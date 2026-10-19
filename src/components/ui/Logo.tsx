import React from 'react';

export interface LogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 24
      : size === 'lg'
      ? 48
      : 36;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/icons/icon128.png"
        width={pixelSize}
        height={pixelSize}
        alt="LingoFlow"
        className="shrink-0 rounded-xl transition-transform duration-300 hover:scale-105 shadow-md shadow-indigo-950/50"
      />
      {showText && (
        <span className="font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          LingoFlow
        </span>
      )}
    </div>
  );
};
