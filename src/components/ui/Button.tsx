import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-[transform,background-color,border-color,color,filter] duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-slate-900/20 hover:brightness-110 focus-visible:ring-indigo-500 border border-white/10',
    secondary:
      'bg-slate-800/80 text-slate-200 border border-slate-700/80 hover:bg-slate-700 hover:border-slate-600 focus-visible:ring-slate-500 hover:text-slate-50',
    ghost:
      'bg-transparent text-slate-300 hover:bg-slate-500/15 hover:text-slate-50 focus-visible:ring-slate-500',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-slate-900/20 hover:brightness-110 focus-visible:ring-red-500 border border-red-500/30',
  }[variant];

  const keepsDarkPalette = variant === 'primary' || variant === 'danger';

  return (
    <button
      type={type}
      data-engchat-theme={keepsDarkPalette ? 'dark' : undefined}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children !== undefined && <span>{children}</span>}
    </button>
  );
};
