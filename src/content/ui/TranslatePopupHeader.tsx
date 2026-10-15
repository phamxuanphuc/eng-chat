import React, { useState } from 'react';
import { Languages, PenLine, ChevronDown, Pin, PinOff, X } from 'lucide-react';
import { getPopupTheme } from './popup-theme';

export interface TranslatePopupHeaderProps {
  mode: 'translate' | 'rewrite';
  targetLanguage: string;
  isPinned: boolean;
  theme: 'light' | 'dark';
  onTogglePin?: () => void;
  onLanguageChange?: (lang: string) => void;
  onModeChange?: (mode: 'translate' | 'rewrite') => void;
  onClose: () => void;
}

const LANGUAGES = ['Vietnamese', 'English', 'Japanese', 'Korean', 'Chinese', 'French'];

export const TranslatePopupHeader: React.FC<TranslatePopupHeaderProps> = ({
  mode,
  targetLanguage,
  isPinned,
  theme,
  onTogglePin,
  onLanguageChange,
  onModeChange,
  onClose,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const isLight = theme === 'light';
  const th = getPopupTheme(theme);

  return (
    <div className={`sticky top-0 z-20 px-4 pt-2.5 pb-2 border-b backdrop-blur-md rounded-t-2xl flex flex-col gap-1.5 ${
      isLight ? 'bg-white/95 border-slate-200/80' : 'bg-slate-900/95 border-slate-800/80'
    }`}>
      <div className={`w-8 h-1 rounded-full mx-auto ${th.bar}`} />

      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            type="button"
            onClick={() => setModeMenuOpen((p) => !p)}
            className={`flex items-center gap-1.5 py-1 px-1.5 -ml-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${th.title}`}
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

        <div className="flex items-center gap-1">
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
            className={`p-1 rounded-lg cursor-pointer ${isPinned ? 'text-indigo-400 bg-indigo-500/20' : th.iconBtn}`}
            title={isPinned ? 'Bỏ ghim popup' : 'Ghim popup'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg cursor-pointer ${th.iconBtn}`}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
