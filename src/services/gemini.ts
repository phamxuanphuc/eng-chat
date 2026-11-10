import axios, { AxiosError } from 'axios';
import { AppSettings, OptimizeRequest, OptimizeResponse } from '../types';
import { parseTranslateResult } from './translate-result';
import { ApiError, localizeError } from './api-error';
import { getServerHost, hasHostPermission } from './host-permission';
import { buildSystemInstruction, buildUserPrompt } from './prompt';
import { callOpenAiApi } from './openai';
import { classifyKeyFailure, clearKeyCooldown, markKeyCooldown, orderKeysByAvailability } from './key-cooldown';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const fetchGeminiModels = async (apiKey: string): Promise<string[]> => {
  if (!apiKey?.trim()) throw new ApiError('error.noKey');
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
      if (status === 401 || status === 403) throw new ApiError('error.geminiModelsInvalidKey', { status });
      if (!(error as AxiosError).response) throw new ApiError('error.geminiModelsNetwork');
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
    throw new ApiError('error.geminiNoKey');
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
    if (blockReason) throw new ApiError('error.geminiBlocked', { reason: String(blockReason) });
    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) throw new ApiError('error.geminiNoData');

    const parts: Array<{ text?: string; thought?: boolean }> = candidates[0]?.content?.parts || [];
    const textResult = parts
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');
    if (!textResult.trim()) {
      const finishReason = candidates[0]?.finishReason;
      throw finishReason && finishReason !== 'STOP'
        ? new ApiError('error.geminiEmptyReason', { reason: String(finishReason) })
        : new ApiError('error.geminiEmpty');
    }

    return textResult.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: { message?: string; status?: string } }>;
      const status = axiosErr.response?.status;
      const serverMessage = axiosErr.response?.data?.error?.message;

      if (status === 400) {
        throw serverMessage ? new ApiError('error.invalidRequest', { detail: serverMessage }) : new ApiError('error.geminiBadRequest');
      }
      if (status === 401 || status === 403) {
        throw new ApiError('error.geminiInvalidKey');
      }
      if (status === 404) {
        throw new ApiError('error.geminiModelNotFound', { model });
      }
      if (status === 429) {
        throw new ApiError('error.geminiQuota');
      }
      if (axiosErr.code === 'ECONNABORTED') {
        throw new ApiError('error.geminiTimeout');
      }
      if (!axiosErr.response) {
        throw new ApiError('error.geminiNetwork');
      }
      if (status && status >= 500) {
        throw new ApiError('error.serverUnavailable', { status });
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
      request.rewriteOptions,
      request.targetLanguage,
      { mode: request.mode, translateOnly: request.translateOnly }
    );
    const userPrompt = buildUserPrompt(
      request.text,
      settings.enableChatContext ? request.contextMessages : undefined,
      request.taskInstruction,
      request.previousResult
    );

    let rawResult = '';

    if (settings.llmProvider === 'openai_compatible') {
      const model = settings.customModel?.trim() || 'gpt-4o-mini';
      const baseUrl = settings.customBaseUrl?.trim() || 'https://api.openai.com/v1';
      const apiKey = settings.customApiKey?.trim() || '';

      if (!(await hasHostPermission(baseUrl))) {
        throw new ApiError('error.hostPermission', { server: getServerHost(baseUrl) });
      }

      rawResult = await callOpenAiApi({
        baseUrl,
        apiKey,
        model,
        systemInstruction,
        prompt: userPrompt,
      });
    } else {
      const rotate = settings.autoRotateKeys !== false;
      const configuredKeys = extractCandidateKeys(settings);
      const candidateKeys = rotate ? await orderKeysByAvailability(configuredKeys) : configuredKeys;
      if (candidateKeys.length === 0) {
        throw new ApiError('error.geminiNoKey');
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
          if (rotate) await clearKeyCooldown(currentKey);
          break;
        } catch (err: any) {
          lastError = err;
          const msg = String(err?.message || '');

          if (msg.includes('404') && targetModel !== 'gemini-3.5-flash-lite') {
            targetModel = 'gemini-3.5-flash-lite';
            i--;
            continue;
          }

          const failure = classifyKeyFailure(msg);
          if (rotate && failure) {
            await markKeyCooldown(currentKey, failure);
            if (i < candidateKeys.length - 1) continue;
          }
          throw err;
        }
      }

      if (lastError) {
        throw lastError;
      }
    }

    if (request.tone === 'translate_explain' && !request.translateOnly) {
      return { success: true, data: parseTranslateResult(rawResult) };
    }

    return { success: true, data: rawResult };
  } catch (err) {
    return { success: false, error: localizeError(err, settings.language) };
  }
};
