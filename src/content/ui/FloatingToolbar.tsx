import React, { useState, useRef, useEffect } from 'react';
import { ToneType } from '../../types';
import {
  Sparkles,
  PenLine,
  Wand2,
  MoreVertical,
  Check,
  Loader2,
  BookOpen,
  Briefcase,
  Smile,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export interface FloatingToolbarProps {
  visible: boolean;
  x: number;
  y: number;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  isEditable?: boolean;
  onSelectTone: (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve') => void;
  onClose?: () => void;
}

const TONE_OPTIONS: { id: ToneType; label: string; icon: React.ReactNode }[] = [
  { id: 'polite', label: 'Lịch sự (Polite)', icon: <ShieldCheck size={14} className="text-blue-400" /> },
  { id: 'professional', label: 'Chuyên nghiệp (Professional)', icon: <Briefcase size={14} className="text-purple-400" /> },
  { id: 'friendly', label: 'Thân thiện (Friendly)', icon: <Smile size={14} className="text-emerald-400" /> },
  { id: 'concise', label: 'Ngắn gọn (Concise)', icon: <Zap size={14} className="text-amber-400" /> },
  { id: 'translate_explain', label: 'Dịch & Giải thích', icon: <BookOpen size={14} className="text-indigo-400" /> },
];

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  visible,
  x,
  y,
  isLoading = false,
  theme = 'dark',
  isEditable = false,
  onSelectTone,
  onClose,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) {
      setMenuOpen(false);
      setSuccessAnim(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleToneClick = (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve') => {
    setMenuOpen(false);
    if (mode) {
      onSelectTone(tone, mode);
    } else {
      onSelectTone(tone);
    }
  };

  const isLight = theme === 'light';
  const barStyle = isLight
    ? 'bg-white border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-700 hover:border-slate-300'
    : 'bg-slate-900 border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.45)] text-slate-200 hover:border-slate-600 ring-1 ring-white/10';
  const btnHover = isLight
    ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 active:bg-slate-200'
    : 'text-slate-300 hover:text-indigo-300 hover:bg-slate-800/80 active:bg-slate-700/60';
  const menuStyle = isLight
    ? 'bg-white border-slate-200 shadow-2xl text-slate-700 ring-1 ring-black/5'
    : 'bg-slate-900 border-slate-700/80 shadow-2xl text-slate-200 ring-1 ring-white/10';
  const menuItemHover = isLight
    ? 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50'
    : 'text-slate-300 hover:text-white hover:bg-indigo-600/30';
  const iconBg = isLight ? 'bg-slate-100 group-hover:bg-indigo-100/60' : 'bg-slate-800/80 group-hover:bg-indigo-500/20';

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="EngChat Floating Toolbar"
      className="fixed z-[2147483646] flex flex-col items-center select-none animate-in fade-in zoom-in-95 duration-200"
      style={{ left: `${x}px`, top: `${y}px` }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border backdrop-blur-xl transition-all ${barStyle}`}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('professional', 'improve')}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title="Cải thiện văn bản (Improve)"
          aria-label="Improve text"
        >
          <Wand2 size={15} className="text-indigo-400 hover:scale-110 transition-transform" />
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('translate_explain', 'translate')}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title="Dịch & Giải thích (Translate)"
          aria-label="Dịch & Giải thích"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[11px] group-hover:bg-indigo-500/30 transition-colors">
            文A
          </span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('professional', 'rewrite')}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${btnHover}`}
          title="Viết lại văn bản (Rewrite)"
          aria-label="Rewrite text"
        >
          <PenLine size={15} />
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('polite')}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer relative ${btnHover}`}
          title="Tối ưu với AI (Polite)"
          aria-label="AI Optimize"
        >
          {isLoading ? (
            <Loader2 size={15} className="animate-spin text-indigo-400" />
          ) : successAnim ? (
            <Check size={15} className="text-emerald-400" />
          ) : (
            <Sparkles size={15} className="text-indigo-400 hover:scale-110 transition-transform" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
          title="Tùy chọn khác"
          aria-label="More options"
        >
          <MoreVertical size={14} />
        </button>

        <div className="pl-1">
          <div
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-1 ring-indigo-400/30"
            title="EngChat AI"
          >
            ✦
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          role="menu"
          className={`absolute top-full mt-2 w-52 rounded-xl border backdrop-blur-xl p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${menuStyle}`}
        >
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Chọn phong cách văn phong
          </div>
          {TONE_OPTIONS.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              onClick={() => handleToneClick(item.id)}
              className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer group ${menuItemHover}`}
            >
              <span className={`p-1 rounded transition-colors ${iconBg}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
