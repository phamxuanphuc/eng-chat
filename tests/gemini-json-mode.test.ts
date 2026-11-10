import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { executeOptimize } from '../src/services/gemini';
import { resetKeyCooldowns, getKeyCooldowns } from '../src/services/key-cooldown';
import { mockGeminiJsonRawResponse, mockGeminiSuccessRawResponse, mockTranslateExplainResult } from './mocks/gemini.mock';
import { mockDefaultSettings, mockMultiKeySettings } from './mocks/settings.mock';

vi.mock('axios');

const badRequest = (message?: string) => ({
  isAxios: true,
  response: { status: 400, data: message ? { error: { message } } : {} },
});
const configOf = (call: number) => (axios.post as any).mock.calls[call][1].generationConfig;

describe('Gemini JSON output for translations', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetKeyCooldowns();
    (axios as any).isAxiosError = vi.fn((err) => !!err?.isAxios);
  });

  it('asks for JSON when translating with an explanation', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockGeminiJsonRawResponse });
    const response = await executeOptimize({ text: 'Hello', tone: 'translate_explain' }, mockDefaultSettings);

    expect(configOf(0)).toEqual({ maxOutputTokens: 8192, responseMimeType: 'application/json' });
    expect(response.data).toEqual(mockTranslateExplainResult);
  });

  it.each([
    ['a rewrite', { text: 'Hello', tone: 'professional' as const }],
    ['a summary', { text: 'Hello', tone: 'summarize' as const }],
    ['a plain translation', { text: 'Hello', tone: 'translate_explain' as const, translateOnly: true }],
  ])('keeps plain text output for %s', async (_name, request) => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockGeminiSuccessRawResponse });
    await executeOptimize(request, mockDefaultSettings);

    expect(configOf(0)).toEqual({ maxOutputTokens: 8192 });
  });

  it.each([['with a server message', 'JSON mode is not enabled for this model.'], ['without one', undefined]])(
    'retries once without JSON mode when the model rejects it %s',
    async (_name, message) => {
      vi.mocked(axios.post).mockRejectedValueOnce(badRequest(message)).mockResolvedValueOnce({ data: mockGeminiJsonRawResponse });
      const response = await executeOptimize({ text: 'Hello', tone: 'translate_explain' }, mockMultiKeySettings);

      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(configOf(1)).toEqual({ maxOutputTokens: 8192 });
      expect((axios.post as any).mock.calls[1][2].headers['x-goog-api-key']).toBe((axios.post as any).mock.calls[0][2].headers['x-goog-api-key']);
      expect(response).toEqual({ success: true, data: mockTranslateExplainResult });
      expect(await getKeyCooldowns(['primary-key'])).toEqual({});
    }
  );

  it('reports the error when the request is still bad without JSON mode', async () => {
    vi.mocked(axios.post).mockRejectedValue(badRequest('Request payload is too large.'));
    const response = await executeOptimize({ text: 'Hello', tone: 'translate_explain' }, mockMultiKeySettings);

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(response).toEqual({ success: false, error: 'Invalid request: Request payload is too large.' });
  });

  it('treats a rejected key as a key problem, not a JSON mode problem', async () => {
    vi.mocked(axios.post)
      .mockRejectedValueOnce(badRequest('API key not valid. Please pass a valid API key.'))
      .mockResolvedValueOnce({ data: mockGeminiJsonRawResponse });
    const response = await executeOptimize({ text: 'Hello', tone: 'translate_explain' }, mockMultiKeySettings);

    expect(response.success).toBe(true);
    expect(configOf(1).responseMimeType).toBe('application/json');
    expect((axios.post as any).mock.calls[1][2].headers['x-goog-api-key']).not.toBe((axios.post as any).mock.calls[0][2].headers['x-goog-api-key']);
  });

  it('does not use JSON mode with a custom provider', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { choices: [{ message: { content: '{"translation":"Xin chào"}' } }] } });
    const response = await executeOptimize(
      { text: 'Hello', tone: 'translate_explain' },
      { ...mockDefaultSettings, llmProvider: 'openai_compatible', customModel: 'm' }
    );

    expect((axios.post as any).mock.calls[0][1].response_format).toBeUndefined();
    expect(response.data).toMatchObject({ translation: 'Xin chào' });
  });
});
