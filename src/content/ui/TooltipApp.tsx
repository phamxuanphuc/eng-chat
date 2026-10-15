import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { TranslateExplainResult } from '../../types';
import { Copy, Check, CornerDownLeft, X, BookOpen } from 'lucide-react';
import { Language } from '../../types';
import { getTranslator } from '../../i18n';

export interface TooltipAppProps {
  language?: Language;
  isLoading: boolean;
  error?: string | null;
  result?: string | TranslateExplainResult | null;
  hasEditableTarget: boolean;
  onInsert: (text: string) => void;
  onClose: () => void;
}

export const TooltipApp: React.FC<TooltipAppProps> = ({
  language = 'en',
  isLoading,
  error,
  result,
  hasEditableTarget,
  onInsert,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const t = getTranslator(language);
  const [showExplanation, setShowExplanation] = useState(true);

  const isExplain =
    result && typeof result === 'object' && 'translation' in result;
  const translationText = isExplain
    ? (result as TranslateExplainResult).translation
    : (result as string) || '';

  const explanation = isExplain
    ? (result as TranslateExplainResult).explanation
    : null;

  const handleCopy = async () => {
    if (!translationText) return;
    await navigator.clipboard.writeText(translationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2147483647] w-96 max-w-[90vw] rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-slate-100 p-4 transition-all duration-300 font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-sm font-semibold text-indigo-300">
            EngChat AI
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label={t('common.close')}
        >
          <X size={16} />
        </button>
      </div>

      {isLoading && (
        <div className="py-6 flex justify-center">
          <Loader size="md" text={t('common.optimizing')} />
        </div>
      )}

      {error && (
        <div className="my-2">
          <Alert variant="error" message={t('common.actionFailed')} description={error} />
        </div>
      )}

      {!isLoading && !error && result && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm leading-relaxed text-slate-100 selection:bg-indigo-500/30 max-h-48 overflow-y-auto">
            {translationText}
          </div>

          {explanation && (
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-3 text-xs flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowExplanation((prev) => !prev)}
                className="flex items-center justify-between text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} /> {t('content.analysis')}
                </span>
                <span>{showExplanation ? '▲' : '▼'}</span>
              </button>

              {showExplanation && (
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-700/50 text-slate-300">
                  {explanation.vocabulary?.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-200">{t('content.vocabularyLabel')}</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-300">
                        {explanation.vocabulary.map((item, idx) => (
                          <li key={idx}>
                            <span className="font-medium text-indigo-300">{item.word}</span>: {item.meaning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {explanation.grammar && (
                    <div>
                      <span className="font-semibold text-slate-200">{t('content.grammarLabel')}</span> {explanation.grammar}
                    </div>
                  )}
                  {explanation.nuances && (
                    <div>
                      <span className="font-semibold text-slate-200">{t('content.nuancesLabel')}</span> {explanation.nuances}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>

            {hasEditableTarget && (
              <Button
                variant="primary"
                size="sm"
                icon={<CornerDownLeft size={14} />}
                onClick={() => onInsert(translationText)}
              >
                Insert into field
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
