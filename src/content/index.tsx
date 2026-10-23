import React from 'react';
import { AppSettings, ToneType, OptimizeResponse, RewriteOptions } from '../types';
import { getActiveEditableElement, getSelectedText, replaceTextInElement } from './dom-utils';
import { extractChatContext } from './chat-extractor';
import { computeToolbarPos, setupDOMEvents } from './content-events';
import { ContentOverlay } from './ui/ContentOverlay';
import { detectPageTheme, observePageTheme } from './theme-detector';
import { getRuntimeErrorMessage, sendRuntimeMessage } from '../services/extension-messaging';
import { loadSettings } from '../services/storage';
import { DEFAULT_TARGET_LANGUAGES, loadTargetLanguages, saveTargetLanguages, TargetLanguages } from './target-languages';
import { ensureShadowHost } from './shadow-host';
import { initialToolbarState, initialTooltipState, loadToolbarCollapsed, saveToolbarCollapsed, ToolbarState, TooltipState } from './overlay-state';

let currentEditableEl: HTMLElement | null = null;
let currentTheme: 'light' | 'dark' = 'dark';
let currentLanguage: 'en' | 'vi' = 'en';
let currentDefaultTone: ToneType = 'professional';
let latestRequestId = 0;
let currentSettings: AppSettings | null = null;
let targetLanguages: TargetLanguages = { ...DEFAULT_TARGET_LANGUAGES };
let toolbarState: ToolbarState = { ...initialToolbarState, collapsed: loadToolbarCollapsed() };
let tooltipState: TooltipState = { ...initialTooltipState };

try {
  currentTheme = detectPageTheme();
  observePageTheme((theme) => { currentTheme = theme; renderApp(); });
} catch (_) {}

const renderApp = () => {
  const { reactRoot } = ensureShadowHost();
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
        handleTriggerOptimize(mode === 'translate' ? tone : mode === 'summary' ? 'summarize' : currentDefaultTone, undefined, undefined, mode);
      }}
      onCloseToolbar={() => { toolbarState = { ...toolbarState, visible: false }; renderApp(); }}
      onToggleToolbarCollapse={() => {
        const collapsed = !toolbarState.collapsed;
        toolbarState = { ...toolbarState, collapsed };
        saveToolbarCollapsed(collapsed);
        renderApp();
      }}
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

  const targetLanguage = targetLanguages[mode];
  if (isModalMode) {
    tooltipState = { ...tooltipState, visible: true, mode, targetLanguage, originalText: targetText, isLoading: true, error: null, hasEditableTarget: !!activeEl };
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
        targetLanguage,
      },
    });
    if (requestId !== latestRequestId) return;
    toolbarState = { ...toolbarState, isLoading: false, visible: false };

    if (response.success && response.data) {
      if (!isModalMode && activeEl) {
        replaceTextInElement(activeEl, typeof response.data === 'string' ? response.data : response.data.translation);
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
  handleTriggerOptimize(newMode === 'translate' ? 'translate_explain' : newMode === 'summary' ? 'summarize' : currentDefaultTone, undefined, tooltipState.originalText, newMode);
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
        targetLanguage: targetLanguages[tooltipState.mode],
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
  handleTriggerOptimize(tooltipState.mode === 'translate' ? 'translate_explain' : tooltipState.mode === 'summary' ? 'summarize' : currentDefaultTone, undefined, tooltipState.originalText, tooltipState.mode);
};

const applySettings = (settings: AppSettings) => {
  currentSettings = settings;
  currentLanguage = settings.language === 'vi' ? 'vi' : 'en';
  currentDefaultTone = settings.defaultTone || 'professional';
  renderApp();
};

void loadSettings().then(applySettings).catch(() => { renderApp(); });
void loadTargetLanguages().then((languages) => { targetLanguages = languages; });

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.engchat_settings?.newValue) void loadSettings().then(applySettings).catch(() => {});
    if (changes.engchat_target_languages) void loadTargetLanguages().then((l) => { targetLanguages = l; });
  });
}

const handleLanguageChange = (lang: string) => {
  targetLanguages = { ...targetLanguages, [tooltipState.mode]: lang };
  void saveTargetLanguages(targetLanguages);
  tooltipState = { ...tooltipState, targetLanguage: lang };
  renderApp();
  handleRegenerate();
};

const handleRewriteOptionsChange = async (opts: RewriteOptions) => {
  tooltipState = { ...tooltipState, rewriteOptions: opts };
  renderApp();
  if (!tooltipState.originalText) return;
  const parts = [opts.length !== 'Auto' && `Length: ${opts.length}`, opts.formality !== 'Auto' && `Formality: ${opts.formality}`, opts.format !== 'Auto' && `Format: ${opts.format}`, opts.tone !== 'Auto' && `Tone: ${opts.tone}`].filter(Boolean).join(', ');
  await handleFollowUp(parts ? `Apply these selected options while rewriting the text: ${parts}.` : 'Rewrite naturally.');
};

const cleanupDOMEvents = setupDOMEvents({
  onFocus: (rect, element) => {
    currentEditableEl = element;
    if (tooltipState.visible) return;
    const pos = computeToolbarPos(rect);
    toolbarState = { ...toolbarState, visible: true, x: pos.x, y: pos.y, isLoading: false, isEditable: true };
    renderApp();
  },
  onSelect: (rect, isEditable) => {
    if (tooltipState.visible) return;
    const pos = computeToolbarPos(rect);
    toolbarState = { ...toolbarState, visible: true, x: pos.x, y: pos.y, isLoading: false, isEditable: !!isEditable };
    renderApp();
  },
  onClickOutside: () => {
    if (toolbarState.visible) {
      toolbarState = { ...toolbarState, visible: false };
      renderApp();
    }
  },
});

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupDOMEvents();
});

renderApp();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action !== 'TRIGGER_OPTIMIZE') return false;
    toolbarState = { ...toolbarState, visible: false };
    handleTriggerOptimize(message.tone, message.settings, undefined, message.mode);
    sendResponse({ received: true });
    return true;
  });
}
