import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToneType, OptimizeResponse } from '../types';
import { getActiveEditableElement, getSelectedText, replaceTextInElement } from './dom-utils';
import { extractChatContext } from './chat-extractor';
import { TooltipApp } from './ui/TooltipApp';
import styles from '../styles/index.css?inline';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;
let currentEditableEl: HTMLElement | null = null;

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

const renderTooltip = (props: {
  isLoading: boolean;
  error?: string | null;
  result?: any;
  hasEditableTarget: boolean;
}) => {
  ensureShadowHost();
  if (!reactRoot) return;

  reactRoot.render(
    <TooltipApp
      {...props}
      onInsert={(text) => {
        if (currentEditableEl) {
          replaceTextInElement(currentEditableEl, text);
          closeTooltip();
        }
      }}
      onClose={closeTooltip}
    />
  );
};

const closeTooltip = () => {
  if (reactRoot) {
    reactRoot.render(<React.Fragment />);
  }
};

const handleTriggerOptimize = async (tone: ToneType) => {
  const activeEl = getActiveEditableElement();
  currentEditableEl = activeEl;

  const targetText = getSelectedText();
  if (!targetText) {
    renderTooltip({
      isLoading: false,
      error: 'Vui lòng bôi đen hoặc nhập văn bản trước khi tối ưu.',
      hasEditableTarget: !!activeEl,
    });
    return;
  }

  const contextMessages = extractChatContext(activeEl, 4);

  renderTooltip({
    isLoading: true,
    hasEditableTarget: !!activeEl,
  });

  try {
    const response: OptimizeResponse = await chrome.runtime.sendMessage({
      action: 'EXECUTE_GEMINI',
      payload: {
        text: targetText,
        tone,
        contextMessages,
      },
    });

    if (response.success && response.data) {
      if (activeEl && tone !== 'translate_explain') {
        const textToReplace =
          typeof response.data === 'string'
            ? response.data
            : response.data.translation;
        replaceTextInElement(activeEl, textToReplace);
        closeTooltip();
      } else {
        renderTooltip({
          isLoading: false,
          result: response.data,
          hasEditableTarget: !!activeEl,
        });
      }
    } else {
      renderTooltip({
        isLoading: false,
        error: response.error || 'Có lỗi xảy ra khi gọi AI.',
        hasEditableTarget: !!activeEl,
      });
    }
  } catch (err: any) {
    renderTooltip({
      isLoading: false,
      error: err?.message || 'Không thể kết nối đến tiện ích mở rộng.',
      hasEditableTarget: !!activeEl,
    });
  }
};

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'TRIGGER_OPTIMIZE') {
      handleTriggerOptimize(message.tone);
      sendResponse({ received: true });
    }
    return true;
  });
}
