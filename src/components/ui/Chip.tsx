import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  dashed?: boolean;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  selected,
  dashed = false,
  icon,
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    aria-pressed={selected}
    className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
      selected
        ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200'
        : dashed
        ? 'border-dashed border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        : 'border-slate-700/60 bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-slate-100'
    } ${className}`}
    {...props}
  >
    {icon}
    {children}
  </button>
);
