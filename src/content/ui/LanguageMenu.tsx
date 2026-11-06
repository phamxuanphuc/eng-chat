import React, { useRef, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { useDismiss } from '../../components/ui/useDismiss';
import { getTranslator } from '../../i18n';
import { Language } from '../../types';
import { getLanguageLabel, POPUP_LANGUAGES } from './popup-theme';

export interface LanguageMenuProps {
  language: Language;
  value: string;
  onChange?: (value: string) => void;
}

export const LanguageMenu: React.FC<LanguageMenuProps> = ({ language, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = getTranslator(language);

  useDismiss(containerRef, open, () => setOpen(false));

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('content.selectLanguage')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="!rounded-lg !px-1.5 !py-1"
        icon={<Languages size={14} className="text-indigo-400" />}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex items-center gap-1">
          {getLanguageLabel(t, value)}
          <ChevronDown size={12} className="text-slate-400" />
        </span>
      </Button>
      {open && (
        <Menu label={t('content.selectLanguage')} className="bottom-full left-0 mb-1.5 max-h-52 w-36 overflow-y-auto">
          {POPUP_LANGUAGES.map((item) => (
            <MenuItem
              key={item}
              active={value === item}
              onClick={() => { setOpen(false); onChange?.(item); }}
            >
              {getLanguageLabel(t, item)}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  );
};
