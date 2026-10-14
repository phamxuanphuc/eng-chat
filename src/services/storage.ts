import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  apiKeys: [],
  autoRotateKeys: true,
  selectedModel: 'gemini-2.0-flash',
  defaultTone: 'professional',
  enableChatContext: true,
  maxContextMessages: 4,
};

const STORAGE_KEY = 'engchat_settings';

export const loadSettings = async (): Promise<AppSettings> => {
  let loaded = DEFAULT_SETTINGS;

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEY);
      if (result && result[STORAGE_KEY]) {
        loaded = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
      }
    } catch {
      loaded = DEFAULT_SETTINGS;
    }
  }

  const keys = loaded.apiKeys || [];
  if (keys.length === 0 && loaded.geminiApiKey) {
    loaded.apiKeys = [
      { id: 'key-1', label: 'Khóa 1', key: loaded.geminiApiKey },
    ];
  } else if (keys.length > 0 && !loaded.geminiApiKey) {
    loaded.geminiApiKey = keys[0].key;
  }

  return loaded;
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
