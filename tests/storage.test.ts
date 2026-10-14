import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

describe('Storage & Settings Store', () => {
  let mockStorageData: Record<string, any> = {};

  beforeEach(() => {
    mockStorageData = {};
    (global as any).chrome = {
      storage: {
        sync: {
          get: vi.fn(async (key: string) => ({ [key]: mockStorageData[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(mockStorageData, obj);
          }),
        },
      },
    };
  });

  it('TC-ST-01: loads default settings when storage is empty', async () => {
    const settings = await loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.defaultTone).toBe('professional');
    expect(settings.enableChatContext).toBe(true);
  });

  it('TC-ST-02: saves and retrieves new settings', async () => {
    await saveSettings({ geminiApiKey: 'ai-key-abc-123', defaultTone: 'polite' });
    const settings = await loadSettings();

    expect(settings.geminiApiKey).toBe('ai-key-abc-123');
    expect(settings.defaultTone).toBe('polite');
    expect(settings.maxContextMessages).toBe(DEFAULT_SETTINGS.maxContextMessages);
  });

  it('TC-ST-03: Zustand store updates state and syncs with storage', async () => {
    const { fetchSettings, updateSettings } = useSettingsStore.getState();

    await fetchSettings();
    expect(useSettingsStore.getState().settings.geminiApiKey).toBe('');

    await updateSettings({ geminiApiKey: 'new-key-xyz', enableChatContext: false });
    const current = useSettingsStore.getState().settings;

    expect(current.geminiApiKey).toBe('new-key-xyz');
    expect(current.enableChatContext).toBe(false);
  });
});
