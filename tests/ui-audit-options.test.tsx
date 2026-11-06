import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as OptionsApp } from '../src/options/App';
import { App as PopupApp } from '../src/popup/App';
import { ApiKeyManager } from '../src/options/ApiKeyManager';
import { DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';
import en from '../src/i18n/en.json';
import vi_ from '../src/i18n/vi.json';

let data: Record<string, any> = {};

const renderOptions = (initialEntries = ['/']) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OptionsApp useMemoryRouter initialEntries={initialEntries} />
    </QueryClientProvider>
  );

describe('Settings UX', () => {
  beforeEach(() => {
    data = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (value: Record<string, any>) => { Object.assign(data, value); }),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      runtime: { openOptionsPage: vi.fn(), sendMessage: vi.fn(), getManifest: () => ({ version: '9.8.7' }) },
    };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
  });

  afterEach(() => {
    cleanup();
    delete (globalThis as any).chrome;
  });

  it('tracks unsaved edits and clears the warning after saving', async () => {
    renderOptions();
    expect(await screen.findByText('All changes saved')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Custom LLM' }));
    expect(await screen.findByText('You have unsaved changes')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    expect(await screen.findByText('Settings saved successfully in your browser!')).toBeDefined();
    expect(screen.queryByText('You have unsaved changes')).toBeNull();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('warns before leaving with unsaved edits only', async () => {
    renderOptions();
    await screen.findByText('All changes saved');
    const quiet = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(quiet);
    expect(quiet.defaultPrevented).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Custom LLM' }));
    await screen.findByText('You have unsaved changes');
    const warned = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(warned);
    expect(warned.defaultPrevented).toBe(true);
  });

  it('saves the interface language immediately without flagging unsaved edits', async () => {
    renderOptions();
    await screen.findByText('All changes saved');

    fireEvent.click(screen.getByRole('button', { name: /Language: English/i }));

    expect(await screen.findByText('Mọi thay đổi đã được lưu')).toBeDefined();
    await waitFor(() => expect(data.engchat_settings?.language).toBe('vi'));
    expect(document.documentElement.lang).toBe('vi');
  });

  it('hides the save bar on the hidden sites page, which applies changes at once', async () => {
    renderOptions(['/sites']);
    await screen.findByRole('heading', { level: 2, name: 'Hidden sites' });
    expect(screen.queryByRole('button', { name: /Save Settings/i })).toBeNull();
  });

  it('lets the context limit be cleared while typing and restores it on blur', async () => {
    renderOptions(['/context']);
    const input = await screen.findByLabelText(/Maximum context messages/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    fireEvent.blur(input);
    expect(input.value).toBe('4');

    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(input.value).toBe('10');
  });

  it('counts only real keys and removes the entry when the primary key is cleared', () => {
    const onUpdateKeys = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ApiKeyManager
          language="en"
          apiKeys={[{ id: 'k', label: 'Primary key', key: 'AIzaSy-7421' }]}
          onUpdateKeys={onUpdateKeys}
          autoRotate={false}
          onToggleAutoRotate={() => {}}
          selectedModel="gemini-3.5-flash-lite"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('1 key')).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText('AIzaSy...'), { target: { value: '' } });
    expect(onUpdateKeys).toHaveBeenCalledWith([]);
  });

  it('asks for a key in the toolbar popup when none is configured', async () => {
    render(<PopupApp />);
    expect(await screen.findByText('Add an API key to get started')).toBeDefined();
    expect(screen.getByText('Version 9.8.7')).toBeDefined();
  });

  it('shows the active model in the toolbar popup once configured', async () => {
    data.engchat_settings = { ...DEFAULT_SETTINGS, geminiApiKey: 'AIzaSy-7421', selectedModel: 'gemini-3.5-flash' };
    render(<PopupApp />);
    expect(await screen.findByText('Ready · gemini-3.5-flash')).toBeDefined();
  });
});

describe('Copy', () => {
  it('keeps English and Vietnamese dictionaries in sync', () => {
    expect(Object.keys(vi_).sort()).toEqual(Object.keys(en).sort());
  });
});
