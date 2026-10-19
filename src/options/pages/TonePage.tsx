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
    <div className="flex flex-col gap-6 animate-fadeIn">
      <section className="overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-slate-950 shadow-xl shadow-indigo-950/20">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
                <Sparkles size={19} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300/80">{t('tone.sectionLabel')}</p>
                <h2 className="text-lg font-semibold text-slate-100">{t('tone.title')}</h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">{t('tone.description')}</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">{selectedToneLabel}</Badge>
          </div>

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

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-4">
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
