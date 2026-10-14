import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  selectedModel: 'gemini-2.0-flash',
  defaultTone: 'professional',
  enableChatContext: true,
  maxContextMessages: 3,
};

const STORAGE_KEY = 'engchat_settings';

export const loadSettings = async (): Promise<AppSettings> => {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEY);
      if (result && result[STORAGE_KEY]) {
        return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
      }
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = async (
  partial: Partial<AppSettings>
): Promise<AppSettings> => {
  const current = await loadSettings();
  const updated: AppSettings = { ...current, ...partial };

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: updated });
  }

  return updated;
};
