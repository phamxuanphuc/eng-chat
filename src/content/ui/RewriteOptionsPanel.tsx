import React, { useState } from 'react';
import { RewriteOptions, Language } from '../../types';
import { FileText, Sparkles, Smile, X, Plus, Check, LucideIcon } from 'lucide-react';
import { saveSelectedStyle } from './style-preference';
import { getTranslator, TranslationKey } from '../../i18n';
import { Chip } from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { useEscape } from '../../components/ui/useDismiss';
import enDictionary from '../../i18n/en.json';

export interface RewriteOptionsPanelProps {
  language?: Language;
  options: RewriteOptions;
  onChange: (options: RewriteOptions) => void;
  onClose: () => void;
}

export const LENGTH_OPTIONS = ['Auto', 'Short', 'Medium', 'Long'] as const;
export const FORMALITY_OPTIONS = ['Auto', 'Casual', 'Neutral', 'Formal'] as const;
export const BASE_FORMAT_OPTIONS = [
  'Auto', 'Email', 'Message', 'Comment', 'Paragraph', 'Article',
  'Blog Post', 'Ideas', 'Outline', 'Twitter', 'Reddit', 'Facebook', 'LinkedIn',
];
export const BASE_TONE_OPTIONS = [
  'Auto', 'Enthusiastic', 'Humorous', 'Concerned', 'Humble',
  'Optimistic', 'Empathetic', 'Candid', 'Sincere',
];

export const RewriteOptionsPanel: React.FC<RewriteOptionsPanelProps> = ({
  language = 'en',
  options,
  onChange,
  onClose,
}) => {
  const [formatList, setFormatList] = useState<string[]>(BASE_FORMAT_OPTIONS);
  const [toneList, setToneList] = useState<string[]>(BASE_TONE_OPTIONS);
  const [adding, setAdding] = useState<'format' | 'tone' | null>(null);
  const [draft, setDraft] = useState('');
  const t = getTranslator(language);

  useEscape(true, () => {
    if (adding) setAdding(null);
    else onClose();
  });

  const getOptionLabel = (value: string) => {
    const key = `rewrite.option.${value}`;
    return key in enDictionary ? t(key as TranslationKey) : value;
  };

  const handleSelect = (key: keyof RewriteOptions, value: string) => {
    onChange({ ...options, [key]: value });
    if (key === 'tone') saveSelectedStyle(value);
  };

  const handleAddCustom = (key: 'format' | 'tone') => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const setList = key === 'format' ? setFormatList : setToneList;
    setList((list) => (list.includes(trimmed) ? list : [...list, trimmed]));
    handleSelect(key, trimmed);
    setDraft('');
    setAdding(null);
  };

  const renderGroup = (
    key: keyof RewriteOptions,
    Icon: LucideIcon,
    heading: string,
    items: readonly string[],
    extra?: React.ReactNode,
  ) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon size={15} className="text-indigo-400" />
        <span>{heading}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Chip key={item} selected={(options[key] || 'Auto') === item} onClick={() => handleSelect(key, item)}>
            {getOptionLabel(item)}
          </Chip>
        ))}
        {extra}
      </div>
    </div>
  );

  const renderAddControl = (key: 'format' | 'tone', placeholder: string, addLabel: string) =>
    adding === key ? (
      <form
        className="inline-flex items-center gap-1"
        onSubmit={(event) => { event.preventDefault(); handleAddCustom(key); }}
      >
        <div className="w-28">
          <Input
            autoFocus
            aria-label={addLabel}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            className="!rounded-xl !px-2 !py-1 !text-xs"
          />
        </div>
        <IconButton type="submit" label={addLabel}>
          <Check size={13} className="text-indigo-400" />
        </IconButton>
      </form>
    ) : (
      <Chip dashed icon={<Plus size={12} />} onClick={() => { setDraft(''); setAdding(key); }}>
        {addLabel}
      </Chip>
    );

  return (
    <div
      role="region"
      aria-label={t('common.rewriteStyleOptions')}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <span className="text-xs font-semibold text-slate-300">{t('content.styleOptions')}</span>
        <IconButton label={t('content.closeOptions')} onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {renderGroup('length', FileText, t('content.length'), LENGTH_OPTIONS)}
        {renderGroup('formality', Sparkles, t('content.formality'), FORMALITY_OPTIONS)}
        {renderGroup('format', FileText, t('content.format'), formatList, renderAddControl('format', t('content.formatPlaceholder'), t('content.addFormat')))}
        {renderGroup('tone', Smile, t('content.tone'), toneList, renderAddControl('tone', t('content.tonePlaceholder'), t('content.addTone')))}
      </div>
    </div>
  );
};
