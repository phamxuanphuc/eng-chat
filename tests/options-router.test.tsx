import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as OptionsApp } from '../src/options/App';
import { DEFAULT_SETTINGS, loadSettings } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('Options Multi-Page React Router', () => {
  let mockStorageData: Record<string, any> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    mockStorageData = {};

    (globalThis as any).chrome = {
      storage: {
        sync: {
          get: vi.fn(async (key: string) => ({ [key]: mockStorageData[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(mockStorageData, obj);
          }),
        },
      },
      runtime: {
        openOptionsPage: vi.fn(),
        sendMessage: vi.fn(),
      },
    };

    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('TC-OR-01: Renders AI Provider page by default and navigates across pages', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText('AIzaSy...')).toBeDefined();
    expect(screen.getAllByText('Google Gemini').length).toBeGreaterThan(0);

    const toneTab = screen.getByRole('link', { name: /writing style/i });
    fireEvent.click(toneTab);
    expect(await screen.findByText('Default writing style')).toBeDefined();
    expect(screen.getByText('Polite & Formal')).toBeDefined();

    const contextTab = screen.getByRole('link', { name: /context/i });
    fireEvent.click(contextTab);
    expect(await screen.findByText('Conversation context (Chat Context)')).toBeDefined();

    const aiTab = screen.getByRole('link', { name: /ai provider/i });
    fireEvent.click(aiTab);
    expect(await screen.findByPlaceholderText('AIzaSy...')).toBeDefined();
  });

  it('TC-OR-02: Preserves edits across page navigation and saves successfully', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    );

    const apiKeyInput = screen.getByPlaceholderText('AIzaSy...');
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSy-router-test-key' } });

    fireEvent.click(screen.getByRole('link', { name: /writing style/i }));
    const friendlyTone = await screen.findByText('Friendly & Natural');
    fireEvent.click(friendlyTone);

    fireEvent.click(screen.getByRole('link', { name: /context/i }));
    const maxContextInput = await screen.findByLabelText(/Maximum context messages/i);
    fireEvent.change(maxContextInput, { target: { value: '8' } });

    const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully in your browser!')).toBeDefined();
    });

    const stored = await loadSettings();
    expect(stored.geminiApiKey).toBe('AIzaSy-router-test-key');
    expect(stored.defaultTone).toBe('friendly');
    expect(stored.maxContextMessages).toBe(8);
  });
});
