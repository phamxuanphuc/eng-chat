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
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
        aria-label="LingoFlow Logo"
      >
        <defs>
          <linearGradient id="lfBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a0e1a" />
            <stop offset="50%" stopColor="#12172b" />
            <stop offset="100%" stopColor="#18132e" />
          </linearGradient>
          <linearGradient id="lfBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#6366f1" />
            <stop offset="70%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="lfLoop1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="45%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="lfLoop2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="lfStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>

        <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#lfBgGrad)" stroke="url(#lfBorderGrad)" strokeWidth="8" />

        <path d="M 148 152 C 148 132, 168 120, 188 126 C 240 142, 280 200, 310 248 C 336 290, 368 334, 348 368 C 332 394, 290 398, 252 380 C 200 356, 148 298, 148 236 Z" fill="url(#lfLoop1)" opacity="0.95" />
        <path d="M 364 360 C 364 380, 344 392, 324 386 C 272 370, 232 312, 202 264 C 176 222, 144 178, 164 144 C 180 118, 222 114, 260 132 C 312 156, 364 214, 364 276 Z" fill="url(#lfLoop2)" opacity="0.88" />

        <path d="M 256 188 Q 256 256, 324 256 Q 256 256, 256 324 Q 256 256, 188 256 Q 256 256, 256 188 Z" fill="url(#lfStarGrad)" />
        <circle cx="256" cy="256" r="12" fill="#ffffff" />

        <path d="M 374 136 Q 374 156, 394 156 Q 374 156, 374 176 Q 374 156, 354 156 Q 374 156, 374 136 Z" fill="#38bdf8" />
        <path d="M 138 344 Q 138 358, 152 358 Q 138 358, 138 372 Q 138 358, 124 358 Q 138 358, 138 344 Z" fill="#d946ef" />
      </svg>

      {showText && (
        <span className="font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          LingoFlow
        </span>
      )}
    </div>
  );
};
