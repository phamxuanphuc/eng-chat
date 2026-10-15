import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToneType, OptimizeResponse, RewriteOptions, DEFAULT_REWRITE_OPTIONS } from '../types';
import { getActiveEditableElement, getSelectedText, replaceTextInElement } from './dom-utils';
import { extractChatContext } from './chat-extractor';
import { computeToolbarPos, setupDOMEvents } from './content-events';
import { ContentOverlay } from './ui/ContentOverlay';
import { detectPageTheme, observePageTheme } from './theme-detector';
import styles from '../styles/index.css?inline';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;
let currentEditableEl: HTMLElement | null = null;
let currentTheme: 'light' | 'dark' = 'dark';

try {
  currentTheme = detectPageTheme();
  observePageTheme((theme) => {
    currentTheme = theme;
    renderApp();
  });
} catch (_) {}

let toolbarState = { visible: false, x: 0, y: 0, isLoading: false, isEditable: false };
let tooltipState = {
  visible: false,
  mode: 'translate' as 'translate' | 'rewrite' | 'improve',
  originalText: '',
  result: null as any,
  isLoading: false,
  error: null as string | null,
  targetLanguage: 'Vietnamese',
  rewriteOptions: DEFAULT_REWRITE_OPTIONS,
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
      theme={currentTheme}
      toolbar={toolbarState}
      tooltip={tooltipState}
      onSelectTone={(tone, mode) => {
        toolbarState = { ...toolbarState, visible: false };
        renderApp();
        handleTriggerOptimize(tone, undefined, undefined, mode);
      }}
      onCloseToolbar={() => { toolbarState = { ...toolbarState, visible: false }; renderApp(); }}
      onTogglePin={() => { tooltipState = { ...tooltipState, isPinned: !tooltipState.isPinned }; renderApp(); }}
      onLanguageChange={handleLanguageChange}
      onModeChange={handleModeChange}
      onRewriteOptionsChange={handleRewriteOptionsChange}
      onFollowUp={handleFollowUp}
      onRegenerate={handleRegenerate}
      onInsertText={(text) => {
        if (currentEditableEl) replaceTextInElement(currentEditableEl, text);
        tooltipState = { ...tooltipState, visible: false };
        renderApp();
      }}
      onCloseTooltip={() => { tooltipState = { ...tooltipState, visible: false }; renderApp(); }}
      onTranslateVi={handleTranslateVi}
    />
  );
};

const handleTranslateVi = async (text: string): Promise<string> => {
  const response: OptimizeResponse = await chrome.runtime.sendMessage({
    action: 'EXECUTE_GEMINI',
    payload: { text: `Dịch câu tiếng Anh sau sang tiếng Việt chuẩn, tự nhiên:\n"${text}"`, tone: 'concise' },
  });
  return response.success && response.data ? (typeof response.data === 'string' ? response.data : response.data.translation) : '';
};

const handleTriggerOptimize = async (
  tone: ToneType,
  settings?: any,
  customText?: string,
  forcedMode?: 'translate' | 'rewrite' | 'improve'
) => {
  const activeEl = getActiveEditableElement() || currentEditableEl;
  currentEditableEl = activeEl;
  const targetText = customText || getSelectedText();

  if (!targetText) {
    toolbarState = { ...toolbarState, visible: false };
    tooltipState = { ...tooltipState, visible: true, isLoading: false, error: 'Vui lòng bôi đen hoặc nhập văn bản.', result: null, hasEditableTarget: !!activeEl };
    renderApp();
    return;
  }

  const isModalMode = forcedMode === 'improve' || forcedMode === 'rewrite' || forcedMode === 'translate' || tone === 'translate_explain';
  const mode: 'translate' | 'rewrite' | 'improve' = forcedMode || (tone === 'translate_explain' ? 'translate' : 'rewrite');

  if (isModalMode) {
    tooltipState = { ...tooltipState, visible: true, mode, originalText: targetText, isLoading: true, error: null, hasEditableTarget: !!activeEl };
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
      if (!isModalMode && activeEl) {
        const textToReplace = typeof response.data === 'string' ? response.data : response.data.translation;
        replaceTextInElement(activeEl, textToReplace);
      } else {
        tooltipState = { ...tooltipState, visible: true, mode, originalText: targetText, isLoading: false, result: response.data, error: null, hasEditableTarget: !!activeEl };
      }
    } else {
      tooltipState = { ...tooltipState, visible: true, mode, isLoading: false, error: response.error || 'Có lỗi xảy ra khi gọi AI.', result: null, hasEditableTarget: !!activeEl };
    }
    renderApp();
  } catch (err: any) {
    toolbarState = { ...toolbarState, isLoading: false, visible: false };
    tooltipState = { ...tooltipState, visible: true, mode, isLoading: false, error: err?.message || 'Lỗi kết nối extension.', result: null, hasEditableTarget: !!activeEl };
    renderApp();
  }
};

const handleModeChange = (newMode: 'translate' | 'rewrite' | 'improve') => {
  if (!tooltipState.originalText) return;
  const tone: ToneType = newMode === 'translate' ? 'translate_explain' : 'professional';
  handleTriggerOptimize(tone, undefined, tooltipState.originalText, newMode);
};

const handleFollowUp = async (query: string) => {
  if (!tooltipState.originalText) return;
  tooltipState = { ...tooltipState, isLoading: true, error: null };
  renderApp();

  try {
    const prompt = `Văn bản gốc: "${tooltipState.originalText}"\n\nYêu cầu xử lý tiếp theo: ${query}`;
    const tone: ToneType = tooltipState.mode === 'translate' ? 'translate_explain' : 'professional';
    const response: OptimizeResponse = await chrome.runtime.sendMessage({
      action: 'EXECUTE_GEMINI',
      payload: { text: prompt, tone },
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
    const tone: ToneType = tooltipState.mode === 'translate' ? 'translate_explain' : 'professional';
    handleTriggerOptimize(tone, undefined, tooltipState.originalText, tooltipState.mode);
  }
};

const handleLanguageChange = async (lang: string) => {
  tooltipState = { ...tooltipState, targetLanguage: lang, isLoading: true, error: null };
  renderApp();
  await handleFollowUp(`Dịch toàn bộ văn bản gốc sang ngôn ngữ: ${lang}`);
};

const handleRewriteOptionsChange = async (opts: RewriteOptions) => {
  tooltipState = { ...tooltipState, rewriteOptions: opts };
  renderApp();
  if (!tooltipState.originalText) return;
  const parts: string[] = [];
  if (opts.length !== 'Auto') parts.push(`Length: ${opts.length}`);
  if (opts.formality !== 'Auto') parts.push(`Formality: ${opts.formality}`);
  if (opts.format !== 'Auto') parts.push(`Format: ${opts.format}`);
  if (opts.tone !== 'Auto') parts.push(`Tone: ${opts.tone}`);
  const prompt = parts.length > 0 ? `Rewrite with style requirements: ${parts.join(', ')}.` : 'Rewrite naturally.';
  await handleFollowUp(prompt);
};

setupDOMEvents({
  onFocus: (rect, element) => {
    currentEditableEl = element;
    if (tooltipState.visible) return;
    const pos = computeToolbarPos(rect);
    toolbarState = { visible: true, x: pos.x, y: pos.y, isLoading: false, isEditable: true };
    renderApp();
  },
  onSelect: (rect, isEditable) => {
    if (tooltipState.visible) return;
    const pos = computeToolbarPos(rect);
    toolbarState = { visible: true, x: pos.x, y: pos.y, isLoading: false, isEditable: !!isEditable };
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
      toolbarState = { ...toolbarState, visible: false };
      handleTriggerOptimize(message.tone, message.settings);
      sendResponse({ received: true });
      return true;
    }
    return false;
  });
}
