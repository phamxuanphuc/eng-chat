import axios, { AxiosError } from 'axios';
import {
  AppSettings,
  OptimizeRequest,
  OptimizeResponse,
  TranslateExplainResult,
} from '../types';
import { buildSystemInstruction, buildUserPrompt } from './prompt';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const callGeminiApi = async (params: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}): Promise<string> => {
  const { apiKey, model, systemInstruction, prompt } = params;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chưa cấu hình API Key. Vui lòng mở Cài đặt để thêm Gemini API Key.');
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

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
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      timeout: 12000,
      headers: {
        'Content-Type': 'application/json',
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

    const rawResult = await callGeminiApi({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel || 'gemini-2.0-flash',
      systemInstruction,
      prompt: userPrompt,
    });

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
