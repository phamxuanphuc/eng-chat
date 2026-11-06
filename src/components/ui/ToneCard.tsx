import React from 'react';
import { ToneType } from '../../types';
import { SelectCard } from './SelectCard';

export interface ToneCardProps {
  tone: ToneType;
  title: string;
  description: string;
  icon: React.ReactNode;
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
}) => (
  <SelectCard selected={selected} onClick={() => onClick(tone)} className={`min-h-[84px] ${className}`}>
    <span className="flex items-start gap-3 pr-7">
      <span
        className={`flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border transition-colors ${
          selected
            ? 'border-indigo-400/40 bg-indigo-400/15 text-indigo-300'
            : 'border-slate-700/80 bg-slate-800/80 text-slate-300 group-hover:border-indigo-400/30'
        }`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          {index !== undefined && <span className="text-xs font-bold tracking-widest text-slate-400">0{index}</span>}
          <span className={`truncate text-sm font-semibold ${selected ? 'text-indigo-200' : 'text-slate-200'}`}>
            {title}
          </span>
        </span>
        <span className="line-clamp-2 text-xs leading-5 text-slate-400">{description}</span>
      </span>
    </span>
  </SelectCard>
);
