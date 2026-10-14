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

export const useSettingsStore = create<SettingsState>((set) => ({
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
}));
