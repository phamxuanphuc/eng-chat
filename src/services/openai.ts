import axios, { AxiosError } from 'axios';
import { ApiError } from './api-error';

export interface OpenAiApiParams {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
}

export const CUSTOM_PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
  { id: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3.2' },
];

export const formatOpenAiEndpoint = (baseUrl?: string): string => {
  let base = (baseUrl || 'https://api.openai.com/v1').trim();
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`;
  }
  base = base.replace(/\/+$/, '');
  if (base.endsWith('/chat/completions')) {
    return base;
  }
  return `${base}/chat/completions`;
};

export const formatOpenAiModelsEndpoint = (baseUrl?: string): string => {
  const endpoint = formatOpenAiEndpoint(baseUrl);
  return endpoint.replace(/\/chat\/completions$/, '/models');
};

export const fetchOpenAiModels = async (params: { baseUrl?: string; apiKey?: string }): Promise<string[]> => {
  const headers: Record<string, string> = {};
  if (params.apiKey?.trim()) headers.Authorization = 'Bearer ' + params.apiKey.trim();

  try {
    const response = await axios.get(formatOpenAiModelsEndpoint(params.baseUrl), { timeout: 15000, headers });
    const models = Array.isArray(response.data?.data) ? response.data.data : [];
    return models
      .map((model: any) => typeof model === 'string' ? model : model?.id)
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      .sort();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) throw new ApiError('error.modelsInvalidKey', { status });
      if (status === 404) throw new ApiError('error.modelsNotFound');
      if (!(error as AxiosError).response) throw new ApiError('error.modelsNetwork');
    }
    throw error;
  }
};

export const callOpenAiApi = async (params: OpenAiApiParams): Promise<string> => {
  const { baseUrl, apiKey, model, systemInstruction, prompt } = params;

  if (!model || model.trim() === '') {
    throw new ApiError('error.noModel');
  }

  const endpoint = formatOpenAiEndpoint(baseUrl);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = 'Bearer ' + apiKey.trim();
  }

  const payload = {
    model: model.trim(),
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  };

  try {
    const response = await axios.post(endpoint, payload, {
      timeout: 30000,
      headers,
    });

    const choices = response.data?.choices;
    if (!choices || choices.length === 0) {
      throw new ApiError('error.openaiNoData');
    }

    const content = choices[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new ApiError('error.openaiEmpty');
    }

    return content.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: { message?: string; type?: string } }>;
      const status = axiosErr.response?.status;
      const serverMessage = axiosErr.response?.data?.error?.message;

      if (status === 400) {
        throw serverMessage ? new ApiError('error.invalidRequest', { detail: serverMessage }) : new ApiError('error.openaiBadRequest');
      }
      if (status === 401 || status === 403) {
        throw new ApiError('error.openaiInvalidKey', { status, detail: serverMessage || '' });
      }
      if (status === 404) {
        throw new ApiError('error.openaiNotFound', { model });
      }
      if (status === 429) {
        throw new ApiError('error.openaiQuota', { detail: serverMessage || '' });
      }
      if (axiosErr.code === 'ECONNABORTED') {
        throw new ApiError('error.openaiTimeout');
      }
      if (!axiosErr.response) {
        throw new ApiError('error.openaiNetwork', { server: baseUrl || 'OpenAI' });
      }
      if (status && status >= 500) {
        throw new ApiError('error.serverUnavailable', { status });
      }
    }
    throw error;
  }
};
