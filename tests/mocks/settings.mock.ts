import { AppSettings } from '../../src/types';

export const mockDefaultSettings: AppSettings = {
  geminiApiKey: 'test-api-key-12345',
  apiKeys: [{ id: 'k1', label: 'Khóa 1', key: 'test-api-key-12345' }],
  autoRotateKeys: true,
  selectedModel: 'gemini-3.5-flash-lite',
  defaultTone: 'professional',
  enableChatContext: true,
  maxContextMessages: 4,
};

export const mockMultiKeySettings: AppSettings = {
  geminiApiKey: 'primary-key',
  apiKeys: [
    { id: 'k1', label: 'Primary', key: 'primary-key' },
    { id: 'k2', label: 'Backup', key: 'backup-key' },
  ],
  autoRotateKeys: true,
  selectedModel: 'gemini-3.5-flash-lite',
  defaultTone: 'professional',
  enableChatContext: true,
  maxContextMessages: 4,
};

export const mockEmptySettings: AppSettings = {
  geminiApiKey: '',
  apiKeys: [],
  autoRotateKeys: true,
  selectedModel: 'gemini-3.5-flash-lite',
  defaultTone: 'polite',
  enableChatContext: false,
  maxContextMessages: 3,
};
