import { create } from 'zustand';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../services/storage';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => {
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if ((areaName === 'sync' || areaName === 'local') && changes['engchat_settings']?.newValue) {
        set({ settings: changes['engchat_settings'].newValue });
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'engchat_settings' && e.newValue) {
        try {
          set({ settings: JSON.parse(e.newValue) });
        } catch {}
      }
    });
  }

  return {
    settings: DEFAULT_SETTINGS,
    isLoading: false,
    error: null,

    fetchSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await loadSettings();
        set({ settings: data, isLoading: false });
      } catch {
        set({ error: 'Failed to load settings', isLoading: false });
      }
    },

    updateSettings: async (partial: Partial<AppSettings>) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await saveSettings(partial);
        set({ settings: updated, isLoading: false });
      } catch {
        set({ error: 'Failed to save settings', isLoading: false });
      }
    },
  };
});
