import React from 'react';
import { useOptions } from '../OptionsContext';
import { ToneCard } from '../../components/ui/ToneCard';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Sparkles } from 'lucide-react';
import { TONES_LIST } from '../../constants/tones';
import { getTranslator } from '../../i18n';
import { OutputLanguageSection } from '../OutputLanguageSection';

export const TonePage: React.FC = () => {
  const { language, tone, setTone, tonePrompts, setTonePrompt } = useOptions();
  const t = getTranslator(language);
  const selectedTone = TONES_LIST.find((item) => item.id === tone);
  const selectedToneKey = selectedTone?.id === 'translate_explain' ? 'translate' : selectedTone?.id;
  const selectedToneLabel = selectedToneKey
    ? t(`tone.${selectedToneKey}Title` as Parameters<typeof t>[0])
    : tone;

  return (
    <>
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-5 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" /> {t('tone.title')}
          </h2>
          <Badge variant="primary" size="sm">
            {selectedToneLabel}
          </Badge>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t('tone.description')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {TONES_LIST.map((item) => (
            <ToneCard
              key={item.id}
              tone={item.id}
              title={t(`tone.${item.id === 'translate_explain' ? 'translate' : item.id}Title` as Parameters<typeof t>[0])}
              description={t(`tone.${item.id === 'translate_explain' ? 'translate' : item.id}Description` as Parameters<typeof t>[0])}
              icon={item.icon}
              selected={tone === item.id}
              onClick={setTone}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
          <Textarea
            label={t('tone.custom', { tone: selectedToneLabel })}
            value={tonePrompts[tone] || ''}
            onChange={(event) => setTonePrompt(event.target.value)}
            placeholder={t('tone.placeholder')}
            rows={5}
          />
          <p className="text-xs text-slate-400">
            {t('tone.saved')}
          </p>
        </div>
      </div>
      <OutputLanguageSection />
    </>
  );
};
