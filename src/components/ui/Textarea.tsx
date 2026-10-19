import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const textareaId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full rounded-xl bg-slate-900/90 text-slate-100 placeholder-slate-400 text-sm px-3.5 py-2.5 transition-all duration-300 border resize-none ${
          error
            ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
            : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:shadow-lg focus:shadow-indigo-500/10'
        } outline-none ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  );
};
