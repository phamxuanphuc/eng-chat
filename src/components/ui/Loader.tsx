import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses}`}>
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-pink-500 border-l-indigo-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
      </div>
      {text && <span className="text-xs text-slate-300 font-medium animate-pulse">{text}</span>}
    </div>
  );
};
