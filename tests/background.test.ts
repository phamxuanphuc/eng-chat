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

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        action: 'TRIGGER_OPTIMIZE',
        tone: 'friendly',
      })
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
