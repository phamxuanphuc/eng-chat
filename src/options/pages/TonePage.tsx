import React from 'react';
import { useOptions } from '../OptionsContext';
import { ToneCard } from '../../components/ui/ToneCard';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Palette } from 'lucide-react';
import { PageHeader } from '../PageHeader';
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
    <div className="flex flex-col gap-6 animate-fadeIn">
      <section>
        <div className="flex flex-col gap-5">
          <PageHeader
            icon={<Palette size={19} />}
            title={t('tone.title')}
            description={t('tone.description')}
            aside={<Badge variant="primary" size="sm">{selectedToneLabel}</Badge>}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TONES_LIST.map((item, index) => (
              <ToneCard
                key={item.id}
                tone={item.id}
                title={t(`tone.${item.id === 'translate_explain' ? 'translate' : item.id}Title` as Parameters<typeof t>[0])}
                description={t(`tone.${item.id === 'translate_explain' ? 'translate' : item.id}Description` as Parameters<typeof t>[0])}
                icon={item.icon}
                selected={tone === item.id}
                onClick={setTone}
                index={index + 1}
              />
            ))}
          </div>

          <div>
            <Textarea
              label={t('tone.custom', { tone: selectedToneLabel })}
              value={tonePrompts[tone] || ''}
              onChange={(event) => setTonePrompt(event.target.value)}
              placeholder={t('tone.placeholder')}
              rows={4}
            />
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{t('tone.saved')}</p>
          </div>
        </div>
      </section>
      <OutputLanguageSection />
    </div>
  );
};
