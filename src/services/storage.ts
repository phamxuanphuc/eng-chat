import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  llmProvider: 'gemini',
  geminiApiKey: '',
  apiKeys: [],
  autoRotateKeys: true,
  selectedModel: 'gemini-3.5-flash-lite',
  defaultTone: 'professional',
  tonePrompts: {},
  enableChatContext: true,
  maxContextMessages: 4,
  customBaseUrl: 'https://api.openai.com/v1',
  customApiKey: '',
  customModel: 'gpt-4o-mini',
};


const STORAGE_KEY = 'engchat_settings';

const getLocalStorage = (): Storage | null => {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage;
      }
    }
  } catch {}
  return null;
};


export const loadSettings = async (): Promise<AppSettings> => {
  let loaded = { ...DEFAULT_SETTINGS };
  let found = false;

  if (typeof chrome !== 'undefined') {
    for (const area of [chrome.storage?.local, chrome.storage?.sync]) {
      if (found || !area) continue;
      try {
        const result = await area.get(STORAGE_KEY);
        if (result && result[STORAGE_KEY]) {
          loaded = { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
          found = true;
        }
      } catch {}
    }
  }

  const local = getLocalStorage();
  if (!found && local) {
    try {
      const stored = local.getItem(STORAGE_KEY);
      if (stored) {
        loaded = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}
  }

  if (!loaded.selectedModel || loaded.selectedModel.includes('2.0-flash')) {
    loaded.selectedModel = 'gemini-3.5-flash-lite';
  }

  loaded.language = loaded.language === 'vi' ? 'vi' : 'en';

  if (!loaded.llmProvider) {
    loaded.llmProvider = 'gemini';
  }
  if (!loaded.customBaseUrl) {
    loaded.customBaseUrl = 'https://api.openai.com/v1';
  }
  if (!loaded.customModel) {
    loaded.customModel = 'gpt-4o-mini';
  }

  const validKeys = (loaded.apiKeys || []).filter(

    (k) => k && typeof k.key === 'string' && k.key.trim().length > 0
  );

  if (validKeys.length === 0 && loaded.geminiApiKey?.trim()) {
    loaded.apiKeys = [
      { id: 'key-1', label: 'Key 1', key: loaded.geminiApiKey.trim() },
    ];
  } else if (validKeys.length > 0) {
    loaded.apiKeys = validKeys;
    if (!loaded.geminiApiKey || !loaded.geminiApiKey.trim()) {
      loaded.geminiApiKey = validKeys[0].key;
    }
  } else {
    loaded.apiKeys = [];
    loaded.geminiApiKey = '';
  }

  return loaded;
};

export const saveSettings = async (
  partial: Partial<AppSettings>
): Promise<AppSettings> => {
  const current = await loadSettings();
  const updated: AppSettings = { ...current, ...partial };

  if (updated.geminiApiKey && (!updated.apiKeys || updated.apiKeys.length === 0)) {
    updated.apiKeys = [
      { id: 'key-1', label: 'Primary key', key: updated.geminiApiKey.trim() },
    ];
  } else if (updated.apiKeys && updated.apiKeys.length > 0 && !updated.geminiApiKey) {
    updated.geminiApiKey = updated.apiKeys[0].key;
  }

  let persisted = false;
  if (typeof chrome !== 'undefined') {
    for (const area of [chrome.storage?.local, chrome.storage?.sync]) {
      if (!area) continue;
      try {
        await area.set({ [STORAGE_KEY]: updated });
        persisted = true;
      } catch {}
    }
  }

  const local = getLocalStorage();
  if (local) {
    try {
      local.setItem(STORAGE_KEY, JSON.stringify(updated));
      persisted = true;
    } catch {}
  }

  if (!persisted) throw new Error('Unable to save settings.');
  return updated;
};

