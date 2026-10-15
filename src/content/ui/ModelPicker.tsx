import React, { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, Star, X } from 'lucide-react';
import { AppSettings, LLMProvider } from '../../types';
import { GEMINI_MODELS } from '../../options/ModelSelector';
import { fetchOpenAiModels } from '../../services/openai';
import { loadSettings, saveSettings } from '../../services/storage';

interface ModelPickerProps {
  theme: 'light' | 'dark';
  onClose: () => void;
}

const getSettings = async (): Promise<AppSettings> => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const response = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
    if (response) return response as AppSettings;
  }
  return loadSettings();
};

const persistSettings = async (partial: Partial<AppSettings>) => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const response = await chrome.runtime.sendMessage({ action: 'SAVE_SETTINGS', payload: partial });
    if (response?.success) return response.settings as AppSettings;
  }
  return saveSettings(partial);
};

export const ModelPicker: React.FC<ModelPickerProps> = ({ theme, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    getSettings()
      .then((loaded) => {
        setSettings(loaded);
        setProvider(loaded.llmProvider || 'gemini');
      })
      .catch((err: any) => setError(err?.message || 'Không thể tải cấu hình.'))
      .finally(() => setIsLoading(false));
  }, []);

  const fetchCustomModels = async () => {
    if (!settings) return;
    setIsFetchingModels(true);
    setError(null);
    try {
      const models = await fetchOpenAiModels({
        baseUrl: settings.customBaseUrl,
        apiKey: settings.customApiKey,
      });
      setCustomModels(models);
      if (models.length === 0) setError('Nhà cung cấp không trả về model nào.');
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách model.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const selectModel = async (nextProvider: LLMProvider, model: string) => {
    if (!settings) return;
    const partial: Partial<AppSettings> = nextProvider === 'gemini'
      ? { llmProvider: 'gemini', selectedModel: model }
      : { llmProvider: 'openai_compatible', customModel: model };
    const updated = await persistSettings(partial);
    setSettings(updated);
    setProvider(nextProvider);
  };

  const activeModel = provider === 'gemini'
    ? settings?.selectedModel
    : settings?.customModel;
  const panelClass = isLight
    ? 'bg-white border-slate-200 text-slate-800'
    : 'bg-slate-900 border-slate-700 text-slate-100';
  const mutedClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const itemClass = isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800';

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-end p-3 pointer-events-none">
      <div className={`pointer-events-auto w-[min(350px,calc(100vw-24px))] rounded-2xl border shadow-2xl p-3 ${panelClass}`} role="dialog" aria-label="LLM model picker">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Star size={15} className="text-amber-400 fill-amber-400" /> Chọn model AI</div>
          <button type="button" onClick={onClose} aria-label="Close model picker" className={`p-1 rounded-lg ${mutedClass} ${itemClass}`}><X size={15} /></button>
        </div>

        {isLoading ? (
          <div className={`flex items-center gap-2 text-xs ${mutedClass}`}><Loader2 size={14} className="animate-spin" /> Đang tải cấu hình...</div>
        ) : (
          <>
            <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl mb-3 ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
              {(['gemini', 'openai_compatible'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setProvider(item); setError(null); }}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium ${provider === item ? 'bg-indigo-600 text-white' : mutedClass}`}
                >
                  {item === 'gemini' ? 'Gemini' : 'Custom provider'}
                </button>
              ))}
            </div>

            {provider === 'gemini' ? (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {GEMINI_MODELS.map((model) => (
                  <button key={model.id} type="button" onClick={() => selectModel('gemini', model.id)} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${itemClass}`}>
                    <span>{model.name}</span>
                    {activeModel === model.id && <Check size={14} className="text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button type="button" onClick={fetchCustomModels} disabled={isFetchingModels} className={`flex items-center gap-1.5 text-xs text-indigo-400 mb-2 disabled:opacity-60`}>
                  <RefreshCw size={13} className={isFetchingModels ? 'animate-spin' : ''} /> {isFetchingModels ? 'Đang tải model...' : 'Tải danh sách model'}
                </button>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {customModels.map((model) => (
                    <button key={model} type="button" onClick={() => selectModel('openai_compatible', model)} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${itemClass}`}>
                      <span className="truncate">{model}</span>
                      {activeModel === model && <Check size={14} className="text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
                {!customModels.length && !error && <p className={`text-xs ${mutedClass}`}>Tải danh sách model từ Base URL đã cấu hình.</p>}
              </>
            )}
            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};
