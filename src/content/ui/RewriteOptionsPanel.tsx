import React, { useState } from 'react';
import { RewriteOptions } from '../../types';
import { FileText, Sparkles, Smile, X, Plus, Check } from 'lucide-react';

export interface RewriteOptionsPanelProps {
  options: RewriteOptions;
  theme?: 'light' | 'dark';
  onChange: (options: RewriteOptions) => void;
  onClose: () => void;
}

const LENGTH_OPTIONS = ['Auto', 'Short', 'Medium', 'Long'] as const;
const FORMALITY_OPTIONS = ['Auto', 'Casual', 'Neutral', 'Formal'] as const;
const BASE_FORMAT_OPTIONS = [
  'Auto', 'Email', 'Message', 'Comment', 'Paragraph', 'Article',
  'Blog Post', 'Ideas', 'Outline', 'Twitter', 'Reddit', 'Facebook', 'LinkedIn',
];
const BASE_TONE_OPTIONS = [
  'Auto', 'Enthusiastic', 'Humorous', 'Concerned', 'Humble',
  'Optimistic', 'Empathetic', 'Candid', 'Sincere',
];

export const RewriteOptionsPanel: React.FC<RewriteOptionsPanelProps> = ({
  options,
  theme = 'dark',
  onChange,
  onClose,
}) => {
  const [formatList, setFormatList] = useState<string[]>(BASE_FORMAT_OPTIONS);
  const [toneList, setToneList] = useState<string[]>(BASE_TONE_OPTIONS);
  const [newFormat, setNewFormat] = useState('');
  const [newTone, setNewTone] = useState('');
  const [isAddingFormat, setIsAddingFormat] = useState(false);
  const [isAddingTone, setIsAddingTone] = useState(false);

  const isLight = theme === 'light';
  const panelStyle = isLight
    ? 'bg-white text-slate-800 border-slate-200 shadow-2xl ring-1 ring-black/5'
    : 'bg-slate-900 text-slate-100 border-slate-700/80 shadow-2xl ring-1 ring-white/10';
  const headingStyle = isLight ? 'text-slate-800 font-semibold' : 'text-slate-200 font-semibold';
  const addBtnStyle = isLight
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-dashed border-slate-300'
    : 'bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 border-dashed border-slate-700';

  const handleSelect = (key: keyof RewriteOptions, value: string) => {
    onChange({ ...options, [key]: value });
  };

  const handleAddCustom = (key: 'format' | 'tone', value: string, reset: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (key === 'format' && !formatList.includes(trimmed)) setFormatList((p) => [...p, trimmed]);
    if (key === 'tone' && !toneList.includes(trimmed)) setToneList((p) => [...p, trimmed]);
    handleSelect(key, trimmed);
    reset();
  };

  const renderChip = (key: keyof RewriteOptions, item: string) => {
    const isSelected = (options[key] || 'Auto') === item;
    const selectedStyle = isLight
      ? 'bg-indigo-50 text-indigo-700 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
      : 'bg-indigo-600/40 text-indigo-200 border-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.25)]';
    const unselectedStyle = isLight
      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60';
    return (
      <button
        key={item}
        type="button"
        onClick={() => handleSelect(key, item)}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
          isSelected ? selectedStyle : unselectedStyle
        }`}
      >
        {item}
      </button>
    );
  };

  return (
    <div
      role="region"
      aria-label="Rewrite style options"
      className={`absolute inset-0 z-50 backdrop-blur-2xl rounded-2xl flex flex-col border overflow-hidden ${panelStyle}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md ${isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'}`}>
        <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Tùy chọn văn phong & định dạng</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close options"
          className={`p-1 rounded-lg transition-colors cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 text-sm ${headingStyle}`}>
          <FileText size={15} className="text-indigo-400" />
          <span>Length</span>
        </div>
        <div className="flex flex-wrap gap-1.5">{LENGTH_OPTIONS.map((item) => renderChip('length', item))}</div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 text-sm ${headingStyle}`}>
          <Sparkles size={15} className="text-indigo-400" />
          <span>Formality</span>
        </div>
        <div className="flex flex-wrap gap-1.5">{FORMALITY_OPTIONS.map((item) => renderChip('formality', item))}</div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 text-sm ${headingStyle}`}>
          <FileText size={15} className="text-indigo-400" />
          <span>Format</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {formatList.map((item) => renderChip('format', item))}
          {isAddingFormat ? (
            <form onSubmit={(e) => { e.preventDefault(); handleAddCustom('format', newFormat, () => { setNewFormat(''); setIsAddingFormat(false); }); }} className="inline-flex items-center gap-1">
              <input type="text" autoFocus value={newFormat} onChange={(e) => setNewFormat(e.target.value)} placeholder="Format..." className={`w-24 px-2 py-1 rounded-xl text-xs outline-none ${isLight ? 'bg-slate-50 border border-indigo-400 text-slate-800' : 'bg-slate-950 border border-indigo-500 text-slate-100'}`} />
              <button type="submit" className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"><Check size={12} /></button>
            </form>
          ) : (
            <button type="button" onClick={() => setIsAddingFormat(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors border ${addBtnStyle}`}>
              <Plus size={12} /><span>Add format</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 text-sm ${headingStyle}`}>
          <Smile size={15} className="text-indigo-400" />
          <span>Tone</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {toneList.map((item) => renderChip('tone', item))}
          {isAddingTone ? (
            <form onSubmit={(e) => { e.preventDefault(); handleAddCustom('tone', newTone, () => { setNewTone(''); setIsAddingTone(false); }); }} className="inline-flex items-center gap-1">
              <input type="text" autoFocus value={newTone} onChange={(e) => setNewTone(e.target.value)} placeholder="Tone..." className={`w-24 px-2 py-1 rounded-xl text-xs outline-none ${isLight ? 'bg-slate-50 border border-indigo-400 text-slate-800' : 'bg-slate-950 border border-indigo-500 text-slate-100'}`} />
              <button type="submit" className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"><Check size={12} /></button>
            </form>
          ) : (
            <button type="button" onClick={() => setIsAddingTone(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors border ${addBtnStyle}`}>
              <Plus size={12} /><span>Add tone</span>
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
