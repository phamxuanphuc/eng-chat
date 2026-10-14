import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToneType, OptimizeResponse } from '../types';
import { getActiveEditableElement, getSelectedText, replaceTextInElement } from './dom-utils';
import { extractChatContext } from './chat-extractor';
import { ContentOverlay } from './ui/ContentOverlay';
import styles from '../styles/index.css?inline';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;
let currentEditableEl: HTMLElement | null = null;

let toolbarState = {
  visible: false,
  x: 0,
  y: 0,
  isLoading: false,
};

let tooltipState = {
  visible: false,
  isLoading: false,
  error: null as string | null,
  result: null as any,
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

const computeToolbarPos = (rect: DOMRect) => {
  const width = 180;
  const height = 40;
  let x = rect.left + rect.width / 2 - width / 2;
  let y = rect.bottom + 8;

  if (y + height > window.innerHeight) {
    y = Math.max(8, rect.top - height - 8);
  }
  x = Math.max(8, Math.min(window.innerWidth - width - 8, x));
  return { x: Math.round(x), y: Math.round(y) };
};

const showToolbarAt = (x: number, y: number) => {
  toolbarState = { visible: true, x, y, isLoading: false };
  renderApp();
};

const handleTriggerOptimize = async (tone: ToneType, settings?: any) => {
  const activeEl = getActiveEditableElement() || currentEditableEl;
  currentEditableEl = activeEl;

  const targetText = getSelectedText();
  if (!targetText) {
    tooltipState = {
      visible: true,
      isLoading: false,
      error: 'Vui lòng bôi đen hoặc nhập văn bản trước khi tối ưu.',
      result: null,
      hasEditableTarget: !!activeEl,
    };
    renderApp();
    return;
  }

  const shouldExtract = settings ? settings.enableChatContext : true;
  const maxMessages = settings?.maxContextMessages || 4;
  const contextMessages = shouldExtract
    ? extractChatContext(activeEl, maxMessages)
    : [];

  toolbarState = { ...toolbarState, isLoading: true };
  renderApp();

  try {
    const response: OptimizeResponse = await chrome.runtime.sendMessage({
      action: 'EXECUTE_GEMINI',
      payload: {
        text: targetText,
        tone,
        contextMessages,
      },
    });

    toolbarState = { ...toolbarState, isLoading: false, visible: false };

    if (response.success && response.data) {
      if (activeEl && tone !== 'translate_explain') {
        const textToReplace =
          typeof response.data === 'string'
            ? response.data
            : response.data.translation;
        replaceTextInElement(activeEl, textToReplace);
        renderApp();
      } else {
        tooltipState = {
          visible: true,
          isLoading: false,
          result: response.data,
          error: null,
          hasEditableTarget: !!activeEl,
        };
        renderApp();
      }
    } else {
      tooltipState = {
        visible: true,
        isLoading: false,
        error: response.error || 'Có lỗi xảy ra khi gọi AI.',
        result: null,
        hasEditableTarget: !!activeEl,
      };
      renderApp();
    }
  } catch (err: any) {
    toolbarState = { ...toolbarState, isLoading: false, visible: false };
    tooltipState = {
      visible: true,
      isLoading: false,
      error: err?.message || 'Không thể kết nối đến tiện ích mở rộng.',
      result: null,
      hasEditableTarget: !!activeEl,
    };
    renderApp();
  }
};

document.addEventListener('focusin', (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const isEditable =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.getAttribute('contenteditable') === 'true' ||
    target.closest('[contenteditable="true"]');

  if (isEditable) {
    currentEditableEl = target;
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const pos = computeToolbarPos(rect);
      showToolbarAt(pos.x, pos.y);
    }
  }
});

document.addEventListener('mouseup', () => {
  setTimeout(() => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const pos = computeToolbarPos(rect);
          showToolbarAt(pos.x, pos.y);
        }
      } catch {}
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const host = document.getElementById('engchat-root-host');
  if (host && (host === target || host.contains(target))) return;

  const active = getActiveEditableElement();
  if (target === active || (active && active.contains(target))) return;

  const sel = window.getSelection();
  if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;

  if (toolbarState.visible) {
    toolbarState = { ...toolbarState, visible: false };
    renderApp();
  }
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
