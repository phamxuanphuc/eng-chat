import { AppSettings, OptimizeRequest } from '../types';
import { ApiError } from './api-error';
import { buildPrompts, DEFAULT_GEMINI_MODEL, extractCandidateKeys, resolveGeminiModel } from './gemini';
import { getServerHost, hasHostPermission } from './host-permission';
import { classifyKeyError, clearKeyCooldown, markKeyCooldown, orderKeysByAvailability } from './key-cooldown';
import { streamGeminiApi, streamOpenAiApi } from './stream';

const isAbortError = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError';

export const streamsPlainText = (request: OptimizeRequest): boolean =>
  !(request.tone === 'translate_explain' && !request.translateOnly);

export const executeOptimizeStream = async (
  request: OptimizeRequest,
  settings: AppSettings,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const { systemInstruction, userPrompt } = buildPrompts(request, settings);

  if (settings.llmProvider === 'openai_compatible') {
    const baseUrl = settings.customBaseUrl?.trim() || 'https://api.openai.com/v1';
    if (!(await hasHostPermission(baseUrl))) {
      throw new ApiError('error.hostPermission', { server: getServerHost(baseUrl) });
    }
    return streamOpenAiApi({
      baseUrl,
      apiKey: settings.customApiKey?.trim() || '',
      model: settings.customModel?.trim() || 'gpt-4o-mini',
      systemInstruction,
      prompt: userPrompt,
      signal,
      onChunk,
    });
  }

  const rotate = settings.autoRotateKeys !== false;
  const configured = extractCandidateKeys(settings);
  const keys = rotate ? await orderKeysByAvailability(configured) : configured;
  if (keys.length === 0) throw new ApiError('error.geminiNoKey');

  let model = resolveGeminiModel(settings);
  let emitted = false;
  const emit = (text: string) => {
    emitted = true;
    onChunk(text);
  };

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const text = await streamGeminiApi({ apiKey: key, model, systemInstruction, prompt: userPrompt, signal, onChunk: emit });
      if (rotate) await clearKeyCooldown(key);
      return text;
    } catch (error) {
      if (emitted || signal?.aborted || isAbortError(error)) throw error;
      if (error instanceof ApiError && error.key === 'error.geminiModelNotFound' && model !== DEFAULT_GEMINI_MODEL) {
        model = DEFAULT_GEMINI_MODEL;
        i--;
        continue;
      }
      const failure = classifyKeyError(error);
      if (rotate && failure) {
        await markKeyCooldown(key, failure);
        if (i < keys.length - 1) continue;
      }
      throw error;
    }
  }
  throw new ApiError('error.geminiNoKey');
};
