import React, { useEffect, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { getTranslator } from '../../i18n';
import { getRuntimeErrorMessage, sendRuntimeMessage } from '../../services/extension-messaging';
import { Language } from '../../types';
import { getLanguageLabel } from './popup-theme';

export interface NativeTranslationSectionProps {
  language: Language;
  mode: 'rewrite' | 'improve';
  text: string;
  nativeLanguage: string;
  onTranslate?: (text: string) => Promise<string>;
}

export const NativeTranslationSection: React.FC<NativeTranslationSectionProps> = ({ language, mode, text, nativeLanguage, onTranslate }) => {
  const [open, setOpen] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const t = getTranslator(language);
  const languageName = language === 'vi'
    ? getLanguageLabel(t, nativeLanguage).toLocaleLowerCase('vi')
    : getLanguageLabel(t, nativeLanguage);
  const label = t(mode === 'improve' ? 'content.translateImprovedToNative' : 'content.translateRewrittenToNative', { language: languageName });

  useEffect(() => { setTranslation(null); setOpen(false); }, [text, nativeLanguage]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || translation || isTranslating || !text) return;
    setIsTranslating(true);
    try {
      if (onTranslate) {
        setTranslation(await onTranslate(text));
      } else {
        const response = await sendRuntimeMessage({
          action: 'EXECUTE_GEMINI',
          payload: { text, tone: 'translate_explain', targetLanguage: nativeLanguage, translateOnly: true },
        });
        setTranslation(response?.success && response.data
          ? (typeof response.data === 'string' ? response.data : response.data.translation)
          : t('common.unableTranslate'));
      }
    } catch (err: unknown) {
      setTranslation(t('content.translationError', { error: getRuntimeErrorMessage(err, t('common.unableConnect'), language) }));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-1.5 text-xs">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-label={open ? t('common.collapse') : label}
        className="w-full !justify-start !rounded-lg !px-1.5 !py-1 !text-indigo-400 [&>span:last-child]:flex-1"
        icon={<Languages size={13} />}
        onClick={handleToggle}
      >
        <span className="flex items-center justify-between gap-2">
          {label}
          <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </Button>
      {open && (
        <div className="border-t border-slate-800 px-1.5 pb-1 pt-2 leading-relaxed text-slate-300">
          {isTranslating ? (
            <Loader size="sm" text={t('content.translatingToNative', { language: languageName })} className="py-1" />
          ) : (
            <div className="whitespace-pre-wrap selection:bg-indigo-500/30">{translation || t('content.noNativeTranslation', { language: languageName })}</div>
          )}
        </div>
      )}
    </div>
  );
};
