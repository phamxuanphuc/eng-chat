import React, { useRef, useState } from 'react';
import { Languages, PenLine, Wand2, FileText, ChevronDown, X, Pin, LucideIcon } from 'lucide-react';
import { Language } from '../../types';
import { getTranslator, TranslationKey } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { useDismiss } from '../../components/ui/useDismiss';

type PopupMode = 'translate' | 'rewrite' | 'improve' | 'summary';

const MODES: Array<{ mode: PopupMode; labelKey: TranslationKey; Icon: LucideIcon }> = [
  { mode: 'improve', labelKey: 'content.improveIt', Icon: Wand2 },
  { mode: 'rewrite', labelKey: 'content.rewriteMode', Icon: PenLine },
  { mode: 'summary', labelKey: 'content.summaryMode', Icon: FileText },
  { mode: 'translate', labelKey: 'content.translateMode', Icon: Languages },
];

export interface TranslatePopupHeaderProps {
  language?: Language;
  mode: PopupMode;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onModeChange?: (mode: PopupMode) => void;
  onClose: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
}

export const TranslatePopupHeader: React.FC<TranslatePopupHeaderProps> = ({
  language = 'en',
  mode,
  onModeChange,
  onClose,
  onTogglePin,
  isPinned = false,
  onDragStart,
}) => {
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const t = getTranslator(language);
  const current = MODES.find((item) => item.mode === mode) || MODES[3];
  const pinLabel = isPinned ? t('content.unpin') : t('content.pin');

  useDismiss(modeMenuRef, modeMenuOpen, () => setModeMenuOpen(false));

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, [role="button"]')) return;
    onDragStart?.(e);
  };

  return (
    <div
      onMouseDown={handleHeaderMouseDown}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="sticky top-0 z-20 pointer-events-auto flex flex-col gap-1 rounded-t-2xl border-b border-slate-800/80 bg-slate-900 px-4 pb-2 pt-2 cursor-grab active:cursor-grabbing select-none"
    >
      <div
        data-testid="drag-handle"
        className="group flex w-full items-center justify-center pb-0.5 cursor-grab active:cursor-grabbing select-none"
        title={t('content.dragToMove')}
      >
        <div className="h-1 w-9 rounded-full bg-slate-600/70 transition-[transform,background-color] group-hover:scale-x-125 group-hover:bg-indigo-400" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div ref={modeMenuRef} className="relative -ml-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            aria-haspopup="menu"
            aria-expanded={modeMenuOpen}
            className="!rounded-lg !px-1.5 !py-1 font-semibold"
            icon={<current.Icon size={15} className="text-indigo-400" />}
            onClick={() => setModeMenuOpen((open) => !open)}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="inline-flex items-center gap-1">
              {t(current.labelKey)}
              <ChevronDown size={13} className="text-slate-400" />
            </span>
          </Button>
          {modeMenuOpen && (
            <Menu label={t(current.labelKey)} className="left-0 top-full mt-1.5 w-36">
              {MODES.map((item) => (
                <MenuItem
                  key={item.mode}
                  active={item.mode === mode}
                  icon={<item.Icon size={13} />}
                  onClick={() => { setModeMenuOpen(false); onModeChange?.(item.mode); }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  {t(item.labelKey)}
                </MenuItem>
              ))}
            </Menu>
          )}
        </div>
        <div className="flex items-center gap-1">
          <IconButton label={pinLabel} active={isPinned} aria-pressed={isPinned} onClick={onTogglePin}>
            <Pin size={15} className={isPinned ? 'fill-current' : ''} />
          </IconButton>
          <IconButton label={t('content.close')} onClick={onClose}>
            <X size={15} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
