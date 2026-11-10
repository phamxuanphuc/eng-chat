import { ApiError } from './api-error';
import { geminiStatusError, openAiStatusError } from './http-errors';
import { formatOpenAiEndpoint } from './openai';

const GEMINI_STREAM_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const IDLE_TIMEOUT_MS = 30000;

type Handlers = { signal?: AbortSignal; onChunk: (text: string) => void };

export const readSseData = async (
  body: ReadableStream<Uint8Array>,
  onData: (data: string) => boolean | void
): Promise<void> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (rawLine: string): boolean => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (!line.startsWith('data:')) return false;
    return onData(line.slice(5).trimStart()) === true;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const stop = handleLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (stop) return;
        newline = buffer.indexOf('\n');
      }
    }
    buffer += decoder.decode();
    if (buffer) handleLine(buffer);
  } finally {
    try { await reader.cancel(); } catch {}
  }
};

const readErrorMessage = async (response: Response): Promise<string | undefined> => {
  try {
    const data = await response.json();
    const message = data?.error?.message;
    return typeof message === 'string' ? message : undefined;
  } catch {
    return undefined;
  }
};

const withIdleTimeout = (external?: AbortSignal) => {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout>;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { timedOut = true; controller.abort(); }, IDLE_TIMEOUT_MS);
  };
  const forward = () => controller.abort();
  if (external?.aborted) controller.abort();
  external?.addEventListener('abort', forward);
  arm();
  return {
    signal: controller.signal,
    touch: arm,
    timedOut: () => timedOut,
    dispose: () => { clearTimeout(timer); external?.removeEventListener('abort', forward); },
  };
};

const isAbort = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError';

const runStream = async (
  url: string,
  init: RequestInit,
  handlers: Handlers,
  mapStatus: (status: number, message: string | undefined) => ApiError | null,
  errors: { timeout: ApiError; network: ApiError },
  consume: (body: ReadableStream<Uint8Array>, touch: () => void) => Promise<string>,
): Promise<string> => {
  const guard = withIdleTimeout(handlers.signal);
  try {
    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: guard.signal });
    } catch (error) {
      if (guard.timedOut()) throw errors.timeout;
      if (isAbort(error)) throw error;
      throw errors.network;
    }
    if (!response.ok) {
      throw mapStatus(response.status, await readErrorMessage(response)) ?? new ApiError('error.serverUnavailable', { status: response.status });
    }
    if (!response.body) throw errors.network;
    try {
      return await consume(response.body, guard.touch);
    } catch (error) {
      if (guard.timedOut()) throw errors.timeout;
      throw error;
    }
  } finally {
    guard.dispose();
  }
};

class Emitter {
  private started = false;
  text = '';
  constructor(private readonly onChunk: (text: string) => void) {}
  push(piece: string): void {
    if (!piece) return;
    const value = this.started ? piece : piece.trimStart();
    if (!value) return;
    this.started = true;
    this.text += value;
    this.onChunk(value);
  }
}

export interface GeminiStreamParams extends Handlers {
  apiKey: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}

export const streamGeminiApi = async (params: GeminiStreamParams): Promise<string> => {
  const apiKey = params.apiKey?.trim();
  if (!apiKey) throw new ApiError('error.geminiNoKey');
  const model = params.model?.trim() || 'gemini-3.5-flash-lite';
  const emitter = new Emitter(params.onChunk);
  let finishReason: string | undefined;

  await runStream(
    `${GEMINI_STREAM_BASE}/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: params.systemInstruction }] },
        contents: [{ parts: [{ text: params.prompt }] }],
        generationConfig: { maxOutputTokens: 8192 },
      }),
    },
    params,
    (status, message) => geminiStatusError(status, message, model),
    { timeout: new ApiError('error.geminiTimeout'), network: new ApiError('error.geminiNetwork') },
    async (body, touch) => {
      await readSseData(body, (data) => {
        touch();
        let event: any;
        try { event = JSON.parse(data); } catch { return; }
        const blockReason = event?.promptFeedback?.blockReason;
        if (blockReason) throw new ApiError('error.geminiBlocked', { reason: String(blockReason) });
        const candidate = event?.candidates?.[0];
        if (candidate?.finishReason) finishReason = String(candidate.finishReason);
        const parts: Array<{ text?: string; thought?: boolean }> = candidate?.content?.parts || [];
        for (const part of parts) {
          if (!part.thought && typeof part.text === 'string') emitter.push(part.text);
        }
      });
      return emitter.text;
    },
  );

  if (!emitter.text.trim()) {
    throw finishReason && finishReason !== 'STOP'
      ? new ApiError('error.geminiEmptyReason', { reason: finishReason })
      : new ApiError('error.geminiEmpty');
  }
  return emitter.text.trim();
};

export interface OpenAiStreamParams extends Handlers {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}

export const streamOpenAiApi = async (params: OpenAiStreamParams): Promise<string> => {
  const model = params.model?.trim();
  if (!model) throw new ApiError('error.noModel');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.apiKey?.trim()) headers.Authorization = 'Bearer ' + params.apiKey.trim();
  const emitter = new Emitter(params.onChunk);

  await runStream(
    formatOpenAiEndpoint(params.baseUrl),
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: params.systemInstruction },
          { role: 'user', content: params.prompt },
        ],
        temperature: 0.7,
        stream: true,
      }),
    },
    params,
    (status, message) => openAiStatusError(status, message, model),
    { timeout: new ApiError('error.openaiTimeout'), network: new ApiError('error.openaiNetwork', { server: params.baseUrl || 'OpenAI' }) },
    async (body, touch) => {
      await readSseData(body, (data) => {
        touch();
        if (data === '[DONE]') return true;
        let event: any;
        try { event = JSON.parse(data); } catch { return; }
        const delta = event?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') emitter.push(delta);
      });
      return emitter.text;
    },
  );

  if (!emitter.text.trim()) throw new ApiError('error.openaiEmpty');
  return emitter.text.trim();
};
