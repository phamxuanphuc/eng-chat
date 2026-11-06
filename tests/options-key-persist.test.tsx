import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as OptionsApp } from '../src/options/App';
import { DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

const renderOptions = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <OptionsApp />
    </QueryClientProvider>
  );

const keys = [{ id: 'k1', label: 'Main', key: 'AIzaSy-main-key-1111' }];

describe('Backup key persistence without pressing Save', () => {
  let data: Record<string, any>;

  beforeEach(() => {
    document.body.innerHTML = '';
    data = {
      engchat_settings: { ...DEFAULT_SETTINGS, geminiApiKey: keys[0].key, apiKeys: keys },
    };
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(data, obj);
          }),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      runtime: { openOptionsPage: vi.fn(), sendMessage: vi.fn() },
    };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
  });

  const addBackup = async (value: string, name = '') => {
    await screen.findByDisplayValue(keys[0].key);
    if (name) fireEvent.change(screen.getByLabelText('Key name'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Backup API key'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Add backup key' }));
  };

  it('saves an added backup key immediately and shows it after reload', async () => {
    const first = renderOptions();
    await addBackup('AIzaSy-backup-key-2222', 'Spare');

    await waitFor(() => expect(data.engchat_settings.apiKeys.map((k: any) => k.key)).toEqual([keys[0].key, 'AIzaSy-backup-key-2222']));
    expect(data.engchat_settings.geminiApiKey).toBe(keys[0].key);
    first.unmount();

    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
    renderOptions();
    expect(await screen.findByText('Spare')).toBeDefined();
    expect(screen.getByText('2 keys')).toBeDefined();
  });

  it('does not report unsaved changes after adding a key', async () => {
    renderOptions();
    await addBackup('AIzaSy-backup-key-2222');
    await waitFor(() => expect(data.engchat_settings.apiKeys).toHaveLength(2));
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('persists removing a backup key and making another key primary', async () => {
    data.engchat_settings.apiKeys = [...keys, { id: 'k2', label: 'Spare', key: 'AIzaSy-backup-key-2222' }];
    renderOptions();
    fireEvent.click(await screen.findByRole('button', { name: /make primary/i }));
    await waitFor(() => expect(data.engchat_settings.geminiApiKey).toBe('AIzaSy-backup-key-2222'));
    expect(data.engchat_settings.apiKeys.map((k: any) => k.id)).toEqual(['k2', 'k1']);

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[1]);
    await waitFor(() => expect(data.engchat_settings.apiKeys.map((k: any) => k.id)).toEqual(['k2']));
  });

  it('keeps other unsaved edits out of the quick key save', async () => {
    renderOptions();
    await screen.findByDisplayValue(keys[0].key);
    fireEvent.click(screen.getByRole('link', { name: /context/i }));
    fireEvent.change(await screen.findByLabelText(/Maximum context messages/i), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('link', { name: /ai provider/i }));
    await addBackup('AIzaSy-backup-key-2222');
    await waitFor(() => expect(data.engchat_settings.apiKeys).toHaveLength(2));
    expect(data.engchat_settings.maxContextMessages).toBe(DEFAULT_SETTINGS.maxContextMessages);
  });
});
