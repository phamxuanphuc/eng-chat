import { AppSettings } from '../../src/types';

export const mockDefaultSettings: AppSettings = {
  geminiApiKey: 'test-api-key-12345',
  selectedModel: 'gemini-2.0-flash',
  defaultTone: 'professional',
  enableChatContext: true,
  maxContextMessages: 3,
};

export const mockEmptySettings: AppSettings = {
  geminiApiKey: '',
  selectedModel: 'gemini-2.0-flash',
  defaultTone: 'polite',
  enableChatContext: false,
  maxContextMessages: 3,
};
