import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setupContextMenus,
  handleContextMenuClick,
  handleRuntimeMessage,
} from '../src/background/index';

describe('Background Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).chrome = {
      contextMenus: {
        removeAll: vi.fn((cb) => cb && cb()),
        create: vi.fn(),
      },
      tabs: {
        sendMessage: vi.fn(),
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
      expect.objectContaining({ id: 'engchat_tone_polite' })
    );
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'engchat_tone_translate_explain' })
    );
  });

  it('TC-BG-02: dispatches message to active tab on context menu click', async () => {
    const info = { menuItemId: 'engchat_tone_friendly' } as any;
    const tab = { id: 101 } as any;

    await handleContextMenuClick(info, tab);

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(101, {
      action: 'TRIGGER_OPTIMIZE',
      tone: 'friendly',
    });
  });

  it('TC-BG-03: handles GET_SETTINGS message', async () => {
    const sendResponse = vi.fn();
    await handleRuntimeMessage({ action: 'GET_SETTINGS' }, {} as any, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ selectedModel: 'gemini-2.0-flash' })
    );
  });
});
