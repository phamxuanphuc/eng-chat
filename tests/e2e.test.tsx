import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { App as OptionsApp } from '../src/options/App';
import { App as PopupApp } from '../src/popup/App';
import { replaceTextInElement } from '../src/content/dom-utils';
import { extractChatContext } from '../src/content/chat-extractor';
import { executeOptimize } from '../src/services/gemini';
import { loadSettings, DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { mockGeminiSuccessRawResponse } from './mocks/gemini.mock';

vi.mock('axios');

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

describe('E2E User Flow Tests', () => {
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

  it('E2E-01: User configures and saves API Key, Model, and Context limit in Options', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    );

    const apiKeyInput = screen.getByPlaceholderText('AIzaSy...') as HTMLInputElement;
    fireEvent.change(apiKeyInput, { target: { value: 'AIzaSy-e2e-live-key' } });

    const toneTab = screen.getByRole('link', { name: /văn phong/i });
    fireEvent.click(toneTab);

    const conciseTone = await screen.findByText('Ngắn gọn & Trực diện');
    fireEvent.click(conciseTone);

    const contextTab = screen.getByRole('link', { name: /ngữ cảnh/i });
    fireEvent.click(contextTab);

    const maxContextInput = await screen.findByLabelText(/Số lượng tin nhắn ngữ cảnh tối đa/i);
    fireEvent.change(maxContextInput, { target: { value: '6' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu Cài Đặt/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Cài đặt đã được lưu thành công vào trình duyệt!')).toBeDefined();
    });

    const stored = await loadSettings();
    expect(stored.geminiApiKey).toBe('AIzaSy-e2e-live-key');
    expect(stored.defaultTone).toBe('concise');
    expect(stored.maxContextMessages).toBe(6);
  });

  it('E2E-02: User tests API connection from Options page', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: 'OK' }] } }],
      },
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    );

    const apiKeyInput = screen.getByPlaceholderText('AIzaSy...');
    fireEvent.change(apiKeyInput, { target: { value: 'test-ping-key' } });

    const testBtn = screen.getByRole('button', { name: /Kiểm tra kết nối/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText('Kết nối thành công! API Key hoạt động bình thường.')).toBeDefined();
    });
  });

  it('E2E-03: User opens Popup and optimizes custom text directly', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: mockGeminiSuccessRawResponse,
    });

    const testSettings = {
      geminiApiKey: 'valid-popup-key',
      selectedModel: 'gemini-3.5-flash-lite',
      defaultTone: 'professional' as const,
      enableChatContext: true,
      maxContextMessages: 4,
    };
    mockStorageData['engchat_settings'] = testSettings;
    useSettingsStore.setState({ settings: testSettings });

    const queryClient = createTestQueryClient();
    render(<QueryClientProvider client={queryClient}><PopupApp /></QueryClientProvider>);

    const textarea = screen.getByPlaceholderText(/Gõ hoặc dán văn bản/i);
    fireEvent.change(textarea, { target: { value: 'Tôi đã xem xét cổng thanh toán' } });

    const submitBtn = screen.getByRole('button', { name: /Tối Ưu Ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('I have reviewed the payment gateway implementation and it looks solid.')
      ).toBeDefined();
    });
  });

  it('E2E-04: Chat context extraction and auto-replacement in conversation input', async () => {
    document.body.innerHTML = '';
    const chatContainer = document.createElement('div');
    chatContainer.setAttribute('role', 'log');

    const prevMsg1 = document.createElement('div');
    prevMsg1.setAttribute('data-qa', 'message_content');
    prevMsg1.innerText = 'What is the deployment timeline for version 2?';
    chatContainer.appendChild(prevMsg1);

    const prevMsg2 = document.createElement('div');
    prevMsg2.setAttribute('data-qa', 'message_content');
    prevMsg2.innerText = 'We need to finish QA by Friday.';
    chatContainer.appendChild(prevMsg2);

    const chatInput = document.createElement('input');
    chatInput.value = 'Chắc chắn, tôi sẽ hoàn thành đúng hạn';
    chatContainer.appendChild(chatInput);
    document.body.appendChild(chatContainer);

    const extracted = extractChatContext(chatInput, 4);
    expect(extracted.length).toBe(2);
    expect(extracted[0].text).toBe('What is the deployment timeline for version 2?');

    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: 'Certainly, I will ensure everything is finished on schedule.' }] } }],
      },
    });

    const aiResponse = await executeOptimize(
      { text: chatInput.value, tone: 'professional', contextMessages: extracted },
      { geminiApiKey: 'test-chat-key', selectedModel: 'gemini-3.5-flash-lite', defaultTone: 'professional', enableChatContext: true, maxContextMessages: 4 }
    );

    expect(aiResponse.success).toBe(true);

    const replaced = replaceTextInElement(chatInput, aiResponse.data as string);
    expect(replaced).toBe(true);
    expect(chatInput.value).toBe('Certainly, I will ensure everything is finished on schedule.');
  });

  it('E2E-05: Error handling and user alert when API key is invalid', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce({
      isAxios: true,
      response: { status: 401, data: { error: { message: 'API_KEY_INVALID' } } },
    });

    const invalidSettings = {
      geminiApiKey: 'invalid-401-key',
      selectedModel: 'gemini-3.5-flash-lite',
      defaultTone: 'professional' as const,
      enableChatContext: true,
      maxContextMessages: 4,
    };
    mockStorageData['engchat_settings'] = invalidSettings;
    useSettingsStore.setState({ settings: invalidSettings });

    const queryClient = createTestQueryClient();
    render(<QueryClientProvider client={queryClient}><PopupApp /></QueryClientProvider>);

    const textarea = screen.getByPlaceholderText(/Gõ hoặc dán văn bản/i);
    fireEvent.change(textarea, { target: { value: 'Xin chào' } });

    const submitBtn = screen.getByRole('button', { name: /Tối Ưu Ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Gemini API Key không chính xác hoặc không có quyền truy cập/i)
      ).toBeDefined();
    });
  });
});
