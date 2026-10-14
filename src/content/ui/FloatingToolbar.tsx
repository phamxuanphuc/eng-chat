import React, { useState, useRef, useEffect } from 'react';
import { ToneType } from '../../types';
import {
  Sparkles,
  PenLine,
  ChevronDown,
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
  onSelectTone: (tone: ToneType) => void;
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

  const handleToneClick = (tone: ToneType) => {
    setMenuOpen(false);
    onSelectTone(tone);
  };

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="EngChat Floating Toolbar"
      className="fixed z-[2147483646] flex flex-col items-center select-none animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.45)] backdrop-blur-xl text-slate-200 ring-1 ring-white/10 transition-all hover:border-slate-600">
        <div className="flex items-center">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleToneClick('translate_explain')}
            className="flex items-center gap-1 px-2 py-1 rounded-l-full text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 active:bg-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer group"
            title="Dịch & Giải thích (Translate)"
            aria-label="Dịch & Giải thích"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[11px] group-hover:bg-indigo-500/30 transition-colors">
              文A
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-1 -ml-0.5 rounded-r-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 active:bg-slate-700/60 transition-colors cursor-pointer"
            title="Chọn giọng văn"
            aria-label="Chọn giọng văn"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <ChevronDown
              size={12}
              className={`text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60 mx-0.5" />

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('professional')}
          className="p-1.5 rounded-full text-slate-300 hover:text-indigo-300 hover:bg-slate-800/80 active:bg-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
          title="Làm mượt văn bản (Professional)"
          aria-label="Polish text"
        >
          <PenLine size={15} />
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleToneClick('polite')}
          className="p-1.5 rounded-full text-slate-300 hover:text-indigo-300 hover:bg-slate-800/80 active:bg-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer relative"
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
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 active:bg-slate-700/60 transition-colors cursor-pointer"
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
          className="absolute top-full mt-2 w-52 rounded-xl bg-slate-900/98 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-1.5 flex flex-col gap-0.5 text-slate-200 z-50 ring-1 ring-white/10 animate-in fade-in slide-in-from-top-1 duration-150"
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
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-indigo-600/30 active:bg-indigo-600/50 transition-colors text-left cursor-pointer group"
            >
              <span className="p-1 rounded bg-slate-800/80 group-hover:bg-indigo-500/20 transition-colors">
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
