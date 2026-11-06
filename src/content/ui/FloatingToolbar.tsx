import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, EyeOff, FileText, Languages, PenLine, Wand2 } from 'lucide-react';
import { ToneType, Language } from '../../types';
import { getTranslator } from '../../i18n';
import { IconButton } from '../../components/ui/IconButton';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { useDismiss } from '../../components/ui/useDismiss';
import type { HideScope } from '../toolbar-visibility';

export type { HideScope };

const BAR_HEIGHT = 46;
const MENU_HEIGHT = 96;
const MENU_MAX_WIDTH = 280;

export interface FloatingToolbarProps {
  language?: Language;
  visible: boolean;
  x: number;
  y: number;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  isEditable?: boolean;
  collapsed?: boolean;
  onSelectTone: (tone: ToneType, mode?: 'translate' | 'rewrite' | 'improve' | 'summary') => void;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onHide?: (scope: HideScope) => void;
  siteLabel?: string;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  language = 'en',
  visible,
  x,
  y,
  isLoading = false,
  theme = 'dark',
  collapsed = false,
  onSelectTone,
  onToggleCollapse,
  onHide,
  siteLabel = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || collapsed) setMenuOpen(false);
  }, [visible, collapsed]);

  useDismiss(menuAnchorRef, menuOpen, () => setMenuOpen(false));

  if (!visible) return null;

  const t = getTranslator(language);
  const handleHide = (scope: HideScope) => {
    setMenuOpen(false);
    onHide?.(scope);
  };

  const handleArrowKeys = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const bar = barRef.current;
    if (!bar) return;
    const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const active = (bar.getRootNode() as Document | ShadowRoot).activeElement as HTMLButtonElement;
    const step = event.key === 'ArrowRight' ? 1 : -1;
    event.preventDefault();
    buttons[(buttons.indexOf(active) + step + buttons.length) % buttons.length]?.focus();
  };

  const actions = [
    { label: t('content.improve'), Icon: Wand2, tone: 'professional', mode: 'improve' },
    { label: t('content.translate'), Icon: Languages, tone: 'translate_explain', mode: 'translate' },
    { label: t('content.summary'), Icon: FileText, tone: 'summarize', mode: 'summary' },
    { label: t('content.rewrite'), Icon: PenLine, tone: 'professional', mode: 'rewrite' },
  ] as const;
  const opensUpward = y + BAR_HEIGHT + MENU_HEIGHT > window.innerHeight;
  const alignsRight = x + MENU_MAX_WIDTH > window.innerWidth;

  return (
    <div
      role="toolbar"
      aria-label={t('app.name')}
      data-engchat-theme={theme}
      className="fixed z-[2147483646] flex animate-popIn flex-col items-center select-none"
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.preventDefault()}
      onKeyDown={handleArrowKeys}
      style={{ left: `${x}px`, top: `${y}px`, pointerEvents: 'auto' }}
    >
      <div
        ref={barRef}
        className="flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900 px-2 py-1.5 text-slate-200 shadow-[0_8px_30px_rgb(2_6_23/0.35)] ring-1 ring-white/10 transition-colors hover:border-slate-600"
      >
        {collapsed ? (
          <IconButton size="md" label={t('content.expand')} className="!rounded-full" onClick={onToggleCollapse}>
            <ChevronUp size={15} />
          </IconButton>
        ) : (
          <>
            {actions.map(({ label, Icon, tone, mode }) => (
              <IconButton
                key={mode}
                size="md"
                tooltip
                label={label}
                disabled={isLoading}
                className="!rounded-full"
                onClick={() => onSelectTone(tone, mode)}
              >
                <Icon size={15} className="text-indigo-400" />
              </IconButton>
            ))}
            {onHide && (
              <div ref={menuAnchorRef} className="relative">
                <IconButton
                  size="md"
                  label={t('content.hide')}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="!rounded-full"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <EyeOff size={15} />
                </IconButton>
                {menuOpen && (
                  <Menu
                    label={t('content.hide')}
                    className={`w-max max-w-[min(280px,calc(100vw-16px))] ${opensUpward ? 'bottom-full mb-3' : 'top-full mt-3'} ${alignsRight ? 'right-0' : 'left-0'}`}
                  >
                    <MenuItem onClick={() => handleHide('session')}>{t('content.hideSession')}</MenuItem>
                    <MenuItem onClick={() => handleHide('site')}>{t('content.hideSite', { site: siteLabel })}</MenuItem>
                  </Menu>
                )}
              </div>
            )}
            <IconButton size="md" label={t('content.collapse')} className="!rounded-full" onClick={onToggleCollapse}>
              <ChevronDown size={15} />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
};
