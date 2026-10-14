import React from 'react';
import { FloatingToolbar } from './FloatingToolbar';
import { TranslatePopup } from './TranslatePopup';
import { ToneType } from '../../types';

export interface ContentOverlayProps {
  toolbar: {
    visible: boolean;
    x: number;
    y: number;
    isLoading?: boolean;
  };
  tooltip: {
    visible: boolean;
    mode?: 'translate' | 'rewrite';
    isLoading: boolean;
    originalText: string;
    result?: any;
    error?: string | null;
    targetLanguage?: string;
    isPinned?: boolean;
    hasEditableTarget: boolean;
  };
  onSelectTone: (tone: ToneType, mode?: 'translate' | 'rewrite') => void;
  onCloseToolbar: () => void;
  onTogglePin?: () => void;
  onLanguageChange?: (lang: string) => void;
  onModeChange?: (mode: 'translate' | 'rewrite') => void;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsertText: (text: string) => void;
  onCloseTooltip: () => void;
}

export const ContentOverlay: React.FC<ContentOverlayProps> = ({
  toolbar,
  tooltip,
  onSelectTone,
  onCloseToolbar,
  onTogglePin,
  onLanguageChange,
  onModeChange,
  onFollowUp,
  onRegenerate,
  onInsertText,
  onCloseTooltip,
}) => {
  return (
    <>
      <FloatingToolbar
        visible={toolbar.visible}
        x={toolbar.x}
        y={toolbar.y}
        isLoading={toolbar.isLoading}
        onSelectTone={onSelectTone}
        onClose={onCloseToolbar}
      />

      {tooltip.visible && (
        <TranslatePopup
          mode={tooltip.mode}
          originalText={tooltip.originalText}
          result={tooltip.result}
          isLoading={tooltip.isLoading}
          error={tooltip.error}
          targetLanguage={tooltip.targetLanguage}
          isPinned={tooltip.isPinned}
          hasEditableTarget={tooltip.hasEditableTarget}
          onTogglePin={onTogglePin}
          onLanguageChange={onLanguageChange}
          onModeChange={onModeChange}
          onFollowUp={onFollowUp}
          onRegenerate={onRegenerate}
          onInsert={onInsertText}
          onClose={onCloseTooltip}
        />
      )}
    </>
  );
};
