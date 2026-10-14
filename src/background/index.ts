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

export const handleContextMenuClick = async (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) => {
  if (!tab?.id) return;
  const menuId = String(info.menuItemId);

  if (menuId.startsWith(CONTEXT_MENU_PREFIX)) {
    const tone = menuId.replace(CONTEXT_MENU_PREFIX, '') as ToneType;
    chrome.tabs.sendMessage(tab.id, {
      action: 'TRIGGER_OPTIMIZE',
      tone,
    });
  }
};

export const handleRuntimeMessage = async (
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
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

  return false;
};

export const handleCommand = async (command: string) => {
  if (command === 'optimize_selection') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    if (activeTab?.id) {
      const settings = await loadSettings();
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'TRIGGER_OPTIMIZE',
        tone: settings.defaultTone || 'professional',
      });
    }
  }
};

if (typeof chrome !== 'undefined') {
  chrome.runtime?.onInstalled?.addListener(() => {
    setupContextMenus();
  });

  chrome.contextMenus?.onClicked?.addListener((info, tab) => {
    handleContextMenuClick(info, tab);
  });

  chrome.commands?.onCommand?.addListener((command) => {
    handleCommand(command);
  });

  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    handleRuntimeMessage(message, sender, sendResponse);
    return true;
  });
}
