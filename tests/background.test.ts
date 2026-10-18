import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setupContextMenus,
  handleContextMenuClick,
  handleRuntimeMessage,
  handleCommand,
  safeSendTabMessage,
} from '../src/background/index';

describe('Background Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).chrome = {
      contextMenus: {
        removeAll: vi.fn((cb) => cb && cb()),
        create: vi.fn(),
      },
      tabs: {
        sendMessage: vi.fn(),
        query: vi.fn(async () => [{ id: 999 }]),
      },
      storage: {
        sync: {
          get: vi.fn(async () => ({})),
          set: vi.fn(async () => {}),
        },
      },
    };
  });

  it('TC-BG-01: sets up context menus on install', () => {
    setupContextMenus();
    expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'engchat_root' })
    );
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'engchat_action_improve', title: 'Improve' })
    );
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'engchat_action_rewrite', title: 'Rewrite' })
    );
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'engchat_action_translate', title: 'Translate' })
    );
    const createdTitles = (chrome.contextMenus.create as any).mock.calls
      .filter(([item]: any[]) => item.parentId === 'engchat_root')
      .map(([item]: any[]) => item.title);
    expect(createdTitles).toEqual(['Improve', 'Rewrite', 'Translate']);
  });

  it('TC-BG-02: dispatches each context action with its mode and tone', async () => {
    const tab = { id: 101 } as any;
    (chrome.storage.sync.get as any).mockResolvedValue({
      engchat_settings: { defaultTone: 'friendly' },
    });

    await handleContextMenuClick({ menuItemId: 'engchat_action_improve' } as any, tab);
    await handleContextMenuClick({ menuItemId: 'engchat_action_rewrite' } as any, tab);
    await handleContextMenuClick({ menuItemId: 'engchat_action_translate' } as any, tab);

    expect(chrome.tabs.sendMessage).toHaveBeenNthCalledWith(
      1,
      101,
      expect.objectContaining({ action: 'TRIGGER_OPTIMIZE', tone: 'friendly', mode: 'improve' })
    );
    expect(chrome.tabs.sendMessage).toHaveBeenNthCalledWith(
      2,
      101,
      expect.objectContaining({ action: 'TRIGGER_OPTIMIZE', tone: 'friendly', mode: 'rewrite' })
    );
    expect(chrome.tabs.sendMessage).toHaveBeenNthCalledWith(
      3,
      101,
      expect.objectContaining({ action: 'TRIGGER_OPTIMIZE', tone: 'translate_explain', mode: 'translate' })
    );
  });

  it('TC-BG-03: handles GET_SETTINGS message', async () => {
    const sendResponse = vi.fn();
    await handleRuntimeMessage({ action: 'GET_SETTINGS' }, {} as any, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ selectedModel: 'gemini-3.5-flash-lite' })
    );

  });

  it('TC-BG-04: dispatches message to active tab on keyboard command', async () => {
    await handleCommand('optimize_selection');

    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      999,
      expect.objectContaining({
        action: 'TRIGGER_OPTIMIZE',
        tone: 'professional',
      })
    );
  });

  it('TC-BG-05: safeSendTabMessage safely handles unreachable tab without throwing', async () => {
    (chrome.tabs.sendMessage as any).mockRejectedValueOnce(
      new Error('Could not establish connection. Receiving end does not exist.')
    );
    (chrome.tabs.get as any) = vi.fn().mockResolvedValue({ url: 'chrome://extensions' });

    const result = await safeSendTabMessage(999, { action: 'TRIGGER_OPTIMIZE' });
    expect(result).toBe(false);
  });
});

describe('Background FETCH_CUSTOM_MODELS', () => {
  it('fetches custom models from the service worker', async () => {
    const axios = (await import('axios')).default;
    const getSpy = vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: { data: [{ id: 'b' }, { id: 'a' }] } });
    (globalThis as any).chrome = {
      storage: { sync: { get: vi.fn(async () => ({ engchat_settings: { customBaseUrl: 'https://x.test/v1', customApiKey: 'sk' } })), set: vi.fn() } },
    };
    const sendResponse = vi.fn();
    await handleRuntimeMessage({ action: 'FETCH_CUSTOM_MODELS' }, {} as any, sendResponse);
    expect(getSpy).toHaveBeenCalledWith('https://x.test/v1/models', expect.objectContaining({ headers: { Authorization: 'Bearer sk' } }));
    expect(sendResponse).toHaveBeenCalledWith({ success: true, models: ['a', 'b'] });
    getSpy.mockRestore();
  });
});

describe('Background OPEN_OPTIONS_PAGE', () => {
  it('opens the options page from the service worker', async () => {
    const openOptionsPage = vi.fn(async () => {});
    (globalThis as any).chrome = { runtime: { openOptionsPage } };
    const sendResponse = vi.fn();
    await handleRuntimeMessage({ action: 'OPEN_OPTIONS_PAGE' }, {} as any, sendResponse);
    expect(openOptionsPage).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});
