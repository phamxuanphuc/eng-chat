import React from 'react';
import { Globe, LucideIcon, Sparkles } from 'lucide-react';
import { Language, LLMProvider } from '../types';
import { Badge } from '../components/ui/Badge';
import { SelectCard } from '../components/ui/SelectCard';
import { getTranslator, TranslationKey } from '../i18n';

interface ProviderSelectorProps {
  language?: Language;
  provider: LLMProvider;
  onSelectProvider: (provider: LLMProvider) => void;
}

const PROVIDERS: Array<{
  id: LLMProvider;
  name?: string;
  nameKey?: TranslationKey;
  subtitleKey: TranslationKey;
  descriptionKey: TranslationKey;
  Icon: LucideIcon;
  tags: Array<{ key: TranslationKey; variant: 'success' | 'primary' | 'secondary' }>;
}> = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    subtitleKey: 'provider.googleStudio',
    descriptionKey: 'provider.geminiDescription',
    Icon: Sparkles,
    tags: [{ key: 'provider.free', variant: 'success' }, { key: 'provider.multiKey', variant: 'secondary' }],
  },
  {
    id: 'openai_compatible',
    nameKey: 'provider.custom',
    subtitleKey: 'provider.openai',
    descriptionKey: 'provider.customDescription',
    Icon: Globe,
    tags: [{ key: 'provider.deepseekGroq', variant: 'primary' }, { key: 'provider.ollamaLocal', variant: 'secondary' }],
  },
];

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ language, provider, onSelectProvider }) => {
  const t = getTranslator(language || 'en');

  return (
    <section className="flex flex-col gap-5 border-t border-slate-800/80 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Sparkles size={16} className="text-indigo-400" /> {t('provider.choose')}
        </h3>
        <Badge variant={provider === 'gemini' ? 'success' : 'primary'} size="sm">
          {provider === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {PROVIDERS.map(({ id, name, nameKey, subtitleKey, descriptionKey, Icon, tags }) => {
          const selected = provider === id;
          const title = name || t(nameKey as TranslationKey);
          return (
            <SelectCard key={id} selected={selected} aria-label={title} onClick={() => onSelectProvider(id)}>
              <span className="flex h-full flex-col justify-between gap-4">
                <span className="flex items-center gap-2.5 pr-7">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                    <Icon size={18} />
                  </span>
                  <span className="flex flex-col">
                    <span className={`text-sm font-bold ${selected ? 'text-indigo-200' : 'text-slate-200'}`}>{title}</span>
                    <span className="text-xs text-slate-400">{t(subtitleKey)}</span>
                  </span>
                </span>
                <span className="text-xs leading-relaxed text-slate-400">{t(descriptionKey)}</span>
                <span className="flex items-center gap-1.5 pt-1">
                  {tags.map((tag) => <Badge key={tag.key} variant={tag.variant} size="sm">{t(tag.key)}</Badge>)}
                </span>
              </span>
            </SelectCard>
          );
        })}
      </div>
    </section>
  );
};
