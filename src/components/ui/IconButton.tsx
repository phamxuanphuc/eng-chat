import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
  tooltip?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  size = 'sm',
  active = false,
  tooltip = false,
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    title={tooltip ? undefined : label}
    className={`group ${tooltip ? 'relative' : ''} inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-50 ${
      size === 'md' ? 'h-8 w-8' : 'h-7 w-7'
    } ${
      active
        ? 'bg-indigo-500/15 text-indigo-300'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 active:bg-slate-700'
    } ${className}`}
    {...props}
  >
    {children}
    {tooltip && (
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    )}
  </button>
);
