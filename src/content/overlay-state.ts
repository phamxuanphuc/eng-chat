import { DEFAULT_REWRITE_OPTIONS, RewriteOptions } from '../types';

export interface ToolbarState {
  visible: boolean;
  x: number;
  y: number;
  isLoading: boolean;
  isEditable: boolean;
  collapsed: boolean;
}

export interface TooltipState {
  visible: boolean;
  mode: 'translate' | 'rewrite' | 'improve' | 'summary';
  originalText: string;
  result: any;
  isLoading: boolean;
  error: string | null;
  targetLanguage: string;
  rewriteOptions: RewriteOptions;
  isPinned: boolean;
  hasEditableTarget: boolean;
}

export const initialToolbarState: ToolbarState = {
  visible: false,
  x: 0,
  y: 0,
  isLoading: false,
  isEditable: false,
  collapsed: false,
};

const TOOLBAR_COLLAPSED_KEY = 'engchat_toolbar_collapsed';

export const loadToolbarCollapsed = (): boolean => {
  try {
    return window.sessionStorage.getItem(TOOLBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveToolbarCollapsed = (collapsed: boolean): void => {
  try {
    window.sessionStorage.setItem(TOOLBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // Storage can be unavailable on restricted pages.
  }
};

export const initialTooltipState: TooltipState = {
  visible: false,
  mode: 'translate',
  originalText: '',
  result: null,
  isLoading: false,
  error: null,
  targetLanguage: 'Vietnamese',
  rewriteOptions: DEFAULT_REWRITE_OPTIONS,
  isPinned: false,
  hasEditableTarget: false,
};
