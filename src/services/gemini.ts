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
  if (!apiKey?.trim()) throw new Error('Chưa cấu hình API Key.');
  try {
    const response = await axios.get(GEMINI_API_BASE, {
      timeout: 15000,
      headers: { 'x-goog-api-key': apiKey.trim() },
      params: { key: apiKey.trim() },
    });
    return (Array.isArray(response.data?.models) ? response.data.models : [])
      .filter((model: any) => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
      .map((model: any) => String(model.name || '').replace(/^models\//, ''))
      .filter(Boolean)
      .sort();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) throw new Error(`Gemini API Key không chính xác (${status}).`);
      if (!(error as AxiosError).response) throw new Error('Không thể kết nối đến Gemini.');
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
    throw new Error('Chưa cấu hình API Key. Vui lòng mở Cài đặt để thêm Gemini API Key.');
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
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      params: {
        key: cleanKey,
      },
    });

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('Gemini không phản hồi dữ liệu.');
    }

    const textResult = candidates[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Dữ liệu phản hồi từ Gemini rỗng.');
    }

    return textResult.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: { message?: string; status?: string } }>;
      const status = axiosErr.response?.status;
      const serverMessage = axiosErr.response?.data?.error?.message;

      if (status === 400) {
        throw new Error(`Yêu cầu không hợp lệ: ${serverMessage || 'Vui lòng kiểm tra lại dữ liệu.'}`);
      }
      if (status === 401 || status === 403) {
        throw new Error('Gemini API Key không chính xác hoặc không có quyền truy cập.');
      }
      if (status === 404) {
        throw new Error(`Mô hình "${model}" không tìm thấy (404). Khuyên dùng gemini-3.5-flash-lite.`);
      }
      if (status === 429) {
        throw new Error('Đã vượt quá hạn mức gọi API (Quota Exceeded / Rate Limit). Vui lòng thử lại sau.');
      }
      if (axiosErr.code === 'ECONNABORTED') {
        throw new Error('Thời gian chờ gọi API đã quá hạn (Timeout). Kiểm tra kết nối mạng của bạn.');
      }
      if (!axiosErr.response) {
        throw new Error('Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra kết nối mạng.');
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
    const systemInstruction = buildSystemInstruction(request.tone);
    const userPrompt = buildUserPrompt(
      request.text,
      settings.enableChatContext ? request.contextMessages : undefined
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
        throw new Error('Chưa cấu hình API Key. Vui lòng mở Cài đặt để thêm Gemini API Key.');
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
            msg.includes('hạn mức') ||
            msg.includes('không chính xác') ||
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
              grammar: 'Không thể phân tích cú pháp chi tiết.',
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
      error: err?.message || 'Có lỗi xảy ra trong quá trình xử lý.',
    };
  }
};
