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
        model: 'gemini-2.0-flash',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('Chưa cấu hình API Key');
  });

  it('TC-GM-02: returns clean text on successful Gemini call', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: mockGeminiSuccessRawResponse,
    });

    const result = await callGeminiApi({
      apiKey: 'valid-api-key',
      model: 'gemini-2.0-flash',
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
        model: 'gemini-2.0-flash',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('Gemini API Key không chính xác');
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
        model: 'gemini-2.0-flash',
        systemInstruction: 'test',
        prompt: 'hello',
      })
    ).rejects.toThrow('Đã vượt quá hạn mức gọi API');
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
    expect(response.error).toContain('Đã vượt quá hạn mức gọi API');
  });

  it('TC-GM-08: executeOptimize returns error when no API keys configured', async () => {
    const response = await executeOptimize(
      { text: 'Hello', tone: 'professional' },
      mockEmptySettings
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain('Chưa cấu hình API Key');
  });
});

