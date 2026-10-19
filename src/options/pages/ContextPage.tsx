import React from 'react';
import { useOptions } from '../OptionsContext';
import { Switch } from '../../components/ui/Switch';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MessageSquare } from 'lucide-react';
import { getTranslator } from '../../i18n';
import { PageHeader } from '../PageHeader';

const QUICK_COUNTS = [2, 4, 6, 8];

export const ContextPage: React.FC = () => {
  const { language, chatContext, setChatContext, maxContext, setMaxContext } = useOptions();
  const t = getTranslator(language);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <PageHeader
        icon={<MessageSquare size={19} />}
        title={t('context.title')}
        aside={
          <Badge variant={chatContext ? 'success' : 'secondary'} size="sm">
            {chatContext ? t('context.enabled') : t('context.disabled')}
          </Badge>
        }
      />

      <Switch
        label={t('context.extract')}
        description={t('context.description')}
        checked={chatContext}
        onChange={setChatContext}
      />

      {chatContext && (
        <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-6">
          <Input
            label={t('context.max')}
            type="number"
            min={1}
            max={10}
            value={maxContext}
            onChange={(e) => setMaxContext(Math.max(1, Math.min(10, Number(e.target.value))))}
          />

          <div role="group" aria-label={t('context.quick')} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">{t('context.quick')}</span>
            {QUICK_COUNTS.map((num) => (
              <Button
                key={num}
                type="button"
                variant={maxContext === num ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={maxContext === num}
                onClick={() => setMaxContext(num)}
              >
                {t('context.messages', { count: num })}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
