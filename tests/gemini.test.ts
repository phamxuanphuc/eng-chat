import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { callGeminiApi, executeOptimize } from '../src/services/gemini';
import {
  mockGeminiSuccessRawResponse,
  mockGeminiJsonRawResponse,
  mockTranslateExplainResult,
} from './mocks/gemini.mock';
import { mockDefaultSettings, mockMultiKeySettings, mockEmptySettings } from './mocks/settings.mock';

vi.mock('axios');

describe('Gemini Service & Axios Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios as any).isAxiosError = vi.fn((err) => !!err?.isAxios);
  });

  it('TC-GM-01: throws error when API key is missing', async () => {
    await expect(
      callGeminiApi({
        apiKey: '',
        model: 'gemini-3.5-flash-lite',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('API key is not configured');
  });

  it('TC-GM-02: returns clean text on successful Gemini call', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: mockGeminiSuccessRawResponse,
    });

    const result = await callGeminiApi({
      apiKey: 'valid-api-key',
      model: 'gemini-3.5-flash-lite',
      systemInstruction: 'test',
      prompt: 'hello',
    });

    expect(result).toBe(
      'I have reviewed the payment gateway implementation and it looks solid.'
    );
  });

  it('TC-GM-03: maps 401 error to friendly message', async () => {
    const error = {
      isAxios: true,
      response: {
        status: 401,
        data: { error: { message: 'API_KEY_INVALID' } },
      },
    };
    vi.mocked(axios.post).mockRejectedValueOnce(error);

    await expect(
      callGeminiApi({
        apiKey: 'invalid-key',
        model: 'gemini-3.5-flash-lite',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('Gemini API key is invalid');
  });

  it('TC-GM-04: maps 429 quota error to friendly message', async () => {
    const error = {
      isAxios: true,
      response: {
        status: 429,
        data: { error: { message: 'RESOURCE_EXHAUSTED' } },
      },
    };
    vi.mocked(axios.post).mockRejectedValueOnce(error);

    await expect(
      callGeminiApi({
        apiKey: 'valid-key',
        model: 'gemini-3.5-flash-lite',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('API quota or rate limit exceeded');
  });

  it('TC-GM-05: executeOptimize parses JSON for translate_explain', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: mockGeminiJsonRawResponse,
    });

    const response = await executeOptimize(
      { text: 'Kiểm tra', tone: 'translate_explain' },
      mockDefaultSettings as any
    );

    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockTranslateExplainResult);
  });

  it('TC-GM-06: executeOptimize fails over to backup key on 429 quota error', async () => {
    const error429 = {
      isAxios: true,
      response: {
        status: 429,
        data: { error: { message: 'RESOURCE_EXHAUSTED' } },
      },
    };

    vi.mocked(axios.post)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({
        data: mockGeminiSuccessRawResponse,
      });

    const response = await executeOptimize(
      { text: 'Hello', tone: 'professional' },
      mockMultiKeySettings
    );

    expect(response.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect((axios.post as any).mock.calls[0][1].contents).toBeDefined();
  });

  it('TC-GM-07: executeOptimize does not rotate keys when autoRotateKeys is false', async () => {
    const error429 = {
      isAxios: true,
      response: {
        status: 429,
        data: { error: { message: 'RESOURCE_EXHAUSTED' } },
      },
    };

    vi.mocked(axios.post).mockRejectedValueOnce(error429);

    const noRotateSettings = { ...mockMultiKeySettings, autoRotateKeys: false };
    const response = await executeOptimize(
      { text: 'Hello', tone: 'professional' },
      noRotateSettings
    );

    expect(response.success).toBe(false);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(response.error).toContain('API quota or rate limit exceeded');
  });

  it('TC-GM-08: applies the selected tone prompt to the Gemini system instruction', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: mockGeminiSuccessRawResponse,
    });

    const response = await executeOptimize(
      { text: 'Hello', tone: 'friendly' },
      {
        ...mockDefaultSettings,
        tonePrompts: { friendly: 'Use simple everyday wording.' },
      }
    );

    expect(response.success).toBe(true);
    const payload = (axios.post as any).mock.calls[0][1];
    expect(payload.system_instruction.parts[0].text).toContain(
      'Additional user instructions for this style: Use simple everyday wording.'
    );
  });

  it('TC-GM-09: executeOptimize returns error when no API keys configured', async () => {
    const response = await executeOptimize(
      { text: 'Hello', tone: 'professional' },
      mockEmptySettings
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('API key is not configured');
  });

  it('TC-GM-10: maps 404 model not found error and fallback occurs', async () => {
    const error404 = {
      isAxios: true,
      response: {
        status: 404,
        data: { error: { message: 'models/gemini-old is not found' } },
      },
    };
    vi.mocked(axios.post).mockRejectedValueOnce(error404);

    await expect(
      callGeminiApi({
        apiKey: 'key',
        model: 'gemini-old',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('was not found (404)');
  });
});

describe('Gemini hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios as any).isAxiosError = vi.fn((err) => !!err?.isAxios);
  });

  const call = () => callGeminiApi({ apiKey: 'k', model: 'gemini-3.5-flash-lite', systemInstruction: 's', prompt: 'p' });

  it('sends the API key only in a header, never in the URL query', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockGeminiSuccessRawResponse });
    await call();
    const config = (axios.post as any).mock.calls[0][2];
    expect(config.params).toBeUndefined();
    expect(config.headers['x-goog-api-key']).toBe('k');
  });

  it('joins multi-part responses and skips thought parts', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: 'thinking', thought: true }, { text: 'Hello ' }, { text: 'world' }] } }] },
    });
    await expect(call()).resolves.toBe('Hello world');
  });

  it('reports a blocked prompt', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { promptFeedback: { blockReason: 'SAFETY' } } });
    await expect(call()).rejects.toThrow('Gemini blocked this request (SAFETY).');
  });

  it('reports the finish reason when output is empty', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [] } }] },
    });
    await expect(call()).rejects.toThrow('Gemini returned empty data (MAX_TOKENS).');
  });
});
