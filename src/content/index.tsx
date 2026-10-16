import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToneType, OptimizeResponse, RewriteOptions, DEFAULT_REWRITE_OPTIONS } from '../types';
import { getActiveEditableElement, getSelectedText, replaceTextInElement } from './dom-utils';
import { extractChatContext } from './chat-extractor';
import { computeToolbarPos, setupDOMEvents } from './content-events';
import { ContentOverlay } from './ui/ContentOverlay';
import { detectPageTheme, observePageTheme } from './theme-detector';
import styles from '../styles/index.css?inline';
import { getTranslator } from '../i18n';
import { getRuntimeErrorMessage, sendRuntimeMessage } from '../services/extension-messaging';
import { loadSettings } from '../services/storage';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;
let currentEditableEl: HTMLElement | null = null;
let currentTheme: 'light' | 'dark' = 'dark';
let currentLanguage: 'en' | 'vi' = 'en';
let currentDefaultTone: ToneType = 'professional';

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
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';
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
      language={currentLanguage}
      theme={currentTheme}
      toolbar={toolbarState}
      tooltip={tooltipState}
      onSelectTone={(tone, mode) => {
        toolbarState = { ...toolbarState, visible: false };
        renderApp();
        handleTriggerOptimize(
          mode === 'translate' ? tone : currentDefaultTone,
          undefined,
          undefined,
          mode
        );
      }}
      onCloseToolbar={() => { toolbarState = { ...toolbarState, visible: false }; renderApp(); }}
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
  const response: OptimizeResponse = await sendRuntimeMessage({
    action: 'EXECUTE_GEMINI',
    payload: { text: `Translate the following English sentence into natural Vietnamese:\n"${text}"`, tone: 'concise' },
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
    tooltipState = { ...tooltipState, visible: true, isLoading: false, error: 'Select or enter text.', result: null, hasEditableTarget: !!activeEl };
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
    const response: OptimizeResponse = await sendRuntimeMessage({
      action: 'EXECUTE_GEMINI',
      payload: {
        text: targetText,
        tone,
        contextMessages,
        rewriteOptions: mode === 'translate' ? undefined : tooltipState.rewriteOptions,
      },
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
      tooltipState = { ...tooltipState, visible: true, mode, isLoading: false, error: response.error || 'An error occurred while calling AI.', result: null, hasEditableTarget: !!activeEl };
    }
    renderApp();
  } catch (err: any) {
    toolbarState = { ...toolbarState, isLoading: false, visible: false };
    tooltipState = { ...tooltipState, visible: true, mode, isLoading: false, error: getRuntimeErrorMessage(err, 'Connection error extension.'), result: null, hasEditableTarget: !!activeEl };
    renderApp();
  }
};

const handleModeChange = (newMode: 'translate' | 'rewrite' | 'improve') => {
  if (!tooltipState.originalText) return;
  if (newMode === 'improve') tooltipState.targetLanguage = 'English';
  handleTriggerOptimize(newMode === 'translate' ? 'translate_explain' : currentDefaultTone, undefined, tooltipState.originalText, newMode);
};

const handleFollowUp = async (query: string) => {
  if (!tooltipState.originalText) return;
  tooltipState = { ...tooltipState, isLoading: true, error: null, isPinned: false };
  renderApp();

  try {
    const tone: ToneType = tooltipState.mode === 'translate' ? 'translate_explain' : currentDefaultTone;
    const response: OptimizeResponse = await sendRuntimeMessage({
      action: 'EXECUTE_GEMINI',
      payload: {
        text: tooltipState.originalText,
        tone,
        rewriteOptions: tooltipState.mode === 'translate' ? undefined : tooltipState.rewriteOptions,
        taskInstruction: query,
      },
    });
    tooltipState = { ...tooltipState, isLoading: false, result: response.success ? response.data : null, error: response.success ? null : (response.error || 'Processing error') };
    renderApp();
  } catch (err: any) {
    tooltipState = { ...tooltipState, isLoading: false, error: getRuntimeErrorMessage(err, 'Connection error') };
    renderApp();
  }
};

const handleRegenerate = () => {
  if (!tooltipState.originalText) return;
  const tone: ToneType = tooltipState.mode === 'translate' ? 'translate_explain' : currentDefaultTone;
  handleTriggerOptimize(tone, undefined, tooltipState.originalText, tooltipState.mode);
};

void loadSettings().then((settings) => {
  currentLanguage = settings.language || 'en';
  currentDefaultTone = settings.defaultTone || 'professional';
  renderApp();
}).catch(() => {
  renderApp();
});

const handleLanguageChange = async (lang: string) => {
  tooltipState = { ...tooltipState, targetLanguage: lang, isLoading: true, error: null };
  renderApp();
  const prompt = tooltipState.mode === 'improve' ? `Improve text into ${lang} language.` : `Translate to language: ${lang}`;
  await handleFollowUp(prompt);
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
  await handleFollowUp(parts.length > 0 ? `Apply these selected options while rewriting the text: ${parts.join(', ')}.` : 'Rewrite naturally.');
};

const cleanupDOMEvents = setupDOMEvents({
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
    let changed = false;
    if (toolbarState.visible) { toolbarState = { ...toolbarState, visible: false }; changed = true; }
    if (tooltipState.visible && !tooltipState.isPinned) { tooltipState = { ...tooltipState, visible: false }; changed = true; }
    if (changed) renderApp();
  },
});
window.addEventListener('pagehide', cleanupDOMEvents, { once: true });

// Mount immediately so the content script remains usable even if settings storage is slow.
renderApp();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action === 'TRIGGER_OPTIMIZE') {
      toolbarState = { ...toolbarState, visible: false };
      handleTriggerOptimize(message.tone, message.settings, undefined, message.mode);
      sendResponse({ received: true });
      return true;
    }
    return false;
  });
}
