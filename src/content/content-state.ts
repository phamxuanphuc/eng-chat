import { AppSettings, Language, ToneType } from '../types';
import { getTranslator } from '../i18n';
import { getOverlayPrefs } from './overlay-prefs';
import { EditSnapshot } from './edit-target';
import { DEFAULT_TARGET_LANGUAGES, PopupMode, TargetLanguages } from './target-languages';
import { initialToolbarState, initialTooltipState, loadToolbarCollapsed, ToolbarState, TooltipState } from './overlay-state';

export const state = {
  editableEl: null as HTMLElement | null,
  editSnapshot: null as EditSnapshot | null,
  toolbarAnchor: null as (() => DOMRect | null) | null,
  theme: 'dark' as 'light' | 'dark',
  language: 'en' as Language,
  defaultTone: 'professional' as ToneType,
  requestId: 0,
  settings: null as AppSettings | null,
  targetLanguages: { ...DEFAULT_TARGET_LANGUAGES } as TargetLanguages,
  toolbar: { ...initialToolbarState, collapsed: loadToolbarCollapsed() } as ToolbarState,
  tooltip: { ...initialTooltipState } as TooltipState,
};

let renderer: () => void = () => {};

export const setRenderer = (render: () => void): void => {
  renderer = render;
};

export const render = (): void => renderer();

export const patchToolbar = (patch: Partial<ToolbarState>): void => {
  state.toolbar = { ...state.toolbar, ...patch };
};

export const patchTooltip = (patch: Partial<TooltipState>): void => {
  state.tooltip = { ...state.tooltip, ...patch };
};

export const translator = () => getTranslator(state.language);

export const isPinned = (mode: PopupMode): boolean => getOverlayPrefs().pinnedBySection[mode];

export const toneForMode = (mode: PopupMode): ToneType =>
  mode === 'translate' ? 'translate_explain' : mode === 'summary' ? 'summarize' : state.defaultTone;

export const resultText = (result: unknown): string =>
  typeof result === 'string' ? result : (result as { translation?: unknown } | null)?.translation?.toString() || '';
