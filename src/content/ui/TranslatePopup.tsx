import React, { useState } from 'react';
import { TranslateExplainResult } from '../../types';
import {
  Languages,
  ChevronDown,
  Pin,
  PinOff,
  X,
  Sparkles,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { TranslatePopupFooter } from './TranslatePopupFooter';

export interface TranslatePopupProps {
  originalText: string;
  result?: string | TranslateExplainResult | null;
  isLoading: boolean;
  error?: string | null;
  targetLanguage?: string;
  isPinned?: boolean;
  hasEditableTarget?: boolean;
  onTogglePin?: () => void;
  onLanguageChange?: (lang: string) => void;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsert?: (text: string) => void;
  onClose: () => void;
}

const LANGUAGES = [
  { id: 'Vietnamese', label: 'Vietnamese' },
  { id: 'English', label: 'English' },
  { id: 'Japanese', label: 'Japanese' },
  { id: 'Korean', label: 'Korean' },
  { id: 'Chinese', label: 'Chinese' },
  { id: 'French', label: 'French' },
];

export const TranslatePopup: React.FC<TranslatePopupProps> = ({
  originalText,
  result,
  isLoading,
  error,
  targetLanguage = 'Vietnamese',
  isPinned = false,
  hasEditableTarget = false,
  onTogglePin,
  onLanguageChange,
  onFollowUp,
  onRegenerate,
  onInsert,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const isExplain = result && typeof result === 'object' && 'translation' in result;
  const translationText = isExplain
    ? (result as TranslateExplainResult).translation
    : (result as string) || '';
  const explanation = isExplain ? (result as TranslateExplainResult).explanation : null;

  return (
    <div
      role="dialog"
      aria-label="EngChat Translate Popup"
      className="fixed bottom-6 right-6 z-[2147483647] w-[460px] max-w-[94vw] rounded-2xl bg-slate-900/98 border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-slate-100 p-4 transition-all duration-200 font-sans flex flex-col gap-3 ring-1 ring-white/10"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="w-8 h-1 bg-slate-600/70 rounded-full mx-auto -mt-1 cursor-grab" />

      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Languages size={15} className="text-indigo-400" />
          <span>Translate</span>
          <ChevronDown size={13} className="text-slate-400" />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((p) => !p)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-colors cursor-pointer"
            >
              <span>{targetLanguage}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-1 z-50 flex flex-col gap-0.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLangMenuOpen(false);
                      onLanguageChange?.(l.id);
                    }}
                    className={`px-2.5 py-1 text-xs text-left rounded-lg transition-colors ${
                      targetLanguage === l.id
                        ? 'bg-indigo-600/40 text-indigo-200 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isPinned ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isPinned ? 'Bỏ ghim popup' : 'Ghim popup'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {originalText && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-400 flex items-start justify-between gap-2">
          <div className={`flex-1 ${!isExpanded ? 'line-clamp-2' : 'max-h-28 overflow-y-auto pr-1'}`}>
            {originalText}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((p) => !p)}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 cursor-pointer"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      <div className="text-[11px] text-slate-500 font-normal px-0.5">
        EngChat translation are based on web content and context
      </div>

      <div className="min-h-[70px] max-h-56 overflow-y-auto px-0.5 flex flex-col gap-2">
        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-indigo-300">
            <Loader2 size={16} className="animate-spin text-indigo-400" />
            <span>Đang dịch với Gemini AI...</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="text-sm leading-relaxed text-slate-100 selection:bg-indigo-500/30 whitespace-pre-wrap">
            {translationText || 'Chưa có bản dịch.'}
          </div>
        )}

        {explanation && (
          <div className="mt-1 pt-1 border-t border-slate-800/60 text-xs">
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
              <div className="mt-1.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5 text-slate-300">
                {explanation.vocabulary?.map((v, i) => (
                  <div key={i}>
                    <span className="font-semibold text-indigo-300">{v.word}</span>: {v.meaning}
                  </div>
                ))}
                {explanation.grammar && (
                  <div><span className="font-semibold text-slate-200">Ngữ pháp:</span> {explanation.grammar}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!isLoading && !error && translationText && (
        <button
          type="button"
          onClick={() => onFollowUp?.('Hãy diễn đạt lại đoạn văn trên tự nhiên hơn hoặc cung cấp phương án dịch hay hơn.')}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors w-fit px-1 py-0.5 cursor-pointer group"
        >
          <Sparkles size={13} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Ask Gemini for a better answer</span>
        </button>
      )}

      <TranslatePopupFooter
        translationText={translationText}
        isLoading={isLoading}
        hasEditableTarget={hasEditableTarget}
        onFollowUp={onFollowUp}
        onRegenerate={onRegenerate}
        onInsert={onInsert}
      />
    </div>
  );
};
