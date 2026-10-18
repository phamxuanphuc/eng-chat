import React from 'react';
import { Globe } from 'lucide-react';
import { useOptions } from '../OptionsContext';
import { Select } from '../../components/ui/Select';
import { getTranslator, TranslationKey } from '../../i18n';
import { PopupMode } from '../../content/target-languages';
import { POPUP_LANGUAGES } from '../../content/ui/popup-theme';

const MODES: Array<{ mode: PopupMode; labelKey: TranslationKey }> = [
  { mode: 'improve', labelKey: 'outputLanguage.improve' },
  { mode: 'rewrite', labelKey: 'outputLanguage.rewrite' },
  { mode: 'summary', labelKey: 'outputLanguage.summary' },
  { mode: 'translate', labelKey: 'outputLanguage.translate' },
];

const LANGUAGE_OPTIONS = POPUP_LANGUAGES.map((lang) => ({ value: lang, label: lang }));

export const OutputLanguagePage: React.FC = () => {
  const { language, targetLanguages, setTargetLanguage } = useOptions();
  const t = getTranslator(language);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-5 animate-fadeIn">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Globe size={18} className="text-indigo-400" /> {t('outputLanguage.title')}
        </h2>
        <p className="text-xs text-slate-400">{t('outputLanguage.description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODES.map(({ mode, labelKey }) => (
          <Select
            key={mode}
            id={`output-language-${mode}`}
            label={t(labelKey)}
            value={targetLanguages[mode]}
            onChange={(event) => setTargetLanguage(mode, event.target.value)}
            options={LANGUAGE_OPTIONS}
          />
        ))}
      </div>
    </div>
  );
};
