import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { App as OptionsApp } from '../src/options/App';
import { App as PopupApp } from '../src/popup/App';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { mockGeminiSuccessRawResponse } from './mocks/gemini.mock';

vi.mock('axios');

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('E2E Multi-Key Management & Failover', () => {
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

    (axios as any).isAxiosError = vi.fn((err) => !!err?.isAxios);
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('E2E-MK-01: User adds primary key and backup key, then saves settings', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    );

    const primaryInput = screen.getByPlaceholderText('AIzaSy...');
    fireEvent.change(primaryInput, { target: { value: 'primary-ai-key' } });

    const backupLabelInput = screen.getByPlaceholderText('VD: Dự phòng 1, Cá nhân...');
    fireEvent.change(backupLabelInput, { target: { value: 'Dự phòng 1' } });

    const backupKeyInput = screen.getByPlaceholderText('Nhập khóa dự phòng...');
    fireEvent.change(backupKeyInput, { target: { value: 'backup-ai-key-002' } });

    const addBackupBtn = screen.getByRole('button', { name: /Thêm khóa dự phòng/i });
    fireEvent.click(addBackupBtn);

    expect(screen.getByText('Dự phòng 1')).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Lưu Cài Đặt/i });
    fireEvent.click(saveBtn);

    await waitFor(async () => {
      const stored = await loadSettings();
      expect(stored.geminiApiKey).toBe('primary-ai-key');
      expect(stored.apiKeys?.length).toBe(2);
      expect(stored.apiKeys?.[1].key).toBe('backup-ai-key-002');
    });
  });

  it('E2E-MK-02: Popup displays number of active keys and optimizes text', async () => {
    const testSettings = {
      ...DEFAULT_SETTINGS,
      geminiApiKey: 'primary-key',
      apiKeys: [
        { id: 'k1', label: 'Khóa chính', key: 'primary-key' },
        { id: 'k2', label: 'Dự phòng 1', key: 'backup-key' },
      ],
      autoRotateKeys: true,
    };
    mockStorageData['engchat_settings'] = testSettings;
    useSettingsStore.setState({ settings: testSettings });

    vi.mocked(axios.post).mockResolvedValueOnce({
      data: mockGeminiSuccessRawResponse,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PopupApp />
      </QueryClientProvider>
    );

    expect(screen.getByText('2 Keys')).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Gõ hoặc dán văn bản/i);
    fireEvent.change(textarea, { target: { value: 'Kiểm tra' } });

    const submitBtn = screen.getByRole('button', { name: /Tối Ưu Ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('I have reviewed the payment gateway implementation and it looks solid.')
      ).toBeDefined();
    });
  });

  it('E2E-MK-03: User can promote backup key to primary key in Options', async () => {
    const testSettings = {
      ...DEFAULT_SETTINGS,
      geminiApiKey: 'key-alpha',
      apiKeys: [
        { id: 'k1', label: 'Khóa Alpha', key: 'key-alpha' },
        { id: 'k2', label: 'Khóa Beta', key: 'key-beta' },
      ],
      autoRotateKeys: true,
    };
    mockStorageData['engchat_settings'] = testSettings;
    useSettingsStore.setState({ settings: testSettings });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    );

    const makePrimaryBtn = screen.getByRole('button', { name: /Đặt chính/i });
    fireEvent.click(makePrimaryBtn);

    const saveBtn = screen.getByRole('button', { name: /Lưu Cài Đặt/i });
    fireEvent.click(saveBtn);

    await waitFor(async () => {
      const stored = await loadSettings();
      expect(stored.geminiApiKey).toBe('key-beta');
      expect(stored.apiKeys?.[0].label).toBe('Khóa Beta');
    });
  });
});
