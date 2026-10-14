import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToneType, OptimizeResponse } from '../types';
import { getActiveEditableElement, getSelectedText, replaceTextInElement } from './dom-utils';
import { extractChatContext } from './chat-extractor';
import { computeToolbarPos, setupDOMEvents } from './content-events';
import { ContentOverlay } from './ui/ContentOverlay';
import styles from '../styles/index.css?inline';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;
let currentEditableEl: HTMLElement | null = null;

let toolbarState = { visible: false, x: 0, y: 0, isLoading: false };
let tooltipState = {
  visible: false,
  originalText: '',
  result: null as any,
  isLoading: false,
  error: null as string | null,
  targetLanguage: 'Vietnamese',
  isPinned: false,
  hasEditableTarget: false,
};

const ensureShadowHost = (): ShadowRoot => {
  if (shadowRoot) return shadowRoot;
  const host = document.createElement('div');
  host.id = 'engchat-root-host';
  document.body.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleLink = document.createElement('style');
  styleLink.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    :host { all: initial; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    * { box-sizing: border-box; }
    ${styles}
  `;
  shadowRoot.appendChild(styleLink);

  const appContainer = document.createElement('div');
  appContainer.id = 'engchat-app-container';
  shadowRoot.appendChild(appContainer);
  reactRoot = ReactDOM.createRoot(appContainer);
  return shadowRoot;
};

const renderApp = () => {
  ensureShadowHost();
  if (!reactRoot) return;

  reactRoot.render(
    <ContentOverlay
      toolbar={toolbarState}
      tooltip={tooltipState}
      onSelectTone={(tone) => handleTriggerOptimize(tone)}
      onCloseToolbar={() => {
        toolbarState = { ...toolbarState, visible: false };
        renderApp();
      }}
      onTogglePin={() => {
        tooltipState = { ...tooltipState, isPinned: !tooltipState.isPinned };
        renderApp();
      }}
      onLanguageChange={(lang) => handleLanguageChange(lang)}
      onFollowUp={(query) => handleFollowUp(query)}
      onRegenerate={() => handleRegenerate()}
      onInsertText={(text) => {
        if (currentEditableEl) {
          replaceTextInElement(currentEditableEl, text);
          tooltipState = { ...tooltipState, visible: false };
          renderApp();
        }
      }}
      onCloseTooltip={() => {
        tooltipState = { ...tooltipState, visible: false };
        renderApp();
      }}
    />
  );
};

const handleTriggerOptimize = async (tone: ToneType, settings?: any, customText?: string) => {
  const activeEl = getActiveEditableElement() || currentEditableEl;
  currentEditableEl = activeEl;
  const targetText = customText || getSelectedText();

  if (!targetText) {
    tooltipState = { ...tooltipState, visible: true, isLoading: false, error: 'Vui lòng bôi đen hoặc nhập văn bản.', result: null, hasEditableTarget: !!activeEl };
    renderApp();
    return;
  }

  const isTranslate = tone === 'translate_explain';
  if (isTranslate) {
    tooltipState = { ...tooltipState, visible: true, originalText: targetText, isLoading: true, error: null, hasEditableTarget: !!activeEl };
    toolbarState = { ...toolbarState, visible: false };
  } else {
    toolbarState = { ...toolbarState, isLoading: true };
  }
  renderApp();

  const shouldExtract = settings ? settings.enableChatContext : true;
  const contextMessages = shouldExtract ? extractChatContext(activeEl, settings?.maxContextMessages || 4) : [];

  try {
    const response: OptimizeResponse = await chrome.runtime.sendMessage({
      action: 'EXECUTE_GEMINI',
      payload: { text: targetText, tone, contextMessages },
    });
    toolbarState = { ...toolbarState, isLoading: false, visible: false };

    if (response.success && response.data) {
      if (!isTranslate && activeEl) {
        const textToReplace = typeof response.data === 'string' ? response.data : response.data.translation;
        replaceTextInElement(activeEl, textToReplace);
      } else {
        tooltipState = { ...tooltipState, visible: true, originalText: targetText, isLoading: false, result: response.data, error: null, hasEditableTarget: !!activeEl };
      }
    } else {
      tooltipState = { ...tooltipState, visible: true, isLoading: false, error: response.error || 'Có lỗi xảy ra khi gọi AI.', result: null, hasEditableTarget: !!activeEl };
    }
    renderApp();
  } catch (err: any) {
    toolbarState = { ...toolbarState, isLoading: false, visible: false };
    tooltipState = { ...tooltipState, visible: true, isLoading: false, error: err?.message || 'Lỗi kết nối extension.', result: null, hasEditableTarget: !!activeEl };
    renderApp();
  }
};

const handleFollowUp = async (query: string) => {
  if (!tooltipState.originalText) return;
  tooltipState = { ...tooltipState, isLoading: true, error: null };
  renderApp();

  try {
    const prompt = `Văn bản gốc: "${tooltipState.originalText}"\n\nYêu cầu xử lý tiếp theo: ${query}`;
    const response: OptimizeResponse = await chrome.runtime.sendMessage({
      action: 'EXECUTE_GEMINI',
      payload: { text: prompt, tone: 'translate_explain' },
    });
    tooltipState = { ...tooltipState, isLoading: false, result: response.success ? response.data : null, error: response.success ? null : (response.error || 'Lỗi xử lý') };
    renderApp();
  } catch (err: any) {
    tooltipState = { ...tooltipState, isLoading: false, error: err?.message || 'Lỗi kết nối' };
    renderApp();
  }
};

const handleRegenerate = () => {
  if (tooltipState.originalText) {
    handleTriggerOptimize('translate_explain', undefined, tooltipState.originalText);
  }
};

const handleLanguageChange = async (lang: string) => {
  tooltipState = { ...tooltipState, targetLanguage: lang, isLoading: true, error: null };
  renderApp();
  await handleFollowUp(`Dịch toàn bộ văn bản gốc sang ngôn ngữ: ${lang}`);
};

setupDOMEvents({
  onFocus: (rect, element) => {
    currentEditableEl = element;
    const pos = computeToolbarPos(rect);
    toolbarState = { visible: true, x: pos.x, y: pos.y, isLoading: false };
    renderApp();
  },
  onSelect: (rect) => {
    const pos = computeToolbarPos(rect);
    toolbarState = { visible: true, x: pos.x, y: pos.y, isLoading: false };
    renderApp();
  },
  onClickOutside: () => {
    if (toolbarState.visible) {
      toolbarState = { ...toolbarState, visible: false };
      renderApp();
    }
    if (tooltipState.visible && !tooltipState.isPinned) {
      tooltipState = { ...tooltipState, visible: false };
      renderApp();
    }
  },
});

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'TRIGGER_OPTIMIZE') {
      handleTriggerOptimize(message.tone, message.settings);
      sendResponse({ received: true });
      return true;
    }
    return false;
  });
}
