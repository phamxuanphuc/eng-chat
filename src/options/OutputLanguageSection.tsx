import React from 'react';
import { FileText, Globe, Languages, LucideIcon, PenLine, Wand2 } from 'lucide-react';
import { useOptions } from './OptionsContext';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { getTranslator, TranslationKey } from '../i18n';
import { PopupMode } from '../content/target-languages';
import { POPUP_LANGUAGES } from '../content/ui/popup-theme';

const MODES: Array<{ mode: PopupMode; labelKey: TranslationKey; Icon: LucideIcon }> = [
  { mode: 'improve', labelKey: 'outputLanguage.improve', Icon: Wand2 },
  { mode: 'rewrite', labelKey: 'outputLanguage.rewrite', Icon: PenLine },
  { mode: 'summary', labelKey: 'outputLanguage.summary', Icon: FileText },
  { mode: 'translate', labelKey: 'outputLanguage.translate', Icon: Languages },
];

const LANGUAGE_OPTIONS = POPUP_LANGUAGES.map((lang) => ({ value: lang, label: lang }));

export const OutputLanguageSection: React.FC = () => {
  const { language, targetLanguages, setTargetLanguage } = useOptions();
  const t = getTranslator(language);

  return (
    <section className="border-t border-slate-800/80 pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-indigo-300">
            <Globe size={17} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">{t('outputLanguage.title')}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">{t('outputLanguage.description')}</p>
          </div>
        </div>
        <Badge variant="secondary" size="sm">{t('tone.modesCount', { count: MODES.length })}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODES.map(({ mode, labelKey, Icon }) => (
          <div key={mode} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-slate-950/40 p-3 transition-colors hover:border-slate-700">
            <div className="flex min-w-0 items-center gap-2.5">
              <span data-testid={`output-language-icon-${mode}`} aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                <Icon size={14} />
              </span>
              <span className="truncate text-sm font-medium text-slate-200">{t(labelKey)}</span>
            </div>
            <div className="w-32 shrink-0">
              <Select
                id={`output-language-${mode}`}
                aria-label={t(labelKey)}
                value={targetLanguages[mode]}
                onChange={(event) => setTargetLanguage(mode, event.target.value)}
                options={LANGUAGE_OPTIONS}
                className="w-full !rounded-xl !py-2 text-xs"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
