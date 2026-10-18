import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

describe('Storage & Settings Store', () => {
  let mockStorageData: Record<string, any> = {};

  beforeEach(() => {
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
    };
  });

  it('TC-ST-01: loads default settings when storage is empty', async () => {
    const settings = await loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.defaultTone).toBe('professional');
    expect(settings.enableChatContext).toBe(true);
  });

  it('persists the selected language and falls back to English for invalid values', async () => {
    await saveSettings({ language: 'vi' });
    expect((await loadSettings()).language).toBe('vi');
    await saveSettings({ language: 'fr' as any });
    expect((await loadSettings()).language).toBe('en');
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

  it('persists provider-specific selected models', async () => {
    await saveSettings({ llmProvider: 'openai_compatible', selectedModel: 'gemini-2.5-flash', customModel: 'local-model' });
    const loaded = await loadSettings();
    expect(loaded.llmProvider).toBe('openai_compatible');
    expect(loaded.selectedModel).toBe('gemini-2.5-flash');
    expect(loaded.customModel).toBe('local-model');
  });

  it('TC-ST-04: loads and saves multiple API keys with auto-rotation setting', async () => {
    const customKeys = [
      { id: 'k1', label: 'Main', key: 'key-1' },
      { id: 'k2', label: 'Backup', key: 'key-2' },
    ];
    await saveSettings({
      apiKeys: customKeys,
      autoRotateKeys: true,
      geminiApiKey: 'key-1',
    });

    const loaded = await loadSettings();
    expect(loaded.apiKeys).toEqual(customKeys);
    expect(loaded.autoRotateKeys).toBe(true);
    expect(loaded.geminiApiKey).toBe('key-1');
  });
});


describe('Storage area precedence', () => {
  it('prefers chrome.storage.local over a stale sync copy', async () => {
    (globalThis as any).chrome = {
      storage: {
        local: { get: vi.fn(async () => ({ engchat_settings: { defaultTone: 'friendly' } })), set: vi.fn(async () => {}) },
        sync: { get: vi.fn(async () => ({ engchat_settings: { defaultTone: 'polite' } })), set: vi.fn(async () => {}) },
      },
    };
    expect((await loadSettings()).defaultTone).toBe('friendly');
  });

  it('keeps saving when sync quota is exceeded and throws when nothing persists', async () => {
    const local = { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) };
    const sync = { get: vi.fn(async () => ({})), set: vi.fn(async () => { throw new Error('QUOTA_BYTES_PER_ITEM'); }) };
    (globalThis as any).chrome = { storage: { local, sync } };
    await expect(saveSettings({ defaultTone: 'concise' })).resolves.toMatchObject({ defaultTone: 'concise' });
    expect(local.set).toHaveBeenCalled();

    local.set.mockRejectedValueOnce(new Error('disk full'));
    await expect(saveSettings({ defaultTone: 'concise' })).rejects.toThrow('Unable to save settings.');
  });
});
