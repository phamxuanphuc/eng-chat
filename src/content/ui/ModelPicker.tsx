import React, { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, Star, X } from 'lucide-react';
import { AppSettings, LLMProvider } from '../../types';
import { GEMINI_MODELS } from '../../options/ModelSelector';
import { fetchOpenAiModels } from '../../services/openai';
import { loadSettings, saveSettings } from '../../services/storage';
import { Language } from '../../types';
import { getTranslator } from '../../i18n';
import { sendRuntimeMessage } from '../../services/extension-messaging';

interface ModelPickerProps {
  language?: Language;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const getSettings = async (): Promise<AppSettings> => {
  try {
    const response = await sendRuntimeMessage({ action: 'GET_SETTINGS' });
    if (response) return response as AppSettings;
  } catch (error) {
    if (!error || !(error instanceof Error) || !error.message.includes('reload this page')) throw error;
  }
  return loadSettings();
};

const persistSettings = async (partial: Partial<AppSettings>) => {
  try {
    const response = await sendRuntimeMessage({ action: 'SAVE_SETTINGS', payload: partial });
    if (response?.success) return response.settings as AppSettings;
  } catch (error) {
    if (!error || !(error instanceof Error) || !error.message.includes('reload this page')) throw error;
  }
  return saveSettings(partial);
};

export const ModelPicker: React.FC<ModelPickerProps> = ({ language = 'en', theme, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLight = theme === 'light';
  const t = getTranslator(language);

  useEffect(() => {
    getSettings()
      .then((loaded) => {
        setSettings(loaded);
        setProvider(loaded.llmProvider || 'gemini');
      })
      .catch((err: any) => setError(err?.message || t('content.unableLoadConfig')))
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
      if (models.length === 0) setError(t('content.noModels'));
    } catch (err: any) {
      setError(err?.message || t('content.unableLoadModels'));
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
      <div className={`pointer-events-auto w-[min(350px,calc(100vw-24px))] rounded-2xl border shadow-2xl p-3 ${panelClass}`} role="dialog" aria-label={t('content.modelPickerDialog')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Star size={15} className="text-amber-400 fill-amber-400" /> {t('content.chooseModelTitle')}</div>
          <button type="button" onClick={onClose} aria-label={t('content.close')} className={`p-1 rounded-lg ${mutedClass} ${itemClass}`}><X size={15} /></button>
        </div>

        {isLoading ? (
          <div className={`flex items-center gap-2 text-xs ${mutedClass}`}><Loader2 size={14} className="animate-spin" /> {t('content.loading')}</div>
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
                  {item === 'gemini' ? 'Gemini' : t('content.customProvider')}
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
                  <RefreshCw size={13} className={isFetchingModels ? 'animate-spin' : ''} /> {isFetchingModels ? t('content.loadingModels') : t('content.loadModels')}
                </button>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {customModels.map((model) => (
                    <button key={model} type="button" onClick={() => selectModel('openai_compatible', model)} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${itemClass}`}>
                      <span className="truncate">{model}</span>
                      {activeModel === model && <Check size={14} className="text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
                {!customModels.length && !error && <p className={`text-xs ${mutedClass}`}>{t('content.loadBaseUrl')}</p>}
              </>
            )}
            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};
