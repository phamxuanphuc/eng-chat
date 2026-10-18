import React, { useState } from 'react';
import { Language } from '../../types';
import { getTranslator } from '../../i18n';
import { sendRuntimeMessage } from '../../services/extension-messaging';
import {
  Copy,
  Check,
  RotateCw,
  Settings,
  CornerDownLeft,
} from 'lucide-react';

export interface TranslatePopupFooterProps {
  language?: Language;
  translationText: string;
  isLoading: boolean;
  theme?: 'light' | 'dark';
  mode?: 'translate' | 'rewrite' | 'improve' | 'summary';
  hasEditableTarget?: boolean;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsert?: (text: string) => void;
  onOpenModelPicker?: () => void;
}

export const TranslatePopupFooter: React.FC<TranslatePopupFooterProps> = ({
  language = 'en',
  translationText,
  isLoading,
  theme = 'dark',
  mode = 'translate',
  hasEditableTarget = false,
  onFollowUp,
  onRegenerate,
  onInsert,
  onOpenModelPicker,
}) => {
  const [copied, setCopied] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const isLight = theme === 'light';
  const t = getTranslator(language);
  const iconBtnClass = isLight
    ? 'p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer'
    : 'p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer';

  const placeholderText =
    mode === 'improve'
      ? t('content.askImprove')
      : mode === 'rewrite'
      ? t('content.askRewrite')
      : mode === 'summary'
      ? t('content.askSummary')
      : t('content.askFollowUp');

  const handleCopy = async () => {
    if (!translationText) return;
    await navigator.clipboard.writeText(translationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isLoading) return;
    onFollowUp?.(followUpText.trim());
    setFollowUpText('');
  };

  return (
    <div className={`flex items-center justify-between gap-2 pt-2 border-t mt-1 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
      <form
        onSubmit={handleFollowUpSubmit}
        className={`flex-1 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all border ${
          isLight
            ? 'bg-slate-100 border-slate-200 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/20'
            : 'bg-slate-950/80 border-slate-800/80 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20'
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
          ✦
        </div>
        <input
          type="text"
          value={followUpText}
          onChange={(e) => setFollowUpText(e.target.value)}
          placeholder={placeholderText}
          className={`w-full bg-transparent border-none outline-none text-xs ${
            isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-slate-500'
          }`}
        />
      </form>

      {hasEditableTarget && (
        <button
          type="button"
          onClick={() => onInsert?.(translationText)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 whitespace-nowrap"
          title={t('content.replaceInput')}
          aria-label={t('content.replaceInput')}
        >
          <CornerDownLeft size={13} className="text-indigo-300" />
          <span>{t('content.replace')}</span>
        </button>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className={iconBtnClass}
          title={copied ? t('content.copied') : t('content.copy')}
          aria-label={t('content.copy')}
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className={`${iconBtnClass} disabled:opacity-50`}
          title={t('content.regenerate')}
          aria-label={t('content.regenerate')}
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={() => { void sendRuntimeMessage({ action: 'OPEN_OPTIONS_PAGE' }).catch(() => {}); }}
          className={iconBtnClass}
          title={t('content.openSettings')}
          aria-label={t('content.openSettings')}
        >
          <Settings size={14} />
        </button>

        <button
          type="button"
          onClick={onOpenModelPicker}
          className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white/20 hover:scale-110 transition-transform cursor-pointer"
          title={t('content.chooseModel')}
          aria-label={t('common.openModelPicker')}
        >
          ✦
        </button>
      </div>
    </div>
  );
};
