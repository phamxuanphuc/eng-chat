import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSseData, streamGeminiApi, streamOpenAiApi } from '../src/services/stream';
import { ApiError } from '../src/services/api-error';

const encoder = new TextEncoder();

const bodyOf = (pieces: string[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      pieces.forEach((piece) => controller.enqueue(encoder.encode(piece)));
      controller.close();
    },
  });

const okResponse = (pieces: string[]) => ({ ok: true, status: 200, body: bodyOf(pieces), json: async () => ({}) });
const errorResponse = (status: number, message?: string) => ({
  ok: false,
  status,
  body: null,
  json: async () => (message ? { error: { message } } : Promise.reject(new Error('no body'))),
});

const geminiEvent = (text: string, extra: Record<string, unknown> = {}) =>
  `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, ...extra }] })}\n\n`;
const openAiEvent = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const collect = () => {
  const chunks: string[] = [];
  return { chunks, onChunk: (text: string) => chunks.push(text) };
};

const gemini = (extra: Record<string, unknown> = {}) => {
  const { chunks, onChunk } = collect();
  const promise = streamGeminiApi({ apiKey: 'key-1', model: 'gemini-x', systemInstruction: 'sys', prompt: 'hi', onChunk, ...extra });
  return { chunks, promise };
};

const openAi = (extra: Record<string, unknown> = {}) => {
  const { chunks, onChunk } = collect();
  const promise = streamOpenAiApi({ baseUrl: 'https://example.test/v1', apiKey: 'sk', model: 'm', systemInstruction: 'sys', prompt: 'hi', onChunk, ...extra });
  return { chunks, promise };
};

describe('readSseData', () => {
  it('joins events split across reads, including inside a line and a UTF-8 character', async () => {
    const bytes = encoder.encode('data: {"a":"đồng ý"}\n\n');
    const cut = 12;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, cut));
        controller.enqueue(bytes.slice(cut));
        controller.close();
      },
    });
    const seen: string[] = [];
    await readSseData(body, (data) => { seen.push(data); });
    expect(seen).toEqual(['{"a":"đồng ý"}']);
  });

  it('ignores comments, event names and blank lines, and handles CRLF and a final line without newline', async () => {
    const seen: string[] = [];
    await readSseData(bodyOf([': ping\r\nevent: message\r\ndata: one\r\n\r\n', 'data:two']), (data) => { seen.push(data); });
    expect(seen).toEqual(['one', 'two']);
  });

  it('stops reading once the handler asks to', async () => {
    const seen: string[] = [];
    await readSseData(bodyOf(['data: a\ndata: b\ndata: c\n']), (data) => { seen.push(data); return data === 'b'; });
    expect(seen).toEqual(['a', 'b']);
  });
});

describe('streamGeminiApi', () => {
  it('posts to streamGenerateContent with alt=sse and the key only in a header', async () => {
    fetchMock.mockResolvedValue(okResponse([geminiEvent('Hello', { finishReason: 'STOP' })]));
    const { promise } = gemini();
    await promise;
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-x:streamGenerateContent?alt=sse');
    expect(url).not.toContain('key-1');
    expect(init.headers['x-goog-api-key']).toBe('key-1');
    expect(JSON.parse(init.body).system_instruction.parts[0].text).toBe('sys');
  });

  it('emits chunks in order, skips thought parts and returns the trimmed text', async () => {
    const thought = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'thinking', thought: true }] } }] })}\n\n`;
    fetchMock.mockResolvedValue(okResponse([thought, geminiEvent('  Hello'), geminiEvent(' wor'), geminiEvent('ld \n')]));
    const { chunks, promise } = gemini();
    await expect(promise).resolves.toBe('Hello world');
    expect(chunks).toEqual(['Hello', ' wor', 'ld \n']);
  });

  it('survives chunks cut in the middle of a line', async () => {
    const whole = geminiEvent('Cut me') + geminiEvent(' again');
    fetchMock.mockResolvedValue(okResponse([whole.slice(0, 20), whole.slice(20, 55), whole.slice(55)]));
    const { promise } = gemini();
    await expect(promise).resolves.toBe('Cut me again');
  });

  it('maps HTTP failures to the same errors as the non-streaming call', async () => {
    const cases: Array<[number, string | undefined, string]> = [
      [401, undefined, 'error.geminiInvalidKey'],
      [403, undefined, 'error.geminiInvalidKey'],
      [429, undefined, 'error.geminiQuota'],
      [404, undefined, 'error.geminiModelNotFound'],
      [400, 'API key not valid', 'error.invalidRequest'],
      [400, undefined, 'error.geminiBadRequest'],
      [503, undefined, 'error.serverUnavailable'],
    ];
    for (const [status, message, key] of cases) {
      fetchMock.mockResolvedValueOnce(errorResponse(status, message));
      const { promise } = gemini();
      await expect(promise).rejects.toMatchObject({ key });
    }
  });

  it('reports a network failure and rethrows aborts untouched', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(gemini().promise).rejects.toMatchObject({ key: 'error.geminiNetwork' });

    const controller = new AbortController();
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal!.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      })
    );
    const { promise } = gemini({ signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('fails clearly without a key, when blocked, and when nothing comes back', async () => {
    await expect(streamGeminiApi({ apiKey: ' ', model: 'm', systemInstruction: '', prompt: '', onChunk: () => {} })).rejects.toMatchObject({ key: 'error.geminiNoKey' });

    fetchMock.mockResolvedValueOnce(okResponse([`data: ${JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } })}\n\n`]));
    await expect(gemini().promise).rejects.toMatchObject({ key: 'error.geminiBlocked' });

    fetchMock.mockResolvedValueOnce(okResponse([geminiEvent('', { finishReason: 'SAFETY' })]));
    await expect(gemini().promise).rejects.toMatchObject({ key: 'error.geminiEmptyReason' });

    fetchMock.mockResolvedValueOnce(okResponse([]));
    await expect(gemini().promise).rejects.toBeInstanceOf(ApiError);
  });
});

describe('streamOpenAiApi', () => {
  it('requests stream: true with the bearer key at the compatible endpoint', async () => {
    fetchMock.mockResolvedValue(okResponse([openAiEvent('Hi'), 'data: [DONE]\n\n']));
    await openAi().promise;
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.test/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'm', stream: true });
  });

  it('reads delta content and stops at [DONE]', async () => {
    fetchMock.mockResolvedValue(okResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { role: 'assistant' } }] })}\n\n`,
      openAiEvent('Hel'),
      openAiEvent('lo'),
      'data: [DONE]\n\n',
      openAiEvent('ignored'),
    ]));
    const { chunks, promise } = openAi();
    await expect(promise).resolves.toBe('Hello');
    expect(chunks).toEqual(['Hel', 'lo']);
  });

  it('skips malformed events and handles chunks split inside a JSON payload', async () => {
    const event = openAiEvent('Split');
    fetchMock.mockResolvedValue(okResponse(['data: {not json}\n\n', event.slice(0, 15), event.slice(15), 'data: [DONE]\n\n']));
    await expect(openAi().promise).resolves.toBe('Split');
  });

  it('maps HTTP failures to the same errors as the non-streaming call', async () => {
    const cases: Array<[number, string]> = [
      [401, 'error.openaiInvalidKey'],
      [429, 'error.openaiQuota'],
      [404, 'error.openaiNotFound'],
      [500, 'error.serverUnavailable'],
    ];
    for (const [status, key] of cases) {
      fetchMock.mockResolvedValueOnce(errorResponse(status, 'detail'));
      await expect(openAi().promise).rejects.toMatchObject({ key });
    }
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(openAi().promise).rejects.toMatchObject({ key: 'error.openaiNetwork' });
  });

  it('requires a model and a non-empty reply', async () => {
    await expect(openAi({ model: ' ' }).promise).rejects.toMatchObject({ key: 'error.noModel' });
    fetchMock.mockResolvedValueOnce(okResponse(['data: [DONE]\n\n']));
    await expect(openAi().promise).rejects.toMatchObject({ key: 'error.openaiEmpty' });
  });
});
