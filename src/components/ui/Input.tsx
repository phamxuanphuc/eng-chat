import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getTranslator } from '../../i18n';
import { IconButton } from './IconButton';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'bare';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  id,
  variant = 'default',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const language = useSettingsStore((state) => state.settings.language);
  const t = getTranslator(language);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const stateStyles = error
    ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
    : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30';
  const fieldStyles = variant === 'bare'
    ? 'w-full border-none bg-transparent text-xs text-slate-200 placeholder-slate-400'
    : `w-full rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 transition-colors ${stateStyles}`;

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
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`${fieldStyles} ${icon ? 'pl-9' : ''} ${isPassword ? 'pr-10' : ''} outline-none ${className}`}
          {...props}
        />
        {isPassword && (
          <IconButton
            label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
            className="absolute right-1.5"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconButton>
        )}
      </div>
      {error && <span id={errorId} className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  );
};
