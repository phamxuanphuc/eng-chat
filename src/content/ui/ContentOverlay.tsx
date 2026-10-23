import React from 'react';
import { FloatingToolbar } from './FloatingToolbar';
import { TranslatePopup } from './TranslatePopup';
import { ToneType, RewriteOptions, Language } from '../../types';

export interface ContentOverlayProps {
  language?: Language;
  theme?: 'light' | 'dark';
  toolbar: {
    visible: boolean;
    x: number;
    y: number;
    isLoading?: boolean;
    isEditable?: boolean;
    collapsed?: boolean;
  };
  tooltip: {
    visible: boolean;
    mode?: 'translate' | 'rewrite' | 'improve' | 'summary';
    isLoading: boolean;
    originalText: string;
    result?: any;
    error?: string | null;
    targetLanguage?: string;
    rewriteOptions?: RewriteOptions;
    hasEditableTarget: boolean;
  };
  onSelectTone: (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve' | 'summary') => void;
  onCloseToolbar: () => void;
  onToggleToolbarCollapse?: () => void;
  onLanguageChange?: (lang: string) => void;
  onModeChange?: (mode: 'translate' | 'rewrite' | 'improve' | 'summary') => void;
  onRewriteOptionsChange?: (options: RewriteOptions) => void;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsertText: (text: string) => void;
  onCloseTooltip: () => void;
  onTranslateVi?: (text: string) => Promise<string>;
}

export const ContentOverlay: React.FC<ContentOverlayProps> = ({
  language = 'en',
  theme = 'dark',
  toolbar,
  tooltip,
  onSelectTone,
  onCloseToolbar,
  onToggleToolbarCollapse,
  onLanguageChange,
  onModeChange,
  onRewriteOptionsChange,
  onFollowUp,
  onRegenerate,
  onInsertText,
  onCloseTooltip,
  onTranslateVi,
}) => {
  return (
    <>
      <FloatingToolbar
        visible={toolbar.visible && !tooltip.visible}
        x={toolbar.x}
        y={toolbar.y}
        isLoading={toolbar.isLoading}
        language={language}
        theme={theme}
        isEditable={toolbar.isEditable}
        collapsed={toolbar.collapsed}
        onSelectTone={onSelectTone}
        onToggleCollapse={onToggleToolbarCollapse}
        onClose={onCloseToolbar}
      />

      {tooltip.visible && (
        <TranslatePopup
          language={language}
          theme={theme}
          mode={tooltip.mode}
          originalText={tooltip.originalText}
          result={tooltip.result}
          isLoading={tooltip.isLoading}
          error={tooltip.error}
          targetLanguage={tooltip.targetLanguage}
          rewriteOptions={tooltip.rewriteOptions}
          hasEditableTarget={tooltip.hasEditableTarget}
          onLanguageChange={onLanguageChange}
          onModeChange={onModeChange}
          onRewriteOptionsChange={onRewriteOptionsChange}
          onFollowUp={onFollowUp}
          onRegenerate={onRegenerate}
          onInsert={onInsertText}
          onClose={onCloseTooltip}
          onTranslateVi={onTranslateVi}
        />
      )}
    </>
  );
};
