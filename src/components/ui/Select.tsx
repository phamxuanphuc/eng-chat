import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  icon?: React.ReactNode;
  compact?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  icon,
  compact = false,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className={`pointer-events-none absolute z-10 flex items-center text-slate-400 ${compact ? 'left-1/2 -translate-x-1/2' : 'left-3'}`}>
            {icon}
          </span>
        )}
        <select
          id={selectId}
          className={`${compact ? 'h-9 w-10 rounded-lg px-0 py-1 pr-0 text-transparent [&>option]:text-slate-100' : 'rounded-xl px-3.5 py-2.5 pr-9 text-sm'} appearance-none border border-indigo-400/80 bg-slate-900 text-slate-100 outline-none transition-all duration-300 shadow-[0_0_0_2px_rgba(99,102,241,0.2)] hover:border-indigo-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30 ${icon && !compact ? 'pl-9' : ''} ${className}`}
          title={compact ? options.find((option) => option.value === props.value)?.label : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={`pointer-events-none absolute text-slate-300 ${compact ? 'right-1' : 'right-3'}`} aria-hidden="true">
          <svg viewBox="0 0 20 20" className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} fill-none stroke-current`} strokeWidth="1.8">
            <path d="m5 7 5 5 5-5" />
          </svg>
        </span>
      </div>
    </div>
  );
};
