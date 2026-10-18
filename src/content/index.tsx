import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppSettings, ToneType, OptimizeResponse, RewriteOptions, DEFAULT_REWRITE_OPTIONS } from '../types';
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
let latestRequestId = 0;
let currentSettings: AppSettings | null = null;

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
  mode: 'translate' as 'translate' | 'rewrite' | 'improve' | 'summary',
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
  document.getElementById('engchat-root-host')?.remove();
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
          mode === 'translate' ? tone : mode === 'summary' ? 'summarize' : currentDefaultTone,
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
    payload: { text, tone: 'translate_explain', taskInstruction: 'Translate the target text into natural Vietnamese.' },
  });
  return response.success && response.data ? (typeof response.data === 'string' ? response.data : response.data.translation) : '';
};

const handleTriggerOptimize = async (
  tone: ToneType,
  settings?: AppSettings,
  customText?: string,
  forcedMode?: 'translate' | 'rewrite' | 'improve' | 'summary'
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

  const isModalMode = forcedMode === 'improve' || forcedMode === 'rewrite' || forcedMode === 'translate' || forcedMode === 'summary' || tone === 'translate_explain' || tone === 'summarize';
  const mode: 'translate' | 'rewrite' | 'improve' | 'summary' = forcedMode || (tone === 'translate_explain' ? 'translate' : tone === 'summarize' ? 'summary' : 'rewrite');

  if (isModalMode) {
    tooltipState = { ...tooltipState, visible: true, mode, originalText: targetText, isLoading: true, error: null, hasEditableTarget: !!activeEl };
    toolbarState = { ...toolbarState, visible: false };
  } else {
    toolbarState = { ...toolbarState, isLoading: true };
  }
  renderApp();
  const requestId = ++latestRequestId;

  const effectiveSettings = settings || currentSettings;
  const shouldExtract = effectiveSettings ? effectiveSettings.enableChatContext !== false : true;
  const contextMessages = shouldExtract ? extractChatContext(activeEl, effectiveSettings?.maxContextMessages || 4) : [];

  try {
    const response: OptimizeResponse = await sendRuntimeMessage({
      action: 'EXECUTE_GEMINI',
      payload: {
        text: targetText,
        tone,
        contextMessages,
        rewriteOptions: mode === 'translate' || mode === 'summary' ? undefined : tooltipState.rewriteOptions,
      },
    });
    if (requestId !== latestRequestId) return;
    toolbarState = { ...toolbarState, isLoading: false, visible: false };

    if (response.success && response.data) {
      if (!isModalMode && activeEl) {
        const textToReplace = typeof response.data === 'string' ? response.data : response.data.translation;
        replaceTextInElement(activeEl, textToReplace);
      } else {
        tooltipState = { ...tooltipState, visible: true, mode, originalText: targetText, isLoading: false, result: response.data, error: null, hasEditableTarget: !!activeEl };
      }
    } else {
      tooltipState = { ...tooltipState, visible: true, mode, originalText: targetText, isLoading: false, error: response.error || 'An error occurred while calling AI.', result: null, hasEditableTarget: !!activeEl };
    }
    renderApp();
  } catch (err: any) {
    if (requestId !== latestRequestId) return;
    toolbarState = { ...toolbarState, isLoading: false, visible: false };
    tooltipState = { ...tooltipState, visible: true, mode, originalText: targetText, isLoading: false, error: getRuntimeErrorMessage(err, 'Connection error extension.'), result: null, hasEditableTarget: !!activeEl };
    renderApp();
  }
};

const handleModeChange = (newMode: 'translate' | 'rewrite' | 'improve' | 'summary') => {
  if (!tooltipState.originalText) {
    tooltipState = { ...tooltipState, mode: newMode };
    renderApp();
    return;
  }
  if (newMode === 'improve') tooltipState.targetLanguage = 'English';
  const tone = newMode === 'translate' ? 'translate_explain' : newMode === 'summary' ? 'summarize' : currentDefaultTone;
  handleTriggerOptimize(tone, undefined, tooltipState.originalText, newMode);
};

const handleFollowUp = async (query: string) => {
  if (!tooltipState.originalText) return;
  tooltipState = { ...tooltipState, isLoading: true, error: null, isPinned: false };
  renderApp();
  const requestId = ++latestRequestId;

  try {
    const tone: ToneType = tooltipState.mode === 'translate' ? 'translate_explain' : tooltipState.mode === 'summary' ? 'summarize' : currentDefaultTone;
    const response: OptimizeResponse = await sendRuntimeMessage({
      action: 'EXECUTE_GEMINI',
      payload: {
        text: tooltipState.originalText,
        tone,
        rewriteOptions: tooltipState.mode === 'translate' || tooltipState.mode === 'summary' ? undefined : tooltipState.rewriteOptions,
        taskInstruction: query,
      },
    });
    if (requestId !== latestRequestId) return;
    tooltipState = { ...tooltipState, isLoading: false, result: response.success ? response.data : null, error: response.success ? null : (response.error || 'Processing error') };
    renderApp();
  } catch (err: any) {
    if (requestId !== latestRequestId) return;
    tooltipState = { ...tooltipState, isLoading: false, error: getRuntimeErrorMessage(err, 'Connection error') };
    renderApp();
  }
};

const handleRegenerate = () => {
  if (!tooltipState.originalText) return;
  const tone: ToneType = tooltipState.mode === 'translate' ? 'translate_explain' : tooltipState.mode === 'summary' ? 'summarize' : currentDefaultTone;
  handleTriggerOptimize(tone, undefined, tooltipState.originalText, tooltipState.mode);
};

const applySettings = (settings: AppSettings) => {
  currentSettings = settings;
  currentLanguage = settings.language === 'vi' ? 'vi' : 'en';
  currentDefaultTone = settings.defaultTone || 'professional';
  renderApp();
};

void loadSettings().then(applySettings).catch(() => {
  renderApp();
});

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.engchat_settings?.newValue) {
      void loadSettings().then(applySettings).catch(() => {});
    }
  });
}

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
    if (changed) renderApp();
  },
});
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupDOMEvents();
});

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
