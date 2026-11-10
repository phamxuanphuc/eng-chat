import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ApiError } from '../src/services/api-error';
import { executeOptimize } from '../src/services/gemini';
import {
  COOLDOWN_MS,
  classifyKeyError,
  classifyKeyFailure,
  clearKeyCooldown,
  markKeyCooldown,
  orderKeysByAvailability,
  resetKeyCooldowns,
} from '../src/services/key-cooldown';
import { mockGeminiSuccessRawResponse } from './mocks/gemini.mock';
import { mockMultiKeySettings } from './mocks/settings.mock';

vi.mock('axios');

const err = (status: number) => ({ isAxios: true, response: { status, data: { error: { message: 'x' } } } });

describe('Key failure classification by error key', () => {
  it('classifies ApiError by its key without comparing message text', () => {
    expect(classifyKeyError(new ApiError('error.geminiInvalidKey'))).toBe('invalid');
    expect(classifyKeyError(new ApiError('error.geminiQuota'))).toBe('quota');
    expect(classifyKeyError(new ApiError('error.geminiTimeout'))).toBeNull();
    expect(classifyKeyError(new ApiError('error.geminiModelNotFound', { model: 'x' }))).toBeNull();
    expect(classifyKeyError(new ApiError('error.geminiBadRequest'))).toBeNull();
  });

  it('is unaffected by the wording of the message', () => {
    const error = new ApiError('error.geminiQuota');
    error.message = 'completely different wording';
    expect(classifyKeyError(error)).toBe('quota');
    const other = new ApiError('error.geminiTimeout');
    other.message = 'API quota exceeded 429';
    expect(classifyKeyError(other)).toBeNull();
  });

  it('treats a rejected key reported as an invalid request as an invalid key', () => {
    expect(classifyKeyError(new ApiError('error.invalidRequest', { detail: 'API key not valid. Please pass a valid API key.' }))).toBe('invalid');
    expect(classifyKeyError(new ApiError('error.invalidRequest', { detail: 'contents exceed 40300 tokens' }))).toBeNull();
  });

  it('still reads plain errors and strings by message', () => {
    expect(classifyKeyError(new Error('429 Too Many Requests'))).toBe('quota');
    expect(classifyKeyError(new Error('Unauthorized'))).toBe('invalid');
    expect(classifyKeyError('quota exceeded')).toBe('quota');
    expect(classifyKeyError(new Error('boom'))).toBeNull();
    expect(classifyKeyError(undefined)).toBeNull();
  });
});

describe('Key cooldown store', () => {
  let data: Record<string, any>;

  beforeEach(() => {
    data = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(data, obj);
          }),
        },
      },
    };
  });

  it('classifies quota and auth failures and ignores other errors', () => {
    expect(classifyKeyFailure('API quota or rate limit exceeded')).toBe('quota');
    expect(classifyKeyFailure('Gemini API key is invalid or access is unauthorized.')).toBe('invalid');
    expect(classifyKeyFailure('Unable to connect to Google Gemini.')).toBeNull();
    expect(classifyKeyFailure('Invalid request: API key not valid. Please pass a valid API key.')).toBe('invalid');
    expect(classifyKeyFailure('The API key is invalid or access is unauthorized (403).')).toBe('invalid');
    expect(classifyKeyFailure('Invalid request: Please check the data.')).toBeNull();
    expect(classifyKeyFailure('Invalid request: contents exceed 40300 tokens.')).toBeNull();
    expect(classifyKeyFailure('')).toBeNull();
  });

  it('moves cooling keys to the end and restores them after the cooldown expires', async () => {
    const now = 1_000_000;
    await markKeyCooldown('key-a', 'quota', now);
    expect(await orderKeysByAvailability(['key-a', 'key-b'], now + 1000)).toEqual(['key-b', 'key-a']);
    expect(await orderKeysByAvailability(['key-a', 'key-b'], now + COOLDOWN_MS.quota + 1)).toEqual(['key-a', 'key-b']);
  });

  it('keeps every key when all are cooling, soonest expiry first', async () => {
    const now = 1_000_000;
    await markKeyCooldown('key-a', 'invalid', now);
    await markKeyCooldown('key-b', 'quota', now);
    expect(await orderKeysByAvailability(['key-a', 'key-b'], now + 1000)).toEqual(['key-b', 'key-a']);
  });

  it('clears a cooldown and never stores the raw key', async () => {
    await markKeyCooldown('secret-key-value', 'quota');
    expect(JSON.stringify(data)).not.toContain('secret-key-value');
    await clearKeyCooldown('secret-key-value');
    expect(await orderKeysByAvailability(['other', 'secret-key-value'])).toEqual(['other', 'secret-key-value']);
  });

  it('does not throw when storage fails', async () => {
    (chrome.storage.local.get as any).mockRejectedValue(new Error('boom'));
    (chrome.storage.local.set as any).mockRejectedValue(new Error('boom'));
    await expect(markKeyCooldown('k', 'quota')).resolves.toBeUndefined();
    expect(await orderKeysByAvailability(['k', 'j'])).toEqual(['k', 'j']);
  });
});

describe('executeOptimize with key cooldown', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const data: Record<string, any> = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(data, obj);
          }),
        },
      },
    };
    (axios as any).isAxiosError = vi.fn((e) => !!e?.isAxios);
    await resetKeyCooldowns();
  });

  const keysUsed = () => vi.mocked(axios.post).mock.calls.map((c) => (c[2] as any).headers['x-goog-api-key']);

  it('skips a key that hit quota on the next request', async () => {
    vi.mocked(axios.post)
      .mockRejectedValueOnce(err(429))
      .mockResolvedValue({ data: mockGeminiSuccessRawResponse });

    await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);
    await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);

    expect(keysUsed()).toEqual(['primary-key', 'backup-key', 'backup-key']);
  });

  it('still tries cooling keys as a last resort and clears the cooldown on success', async () => {
    vi.mocked(axios.post)
      .mockRejectedValueOnce(err(429))
      .mockRejectedValueOnce(err(429))
      .mockResolvedValueOnce({ data: mockGeminiSuccessRawResponse })
      .mockResolvedValue({ data: mockGeminiSuccessRawResponse });

    const failed = await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);
    expect(failed.success).toBe(false);

    const ok = await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);
    expect(ok.success).toBe(true);
    expect(keysUsed().slice(2)).toEqual(['primary-key']);

    await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);
    expect(keysUsed()[3]).toBe('primary-key');
  });

  it('does not remember failures when auto-rotation is off', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(err(429)).mockResolvedValue({ data: mockGeminiSuccessRawResponse });
    const settings = { ...mockMultiKeySettings, autoRotateKeys: false };
    await executeOptimize({ text: 'Hi', tone: 'professional' }, settings);
    await executeOptimize({ text: 'Hi', tone: 'professional' }, settings);
    expect(keysUsed()).toEqual(['primary-key', 'primary-key']);
  });

  const modelsUsed = () => vi.mocked(axios.post).mock.calls.map((c) => String(c[0]));

  it('falls back to the default model after a model-not-found error', async () => {
    vi.mocked(axios.post)
      .mockRejectedValueOnce(err(404))
      .mockResolvedValue({ data: mockGeminiSuccessRawResponse });
    const result = await executeOptimize(
      { text: 'Hi', tone: 'professional' },
      { ...mockMultiKeySettings, selectedModel: 'gemini-old' }
    );
    expect(result.success).toBe(true);
    expect(modelsUsed()[0]).toContain('gemini-old');
    expect(modelsUsed()[1]).toContain('gemini-3.5-flash-lite');
    expect(keysUsed()).toEqual(['primary-key', 'primary-key']);
  });

  it('does not treat a 404 on the default model as a reason to retry it', async () => {
    vi.mocked(axios.post).mockRejectedValue(err(404));
    const result = await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);
    expect(result.success).toBe(false);
    expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
  });

  it('rotates on an invalid-key error even when the message wording is unrelated', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(err(403)).mockResolvedValue({ data: mockGeminiSuccessRawResponse });
    const result = await executeOptimize({ text: 'Hi', tone: 'professional' }, mockMultiKeySettings);
    expect(result.success).toBe(true);
    expect(keysUsed()).toEqual(['primary-key', 'backup-key']);
  });
});
