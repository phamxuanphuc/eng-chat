import React, { useState } from 'react';
import { BookOpen, ChevronDown, RotateCw, Settings } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { getTranslator, TranslationKey } from '../../i18n';
import { sendRuntimeMessage } from '../../services/extension-messaging';
import { Language, TranslateExplainResult } from '../../types';

type PopupMode = 'translate' | 'rewrite' | 'improve' | 'summary';

const LOADING_KEYS: Record<PopupMode, TranslationKey> = {
  improve: 'content.improving',
  rewrite: 'content.rewriting',
  summary: 'content.summarizing',
  translate: 'content.translating',
};

const EMPTY_KEYS: Record<PopupMode, TranslationKey> = {
  improve: 'content.noImprovedText',
  rewrite: 'content.noRewrittenText',
  summary: 'content.noSummary',
  translate: 'content.noTranslation',
};

export interface PopupResultProps {
  language: Language;
  mode: PopupMode;
  text: string;
  explanation?: TranslateExplainResult['explanation'] | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const PopupResult: React.FC<PopupResultProps> = ({ language, mode, text, explanation, isLoading, error, onRetry }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const t = getTranslator(language);

  return (
    <div aria-live="polite" aria-busy={isLoading} className="flex flex-col gap-2 px-0.5">
      {isLoading && <Loader size="sm" text={t(LOADING_KEYS[mode])} className="py-6" />}
      {error && !isLoading && (
        <Alert
          variant="error"
          message={t('common.actionFailed')}
          description={error}
          action={(
            <>
              {onRetry && (
                <Button variant="secondary" size="sm" icon={<RotateCw size={12} />} onClick={onRetry}>
                  {t('content.retry')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<Settings size={12} />}
                onClick={() => { void sendRuntimeMessage({ action: 'OPEN_OPTIONS_PAGE' }).catch(() => {}); }}
              >
                {t('content.openSettings')}
              </Button>
            </>
          )}
        />
      )}
      {!isLoading && !error && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100 selection:bg-indigo-500/30">
          {text || t(EMPTY_KEYS[mode])}
        </div>
      )}
      {explanation && mode === 'translate' && !isLoading && (
        <div className="mt-1 border-t border-slate-800/60 pt-1 text-xs">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showExplanation}
            className="!rounded-lg !px-1.5 !py-1 !text-indigo-400"
            icon={<BookOpen size={13} />}
            onClick={() => setShowExplanation((current) => !current)}
          >
            <span className="inline-flex items-center gap-1">
              {t('content.analysis')}
              <ChevronDown size={12} className={`transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
            </span>
          </Button>
          {showExplanation && (
            <div className="mt-1.5 space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs leading-relaxed text-slate-300">
              {explanation.vocabulary?.map((item, index) => (
                <div key={index}><span className="font-semibold text-indigo-400">{item.word}</span>: {item.meaning}</div>
              ))}
              {explanation.grammar && <div><span className="font-semibold">{t('content.grammar')}</span> {explanation.grammar}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
