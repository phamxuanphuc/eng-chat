import React from 'react';
import { ToneType, Language } from '../../types';
import { getTranslator } from '../../i18n';
import { FileText, PenLine, Wand2 } from 'lucide-react';

export interface FloatingToolbarProps {
  language?: Language;
  visible: boolean;
  x: number;
  y: number;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  isEditable?: boolean;
  onSelectTone: (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve' | 'summary') => void;
  onClose?: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  language = 'en',
  visible,
  x,
  y,
  isLoading = false,
  theme = 'dark',
  isEditable = false,
  onSelectTone,
  onClose,
}) => {
  if (!visible) return null;

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
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('professional', 'improve')}
          className={`group relative p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title={t('content.improve')}
          aria-label={t('content.improve')}
        >
          <Wand2 size={15} className="text-indigo-400 hover:scale-110 transition-transform" />
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
          <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[11px]">
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
          <FileText size={15} />
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
          <PenLine size={15} />
          <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('content.rewrite')}
          </span>
        </button>

        <div className="pl-1">
          <div
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-1 ring-indigo-400/30"
            title="LingoFlow"
          >
            ✦
          </div>
        </div>
      </div>
    </div>
  );
};
