import React from 'react';
import { LLMProvider } from '../types';
import { Badge } from '../components/ui/Badge';
import { Check, Sparkles, Globe } from 'lucide-react';
import { Language } from '../types';
import { getTranslator } from '../i18n';

interface ProviderSelectorProps {
  language?: Language;
  provider: LLMProvider;
  onSelectProvider: (provider: LLMProvider) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  language,
  provider,
  onSelectProvider,
}) => {
  const isGemini = provider === 'gemini';
  const isOpenAi = provider === 'openai_compatible';
  const t = getTranslator(language || 'en');

  return (
    <section className="flex flex-col gap-5 border-t border-slate-800/80 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Sparkles size={16} className="text-indigo-400" /> {t('provider.choose')}
        </h3>
        <Badge variant={isGemini ? 'success' : 'primary'} size="sm">
          {isGemini ? 'Google Gemini' : 'OpenAI Compatible'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectProvider('gemini')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectProvider('gemini');
            }
          }}
          aria-label="Google Gemini"
          className={`group relative flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
            isGemini
              ? 'bg-indigo-500/10 border-indigo-400/80 ring-1 ring-indigo-400/30'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg shrink-0">
                ✨
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${isGemini ? 'text-indigo-200' : 'text-slate-200'}`}>
                  Google Gemini
                </span>
                <span className="text-xs text-slate-400">{t('provider.googleStudio')}</span>
              </div>
            </div>
            {isGemini && (
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('provider.geminiDescription')}
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <Badge variant="success" size="sm">{t('provider.free')}</Badge>
            <Badge variant="secondary" size="sm">{t('provider.multiKey')}</Badge>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectProvider('openai_compatible')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectProvider('openai_compatible');
            }
          }}
          aria-label={t('provider.custom')}
          className={`group relative flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
            isOpenAi
              ? 'bg-indigo-500/10 border-indigo-400/80 ring-1 ring-indigo-400/30'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-lg shrink-0">
                <Globe size={18} />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${isOpenAi ? 'text-indigo-200' : 'text-slate-200'}`}>
                  {t('provider.custom')}
                </span>
                <span className="text-xs text-slate-400">{t('provider.openai')}</span>
              </div>
            </div>
            {isOpenAi && (
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('provider.customDescription')}
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <Badge variant="primary" size="sm">{t('provider.deepseekGroq')}</Badge>
            <Badge variant="secondary" size="sm">{t('provider.ollamaLocal')}</Badge>
          </div>
        </div>
      </div>
    </section>
  );
};
