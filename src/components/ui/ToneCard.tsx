import React from 'react';
import { Check } from 'lucide-react';
import { ToneType } from '../../types';

export interface ToneCardProps {
  tone: ToneType;
  title: string;
  description: string;
  icon: string;
  selected?: boolean;
  onClick: (tone: ToneType) => void;
  className?: string;
  index?: number;
}

export const ToneCard: React.FC<ToneCardProps> = ({
  tone,
  title,
  description,
  icon,
  selected = false,
  onClick,
  className = '',
  index,
}) => {
  return (
    <div
      onClick={() => onClick(tone)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(tone);
        }
      }}
      className={`group relative min-h-[104px] overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
        selected
          ? 'border-indigo-400/80 bg-indigo-500/10 ring-1 ring-indigo-400/30'
          : 'border-slate-800/90 bg-slate-900/55 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-slate-950/30'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border text-xl transition-colors ${selected ? 'border-indigo-400/40 bg-indigo-400/15' : 'border-slate-700/80 bg-slate-800/80 group-hover:border-indigo-400/30'}`}>
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            {index !== undefined && <span className="text-xs font-bold tracking-widest text-slate-400">0{index}</span>}
            <span className={`truncate text-sm font-semibold ${selected ? 'text-indigo-200' : 'text-slate-200'}`}>
              {title}
            </span>
          </div>
          <span className="line-clamp-2 text-xs leading-5 text-slate-400">
            {description}
          </span>
        </div>
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${selected ? 'bg-indigo-400 text-slate-950 opacity-100' : 'border border-slate-700 text-transparent opacity-0 group-hover:opacity-100'}`}>
          <Check size={14} strokeWidth={3} />
        </span>
      </div>
    </div>
  );
};
