import React from 'react';
import { Check } from 'lucide-react';

export interface SelectCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

export const SelectCard: React.FC<SelectCardProps> = ({ selected, className = '', children, ...props }) => (
  <button
    type="button"
    aria-pressed={selected}
    className={`group relative w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors ${
      selected
        ? 'border-indigo-400/80 bg-indigo-500/10 ring-1 ring-indigo-400/30'
        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60'
    } ${className}`}
    {...props}
  >
    {children}
    {selected && (
      <span
        data-engchat-theme="dark"
        className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white"
      >
        <Check size={12} strokeWidth={3} />
      </span>
    )}
  </button>
);
