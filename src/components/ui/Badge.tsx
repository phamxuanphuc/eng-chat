import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20',
    secondary:
      'bg-slate-800/80 text-slate-300 border-slate-700 shadow-sm',
    success:
      'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20',
    warning:
      'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20',
    danger:
      'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md transition-all ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
