import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, GitCompare, RotateCw, Settings } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { getTranslator, TranslationKey } from '../../i18n';
import { sendRuntimeMessage } from '../../services/extension-messaging';
import { diffWords } from '../../services/text-diff';
import { Language, TranslateExplainResult } from '../../types';
import { DiffView } from './DiffView';

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
  originalText?: string;
  explanation?: TranslateExplainResult['explanation'] | null;
  isLoading: boolean;
  error?: string | null;
  isNotice?: boolean;
  onRetry?: () => void;
}

export const PopupResult: React.FC<PopupResultProps> = ({ language, mode, text, originalText = '', explanation, isLoading, error, isNotice = false, onRetry }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const t = getTranslator(language);
  const vocabulary = Array.isArray(explanation?.vocabulary) ? explanation.vocabulary : [];
  const grammar = typeof explanation?.grammar === 'string' ? explanation.grammar : '';
  const nuances = typeof explanation?.nuances === 'string' ? explanation.nuances : '';
  const canDiff = (mode === 'improve' || mode === 'rewrite') && !isLoading && !error && !!text && !!originalText;
  const diff = useMemo(() => (canDiff ? diffWords(originalText, text) : null), [canDiff, originalText, text]);
  const hasExplanation = vocabulary.length > 0 || !!grammar || !!nuances;

  return (
    <div aria-live="polite" aria-busy={isLoading} className="flex flex-col gap-2 px-0.5">
      {isLoading && <Loader size="sm" text={t(LOADING_KEYS[mode])} className="py-6" />}
      {error && !isLoading && isNotice && <Alert variant="info" message={error} />}
      {error && !isLoading && !isNotice && (
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
          {diff && showDiff ? <DiffView parts={diff} /> : text || t(EMPTY_KEYS[mode])}
        </div>
      )}
      {diff && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={showDiff}
            className="!rounded-lg !px-1.5 !py-1 !text-indigo-400"
            icon={<GitCompare size={13} />}
            onClick={() => setShowDiff((current) => !current)}
          >
            {showDiff ? t('content.hideChanges') : t('content.showChanges')}
          </Button>
        </div>
      )}
      {hasExplanation && mode === 'translate' && !isLoading && !error && (
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
              {vocabulary.map((item, index) => (
                <div key={index}>
                  <span className="font-semibold text-indigo-400">{item.word}</span>: {item.meaning}
                  {item.note && <span className="text-slate-400"> ({item.note})</span>}
                </div>
              ))}
              {grammar && <div><span className="font-semibold">{t('content.grammar')}</span> {grammar}</div>}
              {nuances && <div><span className="font-semibold">{t('content.nuances')}</span> {nuances}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
