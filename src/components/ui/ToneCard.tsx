import React from 'react';
import { ToneType } from '../../types';

export interface ToneCardProps {
  tone: ToneType;
  title: string;
  description: string;
  icon: string;
  selected?: boolean;
  onClick: (tone: ToneType) => void;
  className?: string;
}

export const ToneCard: React.FC<ToneCardProps> = ({
  tone,
  title,
  description,
  icon,
  selected = false,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={() => onClick(tone)}
      className={`relative p-3.5 rounded-xl cursor-pointer transition-all duration-300 text-left border ${
        selected
          ? 'bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50 scale-[1.02]'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl select-none shrink-0">{icon}</span>
        <div className="flex flex-col min-w-0">
          <span
            className={`text-sm font-semibold truncate ${
              selected ? 'text-indigo-300' : 'text-slate-200'
            }`}
          >
            {title}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {description}
          </span>
        </div>
      </div>
    </div>
  );
};
