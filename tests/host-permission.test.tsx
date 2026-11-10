import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import manifest from '../manifest.json';
import { getServerHost, hasHostPermission, requestHostPermission, toOriginPattern } from '../src/services/host-permission';
import { executeOptimize } from '../src/services/gemini';
import { handleRuntimeMessage } from '../src/background/index';
import { CustomProviderManager } from '../src/options/CustomProviderManager';
import { mockDefaultSettings } from './mocks/settings.mock';

vi.mock('axios');

const customSettings = { ...mockDefaultSettings, llmProvider: 'openai_compatible' as const, customBaseUrl: 'https://api.deepseek.com/v1', customModel: 'deepseek-chat' };
const stubPermissions = (permissions: Record<string, unknown>) => vi.stubGlobal('chrome', { permissions });

describe('custom server host permission', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('asks for all sites only as an optional permission', () => {
    expect(manifest.host_permissions).toEqual(['https://generativelanguage.googleapis.com/*']);
    expect(manifest.optional_host_permissions).toEqual(['https://*/*', 'http://*/*']);
  });

  it('builds a match pattern for the server origin without port or path', () => {
    expect(toOriginPattern('https://api.deepseek.com/v1')).toBe('https://api.deepseek.com/*');
    expect(toOriginPattern('http://localhost:11434/v1')).toBe('http://localhost/*');
    expect(toOriginPattern('openrouter.ai/api/v1')).toBe('https://openrouter.ai/*');
    expect(toOriginPattern(undefined)).toBe('https://api.openai.com/*');
    expect(toOriginPattern('https://exa mple.com/v1')).toBeNull();
    expect(getServerHost('http://localhost:11434/v1')).toBe('localhost:11434');
  });

  it('treats the permission as granted where the API does not exist', async () => {
    await expect(hasHostPermission('https://api.deepseek.com/v1')).resolves.toBe(true);
    await expect(requestHostPermission('https://api.deepseek.com/v1')).resolves.toBe(true);
  });

  it('checks and requests the exact origin', async () => {
    const contains = vi.fn(async () => false);
    const request = vi.fn(async () => true);
    stubPermissions({ contains, request });

    await expect(hasHostPermission('https://api.deepseek.com/v1')).resolves.toBe(false);
    await expect(requestHostPermission('https://api.deepseek.com/v1')).resolves.toBe(true);
    expect(contains).toHaveBeenCalledWith({ origins: ['https://api.deepseek.com/*'] });
    expect(request).toHaveBeenCalledWith({ origins: ['https://api.deepseek.com/*'] });
  });

  it('counts a failed request as denied and a failed check as allowed', async () => {
    stubPermissions({
      contains: vi.fn(async () => { throw new Error('boom'); }),
      request: vi.fn(async () => { throw new Error('no user gesture'); }),
    });
    await expect(hasHostPermission('https://a.test')).resolves.toBe(true);
    await expect(requestHostPermission('https://a.test')).resolves.toBe(false);
  });

  it('explains the missing permission instead of calling the server', async () => {
    stubPermissions({ contains: vi.fn(async () => false) });
    const result = await executeOptimize({ text: 'Hi', tone: 'professional' }, { ...customSettings, language: 'vi' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('cấp quyền truy cập api.deepseek.com');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('calls the server once the permission is granted', async () => {
    stubPermissions({ contains: vi.fn(async () => true) });
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Hello' } }] } });
    await expect(executeOptimize({ text: 'Hi', tone: 'professional' }, customSettings)).resolves.toEqual({ success: true, data: 'Hello' });
  });

  it('refuses to list models without the permission', async () => {
    vi.stubGlobal('chrome', {
      permissions: { contains: vi.fn(async () => false) },
      storage: { local: { get: vi.fn(async () => ({ engchat_settings: customSettings })) } },
    });
    const sendResponse = vi.fn();
    await handleRuntimeMessage({ action: 'FETCH_CUSTOM_MODELS' }, {} as any, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: expect.stringContaining('api.deepseek.com') });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('requests access from the Test connection button and reports a refusal', async () => {
    const request = vi.fn(async () => false);
    stubPermissions({ request });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        <CustomProviderManager language="en" baseUrl="https://api.deepseek.com/v1" onUpdateBaseUrl={vi.fn()} apiKey="" onUpdateApiKey={vi.fn()} model="deepseek-chat" onUpdateModel={vi.fn()} />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => expect(screen.getByText(/needs your permission to reach api\.deepseek\.com/)).toBeDefined());
    expect(request).toHaveBeenCalledWith({ origins: ['https://api.deepseek.com/*'] });
    expect(axios.post).not.toHaveBeenCalled();
  });
});
