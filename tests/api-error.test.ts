import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ApiError, localizeError } from '../src/services/api-error';
import { callGeminiApi, executeOptimize } from '../src/services/gemini';
import { callOpenAiApi } from '../src/services/openai';
import { getRuntimeErrorMessage } from '../src/services/extension-messaging';
import { resetKeyCooldowns } from '../src/services/key-cooldown';
import { mockDefaultSettings } from './mocks/settings.mock';
import en from '../src/i18n/en.json';
import vi_ from '../src/i18n/vi.json';

vi.mock('axios');

const httpError = (status: number, message?: string) => ({
  isAxios: true,
  response: { status, data: message ? { error: { message } } : {} },
});

describe('localized API errors', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetKeyCooldowns();
    (axios as any).isAxiosError = vi.fn((err) => !!err?.isAxios);
  });

  it('keeps an English message on the error and translates on demand', () => {
    const error = new ApiError('error.geminiModelNotFound', { model: 'gemini-x' });
    expect(error.message).toBe('Model "gemini-x" was not found (404). Recommended: gemini-3.5-flash-lite.');
    expect(localizeError(error, 'vi')).toBe('Không tìm thấy mô hình "gemini-x" (404). Nên dùng: gemini-3.5-flash-lite.');
    expect(localizeError(error, 'en')).toBe(error.message);
    expect(localizeError(error)).toBe(error.message);
  });

  it('trims an empty provider detail', () => {
    const error = new ApiError('error.openaiQuota', { detail: '' });
    expect(error.message).toBe('API rate limit or quota exceeded.');
    expect(localizeError(error, 'vi')).toBe('Đã vượt giới hạn tần suất hoặc hết hạn mức API.');
  });

  it('passes unknown errors through and falls back when there is no message', () => {
    expect(localizeError(new Error('Boom'), 'vi')).toBe('Boom');
    expect(localizeError('plain text', 'vi')).toBe('plain text');
    expect(localizeError(undefined, 'vi')).toBe('Đã xảy ra lỗi khi xử lý yêu cầu.');
    expect(localizeError(new Error('  '), 'en')).toBe('An error occurred while processing the request.');
    expect(localizeError(null, 'vi', 'content.connectionError')).toBe('Không thể kết nối tới tiện ích VinaWrite.');
  });

  it('has a Vietnamese text with the same placeholders for every error key', () => {
    const placeholders = (text: string) => (text.match(/{{\w+}}/g) || []).sort();
    const keys = Object.keys(en).filter((key) => key.startsWith('error.'));
    expect(keys.length).toBeGreaterThan(20);
    for (const key of keys) {
      const vietnamese = (vi_ as Record<string, string>)[key];
      expect(vietnamese, key).toBeTruthy();
      expect(vietnamese, key).not.toBe((en as Record<string, string>)[key]);
      expect(placeholders(vietnamese), key).toEqual(placeholders((en as Record<string, string>)[key]));
    }
  });

  it('returns the failure in the user language from executeOptimize', async () => {
    vi.mocked(axios.post).mockRejectedValue(httpError(429));
    const vietnamese = await executeOptimize({ text: 'Hi', tone: 'professional' }, { ...mockDefaultSettings, language: 'vi' });
    expect(vietnamese).toEqual({ success: false, error: 'Đã hết hạn mức hoặc vượt giới hạn tần suất API. Vui lòng thử lại sau.' });

    await resetKeyCooldowns();
    const english = await executeOptimize({ text: 'Hi', tone: 'professional' }, { ...mockDefaultSettings, language: 'en' });
    expect(english.error).toBe('API quota or rate limit exceeded. Please try again later.');
  });

  it('keeps the provider detail inside a translated bad request', async () => {
    vi.mocked(axios.post).mockRejectedValue(httpError(400, 'Request payload is too large.'));
    const result = await executeOptimize({ text: 'Hi', tone: 'professional' }, { ...mockDefaultSettings, language: 'vi' });
    expect(result.error).toBe('Yêu cầu không hợp lệ: Request payload is too large.');
  });

  it('reports a missing key in Vietnamese', async () => {
    const result = await executeOptimize(
      { text: 'Hi', tone: 'professional' },
      { ...mockDefaultSettings, language: 'vi', geminiApiKey: '', apiKeys: [] },
    );
    expect(result.error).toBe('Chưa cấu hình khóa API. Mở Cài đặt để thêm khóa API Gemini.');
  });

  it.each([500, 503])('maps a %i from either provider to a retry message', async (status) => {
    vi.mocked(axios.post).mockRejectedValue(httpError(status));
    const params = { apiKey: 'k', model: 'm', systemInstruction: 's', prompt: 'p' };
    await expect(callGeminiApi(params)).rejects.toMatchObject({ key: 'error.serverUnavailable', params: { status } });
    await expect(callOpenAiApi(params)).rejects.toMatchObject({ key: 'error.serverUnavailable', params: { status } });
  });

  it('translates the reload notice shown after an extension update', () => {
    expect(getRuntimeErrorMessage(new Error('Extension context invalidated.'), 'fallback', 'vi'))
      .toBe('Tiện ích vừa được cập nhật. Hãy tải lại trang để kết nối lại VinaWrite.');
    expect(getRuntimeErrorMessage(new Error('Extension was updated. Please reload this page to reconnect VinaWrite.'), 'fallback', 'vi'))
      .toContain('tải lại trang');
    expect(getRuntimeErrorMessage(new Error('Extension context invalidated.'), 'fallback'))
      .toBe('Extension was updated. Please reload this page to reconnect VinaWrite.');
    expect(getRuntimeErrorMessage(new Error(''), 'fallback', 'vi')).toBe('fallback');
  });
});
