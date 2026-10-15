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

    const toneTab = screen.getByRole('link', { name: /văn phong/i });
    fireEvent.click(toneTab);
    expect(await screen.findByText('Văn phong mặc định')).toBeDefined();
    expect(screen.getByText('Lịch sự & Trang trọng')).toBeDefined();

    const contextTab = screen.getByRole('link', { name: /ngữ cảnh/i });
    fireEvent.click(contextTab);
    expect(await screen.findByText('Bối cảnh hội thoại (Chat Context)')).toBeDefined();

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

    fireEvent.click(screen.getByRole('link', { name: /văn phong/i }));
    const friendlyTone = await screen.findByText('Thân thiện & Tự nhiên');
    fireEvent.click(friendlyTone);

    fireEvent.click(screen.getByRole('link', { name: /ngữ cảnh/i }));
    const maxContextInput = await screen.findByLabelText(/Số lượng tin nhắn ngữ cảnh tối đa/i);
    fireEvent.change(maxContextInput, { target: { value: '8' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu Cài Đặt/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Cài đặt đã được lưu thành công vào trình duyệt!')).toBeDefined();
    });

    const stored = await loadSettings();
    expect(stored.geminiApiKey).toBe('AIzaSy-router-test-key');
    expect(stored.defaultTone).toBe('friendly');
    expect(stored.maxContextMessages).toBe(8);
  });
});
