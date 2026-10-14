import { ToneType, OptimizeRequest } from '../types';
import { loadSettings, saveSettings } from '../services/storage';
import { executeOptimize } from '../services/gemini';

const CONTEXT_MENU_PREFIX = 'engchat_tone_';

const TONES_CONFIG: Array<{ id: ToneType; title: string }> = [
  { id: 'polite', title: '🎩 Lịch sự & Trang trọng (Polite)' },
  { id: 'professional', title: '💼 Chuyên nghiệp (Professional)' },
  { id: 'friendly', title: '🤝 Thân thiện (Friendly)' },
  { id: 'concise', title: '⚡ Ngắn gọn & Trực diện (Concise)' },
  { id: 'translate_explain', title: '📖 Dịch & Giải thích chi tiết' },
];

export const setupContextMenus = () => {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'engchat_root',
      title: 'EngChat AI - Tối ưu tiếng Anh',
      contexts: ['selection', 'editable'],
    });

    TONES_CONFIG.forEach((t) => {
      chrome.contextMenus.create({
        id: `${CONTEXT_MENU_PREFIX}${t.id}`,
        parentId: 'engchat_root',
        title: t.title,
        contexts: ['selection', 'editable'],
      });
    });
  });
};

export const safeSendTabMessage = async (
  tabId: number,
  message: any
): Promise<boolean> => {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    try {
      const tab = await chrome.tabs.get(tabId);
      const url = tab?.url || '';
      const isRestricted =
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('devtools://') ||
        url.startsWith('view-source:') ||
        url.includes('chrome.google.com/webstore') ||
        url.includes('chromewebstore.google.com');

      if (!isRestricted && chrome.scripting) {
        const manifest = chrome.runtime.getManifest();
        const contentScripts = manifest.content_scripts?.[0]?.js;
        if (contentScripts && contentScripts.length > 0) {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: contentScripts,
          });
          await chrome.tabs.sendMessage(tabId, message);
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }
};

export const handleContextMenuClick = async (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) => {
  if (!tab?.id) return;
  const menuId = String(info.menuItemId);

  if (menuId.startsWith(CONTEXT_MENU_PREFIX)) {
    const tone = menuId.replace(CONTEXT_MENU_PREFIX, '') as ToneType;
    const settings = await loadSettings();
    await safeSendTabMessage(tab.id, {
      action: 'TRIGGER_OPTIMIZE',
      tone,
      settings,
    });
  }
};

export const handleRuntimeMessage = async (
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  try {
    if (message?.action === 'EXECUTE_GEMINI') {
      const request: OptimizeRequest = message.payload;
      const settings = await loadSettings();
      const result = await executeOptimize(request, settings);
      sendResponse(result);
      return true;
    }

    if (message?.action === 'GET_SETTINGS') {
      const settings = await loadSettings();
      sendResponse(settings);
      return true;
    }

    if (message?.action === 'SAVE_SETTINGS') {
      const updated = await saveSettings(message.payload);
      sendResponse({ success: true, settings: updated });
      return true;
    }

    sendResponse({ success: false, error: 'Unknown action' });
    return false;
  } catch (err: any) {
    sendResponse({ success: false, error: err?.message || 'Lỗi xử lý nội bộ' });
    return false;
  }
};

export const handleCommand = async (command: string) => {
  if (command === 'optimize_selection') {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (activeTab?.id) {
        const settings = await loadSettings();
        await safeSendTabMessage(activeTab.id, {
          action: 'TRIGGER_OPTIMIZE',
          tone: settings.defaultTone || 'professional',
          settings,
        });
      }
    } catch {
      return;
    }
  }
};

if (typeof chrome !== 'undefined') {
  chrome.runtime?.onInstalled?.addListener(() => {
    setupContextMenus();
  });

  chrome.contextMenus?.onClicked?.addListener((info, tab) => {
    handleContextMenuClick(info, tab).catch(() => {});
  });

  chrome.commands?.onCommand?.addListener((command) => {
    handleCommand(command).catch(() => {});
  });

  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    handleRuntimeMessage(message, sender, sendResponse).catch((err) => {
      sendResponse({ success: false, error: err?.message || 'Message error' });
    });
    return true;
  });
}
