import React, { useState } from 'react';
import { Languages, PenLine, Wand2, ChevronDown, Pin, PinOff, X } from 'lucide-react';
import { getPopupTheme, POPUP_LANGUAGES } from './popup-theme';
import { Badge } from '../../components/ui/Badge';
import { loadSelectedStyle } from './style-preference';

export interface TranslatePopupHeaderProps {
  mode: 'translate' | 'rewrite' | 'improve';
  targetLanguage: string;
  isPinned: boolean;
  theme: 'light' | 'dark';
  onTogglePin?: () => void;
  onLanguageChange?: (lang: string) => void;
  onModeChange?: (mode: 'translate' | 'rewrite' | 'improve') => void;
  onClose: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

export const TranslatePopupHeader: React.FC<TranslatePopupHeaderProps> = ({
  mode,
  targetLanguage,
  isPinned,
  theme,
  onTogglePin,
  onLanguageChange,
  onModeChange,
  onClose,
  onDragStart,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(loadSelectedStyle);
  const isLight = theme === 'light';
  const th = getPopupTheme(theme);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, [role="button"]')) {
      return;
    }
    onDragStart?.(e);
  };

  const getModeTitle = () => {
    if (mode === 'improve') return 'Improve it';
    if (mode === 'rewrite') return 'Rewrite';
    return 'Translate';
  };

  const getModeIcon = () => {
    if (mode === 'improve') return <Wand2 size={15} className="text-indigo-400" />;
    if (mode === 'rewrite') return <PenLine size={15} className="text-indigo-400" />;
    return <Languages size={15} className="text-indigo-400" />;
  };

  React.useEffect(() => {
    const syncStyle = () => setSelectedStyle(loadSelectedStyle());
    window.addEventListener('engchat-style-preference-changed', syncStyle);
    return () => window.removeEventListener('engchat-style-preference-changed', syncStyle);
  }, []);

  return (
    <div
      onMouseDown={handleHeaderMouseDown}
      className={`sticky top-0 z-20 px-4 pt-2.5 pb-2 border-b backdrop-blur-md rounded-t-2xl flex flex-col gap-1.5 cursor-grab active:cursor-grabbing select-none ${
        isLight ? 'bg-white/95 border-slate-200/80' : 'bg-slate-900/95 border-slate-800/80'
      }`}
    >
      <div
        data-testid="drag-handle"
        onMouseDown={onDragStart}
        className="w-full pt-0.5 pb-1 -mt-1 cursor-grab active:cursor-grabbing flex items-center justify-center select-none group"
        title="Kéo để di chuyển"
      >
        <div className={`w-9 h-1 rounded-full transition-all group-hover:scale-x-125 group-hover:bg-indigo-400 ${th.bar}`} />
      </div>

      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            type="button"
            onClick={() => setModeMenuOpen((p) => !p)}
            className={`flex items-center gap-1.5 py-1 px-1.5 -ml-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${th.title}`}
          >
            {getModeIcon()}
            <span>{getModeTitle()}</span>
            <Badge variant="primary" size="sm">{selectedStyle}</Badge>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          {modeMenuOpen && (
            <div className={`absolute left-0 top-full mt-1.5 w-32 rounded-xl border shadow-xl p-1 z-50 flex flex-col gap-0.5 ${th.menu}`}>
              {(['improve', 'rewrite', 'translate'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setModeMenuOpen(false); onModeChange?.(m); }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg capitalize ${mode === m ? th.menuActive : th.menuItem}`}
                >
                  {m === 'improve' && <Wand2 size={13} />}
                  {m === 'rewrite' && <PenLine size={13} />}
                  {m === 'translate' && <Languages size={13} />}
                  <span>{m === 'improve' ? 'Improve it' : m === 'rewrite' ? 'Rewrite' : 'Translate'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {mode === 'translate' && (
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
                  {POPUP_LANGUAGES.map((l) => (
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
