import { DEFAULT_REWRITE_OPTIONS, RewriteOptions } from '../types';

export interface ToolbarState {
  visible: boolean;
  x: number;
  y: number;
  isLoading: boolean;
  isEditable: boolean;
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
