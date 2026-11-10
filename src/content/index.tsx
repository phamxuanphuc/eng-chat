import React from 'react';
import { AppSettings } from '../types';
import { applyEdit } from './edit-target';
import { computeToolbarPos, setupDOMEvents } from './content-events';
import { ContentOverlay } from './ui/ContentOverlay';
import { detectPageTheme, observePageTheme } from './theme-detector';
import { loadSettings } from '../services/storage';
import { HIDDEN_SITES_STORAGE_KEY } from '../services/hidden-sites';
import { getSiteLabel, hideToolbar, isToolbarSuppressed, refreshSiteHidden } from './toolbar-visibility';
import { usePresetSectionStore } from '../store/usePresetSectionStore';
import { loadTargetLanguages } from './target-languages';
import { ensureShadowHost } from './shadow-host';
import { saveToolbarCollapsed } from './overlay-state';
import { isPinned, patchToolbar, patchTooltip, render, setRenderer, state, toneForMode } from './content-state';
import { changeMode, changeRewriteOptions, changeTargetLanguage, closeTooltip, followUp, regenerate, translateToVietnamese, triggerOptimize } from './optimize-actions';

const siteLabel = getSiteLabel();

const hideToolbarNow = () => {
  patchToolbar({ visible: false });
  render();
};

const showToolbarAt = (rect: DOMRect, isEditable: boolean) => {
  if (state.tooltip.visible || isToolbarSuppressed()) return;
  patchToolbar({ ...computeToolbarPos(rect), visible: true, isLoading: false, isEditable });
  render();
};

const refreshHiddenSites = () => {
  void refreshSiteHidden().then((hidden) => {
    if (hidden && state.toolbar.visible) hideToolbarNow();
  });
};

const refreshTargetLanguages = () => {
  void loadTargetLanguages().then((languages) => { state.targetLanguages = languages; });
};

setRenderer(() => {
  const { reactRoot } = ensureShadowHost();
  if (!reactRoot) return;
  const { mode } = state.tooltip;

  reactRoot.render(
    <ContentOverlay
      language={state.language}
      theme={state.theme}
      toolbar={state.toolbar}
      tooltip={{ ...state.tooltip, isPinned: isPinned(mode) }}
      onTogglePin={() => {
        const pinned = !isPinned(mode);
        usePresetSectionStore.getState().setPinned(mode, pinned);
        patchTooltip({ isPinned: pinned });
        render();
      }}
      onSelectTone={(tone, selectedMode) => {
        hideToolbarNow();
        void triggerOptimize(selectedMode === 'translate' ? tone : toneForMode(selectedMode || 'rewrite'), undefined, undefined, selectedMode);
      }}
      onCloseToolbar={hideToolbarNow}
      onHideToolbar={async (scope) => {
        await hideToolbar(scope);
        hideToolbarNow();
      }}
      siteLabel={siteLabel}
      onToggleToolbarCollapse={() => {
        const collapsed = !state.toolbar.collapsed;
        patchToolbar({ collapsed });
        saveToolbarCollapsed(collapsed);
        render();
      }}
      onLanguageChange={changeTargetLanguage}
      onModeChange={changeMode}
      onRewriteOptionsChange={changeRewriteOptions}
      onFollowUp={(query) => { void followUp(query, true); }}
      onRegenerate={regenerate}
      onInsertText={(text) => {
        const replaced = !!state.editSnapshot && applyEdit(state.editSnapshot, text);
        patchTooltip(replaced ? { visible: false } : { hasEditableTarget: false });
        render();
      }}
      onCloseTooltip={closeTooltip}
      onTranslateVi={translateToVietnamese}
    />
  );
});

try {
  state.theme = detectPageTheme();
  observePageTheme((theme) => { state.theme = theme; render(); });
} catch {
  state.theme = 'dark';
}

const applySettings = (settings: AppSettings) => {
  state.settings = settings;
  state.language = settings.language === 'vi' ? 'vi' : 'en';
  state.defaultTone = settings.defaultTone || 'professional';
  render();
};

void loadSettings().then(applySettings).catch(() => { render(); });
refreshTargetLanguages();
refreshHiddenSites();

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.engchat_settings?.newValue) void loadSettings().then(applySettings).catch(() => {});
    if (changes[HIDDEN_SITES_STORAGE_KEY]) refreshHiddenSites();
    if (changes.engchat_target_languages) refreshTargetLanguages();
  });
}

const cleanupDOMEvents = setupDOMEvents({
  onFocus: (rect, element) => {
    state.editableEl = element;
    if (state.settings?.showToolbarOnFocus === false) return;
    showToolbarAt(rect, true);
  },
  onSelect: (rect, isEditable) => showToolbarAt(rect, !!isEditable),
  onSensitiveField: () => {
    if (state.toolbar.visible) hideToolbarNow();
  },
  onClickOutside: () => {
    if (state.tooltip.visible && !isPinned(state.tooltip.mode)) closeTooltip();
    else if (state.toolbar.visible) hideToolbarNow();
  },
});

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupDOMEvents();
});

render();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action !== 'TRIGGER_OPTIMIZE') return false;
    patchToolbar({ visible: false });
    void triggerOptimize(message.tone, message.settings, undefined, message.mode);
    sendResponse({ received: true });
    return true;
  });
}
