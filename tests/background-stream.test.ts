import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { handleStreamPort } from '../src/background/index';
import { DEFAULT_SETTINGS } from '../src/services/storage';
import { mockGeminiSuccessRawResponse } from './mocks/gemini.mock';

vi.mock('axios');

const encoder = new TextEncoder();
const event = (text: string) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
const sseBody = (pieces: string[], failAfter = false): ReadableStream<Uint8Array> => {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < pieces.length) controller.enqueue(encoder.encode(pieces[index++]));
      else if (failAfter) controller.error(new TypeError('connection lost'));
      else controller.close();
    },
  });
};
const okResponse = (body: ReadableStream<Uint8Array>) => ({ ok: true, status: 200, body, json: async () => ({}) });
const failResponse = (status: number) => ({ ok: false, status, body: null, json: async () => ({}) });

const makePort = () => {
  const messageListeners: Array<(message: any) => void> = [];
  const disconnectListeners: Array<() => void> = [];
  const sent: any[] = [];
  const port = {
    name: 'engchat_stream',
    postMessage: vi.fn((message: any) => { sent.push(message); }),
    onMessage: { addListener: (fn: (message: any) => void) => messageListeners.push(fn) },
    onDisconnect: { addListener: (fn: () => void) => disconnectListeners.push(fn) },
  };
  return {
    port: port as unknown as chrome.runtime.Port,
    sent,
    send: (message: unknown) => messageListeners.forEach((fn) => fn(message)),
    disconnect: () => disconnectListeners.forEach((fn) => fn()),
  };
};

const settleUntil = async (predicate: () => boolean) => {
  for (let i = 0; i < 100 && !predicate(); i++) await new Promise((resolve) => setTimeout(resolve, 5));
};

describe('Background streaming port', () => {
  let storage: Record<string, any>;
  let fetchMock: ReturnType<typeof vi.fn>;

  const configure = (settings: Record<string, unknown> = {}) => {
    storage.engchat_settings = {
      ...DEFAULT_SETTINGS,
      geminiApiKey: 'key-1',
      apiKeys: [{ id: '1', label: 'a', key: 'key-1' }, { id: '2', label: 'b', key: 'key-2' }],
      autoRotateKeys: true,
      ...settings,
    };
  };

  const run = async (payload: Record<string, unknown> = { text: 'Hello', tone: 'professional', mode: 'improve' }) => {
    const harness = makePort();
    handleStreamPort(harness.port);
    harness.send({ payload });
    await settleUntil(() => harness.sent.some((message) => message.type === 'done' || message.type === 'error'));
    return harness;
  };

  beforeEach(() => {
    storage = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storage[key] })),
          set: vi.fn(async (obj: Record<string, any>) => { Object.assign(storage, obj); }),
        },
      },
    };
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    (axios as any).isAxiosError = vi.fn((e) => !!e?.isAxios);
    vi.mocked(axios.post).mockReset();
    configure();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).chrome;
  });

  it('streams chunks and ends with done', async () => {
    fetchMock.mockResolvedValue(okResponse(sseBody([event('Better '), event('text')])));
    const { sent } = await run();
    expect(sent).toEqual([
      { type: 'chunk', text: 'Better ' },
      { type: 'chunk', text: 'text' },
      { type: 'done', data: 'Better text' },
    ]);
  });

  it('rotates to the next key when the first fails before any chunk', async () => {
    fetchMock
      .mockResolvedValueOnce(failResponse(429))
      .mockResolvedValueOnce(okResponse(sseBody([event('Second key')])));
    const { sent } = await run();
    expect(fetchMock.mock.calls.map((call) => call[1].headers['x-goog-api-key'])).toEqual(['key-1', 'key-2']);
    expect(sent[sent.length - 1]).toEqual({ type: 'done', data: 'Second key' });
  });

  it('does not rotate once chunks were sent and reports a non-retryable error', async () => {
    fetchMock.mockResolvedValue(okResponse(sseBody([event('Partial')], true)));
    const { sent } = await run();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sent[0]).toEqual({ type: 'chunk', text: 'Partial' });
    expect(sent[sent.length - 1]).toMatchObject({ type: 'error', fallback: false });
  });

  it('shows the same localized message for quota errors and does not ask for a fallback', async () => {
    configure({ apiKeys: [{ id: '1', label: 'a', key: 'key-1' }], geminiApiKey: 'key-1', language: 'en' });
    fetchMock.mockResolvedValue(failResponse(429));
    const { sent } = await run();
    expect(sent).toEqual([{ type: 'error', error: 'API quota or rate limit exceeded. Please try again later.', fallback: false }]);
  });

  it('asks the page to fall back when the server fails before the first chunk', async () => {
    configure({ apiKeys: [{ id: '1', label: 'a', key: 'key-1' }], geminiApiKey: 'key-1' });
    fetchMock.mockResolvedValue(failResponse(500));
    const { sent } = await run();
    expect(sent[0]).toMatchObject({ type: 'error', fallback: true });
  });

  it('aborts the request when the port disconnects', async () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal;
      return new Promise(() => {});
    });
    const harness = makePort();
    handleStreamPort(harness.port);
    harness.send({ payload: { text: 'Hello', tone: 'professional', mode: 'improve' } });
    await settleUntil(() => !!signal);
    harness.disconnect();
    expect(signal?.aborted).toBe(true);
    expect(harness.sent).toEqual([]);
  });

  it('ignores a second request on the same port and an empty message', async () => {
    fetchMock.mockResolvedValue(okResponse(sseBody([event('Once')])));
    const harness = await run();
    harness.send({ payload: { text: 'Again', tone: 'professional' } });
    harness.send({});
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps JSON translation requests on the non-streaming path', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: mockGeminiSuccessRawResponse });
    const { sent } = await run({ text: 'Xin chao', tone: 'translate_explain', mode: 'translate' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalled();
    expect(sent[sent.length - 1].type).toBe('done');
  });

  it('streams from an OpenAI-compatible provider', async () => {
    configure({ llmProvider: 'openai_compatible', customBaseUrl: 'https://example.test/v1', customModel: 'm', customApiKey: 'sk' });
    const delta = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
    fetchMock.mockResolvedValue(okResponse(sseBody([delta('Hi '), delta('there'), 'data: [DONE]\n\n'])));
    const { sent } = await run();
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/v1/chat/completions');
    expect(sent[sent.length - 1]).toEqual({ type: 'done', data: 'Hi there' });
  });
});
