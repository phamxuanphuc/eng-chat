import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getTranslator } from '../../i18n';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const language = useSettingsStore((state) => state.settings.language);
  const t = getTranslator(language);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={effectiveType}
          className={`w-full rounded-xl bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm px-3.5 py-2.5 transition-all duration-300 border ${
            error
              ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:shadow-lg focus:shadow-indigo-500/10'
          } ${icon ? 'pl-9' : ''} ${isPassword ? 'pr-10' : ''} outline-none ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  );
};
