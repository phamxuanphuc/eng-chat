import React, { useLayoutEffect, useRef, useState } from 'react';
import { AudioWaveform, ChevronDown } from 'lucide-react';
import { TranslateExplainResult, RewriteOptions, DEFAULT_REWRITE_OPTIONS, Language } from '../../types';
import { TranslatePopupHeader } from './TranslatePopupHeader';
import { TranslatePopupFooter } from './TranslatePopupFooter';
import { RewriteOptionsPanel } from './RewriteOptionsPanel';
import { LanguageMenu } from './LanguageMenu';
import { PopupResult } from './PopupResult';
import { NativeTranslationSection } from './NativeTranslationSection';
import { DEFAULT_TARGET_LANGUAGES } from '../target-languages';
import { getTranslator, TranslationKey } from '../../i18n';
import { useDraggable } from './useDraggable';
import { getOverlayPrefs, saveOverlayPrefs } from '../overlay-prefs';
import { placeNearAnchor, PopupAnchor, Position } from './popup-position';
import { ModelPicker } from './ModelPicker';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useEscape } from '../../components/ui/useDismiss';

type PopupMode = 'translate' | 'rewrite' | 'improve' | 'summary';

const DIALOG_LABELS: Record<PopupMode, TranslationKey> = {
  translate: 'content.dialogTranslate',
  rewrite: 'content.dialogRewrite',
  improve: 'content.dialogImprove',
  summary: 'content.dialogSummary',
};

export interface TranslatePopupProps {
  language?: Language; mode?: PopupMode; originalText: string;
  result?: string | TranslateExplainResult | null;
  isLoading: boolean; error?: string | null; targetLanguage?: string;
  rewriteOptions?: RewriteOptions; theme?: 'light' | 'dark'; hasEditableTarget?: boolean; anchor?: PopupAnchor | null; modelName?: string; contextCount?: number; contextRaw?: boolean; nativeLanguage?: string; isStreaming?: boolean;
  onLanguageChange?: (lang: string) => void; onModeChange?: (mode: PopupMode) => void;
  onRewriteOptionsChange?: (options: RewriteOptions) => void; onFollowUp?: (query: string) => void;
  onRegenerate?: () => void; onInsert?: (text: string) => void; onClose: () => void; isPinned?: boolean; onTogglePin?: () => void; onTranslateNative?: (text: string) => Promise<string>;
}

export const TranslatePopup: React.FC<TranslatePopupProps> = ({
  language = 'en', mode = 'translate', originalText, result, isLoading, error,
  targetLanguage, rewriteOptions, theme = 'dark',
  hasEditableTarget = false, anchor = null, modelName, contextCount = 0, contextRaw = false, nativeLanguage = 'Vietnamese', isStreaming = false,
  onLanguageChange, onModeChange, onRewriteOptionsChange,
  onFollowUp, onRegenerate, onInsert, onClose, isPinned = false, onTogglePin, onTranslateNative,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRewriteOptions, setShowRewriteOptions] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const { position, isDragging, handleMouseDown } = useDraggable(popupRef, {
    initialPosition: getOverlayPrefs().popupPosition,
    onPersist: (popupPosition) => { void saveOverlayPrefs({ popupPosition }); },
  });

  const [anchoredPosition, setAnchoredPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!anchor || position || !popupRef.current) {
      setAnchoredPosition(null);
      return;
    }
    const rect = popupRef.current.getBoundingClientRect();
    const next = placeNearAnchor(anchor, rect.width || 560, rect.height || 300);
    setAnchoredPosition((current) => (current && current.x === next.x && current.y === next.y ? current : next));
  }, [anchor, position, result, isLoading, error, showRewriteOptions, isExpanded]);

  const placed = position || anchoredPosition;
  const t = getTranslator(language);
  const currentLang = targetLanguage || DEFAULT_TARGET_LANGUAGES[mode];
  const isRewriteMode = mode === 'rewrite' || mode === 'improve';
  const isNotice = !originalText && !!error;

  const isExplain = result && typeof result === 'object' && 'translation' in result;
  const rawText = isExplain ? (result as TranslateExplainResult).translation : result;
  const translationText = typeof rawText === 'string' ? rawText : '';
  const explanation = isExplain ? (result as TranslateExplainResult).explanation : null;

  useEscape(true, onClose);

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-label={t(DIALOG_LABELS[mode])}
      data-engchat-theme={theme}
      style={placed ? { left: `${placed.x}px`, top: `${placed.y}px`, bottom: 'auto', right: 'auto' } : undefined}
      className={`fixed pointer-events-auto ${!placed && !anchor ? 'bottom-6 right-6' : ''} z-[2147483647] flex w-[560px] max-w-[calc(100vw-16px)] ${showRewriteOptions && isRewriteMode ? 'min-h-[420px]' : 'min-h-0'} max-h-[88vh] animate-popIn flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 font-sans text-slate-100 shadow-[0_20px_60px_rgb(2_6_23/0.4)] ring-1 ring-white/10 ${isDragging ? 'select-none' : ''}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <TranslatePopupHeader
        language={language}
        mode={mode}
        onModeChange={onModeChange}
        isPinned={isPinned} onTogglePin={onTogglePin}
        onClose={onClose} onDragStart={handleMouseDown}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pt-3">
        {originalText && (
          <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs text-slate-400">
            <div className={`flex-1 ${!isExpanded ? 'line-clamp-2' : 'max-h-28 overflow-y-auto pr-1'}`}>{originalText}</div>
            <IconButton
              label={isExpanded ? t('common.collapse') : t('common.expand')}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((current) => !current)}
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </IconButton>
          </div>
        )}

        <PopupResult
          language={language}
          mode={mode}
          text={translationText}
          originalText={originalText}
          explanation={explanation}
          isLoading={isLoading}
          isStreaming={isStreaming}
          error={error}
          isNotice={isNotice}
          onRetry={onRegenerate}
        />

        {isRewriteMode && !isLoading && !isStreaming && !error && translationText && currentLang !== nativeLanguage && (
          <NativeTranslationSection language={language} mode={mode} text={translationText} nativeLanguage={nativeLanguage} onTranslate={onTranslateNative} />
        )}
      </div>

      {!isNotice && <div className={`relative z-30 flex flex-col gap-1.5 px-4 pb-3 ${mode === 'translate' ? '' : 'border-t border-slate-800/80 pt-2'}`}>
        <div className="relative flex flex-wrap items-center gap-1 text-xs select-none">
          {isRewriteMode && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('common.lengthFormat')}
              className="!rounded-lg !px-1.5 !py-1"
              icon={<AudioWaveform size={14} className="text-indigo-400" />}
              onClick={() => setShowRewriteOptions((current) => !current)}
            >
              {t('content.styleOptions')}
            </Button>
          )}
          <LanguageMenu language={language} value={currentLang} onChange={onLanguageChange} />
          {contextCount > 0 && (
            <span title={t(contextRaw ? 'content.contextTextHint' : 'content.contextUsedHint')}>
              <Badge variant="secondary" size="sm">
                {contextRaw
                  ? t('content.contextText')
                  : t(contextCount === 1 ? 'content.contextUsedOne' : 'content.contextUsed', { count: contextCount })}
              </Badge>
            </span>
          )}
        </div>

        <TranslatePopupFooter
          language={language}
          translationText={translationText} isLoading={isLoading || isStreaming}
          mode={mode} hasEditableTarget={hasEditableTarget} onFollowUp={onFollowUp}
          onRegenerate={onRegenerate} onInsert={onInsert}
          modelName={modelName}
          onOpenModelPicker={() => setShowModelPicker(true)}
        />
      </div>}

      {showModelPicker && (
        <ModelPicker language={language} onClose={() => setShowModelPicker(false)} />
      )}

      {showRewriteOptions && isRewriteMode && (
        <RewriteOptionsPanel
          language={language}
          options={rewriteOptions || DEFAULT_REWRITE_OPTIONS}
          onChange={(opts) => onRewriteOptionsChange?.(opts)} onClose={() => setShowRewriteOptions(false)}
        />
      )}
    </div>
  );
};
