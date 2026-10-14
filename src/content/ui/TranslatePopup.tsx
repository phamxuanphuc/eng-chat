import React, { useState } from 'react';
import { TranslateExplainResult, RewriteOptions, DEFAULT_REWRITE_OPTIONS } from '../../types';
import { Languages, PenLine, ChevronDown, Pin, PinOff, X, Sparkles, Loader2, BookOpen, AudioWaveform } from 'lucide-react';
import { TranslatePopupFooter } from './TranslatePopupFooter';
import { RewriteOptionsPanel } from './RewriteOptionsPanel';
import { getPopupTheme } from './popup-theme';

export interface TranslatePopupProps {
  mode?: 'translate' | 'rewrite';
  originalText: string;
  result?: string | TranslateExplainResult | null;
  isLoading: boolean;
  error?: string | null;
  targetLanguage?: string;
  rewriteOptions?: RewriteOptions;
  theme?: 'light' | 'dark';
  isPinned?: boolean; hasEditableTarget?: boolean;
  onTogglePin?: () => void;
  onLanguageChange?: (lang: string) => void;
  onModeChange?: (mode: 'translate' | 'rewrite') => void;
  onRewriteOptionsChange?: (options: RewriteOptions) => void;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsert?: (text: string) => void;
  onClose: () => void;
}

const LANGUAGES = ['Vietnamese', 'English', 'Japanese', 'Korean', 'Chinese', 'French'];

export const TranslatePopup: React.FC<TranslatePopupProps> = ({
  mode = 'translate',
  originalText,
  result,
  isLoading,
  error,
  targetLanguage = 'Vietnamese',
  rewriteOptions,
  theme = 'dark',
  isPinned = false, hasEditableTarget = false,
  onTogglePin,
  onLanguageChange,
  onModeChange,
  onRewriteOptionsChange,
  onFollowUp,
  onRegenerate,
  onInsert,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRewriteOptions, setShowRewriteOptions] = useState(false);

  const isLight = theme === 'light';
  const th = getPopupTheme(theme);

  const isExplain = result && typeof result === 'object' && 'translation' in result;
  const translationText = isExplain ? (result as TranslateExplainResult).translation : (result as string) || '';
  const explanation = isExplain ? (result as TranslateExplainResult).explanation : null;

  return (
    <div
      role="dialog"
      aria-label={mode === 'rewrite' ? 'EngChat Rewrite Popup' : 'EngChat Translate Popup'}
      className={`fixed bottom-6 right-6 z-[2147483647] w-[460px] max-w-[94vw] rounded-2xl border backdrop-blur-2xl p-4 font-sans flex flex-col gap-3 ${th.card}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={`w-8 h-1 rounded-full mx-auto -mt-1 ${th.bar}`} />

      <div className="flex items-center justify-between pb-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => setModeMenuOpen((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${th.title}`}
          >
            {mode === 'rewrite' ? <PenLine size={15} className="text-indigo-400" /> : <Languages size={15} className="text-indigo-400" />}
            <span>{mode === 'rewrite' ? 'Rewrite' : 'Translate'}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          {modeMenuOpen && (
            <div className={`absolute left-0 top-full mt-1.5 w-32 rounded-xl border shadow-xl p-1 z-50 flex flex-col gap-0.5 ${th.menu}`}>
              {(['rewrite', 'translate'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setModeMenuOpen(false); onModeChange?.(m); }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg capitalize ${mode === m ? th.menuActive : th.menuItem}`}
                >
                  {m === 'rewrite' ? <PenLine size={13} /> : <Languages size={13} />}
                  <span>{m === 'rewrite' ? 'Rewrite' : 'Translate'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {mode !== 'rewrite' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((p) => !p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${th.pill}`}
              >
                <span>{targetLanguage}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {langMenuOpen && (
                <div className={`absolute right-0 top-full mt-1.5 w-32 rounded-xl border shadow-xl p-1 z-50 flex flex-col gap-0.5 ${th.menu}`}>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setLangMenuOpen(false); onLanguageChange?.(l); }}
                      className={`px-2.5 py-1 text-xs text-left rounded-lg ${targetLanguage === l ? th.menuActive : th.menuItem}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg cursor-pointer ${isPinned ? 'text-indigo-400 bg-indigo-500/20' : th.iconBtn}`}
            title={isPinned ? 'Bỏ ghim popup' : 'Ghim popup'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer ${th.iconBtn}`}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {originalText && (
        <div className={`border rounded-xl p-2.5 text-xs flex items-start justify-between gap-2 ${th.origBox}`}>
          <div className={`flex-1 ${!isExpanded ? 'line-clamp-2' : 'max-h-28 overflow-y-auto pr-1'}`}>{originalText}</div>
          <button
            type="button"
            onClick={() => setIsExpanded((p) => !p)}
            className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-pointer"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {mode !== 'rewrite' && (
        <div className={`text-[11px] font-normal px-0.5 ${th.subText}`}>
          EngChat translation are based on web content and context
        </div>
      )}

      <div className="min-h-[70px] max-h-56 overflow-y-auto px-0.5 flex flex-col gap-2">
        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-indigo-400">
            <Loader2 size={16} className="animate-spin text-indigo-400" />
            <span>{mode === 'rewrite' ? 'Đang viết lại với Gemini AI...' : 'Đang dịch với Gemini AI...'}</span>
          </div>
        )}
        {error && <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300">{error}</div>}
        {!isLoading && !error && (
          <div className={`text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30 ${th.resText}`}>
            {translationText || (mode === 'rewrite' ? 'Chưa có bản viết lại.' : 'Chưa có bản dịch.')}
          </div>
        )}
        {explanation && mode !== 'rewrite' && (
          <div className={`mt-1 pt-1 border-t text-xs ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
            <button
              type="button"
              onClick={() => setShowExplanation((p) => !p)}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium py-1 cursor-pointer"
            >
              <BookOpen size={13} />
              <span>Phân tích & Từ vựng</span>
              <span>{showExplanation ? '▲' : '▼'}</span>
            </button>
            {showExplanation && (
              <div className={`mt-1.5 p-2.5 rounded-lg border space-y-1.5 text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'}`}>
                {explanation.vocabulary?.map((v, i) => (
                  <div key={i}><span className="font-semibold text-indigo-400">{v.word}</span>: {v.meaning}</div>
                ))}
                {explanation.grammar && <div><span className="font-semibold">Ngữ pháp:</span> {explanation.grammar}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {!isLoading && !error && translationText && (
        <button
          type="button"
          onClick={() => onFollowUp?.('Hãy diễn đạt lại tự nhiên hơn hoặc cung cấp phương án diễn đạt thay thế hay hơn.')}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors w-fit px-1 py-0.5 cursor-pointer group"
        >
          <Sparkles size={13} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Ask Gemini for a better answer</span>
        </button>
      )}

      {mode === 'rewrite' && (
        <div className="flex items-center gap-2 px-0.5">
          <button
            type="button"
            onClick={() => setShowRewriteOptions((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${th.pill}`}
          >
            <AudioWaveform size={14} className="text-indigo-400" />
            <span>Length & format</span>
          </button>
        </div>
      )}

      {showRewriteOptions && mode === 'rewrite' && (
        <RewriteOptionsPanel
          options={rewriteOptions || DEFAULT_REWRITE_OPTIONS}
          theme={theme}
          onChange={(opts) => onRewriteOptionsChange?.(opts)}
          onClose={() => setShowRewriteOptions(false)}
        />
      )}

      <TranslatePopupFooter
        translationText={translationText}
        isLoading={isLoading}
        theme={theme}
        hasEditableTarget={hasEditableTarget}
        onFollowUp={onFollowUp}
        onRegenerate={onRegenerate}
        onInsert={onInsert}
      />
    </div>
  );
};
