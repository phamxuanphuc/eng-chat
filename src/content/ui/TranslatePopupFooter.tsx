import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Bookmark,
  MoreVertical,
  CornerDownLeft,
} from 'lucide-react';

export interface TranslatePopupFooterProps {
  translationText: string;
  isLoading: boolean;
  theme?: 'light' | 'dark';
  mode?: 'translate' | 'rewrite' | 'improve';
  hasEditableTarget?: boolean;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsert?: (text: string) => void;
  onOpenModelPicker?: () => void;
}

export const TranslatePopupFooter: React.FC<TranslatePopupFooterProps> = ({
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
  const [bookmarked, setBookmarked] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const isLight = theme === 'light';
  const iconBtnClass = isLight
    ? 'p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer'
    : 'p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer';

  const placeholderText =
    mode === 'improve'
      ? 'Tell me how to improve... ↵'
      : mode === 'rewrite'
      ? 'Ask follow-up or rewrite ↵'
      : 'Ask follow-up ↵';

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
          title="Thay thế văn bản trong ô nhập liệu"
          aria-label="Replace text in input"
        >
          <CornerDownLeft size={13} className="text-indigo-300" />
          <span>Replace</span>
        </button>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className={iconBtnClass}
          title={copied ? 'Đã sao chép' : 'Sao chép bản dịch'}
          aria-label="Copy translation"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className={`${iconBtnClass} disabled:opacity-50`}
          title="Dịch lại (Regenerate)"
          aria-label="Regenerate"
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={() => setBookmarked((p) => !p)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            bookmarked ? 'text-amber-500 bg-amber-500/10' : iconBtnClass
          }`}
          title={bookmarked ? 'Đã lưu' : 'Lưu lại'}
          aria-label="Bookmark"
        >
          <Bookmark size={14} className={bookmarked ? 'fill-amber-500' : ''} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreMenuOpen((p) => !p)}
            className={iconBtnClass}
            title="Tùy chọn khác"
            aria-label="More actions"
          >
            <MoreVertical size={14} />
          </button>
          {moreMenuOpen && (
            <div
              className={`absolute right-0 bottom-full mb-1.5 w-36 rounded-xl border p-1 z-50 flex flex-col gap-0.5 ${
                isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-700 shadow-xl'
              }`}
            >
              {hasEditableTarget && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onInsert?.(translationText);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-left rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                >
                  <CornerDownLeft size={13} />
                  <span>Chèn vào ô</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  chrome?.runtime?.openOptionsPage?.();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors ${
                  isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Mở Cài đặt</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenModelPicker}
          className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white/20 hover:scale-110 transition-transform cursor-pointer"
          title="Chọn model AI"
          aria-label="Open model picker"
        >
          ✦
        </button>
      </div>
    </div>
  );
};
