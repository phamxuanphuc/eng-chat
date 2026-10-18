import React from 'react';
import { useOptions } from '../OptionsContext';
import { Switch } from '../../components/ui/Switch';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MessageSquare } from 'lucide-react';
import { getTranslator } from '../../i18n';

export const ContextPage: React.FC = () => {
  const { language, chatContext, setChatContext, maxContext, setMaxContext } = useOptions();
  const t = getTranslator(language);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-100">
          <MessageSquare size={18} className="text-indigo-400" /> {t('context.title')}
        </h2>
        <Badge variant={chatContext ? 'success' : 'secondary'} size="sm">
          {chatContext ? t('context.enabled') : t('context.disabled')}
        </Badge>
      </div>

      <Switch
        label={t('context.extract')}
        description={t('context.description')}
        checked={chatContext}
        onChange={setChatContext}
      />

      {chatContext && (
        <div className="mt-5 flex flex-col gap-4 border-t border-slate-800/80 pt-5">
          <Input
            label={t('context.max')}
            type="number"
            min={1}
            max={10}
            value={maxContext}
            onChange={(e) => setMaxContext(Math.max(1, Math.min(10, Number(e.target.value))))}
          />

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-950/45 p-3 ring-1 ring-slate-800/80">
            <span className="text-xs text-slate-400">{t('context.quick')}</span>
            {[2, 4, 6, 8].map((num) => (
              <Button
                key={num}
                type="button"
                variant={maxContext === num ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setMaxContext(num)}
              >
                {t('context.messages', { count: num })}
              </Button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
