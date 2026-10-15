import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiKeyItem } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { callGeminiApi } from '../services/gemini';
import { KeyRound, Sparkles, Plus, Trash2, Star, ExternalLink, Save } from 'lucide-react';

interface ApiKeyManagerProps {
  apiKeys: ApiKeyItem[];
  onUpdateKeys: (keys: ApiKeyItem[]) => void;
  autoRotate: boolean;
  onToggleAutoRotate: (val: boolean) => void;
  selectedModel: string;
  onSave?: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  apiKeys,
  onUpdateKeys,
  autoRotate,
  onToggleAutoRotate,
  selectedModel,
  onSave,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');

  const primaryKey = apiKeys[0]?.key || '';

  const handlePrimaryChange = (val: string) => {
    const trimmed = val.trim();
    if (apiKeys.length === 0) {
      if (trimmed) {
        onUpdateKeys([{ id: 'key-1', label: 'Primary key', key: trimmed }]);
      }
    } else {
      const updated = [...apiKeys];
      updated[0] = { ...updated[0], key: trimmed };
      onUpdateKeys(updated);
    }
  };

  const handleAddBackup = () => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    const newItem: ApiKeyItem = {
      id: `key-${Date.now()}`,
      label: newLabel.trim() || `Backup key ${apiKeys.length}`,
      key: trimmed,
    };
    onUpdateKeys([...apiKeys, newItem]);
    setNewLabel('');
    setNewKey('');
  };

  const handleRemoveKey = (id: string) => {
    onUpdateKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    const selected = apiKeys.find((k) => k.id === id);
    if (selected) {
      onUpdateKeys([selected, ...apiKeys.filter((k) => k.id !== id)]);
    }
  };

  const testMutation = useMutation({
    mutationFn: async () => {
      const keyToTest = primaryKey || newKey.trim();
      if (!keyToTest) throw new Error('Add at least one API key to test.');
      const res = await callGeminiApi({
        apiKey: keyToTest,
        model: selectedModel,
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
          <KeyRound size={16} className="text-indigo-400" /> Google AI API Key Management
        </h2>
        <Badge variant={apiKeys.length > 0 ? 'success' : 'warning'} size="sm">
          {apiKeys.length} {apiKeys.length <= 1 ? 'Keys' : 'Keys'}
        </Badge>
      </div>

      <Input
        label="Google Gemini API Key (Primary key)"
        type="password"
        placeholder="AIzaSy..."
        value={primaryKey}
        onChange={(e) => handlePrimaryChange(e.target.value)}
      />

      <div className="flex items-center justify-between text-xs px-0.5 text-slate-400">
        <span>No Google AI token yet?</span>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <span>Get a free token from Google AI Studio</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {apiKeys.length > 1 && (
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-medium text-slate-400">Saved keys:</span>
          {apiKeys.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Badge variant={idx === 0 ? 'success' : 'secondary'} size="sm">
                  {idx === 0 ? 'Primary' : 'Backup'}
                </Badge>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">{item.label}</span>
                  <span className="text-[11px] font-mono text-slate-500 truncate">
                    {item.key.slice(0, 7)}••••••••{item.key.slice(-4)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {idx !== 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Star size={12} className="text-amber-400" />}
                    onClick={() => handleSetPrimary(item.id)}
                  >
                    Make primary
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={12} className="text-rose-400" />}
                  onClick={() => handleRemoveKey(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-800 flex flex-col gap-3">
        <span className="text-xs font-medium text-slate-300">Add backup key (Multi-Key Failover)</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            label="Key name"
            placeholder="e.g. Backup 1, Personal..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <Input
            label="Backup API key"
            type="password"
            placeholder="Enter a backup key..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} className="text-indigo-400" />}
            disabled={!newKey.trim()}
            onClick={handleAddBackup}
          >
            Add backup key
          </Button>
        </div>
      </div>

      <Switch
        label="Automatically rotate keys after quota errors (Failover 429)"
        description="Automatically switch to the next backup API key when the primary key returns 429 or 401/403."
        checked={autoRotate}
        onChange={onToggleAutoRotate}
      />

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
        <Button
          variant="secondary"
          size="sm"
          icon={<Sparkles size={14} className="text-indigo-400" />}
          isLoading={testMutation.isPending}
          disabled={!primaryKey && !newKey.trim()}
          onClick={() => testMutation.mutate()}
        >
          Test connection
        </Button>
        {onSave && (
          <Button
            variant="primary"
            size="sm"
            icon={<Save size={14} />}
            disabled={!primaryKey && !newKey.trim()}
            onClick={onSave}
          >
            Save keys
          </Button>
        )}
      </div>
      {testMutation.isSuccess && (
        <Alert variant="success" message="Connection successful! The API key is working." />
      )}

      {testMutation.isError && (
        <Alert variant="error" message="Connection test failed" description={testMutation.error?.message} />
      )}
    </div>
  );
};
