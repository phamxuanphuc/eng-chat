import React, { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getThemePreference, nextTheme, setThemePreference, ThemePreference } from '../services/theme';
import { getTranslator } from '../i18n';
import { Language } from '../types';

const ICONS: Record<ThemePreference, React.ReactNode> = {
  system: <Monitor size={16} />,
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
};

export const ThemeToggle: React.FC<{ language: Language }> = ({ language }) => {
  const t = getTranslator(language);
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);
  const label = t('options.theme', { theme: t(`theme.${theme}`) });

  const cycle = () => {
    const next = nextTheme(theme);
    setThemePreference(next);
    setTheme(next);
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="h-9 w-9 !px-0 !gap-0 rounded-lg"
      icon={ICONS[theme]}
    />
  );
};
