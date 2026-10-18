import axios, { AxiosError } from 'axios';
import {
  AppSettings,
  OptimizeRequest,
  OptimizeResponse,
  TranslateExplainResult,
} from '../types';
import { buildSystemInstruction, buildUserPrompt } from './prompt';
import { callOpenAiApi } from './openai';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const fetchGeminiModels = async (apiKey: string): Promise<string[]> => {
  if (!apiKey?.trim()) throw new Error('API key is not configured.');
  try {
    const response = await axios.get(GEMINI_API_BASE, {
      timeout: 15000,
      headers: { 'x-goog-api-key': apiKey.trim() },
    });
    return (Array.isArray(response.data?.models) ? response.data.models : [])
      .filter((model: any) => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
      .map((model: any) => String(model.name || '').replace(/^models\//, ''))
      .filter(Boolean)
      .sort();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) throw new Error(`Gemini API key is invalid (${status}).`);
      if (!(error as AxiosError).response) throw new Error('Unable to connect to Gemini.');
    }
    throw error;
  }
};

export const callGeminiApi = async (params: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}): Promise<string> => {
  const { apiKey, model: requestedModel, systemInstruction, prompt } = params;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is not configured. Open Settings to add a Gemini API key.');
  }

  const cleanKey = apiKey.trim();
  const model = requestedModel?.trim() || 'gemini-3.5-flash-lite';
  const url = `${GEMINI_API_BASE}/${model}:generateContent`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 8192,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
    });

    const blockReason = response.data?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini blocked this request (${blockReason}).`);
    }

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('Gemini returned no data.');
    }

    const parts: Array<{ text?: string; thought?: boolean }> = candidates[0]?.content?.parts || [];
    const textResult = parts
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');
    if (!textResult.trim()) {
      const finishReason = candidates[0]?.finishReason;
      throw new Error(finishReason && finishReason !== 'STOP'
        ? `Gemini returned empty data (${finishReason}).`
        : 'Gemini returned empty data.');
    }

    return textResult.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: { message?: string; status?: string } }>;
      const status = axiosErr.response?.status;
      const serverMessage = axiosErr.response?.data?.error?.message;

      if (status === 400) {
        throw new Error(`Invalid request: ${serverMessage || 'Please check the data.'}`);
      }
      if (status === 401 || status === 403) {
        throw new Error('Gemini API key is invalid or access is unauthorized.');
      }
      if (status === 404) {
        throw new Error(`Model "${model}" was not found (404). Recommended: gemini-3.5-flash-lite.`);
      }
      if (status === 429) {
        throw new Error('API quota or rate limit exceeded. Please try again later.');
      }
      if (axiosErr.code === 'ECONNABORTED') {
        throw new Error('The API request timed out. Check your network connection.');
      }
      if (!axiosErr.response) {
        throw new Error('Unable to connect to Google Gemini. Check your network connection.');
      }
    }
    throw error;
  }
};

export const extractCandidateKeys = (settings: AppSettings): string[] => {
  const keys: string[] = [];
  if (settings.geminiApiKey && settings.geminiApiKey.trim()) {
    keys.push(settings.geminiApiKey.trim());
  }
  if (Array.isArray(settings.apiKeys)) {
    for (const item of settings.apiKeys) {
      const trimmed = item.key?.trim();
      if (trimmed && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  }
  return keys;
};

export const executeOptimize = async (
  request: OptimizeRequest,
  settings: AppSettings
): Promise<OptimizeResponse> => {
  try {
    const systemInstruction = buildSystemInstruction(
      request.tone,
      settings.tonePrompts?.[request.tone],
      request.rewriteOptions
    );
    const userPrompt = buildUserPrompt(
      request.text,
      settings.enableChatContext ? request.contextMessages : undefined,
      request.taskInstruction
    );

    let rawResult = '';

    if (settings.llmProvider === 'openai_compatible') {
      const model = settings.customModel?.trim() || 'gpt-4o-mini';
      const baseUrl = settings.customBaseUrl?.trim() || 'https://api.openai.com/v1';
      const apiKey = settings.customApiKey?.trim() || '';

      rawResult = await callOpenAiApi({
        baseUrl,
        apiKey,
        model,
        systemInstruction,
        prompt: userPrompt,
      });
    } else {
      const candidateKeys = extractCandidateKeys(settings);
      if (candidateKeys.length === 0) {
        throw new Error('API key is not configured. Open Settings to add a Gemini API key.');
      }

      let lastError: any = null;
      let targetModel = settings.selectedModel || 'gemini-3.5-flash-lite';
      if (targetModel.includes('2.0-flash')) {
        targetModel = 'gemini-3.5-flash-lite';
      }

      for (let i = 0; i < candidateKeys.length; i++) {
        const currentKey = candidateKeys[i];
        try {
          rawResult = await callGeminiApi({
            apiKey: currentKey,
            model: targetModel,
            systemInstruction,
            prompt: userPrompt,
          });
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          const msg = String(err?.message || '');

          if (msg.includes('404') && targetModel !== 'gemini-3.5-flash-lite') {
            targetModel = 'gemini-3.5-flash-lite';
            i--;
            continue;
          }

          const isQuotaOrAuth =
            msg.includes('quota') ||
            msg.includes('invalid') ||
            msg.includes('429') ||
            msg.includes('401') ||
            msg.includes('403');

          if (settings.autoRotateKeys !== false && isQuotaOrAuth && i < candidateKeys.length - 1) {
            continue;
          }
          throw err;
        }
      }

      if (lastError) {
        throw lastError;
      }
    }

    if (request.tone === 'translate_explain') {
      try {
        const cleanJson = rawResult
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed: TranslateExplainResult = JSON.parse(cleanJson);
        return { success: true, data: parsed };
      } catch {
        return {
          success: true,
          data: {
            translation: rawResult,
            explanation: {
              vocabulary: [],
              grammar: 'Unable to parse detailed explanation.',
              nuances: '',
            },
          },
        };
      }
    }

    return { success: true, data: rawResult };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An error occurred while processing the request.',
    };
  }
};
