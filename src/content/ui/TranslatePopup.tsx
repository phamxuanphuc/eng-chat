import React, { useState, useEffect, useRef } from 'react';
import { TranslateExplainResult, RewriteOptions, DEFAULT_REWRITE_OPTIONS } from '../../types';
import { ChevronDown, Loader2, BookOpen, AudioWaveform, Languages, Check } from 'lucide-react';
import { TranslatePopupHeader } from './TranslatePopupHeader';
import { TranslatePopupFooter } from './TranslatePopupFooter';
import { RewriteOptionsPanel } from './RewriteOptionsPanel';
import { getPopupTheme, POPUP_LANGUAGES } from './popup-theme';
import { DEFAULT_TARGET_LANGUAGES } from '../target-languages';
import { Language } from '../../types';
import { getTranslator } from '../../i18n';
import { useDraggable } from './useDraggable';
import { ModelPicker } from './ModelPicker';
import { getRuntimeErrorMessage, sendRuntimeMessage } from '../../services/extension-messaging';

export interface TranslatePopupProps {
  language?: Language; mode?: 'translate' | 'rewrite' | 'improve' | 'summary'; originalText: string;
  result?: string | TranslateExplainResult | null;
  isLoading: boolean; error?: string | null; targetLanguage?: string;
  rewriteOptions?: RewriteOptions; theme?: 'light' | 'dark'; hasEditableTarget?: boolean;
  onLanguageChange?: (lang: string) => void; onModeChange?: (mode: 'translate' | 'rewrite' | 'improve' | 'summary') => void;
  onRewriteOptionsChange?: (options: RewriteOptions) => void; onFollowUp?: (query: string) => void;
  onRegenerate?: () => void; onInsert?: (text: string) => void; onClose: () => void; isPinned?: boolean; onTogglePin?: () => void; onTranslateVi?: (text: string) => Promise<string>;
}

export const TranslatePopup: React.FC<TranslatePopupProps> = ({
  language = 'en', mode = 'translate', originalText, result, isLoading, error,
  targetLanguage, rewriteOptions, theme = 'dark',
  hasEditableTarget = false,
  onLanguageChange, onModeChange, onRewriteOptionsChange,
  onFollowUp, onRegenerate, onInsert, onClose, isPinned = false, onTogglePin, onTranslateVi,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRewriteOptions, setShowRewriteOptions] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showViTranslation, setShowViTranslation] = useState(false);
  const [viTranslation, setViTranslation] = useState<string | null>(null);
  const [isTranslatingVi, setIsTranslatingVi] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const { position, isDragging, handleMouseDown } = useDraggable(popupRef, 'engchat_popup_position');

  const t = getTranslator(language);
  const isLight = theme === 'light';
  const th = getPopupTheme(theme);
  const currentLang = targetLanguage || DEFAULT_TARGET_LANGUAGES[mode];

  const isExplain = result && typeof result === 'object' && 'translation' in result;
  const translationText = isExplain ? (result as TranslateExplainResult).translation : (result as string) || '';
  const explanation = isExplain ? (result as TranslateExplainResult).explanation : null;

  useEffect(() => { setViTranslation(null); setShowViTranslation(false); }, [translationText]);

  useEffect(() => {
    if (!langMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !e.composedPath().includes(langDropdownRef.current)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [langMenuOpen]);

  const handleToggleViTranslation = async () => {
    const next = !showViTranslation;
    setShowViTranslation(next);
    if (!next || viTranslation || isTranslatingVi || !translationText) return;
    setIsTranslatingVi(true);
    try {
      if (onTranslateVi) setViTranslation(await onTranslateVi(translationText));
      else {
        const res = await sendRuntimeMessage({
          action: 'EXECUTE_GEMINI',
          payload: { text: `Translate the following sentence into natural Vietnamese:\n"${translationText}"`, tone: 'concise' },
        });
        setViTranslation((res?.success && res.data) ? (typeof res.data === 'string' ? res.data : res.data.translation) : 'Unable to translate.');
      }
    } catch (err: any) {
      setViTranslation(t('content.translationError', { error: getRuntimeErrorMessage(err, t('common.unableConnect')) }));
    } finally {
      setIsTranslatingVi(false);
    }
  };

  return (
    <div
      ref={popupRef}
      role="dialog"
    aria-label={mode === 'rewrite' ? `${t('app.name')} Rewrite Popup` : mode === 'summary' ? `${t('app.name')} Summary Popup` : `${t('app.name')} Translate Popup`}
      style={position ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' } : undefined}
      className={`fixed relative pointer-events-auto ${!position ? 'bottom-6 right-6' : ''} z-[2147483647] w-[560px] max-w-[94vw] min-h-0 max-h-[88vh] rounded-2xl border backdrop-blur-2xl font-sans flex flex-col overflow-hidden ${isDragging ? 'select-none shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]' : ''} ${th.card}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <TranslatePopupHeader
        language={language}
        mode={mode} targetLanguage={currentLang} theme={theme}
        onLanguageChange={onLanguageChange} onModeChange={onModeChange}
        isPinned={isPinned} onTogglePin={onTogglePin}
        onClose={onClose} onDragStart={handleMouseDown}
      />

      <div className="p-4 pt-3 overflow-y-auto flex-1 flex flex-col gap-3">
        {originalText && (
          <div className={`border rounded-xl p-2.5 text-xs flex items-start justify-between gap-2 ${th.origBox}`}>
            <div className={`flex-1 ${!isExpanded ? 'line-clamp-2' : 'max-h-28 overflow-y-auto pr-1'}`}>{originalText}</div>
            <button
              type="button" onClick={() => setIsExpanded((p) => !p)}
              className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-pointer"
              aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {mode === 'translate' && (
          <div className={`text-[11px] font-normal px-0.5 ${th.subText}`}>{t('content.translationDisclaimer')}</div>
        )}

        <div className="max-h-56 overflow-y-auto px-0.5 flex flex-col gap-2">
          {isLoading && (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-indigo-400">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
              <span>{mode === 'improve' ? t('content.improving') : mode === 'rewrite' ? t('content.rewriting') : mode === 'summary' ? t('content.summarizing') : t('content.translating')}</span>
            </div>
          )}
          {error && <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300">{error}</div>}
          {!isLoading && !error && (
            <div className={`text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30 ${th.resText}`}>
              {translationText || (mode === 'improve' ? t('content.noImprovedText') : mode === 'rewrite' ? t('content.noRewrittenText') : mode === 'summary' ? t('content.noSummary') : t('content.noTranslation'))}
            </div>
          )}
          {explanation && mode === 'translate' && (
            <div className={`mt-1 pt-1 border-t text-xs ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
              <button
                type="button" onClick={() => setShowExplanation((p) => !p)}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium py-1 cursor-pointer"
              >
                <BookOpen size={13} /><span>{t('content.analysis')}</span><span>{showExplanation ? '▲' : '▼'}</span>
              </button>
              {showExplanation && (
                <div className={`mt-1.5 p-2.5 rounded-lg border space-y-1.5 text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'}`}>
                  {explanation.vocabulary?.map((v, i) => (
                    <div key={i}><span className="font-semibold text-indigo-400">{v.word}</span>: {v.meaning}</div>
                  ))}
                  {explanation.grammar && <div><span className="font-semibold">{t('content.grammar')}</span> {explanation.grammar}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {(mode === 'rewrite' || mode === 'improve') && !isLoading && !error && translationText && (
          <div className={`border rounded-xl p-2.5 text-xs flex flex-col gap-1.5 ${th.origBox}`}>
            <button
              type="button" onClick={handleToggleViTranslation}
              className="flex items-center justify-between w-full text-left cursor-pointer group"
              aria-label={showViTranslation ? t('common.collapse') : (mode === 'improve' ? t('content.translateImprovedToVietnamese') : t('content.translateRewrittenToVietnamese'))}
            >
              <div className="flex items-center gap-1.5 font-medium text-indigo-400 group-hover:text-indigo-300">
                <Languages size={13} />
                <span>{mode === 'improve' ? t('content.translateImprovedToVietnamese') : t('content.translateRewrittenToVietnamese')}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showViTranslation ? 'rotate-180' : ''}`} />
            </button>
            {showViTranslation && (
              <div className={`pt-2 mt-1 border-t text-xs leading-relaxed ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'}`}>
                {isTranslatingVi ? (
                  <div className="flex items-center gap-2 py-1 text-indigo-400"><Loader2 size={13} className="animate-spin" /><span>{t('content.translateVietnamese')}</span></div>
                ) : (
                  <div className="whitespace-pre-wrap selection:bg-indigo-500/30">{viTranslation || t('content.noVietnameseTranslation')}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`relative z-30 px-4 pb-3 flex flex-col gap-1.5 ${mode === 'translate' ? '' : `border-t pt-2 ${isLight ? 'border-slate-200/80' : 'border-slate-800/80'}`} `}>
        <div className="relative flex items-center gap-2 px-1 py-0.5 text-xs select-none">
          {(mode === 'rewrite' || mode === 'improve') && <>
            <button
              type="button"
              onClick={() => setShowRewriteOptions((p) => !p)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer font-medium py-0.5 ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}
              aria-label={t('common.lengthFormat')}
            >
              <AudioWaveform size={14} className="text-indigo-400" />
              <span>{t('content.rewrite')}</span>
            </button>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
          </>}
            <div ref={langDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((p) => !p)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer font-medium py-0.5 ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}
                aria-label={t('content.selectLanguage')}
              >
                <Languages size={14} className="text-indigo-400" />
                <span>{currentLang}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {langMenuOpen && (
                <div className={`absolute left-0 bottom-full mb-1.5 w-32 max-h-52 overflow-y-auto rounded-xl border shadow-2xl p-1 z-50 flex flex-col gap-0.5 ${th.menu}`}>
                  {POPUP_LANGUAGES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setLangMenuOpen(false); onLanguageChange?.(l); }}
                      className={`flex items-center justify-between px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${currentLang === l ? th.menuActive : th.menuItem}`}
                    >
                      <span>{l}</span>
                      {currentLang === l && <Check size={12} className="text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        <TranslatePopupFooter
          language={language}
          translationText={translationText} isLoading={isLoading} theme={theme}
          mode={mode} hasEditableTarget={hasEditableTarget} onFollowUp={onFollowUp}
          onRegenerate={onRegenerate} onInsert={onInsert}
          onOpenModelPicker={() => setShowModelPicker(true)}
        />
      </div>

      {showModelPicker && (
        <ModelPicker language={language} theme={theme} onClose={() => setShowModelPicker(false)} />
      )}

      {showRewriteOptions && (mode === 'rewrite' || mode === 'improve') && (
        <RewriteOptionsPanel
          language={language}
          options={rewriteOptions || DEFAULT_REWRITE_OPTIONS} theme={theme}
          onChange={(opts) => onRewriteOptionsChange?.(opts)} onClose={() => setShowRewriteOptions(false)}
        />
      )}
    </div>
  );
};
