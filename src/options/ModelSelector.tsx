import React from 'react';
import { Badge } from '../components/ui/Badge';
import { SelectCard } from '../components/ui/SelectCard';
import { Sparkles, Zap, Shield, Cpu } from 'lucide-react';
import { Language } from '../types';
import { getTranslator } from '../i18n';

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  tagVariant: 'success' | 'primary' | 'secondary' | 'warning';
  description: string;
  icon: React.ReactNode;
}

export const GEMINI_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    tag: 'Recommended - Ultra fast',
    tagVariant: 'success',
    description: 'Ultra-low latency, quota efficient, and instant responses for chat and translation.',
    icon: <Zap size={16} className="text-emerald-400" />,
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'High quality',
    tagVariant: 'primary',
    description: 'Deep contextual reasoning, vocabulary lookup, and precise wording.',
    icon: <Sparkles size={16} className="text-indigo-400" />,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    tag: 'Stable',
    tagVariant: 'secondary',
    description: 'A lightweight, stable model for everyday emails and messages.',
    icon: <Shield size={16} className="text-blue-400" />,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Standard',
    tagVariant: 'secondary',
    description: 'A standard model generation with high reliability and consistency.',
    icon: <Cpu size={16} className="text-slate-400" />,
  },
];

interface ModelSelectorProps {
  language?: Language;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  language,
  selectedModel,
  onSelectModel,
}) => {
  const t = getTranslator(language || 'en');
  const modelText = {
    'gemini-3.5-flash-lite': ['model.recommended', 'model.flashLiteDescription'],
    'gemini-3.5-flash': ['model.highQuality', 'model.flashDescription'],
    'gemini-3.1-flash-lite': ['model.stable', 'model.stableDescription'],
    'gemini-2.5-flash': ['model.standard', 'model.standardDescription'],
  } as const;

  return (
    <section className="flex flex-col gap-5 border-t border-slate-800/80 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Sparkles size={16} className="text-indigo-400" /> {t('model.title')}
        </h3>
        <Badge variant="primary" size="sm">
          {GEMINI_MODELS.find((m) => m.id === selectedModel)?.name || selectedModel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GEMINI_MODELS.map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <SelectCard key={m.id} selected={isSelected} className="!rounded-xl !p-3.5" onClick={() => onSelectModel(m.id)}>
              <span className="flex flex-col gap-2.5">
                <span className="flex flex-wrap items-center gap-2 pr-7">
                  <span className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 p-1.5">{m.icon}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>{m.name}</span>
                  <Badge variant={m.tagVariant} size="sm">
                    {t(modelText[m.id as keyof typeof modelText]?.[0] || 'model.standard')}
                  </Badge>
                </span>
                <span className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {t(modelText[m.id as keyof typeof modelText]?.[1] || 'model.standardDescription')}
                </span>
              </span>
            </SelectCard>
          );
        })}
      </div>
    </section>
  );
};
