import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Copy, Check, Cpu, RotateCw, Settings, CornerDownLeft, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { getTranslator } from '../../i18n';
import { sendRuntimeMessage } from '../../services/extension-messaging';
import { copyText } from '../../services/clipboard';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';

export interface TranslatePopupFooterProps {
  language?: Language;
  translationText: string;
  isLoading: boolean;
  mode?: 'translate' | 'rewrite' | 'improve' | 'summary';
  hasEditableTarget?: boolean;
  onFollowUp?: (query: string) => void;
  onRegenerate?: () => void;
  onInsert?: (text: string) => void;
  onOpenModelPicker?: () => void;
}

export const TranslatePopupFooter: React.FC<TranslatePopupFooterProps> = ({
  language = 'en',
  translationText,
  isLoading,
  mode = 'translate',
  hasEditableTarget = false,
  onFollowUp,
  onRegenerate,
  onInsert,
  onOpenModelPicker,
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [followUpText, setFollowUpText] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  const t = getTranslator(language);
  const hasResult = !isLoading && !!translationText;

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const placeholderText =
    mode === 'improve'
      ? t('content.askImprove')
      : mode === 'rewrite'
      ? t('content.askRewrite')
      : mode === 'summary'
      ? t('content.askSummary')
      : t('content.askFollowUp');
  const copyLabel = copyState === 'copied'
    ? t('content.copied')
    : copyState === 'failed'
    ? t('content.copyFailed')
    : mode === 'translate'
    ? t('content.copy')
    : t('content.copyResult');

  const handleCopy = async () => {
    if (!translationText) return;
    setCopyState((await copyText(translationText)) ? 'copied' : 'failed');
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isLoading) return;
    onFollowUp?.(followUpText.trim());
    setFollowUpText('');
  };

  return (
    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2">
      <form
        onSubmit={handleFollowUpSubmit}
        className="flex min-w-[180px] flex-1 items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/80 px-2.5 py-1.5"
      >
        <Sparkles size={14} className="shrink-0 text-indigo-400" aria-hidden="true" />
        <Input
          variant="bare"
          aria-label={placeholderText}
          value={followUpText}
          onChange={(e) => setFollowUpText(e.target.value)}
          placeholder={placeholderText}
        />
      </form>

      {hasEditableTarget && mode !== 'summary' && (
        <Button
          variant="primary"
          size="sm"
          disabled={!hasResult}
          aria-label={t('content.replaceInput')}
          title={t('content.replaceInput')}
          icon={<CornerDownLeft size={13} />}
          onClick={() => onInsert?.(translationText)}
        >
          {t('content.replace')}
        </Button>
      )}

      <div className="flex items-center gap-1">
        <IconButton label={copyLabel} disabled={!hasResult} onClick={handleCopy}>
          {copyState === 'copied' && <Check size={14} className="text-emerald-400" />}
          {copyState === 'failed' && <AlertCircle size={14} className="text-rose-400" />}
          {copyState === 'idle' && <Copy size={14} />}
        </IconButton>
        <IconButton label={t('content.regenerate')} disabled={isLoading} onClick={onRegenerate}>
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </IconButton>
        <IconButton
          label={t('content.openSettings')}
          onClick={() => { void sendRuntimeMessage({ action: 'OPEN_OPTIONS_PAGE' }).catch(() => {}); }}
        >
          <Settings size={14} />
        </IconButton>
        <IconButton label={t('common.openModelPicker')} title={t('content.chooseModel')} onClick={onOpenModelPicker}>
          <Cpu size={14} className="text-indigo-400" />
        </IconButton>
      </div>
    </div>
  );
};
