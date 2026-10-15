import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { callOpenAiApi } from '../services/openai';
import { Server, Sparkles, Save } from 'lucide-react';

interface CustomProviderManagerProps {
  baseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
  model: string;
  onUpdateModel: (model: string) => void;
  onSave?: () => void;
}

export const CustomProviderManager: React.FC<CustomProviderManagerProps> = ({
  baseUrl,
  onUpdateBaseUrl,
  apiKey,
  onUpdateApiKey,
  model,
  onUpdateModel,
  onSave,
}) => {
  const testMutation = useMutation({
    mutationFn: async () => {
      if (!model.trim()) throw new Error('Enter a model name.');
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
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Server size={16} className="text-indigo-400" /> Custom LLM Configuration (OpenAI Compatible)
        </h2>
        <Badge variant={model.trim() ? 'success' : 'warning'} size="sm">
          {model.trim() || 'No model selected'}
        </Badge>
      </div>

      <Input
        label="Base URL (Endpoint)"
        placeholder="https://api.openai.com/v1"
        value={baseUrl}
        onChange={(e) => onUpdateBaseUrl(e.target.value)}
      />

      <Input
        label="API Key (Access key)"
        type="password"
        placeholder="sk-... (leave blank for local Ollama/LM Studio)"
        value={apiKey}
        onChange={(e) => onUpdateApiKey(e.target.value)}
      />

      <Input
        label="Model Name"
        placeholder="e.g. gpt-4o-mini, deepseek-chat, llama3.2..."
        value={model}
        onChange={(e) => onUpdateModel(e.target.value)}
      />

      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
        💡 Supports <strong className="text-indigo-300">OpenAI Chat Completions</strong>. The system automatically calls <code className="text-slate-300">/chat/completions</code> and passes the bearer token (when available).
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
          Test connection
        </Button>
        {onSave && (
          <Button
            variant="primary"
            size="sm"
            icon={<Save size={14} />}
            disabled={!model.trim()}
            onClick={onSave}
          >
            Save Configuration
          </Button>
        )}
      </div>

      {testMutation.isSuccess && (
        <Alert variant="success" message="Connection successful! The LLM provider responded." />
      )}

      {testMutation.isError && (
        <Alert variant="error" message="Connection test failed" description={testMutation.error?.message} />
      )}
    </div>
  );
};
