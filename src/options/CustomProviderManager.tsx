import React from 'react';
import { Language } from '../types';
import { getTranslator } from '../i18n';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { callOpenAiApi } from '../services/openai';
import { Server, Sparkles, Save } from 'lucide-react';

interface CustomProviderManagerProps {
  language?: Language;
  baseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
  model: string;
  onUpdateModel: (model: string) => void;
  onSave?: () => void;
}

export const CustomProviderManager: React.FC<CustomProviderManagerProps> = ({
  language,
  baseUrl,
  onUpdateBaseUrl,
  apiKey,
  onUpdateApiKey,
  model,
  onUpdateModel,
  onSave,
}) => {
  const t = getTranslator(language || 'en');
  const testMutation = useMutation({
    mutationFn: async () => {
      if (!model.trim()) throw new Error(t('custom.missingModel'));
      const res = await callOpenAiApi({
        baseUrl: baseUrl.trim() || 'https://api.openai.com/v1',
        apiKey: apiKey.trim(),
        model: model.trim(),
        systemInstruction: 'You are a test helper. Reply with single word "OK".',
        prompt: 'Ping',
      });
      if (onSave) onSave();
      return res;
    },
  });

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-100">
          <Server size={16} className="text-indigo-400" /> {t('custom.title')}
        </h2>
        <Badge variant={model.trim() ? 'success' : 'warning'} size="sm">
          {model.trim() || t('custom.noModel')}
        </Badge>
      </div>

      <Input
        label={t('custom.baseUrl')}
        placeholder="https://api.openai.com/v1"
        value={baseUrl}
        onChange={(e) => onUpdateBaseUrl(e.target.value)}
      />

      <Input
        label={t('custom.apiKey')}
        type="password"
        placeholder="sk-... (leave blank for local Ollama/LM Studio)"
        value={apiKey}
        onChange={(e) => onUpdateApiKey(e.target.value)}
      />

      <Input
        label={t('custom.modelName')}
        placeholder="e.g. gpt-4o-mini, deepseek-chat, llama3.2..."
        value={model}
        onChange={(e) => onUpdateModel(e.target.value)}
      />

      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
        💡 {t('custom.help')}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <Button
          variant="secondary"
          size="sm"
          icon={<Sparkles size={14} className="text-indigo-400" />}
          isLoading={testMutation.isPending}
          disabled={!model.trim()}
          onClick={() => testMutation.mutate()}
        >
          {t('api.testConnection')}
        </Button>
        {onSave && (
          <Button
            variant="primary"
            size="sm"
            icon={<Save size={14} />}
            disabled={!model.trim()}
            onClick={onSave}
          >
            {t('custom.save')}
          </Button>
        )}
      </div>

      {testMutation.isSuccess && (
        <Alert variant="success" message={t('custom.connectionSuccess')} />
      )}

      {testMutation.isError && (
        <Alert variant="error" message={t('api.connectionFailed')} description={testMutation.error?.message} />
      )}
    </section>
  );
};
