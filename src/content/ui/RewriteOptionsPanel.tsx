import React, { useState } from 'react';
import { RewriteOptions } from '../../types';
import { FileText, Sparkles, Smile, X, Plus, Check } from 'lucide-react';

export interface RewriteOptionsPanelProps {
  options: RewriteOptions;
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
  onChange,
  onClose,
}) => {
  const [formatList, setFormatList] = useState<string[]>(BASE_FORMAT_OPTIONS);
  const [toneList, setToneList] = useState<string[]>(BASE_TONE_OPTIONS);
  const [newFormat, setNewFormat] = useState('');
  const [newTone, setNewTone] = useState('');
  const [isAddingFormat, setIsAddingFormat] = useState(false);
  const [isAddingTone, setIsAddingTone] = useState(false);

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
    return (
      <button
        key={item}
        type="button"
        onClick={() => handleSelect(key, item)}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
          isSelected
            ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
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
      className="absolute inset-0 z-50 bg-slate-900/98 backdrop-blur-2xl rounded-2xl p-4 overflow-y-auto flex flex-col gap-4 text-slate-100 border border-slate-700/80 shadow-2xl ring-1 ring-white/10"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Tùy chọn văn phong & định dạng</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close options"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <FileText size={15} className="text-indigo-400" />
          <span>Length</span>
        </div>
        <div className="flex flex-wrap gap-1.5">{LENGTH_OPTIONS.map((item) => renderChip('length', item))}</div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Sparkles size={15} className="text-indigo-400" />
          <span>Formality</span>
        </div>
        <div className="flex flex-wrap gap-1.5">{FORMALITY_OPTIONS.map((item) => renderChip('formality', item))}</div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <FileText size={15} className="text-indigo-400" />
          <span>Format</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {formatList.map((item) => renderChip('format', item))}
          {isAddingFormat ? (
            <form onSubmit={(e) => { e.preventDefault(); handleAddCustom('format', newFormat, () => { setNewFormat(''); setIsAddingFormat(false); }); }} className="inline-flex items-center gap-1">
              <input type="text" autoFocus value={newFormat} onChange={(e) => setNewFormat(e.target.value)} placeholder="Format..." className="w-24 px-2 py-1 rounded-xl text-xs bg-slate-950 border border-indigo-500 text-slate-100 outline-none" />
              <button type="submit" className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"><Check size={12} /></button>
            </form>
          ) : (
            <button type="button" onClick={() => setIsAddingFormat(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 border border-dashed border-slate-700 cursor-pointer transition-colors">
              <Plus size={12} /><span>Add format</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Smile size={15} className="text-indigo-400" />
          <span>Tone</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {toneList.map((item) => renderChip('tone', item))}
          {isAddingTone ? (
            <form onSubmit={(e) => { e.preventDefault(); handleAddCustom('tone', newTone, () => { setNewTone(''); setIsAddingTone(false); }); }} className="inline-flex items-center gap-1">
              <input type="text" autoFocus value={newTone} onChange={(e) => setNewTone(e.target.value)} placeholder="Tone..." className="w-24 px-2 py-1 rounded-xl text-xs bg-slate-950 border border-indigo-500 text-slate-100 outline-none" />
              <button type="submit" className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"><Check size={12} /></button>
            </form>
          ) : (
            <button type="button" onClick={() => setIsAddingTone(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 border border-dashed border-slate-700 cursor-pointer transition-colors">
              <Plus size={12} /><span>Add tone</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
