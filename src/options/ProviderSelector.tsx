import React from 'react';
import { LLMProvider } from '../types';
import { Badge } from '../components/ui/Badge';
import { Check, Sparkles, Globe } from 'lucide-react';

interface ProviderSelectorProps {
  provider: LLMProvider;
  onSelectProvider: (provider: LLMProvider) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  provider,
  onSelectProvider,
}) => {
  const isGemini = provider === 'gemini';
  const isOpenAi = provider === 'openai_compatible';

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" /> Choose LLM Provider (AI Provider)
        </h2>
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
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 text-left flex flex-col justify-between gap-3 relative ${
            isGemini
              ? 'bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50 scale-[1.01]'
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
                <span className="text-[11px] text-slate-400">Google AI Studio</span>
              </div>
            </div>
            {isGemini && (
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Google AI Studio API key with a generous free quota and fast Gemini 3.5 Flash-Lite support.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <Badge variant="success" size="sm">Free</Badge>
            <Badge variant="secondary" size="sm">Multi-Key</Badge>
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
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 text-left flex flex-col justify-between gap-3 relative ${
            isOpenAi
              ? 'bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50 scale-[1.01]'
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
                  Custom LLM
                </span>
                <span className="text-[11px] text-slate-400">OpenAI Compatible</span>
              </div>
            </div>
            {isOpenAi && (
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect to DeepSeek, Groq, OpenRouter, OpenAI, or local models through Ollama.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <Badge variant="primary" size="sm">DeepSeek / Groq</Badge>
            <Badge variant="secondary" size="sm">Ollama Local</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
