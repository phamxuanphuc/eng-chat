import React, { useEffect, useState } from 'react';
import { ToneType, Language } from '../../types';
import { getTranslator } from '../../i18n';
import { ChevronDown, ChevronUp, EyeOff, FileText, PenLine, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

import type { HideScope } from '../toolbar-visibility';
export type { HideScope };

export interface FloatingToolbarProps {
  language?: Language;
  visible: boolean;
  x: number;
  y: number;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  isEditable?: boolean;
  collapsed?: boolean;
  onSelectTone: (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve' | 'summary') => void;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onHide?: (scope: HideScope) => void;
  siteLabel?: string;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  language = 'en',
  visible,
  x,
  y,
  isLoading = false,
  theme = 'dark',
  isEditable = false,
  collapsed = false,
  onSelectTone,
  onToggleCollapse,
  onClose,
  onHide,
  siteLabel = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!visible || collapsed) setMenuOpen(false);
  }, [visible, collapsed]);

  if (!visible) return null;

  const handleHide = (scope: HideScope) => {
    setMenuOpen(false);
    onHide?.(scope);
  };

  const handleToneClick = (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve' | 'summary') => {
    if (mode) {
      onSelectTone(tone, mode);
    } else {
      onSelectTone(tone);
    }
  };

  const t = getTranslator(language);
  const isLight = theme === 'light';
  const barStyle = isLight
    ? 'bg-white border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-700 hover:border-slate-300'
    : 'bg-slate-900 border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.45)] text-slate-200 hover:border-slate-600 ring-1 ring-white/10';
  const btnHover = isLight
    ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 active:bg-slate-200'
    : 'text-slate-300 hover:text-indigo-300 hover:bg-slate-800/80 active:bg-slate-700/60';
  const actionIcon = isLight ? 'text-indigo-600' : 'text-indigo-400';
  return (
    <div
      role="toolbar"
      aria-label={t('app.name')}
      className="fixed z-[2147483646] flex flex-col items-center select-none animate-in fade-in zoom-in-95 duration-200"
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.preventDefault()}
      style={{ left: `${x}px`, top: `${y}px`, pointerEvents: 'auto' }}
    >
      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border backdrop-blur-xl transition-all ${barStyle}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`group relative p-1.5 rounded-full transition-colors cursor-pointer ${btnHover}`}
            title={t('content.expand')}
            aria-label={t('content.expand')}
          >
            <ChevronUp size={15} />
          </button>
        ) : (
          <>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('professional', 'improve')}
          className={`group relative p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title={t('content.improve')}
          aria-label={t('content.improve')}
        >
          <Wand2 size={15} className={`${actionIcon} hover:scale-110 transition-transform`} />
          <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('content.improve')}
          </span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('translate_explain', 'translate')}
          className={`group relative p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title={t('content.translate')}
          aria-label={t('content.translate')}
        >
          <span className={`flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 ${actionIcon} font-bold text-[11px]`}>
            文A
          </span>
          <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('content.translate')}
          </span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('summarize', 'summary')}
          className={`group relative p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title={t('content.summary')}
          aria-label={t('content.summary')}
        >
          <FileText size={15} className={actionIcon} />
          <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('content.summary')}
          </span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('professional', 'rewrite')}
          className={`group relative p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title={t('content.rewrite')}
          aria-label={t('content.rewrite')}
        >
          <PenLine size={15} className={actionIcon} />
          <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('content.rewrite')}
          </span>
        </button>

        {onHide && (
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`group relative p-1.5 rounded-full transition-colors cursor-pointer ${btnHover}`}
            title={t('content.hide')}
            aria-label={t('content.hide')}
          >
            <EyeOff size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`group relative p-1.5 rounded-full transition-colors cursor-pointer ${btnHover}`}
          title={t('content.collapse')}
          aria-label={t('content.collapse')}
        >
          <ChevronDown size={15} />
        </button>
          </>
        )}
      </div>
      {menuOpen && onHide && (
        <div
          role="menu"
          aria-label={t('content.hide')}
          className="absolute left-1/2 top-full z-20 mt-2 flex -translate-x-1/2 flex-col gap-1 whitespace-nowrap rounded-xl border border-slate-700/80 bg-slate-900 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.45)]"
        >
          <Button role="menuitem" variant="ghost" size="sm" className="justify-start" onClick={() => handleHide('session')}>
            {t('content.hideSession')}
          </Button>
          <Button role="menuitem" variant="ghost" size="sm" className="justify-start" onClick={() => handleHide('site')}>
            {t('content.hideSite', { site: siteLabel })}
          </Button>
        </div>
      )}
    </div>
  );
};
