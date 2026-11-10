import { Language, ToneType, OptimizeRequest } from '../types';
import { loadSettings, saveSettings } from '../services/storage';
import { executeOptimize } from '../services/gemini';
import { handleStreamPort, STREAM_PORT_NAME } from './stream-port';
export { handleStreamPort, STREAM_PORT_NAME };
import { fetchOpenAiModels } from '../services/openai';
import { getTranslator, TranslationKey } from '../i18n';
import { ApiError, localizeError } from '../services/api-error';
import { getServerHost, hasHostPermission } from '../services/host-permission';

const CONTEXT_MENU_PREFIX = 'engchat_action_';

type ContextAction = 'improve' | 'rewrite' | 'summary' | 'translate';

const CONTEXT_ACTIONS: Array<{ id: ContextAction; titleKey: TranslationKey }> = [
  { id: 'improve', titleKey: 'outputLanguage.improve' },
  { id: 'rewrite', titleKey: 'outputLanguage.rewrite' },
  { id: 'summary', titleKey: 'outputLanguage.summary' },
  { id: 'translate', titleKey: 'outputLanguage.translate' },
];

const toneForAction = (action: ContextAction, defaultTone?: ToneType): ToneType =>
  action === 'translate' ? 'translate_explain' : action === 'summary' ? 'summarize' : defaultTone || 'professional';

const consumeLastError = () => {
  void chrome.runtime?.lastError;
};

const rebuildContextMenus = (language?: Language) =>
  new Promise<void>((resolve) => {
    const t = getTranslator(language);
    chrome.contextMenus.removeAll(() => {
      consumeLastError();
      chrome.contextMenus.create(
        { id: 'engchat_root', title: t('app.name'), contexts: ['selection', 'editable'] },
        consumeLastError
      );
      CONTEXT_ACTIONS.forEach((action) => {
        chrome.contextMenus.create(
          {
            id: `${CONTEXT_MENU_PREFIX}${action.id}`,
            parentId: 'engchat_root',
            title: t(action.titleKey),
            contexts: ['selection', 'editable'],
          },
          consumeLastError
        );
      });
      resolve();
    });
  });

let contextMenuQueue: Promise<void> = Promise.resolve();

export const setupContextMenus = (language?: Language): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) return Promise.resolve();
  contextMenuQueue = contextMenuQueue.then(() => rebuildContextMenus(language)).catch(() => {});
  return contextMenuQueue;
};

export const refreshContextMenus = async () => {
  const language = await loadSettings().then((settings) => settings.language).catch(() => undefined);
  await setupContextMenus(language);
};

export const handleInstalled = async (details?: { reason?: string }): Promise<void> => {
  await refreshContextMenus();
  if (details?.reason !== 'install') return;
  try {
    await chrome.runtime.openOptionsPage();
  } catch {}
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
    const actionId = menuId.replace(CONTEXT_MENU_PREFIX, '') as ContextAction;
    const action = CONTEXT_ACTIONS.find((item) => item.id === actionId);
    if (!action) return;
    const settings = await loadSettings();
    await safeSendTabMessage(tab.id, {
      action: 'TRIGGER_OPTIMIZE',
      tone: toneForAction(action.id, settings.defaultTone),
      mode: action.id,
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

    if (message?.action === 'OPEN_OPTIONS_PAGE') {
      await chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return true;
    }

    if (message?.action === 'FETCH_CUSTOM_MODELS') {
      const settings = await loadSettings();
      if (!(await hasHostPermission(settings.customBaseUrl))) {
        throw new ApiError('error.hostPermission', { server: getServerHost(settings.customBaseUrl) });
      }
      const models = await fetchOpenAiModels({ baseUrl: settings.customBaseUrl, apiKey: settings.customApiKey });
      sendResponse({ success: true, models });
      return true;
    }

    if (message?.action === 'SAVE_SETTINGS') {
      const updated = await saveSettings(message.payload);
      sendResponse({ success: true, settings: updated });
      return true;
    }

    sendResponse({ success: false, error: 'Unknown action' });
    return false;
  } catch (err) {
    const language = await loadSettings().then((settings) => settings.language).catch(() => undefined);
    sendResponse({ success: false, error: localizeError(err, language) });
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
  chrome.runtime?.onInstalled?.addListener((details) => {
    void handleInstalled(details);
  });

  chrome.runtime?.onStartup?.addListener(() => {
    void refreshContextMenus();
  });

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    const change = changes.engchat_settings;
    if (areaName === 'local' && change && change.oldValue?.language !== change.newValue?.language) {
      void refreshContextMenus();
    }
  });

  chrome.contextMenus?.onClicked?.addListener((info, tab) => {
    handleContextMenuClick(info, tab).catch(() => {});
  });

  chrome.commands?.onCommand?.addListener((command) => {
    handleCommand(command).catch(() => {});
  });

  chrome.runtime?.onConnect?.addListener((port) => {
    if (port.name === STREAM_PORT_NAME) handleStreamPort(port);
  });

  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    handleRuntimeMessage(message, sender, sendResponse).catch((err) => {
      sendResponse({ success: false, error: err?.message || 'Message error' });
    });
    return true;
  });
}
