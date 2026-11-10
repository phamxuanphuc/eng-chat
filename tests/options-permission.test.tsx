import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as OptionsApp } from '../src/options/App';
import { DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

describe('Saving a custom provider asks for access to its server', () => {
  let data: Record<string, any>;
  const request = vi.fn(async (_permissions: unknown) => true);

  const setup = (llmProvider: 'gemini' | 'openai_compatible') => {
    data = { engchat_settings: { ...DEFAULT_SETTINGS, llmProvider, customBaseUrl: 'https://api.deepseek.com/v1', customModel: 'deepseek-chat' } };
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OptionsApp />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    request.mockReset();
    request.mockResolvedValue(true);
    (globalThis as any).chrome = {
      permissions: { request, contains: vi.fn(async () => true) },
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => { Object.assign(data, obj); }),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      runtime: { openOptionsPage: vi.fn(), sendMessage: vi.fn() },
    };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
  });

  const editModelAndSave = async () => {
    fireEvent.change(await screen.findByDisplayValue('deepseek-chat'), { target: { value: 'deepseek-reasoner' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));
  };

  it('saves after the user allows access', async () => {
    setup('openai_compatible');
    await editModelAndSave();

    await waitFor(() => expect(data.engchat_settings.customModel).toBe('deepseek-reasoner'));
    expect(request).toHaveBeenCalledWith({ origins: ['https://api.deepseek.com/*'] });
  });

  it('keeps the changes unsaved and says why when access is refused', async () => {
    request.mockResolvedValue(false);
    setup('openai_compatible');
    await editModelAndSave();

    await screen.findByText('Not saved. Allow access to api.deepseek.com when the browser asks.');
    expect(data.engchat_settings.customModel).toBe('deepseek-chat');

    request.mockResolvedValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));
    await waitFor(() => expect(data.engchat_settings.customModel).toBe('deepseek-reasoner'));
    expect(screen.queryByText(/Not saved\./)).toBeNull();
  });

  it('never asks while Gemini is the provider', async () => {
    setup('gemini');
    await screen.findByText('Google AI API keys');
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    fireEvent.change(screen.getByPlaceholderText('AIzaSy...'), { target: { value: 'AIzaSy-new' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save Settings' }));

    await waitFor(() => expect((globalThis as any).chrome.storage.local.set).toHaveBeenCalled());
    expect(request).not.toHaveBeenCalled();
  });

  it('picks a preset on the options page and flags unsaved changes', async () => {
    setup('openai_compatible');
    fireEvent.click(await screen.findByRole('button', { name: 'Groq' }));
    expect((await screen.findByDisplayValue('https://api.groq.com/openai/v1')) as HTMLInputElement).toBeDefined();
    expect(screen.getByDisplayValue('llama-3.3-70b-versatile')).toBeDefined();
    expect(await screen.findByText('You have unsaved changes')).toBeDefined();
  });

  it('says why when host access is refused while loading models', async () => {
    request.mockResolvedValue(false);
    setup('openai_compatible');
    fireEvent.click(await screen.findByRole('button', { name: 'Load model list' }));
    expect(await screen.findByText(/needs your permission to reach api\.deepseek\.com/)).toBeDefined();
  });
});
