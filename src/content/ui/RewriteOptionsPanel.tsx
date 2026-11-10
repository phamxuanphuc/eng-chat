import React, { useEffect, useState } from 'react';
import { RewriteOptions, Language, DEFAULT_REWRITE_OPTIONS } from '../../types';
import { FileText, Sparkles, Smile, X, Plus, Check, LucideIcon } from 'lucide-react';
import { loadCustomRewriteOptions, saveCustomRewriteOptions } from '../custom-rewrite-options';
import { getTranslator, TranslationKey } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { useEscape } from '../../components/ui/useDismiss';
import { CustomRewriteOptions, EMPTY_CUSTOM_OPTIONS } from '../custom-rewrite-options';
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
  const [custom, setCustom] = useState<CustomRewriteOptions>(EMPTY_CUSTOM_OPTIONS);
  const [adding, setAdding] = useState<'format' | 'tone' | null>(null);
  const [customName, setCustomName] = useState('');
  const [draft, setDraft] = useState<RewriteOptions>(options);
  const t = getTranslator(language);
  const unchanged = (Object.keys(draft) as Array<keyof RewriteOptions>).every((key) => draft[key] === options[key]);
  const formatList = [...BASE_FORMAT_OPTIONS, ...custom.format.filter((item) => !BASE_FORMAT_OPTIONS.includes(item))];
  const toneList = [...BASE_TONE_OPTIONS, ...custom.tone.filter((item) => !BASE_TONE_OPTIONS.includes(item))];

  useEffect(() => {
    let active = true;
    void loadCustomRewriteOptions().then((loaded) => {
      if (active) setCustom(loaded);
    });
    return () => { active = false; };
  }, []);

  useEscape(true, () => {
    if (adding) setAdding(null);
    else onClose();
  });

  const getOptionLabel = (value: string) => {
    const key = `rewrite.option.${value}`;
    return key in enDictionary ? t(key as TranslationKey) : value;
  };

  const handleSelect = (key: keyof RewriteOptions, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleAddCustom = (key: 'format' | 'tone') => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const base = key === 'format' ? BASE_FORMAT_OPTIONS : BASE_TONE_OPTIONS;
    if (!base.includes(trimmed) && !custom[key].includes(trimmed)) {
      const next = { ...custom, [key]: [...custom[key], trimmed] };
      setCustom(next);
      void saveCustomRewriteOptions(next);
    }
    handleSelect(key, trimmed);
    setCustomName('');
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
          <Chip key={item} selected={(draft[key] || 'Auto') === item} onClick={() => handleSelect(key, item)}>
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
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder={placeholder}
            className="!rounded-xl !px-2 !py-1 !text-xs"
          />
        </div>
        <IconButton type="submit" label={addLabel}>
          <Check size={13} className="text-indigo-400" />
        </IconButton>
      </form>
    ) : (
      <Chip dashed icon={<Plus size={12} />} onClick={() => { setCustomName(''); setAdding(key); }}>
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

      <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => setDraft({ ...DEFAULT_REWRITE_OPTIONS })}>
          {t('content.resetOptions')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={unchanged}
          onClick={() => { onChange(draft); onClose(); }}
        >
          {t('content.applyOptions')}
        </Button>
      </div>
    </div>
  );
};
