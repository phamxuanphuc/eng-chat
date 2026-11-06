import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as OptionsApp } from '../src/options/App';
import { DEFAULT_SETTINGS, loadSettings } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

const renderOptions = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <OptionsApp />
    </QueryClientProvider>
  );

describe('Options hydration from storage', () => {
  let data: Record<string, any>;

  beforeEach(() => {
    document.body.innerHTML = '';
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
      runtime: { openOptionsPage: vi.fn(), sendMessage: vi.fn() },
    };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
  });

  it('shows the saved Gemini key and key count after reopening the settings page', async () => {
    data.engchat_settings = {
      ...DEFAULT_SETTINGS,
      geminiApiKey: 'AIzaSy-saved-key',
      apiKeys: [{ id: 'key-1', label: 'Primary key', key: 'AIzaSy-saved-key' }],
    };
    renderOptions();

    const input = screen.getByPlaceholderText('AIzaSy...') as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe('AIzaSy-saved-key'));
    expect(screen.getByText(/^1\s/)).toBeDefined();
  });

  it('does not wipe saved keys when saving other settings before editing the key', async () => {
    data.engchat_settings = {
      ...DEFAULT_SETTINGS,
      geminiApiKey: 'AIzaSy-saved-key',
      apiKeys: [{ id: 'key-1', label: 'Primary key', key: 'AIzaSy-saved-key' }],
    };
    renderOptions();
    const input = screen.getByPlaceholderText('AIzaSy...') as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe('AIzaSy-saved-key'));

    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    await waitFor(() => expect(screen.getByText('Settings saved successfully in your browser!')).toBeDefined());

    expect((await loadSettings()).geminiApiKey).toBe('AIzaSy-saved-key');
  });

  it('persists a newly typed key and shows it after a fresh reload', async () => {
    const first = renderOptions();
    fireEvent.change(screen.getByPlaceholderText('AIzaSy...'), { target: { value: 'AIzaSy-new-key' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    await waitFor(() => expect(data.engchat_settings?.geminiApiKey).toBe('AIzaSy-new-key'));
    first.unmount();

    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
    renderOptions();
    const input = screen.getByPlaceholderText('AIzaSy...') as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe('AIzaSy-new-key'));
  });
});
