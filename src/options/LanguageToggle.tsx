import React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getTranslator } from '../i18n';
import { Language } from '../types';

export const LanguageToggle: React.FC<{ language: Language; onChange: (language: Language) => void }> = ({
  language,
  onChange,
}) => {
  const t = getTranslator(language);
  const next: Language = language === 'en' ? 'vi' : 'en';
  const label = `${t('options.language')}: ${t(language === 'en' ? 'language.english' : 'language.vietnamese')}`;

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => onChange(next)}
      aria-label={label}
      title={label}
      className="h-9 !px-2.5 !gap-1 rounded-lg font-semibold"
      icon={<Languages size={14} />}
    >
      {language.toUpperCase()}
    </Button>
  );
};
