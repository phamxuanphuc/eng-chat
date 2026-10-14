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
  hasEditableTarget?: boolean;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsert?: (text: string) => void;
}

export const TranslatePopupFooter: React.FC<TranslatePopupFooterProps> = ({
  translationText,
  isLoading,
  hasEditableTarget = false,
  onFollowUp,
  onRegenerate,
  onInsert,
}) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

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
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 mt-1">
      <form
        onSubmit={handleFollowUpSubmit}
        className="flex-1 flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all"
      >
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
          ✦
        </div>
        <input
          type="text"
          value={followUpText}
          onChange={(e) => setFollowUpText(e.target.value)}
          placeholder="Ask follow-up ↵"
          className="w-full bg-transparent border-none outline-none text-xs text-slate-200 placeholder:text-slate-500"
        />
      </form>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title={copied ? 'Đã sao chép' : 'Sao chép bản dịch'}
          aria-label="Copy translation"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          title="Dịch lại (Regenerate)"
          aria-label="Regenerate"
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={() => setBookmarked((p) => !p)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            bookmarked ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={bookmarked ? 'Đã lưu' : 'Lưu lại'}
          aria-label="Bookmark"
        >
          <Bookmark size={14} className={bookmarked ? 'fill-amber-400' : ''} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreMenuOpen((p) => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tùy chọn khác"
            aria-label="More actions"
          >
            <MoreVertical size={14} />
          </button>
          {moreMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-1 z-50 flex flex-col gap-0.5">
              {hasEditableTarget && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onInsert?.(translationText);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-left rounded-lg text-indigo-300 hover:bg-indigo-600/30 transition-colors"
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-left rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span>Mở Cài đặt</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white/20">
          ✦
        </div>
      </div>
    </div>
  );
};
