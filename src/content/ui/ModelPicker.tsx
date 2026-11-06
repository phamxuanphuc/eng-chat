import React, { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw, Star, X } from 'lucide-react';
import { AppSettings, Language, LLMProvider } from '../../types';
import { GEMINI_MODELS } from '../../options/ModelSelector';
import { loadSettings, saveSettings } from '../../services/storage';
import { getTranslator } from '../../i18n';
import { sendRuntimeMessage } from '../../services/extension-messaging';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { IconButton } from '../../components/ui/IconButton';
import { Loader } from '../../components/ui/Loader';
import { useDismiss } from '../../components/ui/useDismiss';

interface ModelPickerProps {
  language?: Language;
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

export const ModelPicker: React.FC<ModelPickerProps> = ({ language = 'en', onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const t = getTranslator(language);

  useDismiss(panelRef, true, onClose);

  useEffect(() => {
    getSettings()
      .then((loaded) => {
        setSettings(loaded);
        setProvider(loaded.llmProvider || 'gemini');
        setSelectedModel((loaded.llmProvider || 'gemini') === 'gemini' ? loaded.selectedModel : (loaded.customModel || ''));
      })
      .catch((err: any) => setError(err?.message || t('content.unableLoadConfig')))
      .finally(() => setIsLoading(false));
  }, []);

  const fetchCustomModels = async () => {
    if (!settings) return;
    setIsFetchingModels(true);
    setError(null);
    try {
      const response = await sendRuntimeMessage<{ success: boolean; models?: string[]; error?: string }>({ action: 'FETCH_CUSTOM_MODELS' });
      if (!response?.success) throw new Error(response?.error || t('content.unableLoadModels'));
      const models = response.models || [];
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
    try {
      setSettings(await persistSettings(partial));
      setProvider(nextProvider);
      setSelectedModel(model);
    } catch (err: any) {
      setError(err?.message || t('content.unableLoadConfig'));
    }
  };

  const activeModel = selectedModel || (provider === 'gemini' ? settings?.selectedModel : settings?.customModel);

  const renderModel = (nextProvider: LLMProvider, id: string, name: string) => (
    <Button
      key={id}
      variant="ghost"
      size="sm"
      aria-pressed={activeModel === id}
      className="w-full !justify-between !rounded-lg !px-2.5 !py-2 text-left font-normal [&>span:last-child]:flex [&>span:last-child]:w-full [&>span:last-child]:items-center [&>span:last-child]:justify-between [&>span:last-child]:gap-2"
      onClick={() => selectModel(nextProvider, id)}
    >
      <span className="truncate">{name}</span>
      {activeModel === id && <Check size={14} className="shrink-0 text-indigo-400" />}
    </Button>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-end p-3">
      <div
        ref={panelRef}
        role="dialog"
        aria-label={t('content.modelPickerDialog')}
        className="pointer-events-auto mt-12 w-[min(350px,calc(100vw-24px))] animate-popIn rounded-2xl border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Star size={15} className="fill-amber-400 text-amber-400" /> {t('content.chooseModelTitle')}
          </div>
          <IconButton label={t('content.close')} onClick={onClose}>
            <X size={15} />
          </IconButton>
        </div>

        {isLoading ? (
          <Loader size="sm" text={t('content.loading')} className="py-3" />
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-1">
              {(['gemini', 'openai_compatible'] as const).map((item) => (
                <Chip
                  key={item}
                  selected={provider === item}
                  className="justify-center"
                  onClick={() => {
                    setProvider(item);
                    setSelectedModel(item === 'gemini' ? (settings?.selectedModel || '') : (settings?.customModel || ''));
                    setError(null);
                  }}
                >
                  {item === 'gemini' ? 'Gemini' : t('content.customProvider')}
                </Chip>
              ))}
            </div>

            {provider === 'gemini' ? (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {GEMINI_MODELS.map((model) => renderModel('gemini', model.id, model.name))}
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mb-2"
                  disabled={isFetchingModels}
                  icon={<RefreshCw size={13} className={isFetchingModels ? 'animate-spin' : ''} />}
                  onClick={fetchCustomModels}
                >
                  {isFetchingModels ? t('content.loadingModels') : t('content.loadModels')}
                </Button>
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {customModels.map((model) => renderModel('openai_compatible', model, model))}
                </div>
                {!customModels.length && !error && <p className="text-xs text-slate-400">{t('content.loadBaseUrl')}</p>}
              </>
            )}
            {error && <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};
