import React from 'react';
import { FloatingToolbar } from './FloatingToolbar';
import { TooltipApp } from './TooltipApp';
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
    isLoading: boolean;
    error?: string | null;
    result?: any;
    hasEditableTarget: boolean;
  };
  onSelectTone: (tone: ToneType) => void;
  onCloseToolbar: () => void;
  onInsertText: (text: string) => void;
  onCloseTooltip: () => void;
}

export const ContentOverlay: React.FC<ContentOverlayProps> = ({
  toolbar,
  tooltip,
  onSelectTone,
  onCloseToolbar,
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
        <TooltipApp
          isLoading={tooltip.isLoading}
          error={tooltip.error}
          result={tooltip.result}
          hasEditableTarget={tooltip.hasEditableTarget}
          onInsert={onInsertText}
          onClose={onCloseTooltip}
        />
      )}
    </>
  );
};
