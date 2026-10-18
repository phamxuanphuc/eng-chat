import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { ApiKeyItem, ToneType, LLMProvider, Language } from '../types';

export interface OptionsContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
  apiKeys: ApiKeyItem[];
  setApiKeys: (keys: ApiKeyItem[] | ((prev: ApiKeyItem[]) => ApiKeyItem[])) => void;
  autoRotate: boolean;
  setAutoRotate: (v: boolean | ((prev: boolean) => boolean)) => void;
  model: string;
  setModel: (m: string) => void;
  customBaseUrl: string;
  setCustomBaseUrl: (url: string) => void;
  customApiKey: string;
  setCustomApiKey: (k: string) => void;
  customModel: string;
  setCustomModel: (m: string) => void;
  tone: ToneType;
  setTone: (t: ToneType) => void;
  tonePrompts: Partial<Record<ToneType, string>>;
  setTonePrompt: (prompt: string) => void;
  chatContext: boolean;
  setChatContext: (v: boolean | ((prev: boolean) => boolean)) => void;
  maxContext: number;
  setMaxContext: (n: number | ((prev: number) => number)) => void;
  saveSuccess: boolean;
  saveError: boolean;
  handleSave: () => Promise<void>;
}

const OptionsContext = createContext<OptionsContextValue | null>(null);

export const OptionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const [language, setLanguage] = useState<Language>('en');
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [model, setModel] = useState('gemini-3.5-flash-lite');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://api.openai.com/v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('gpt-4o-mini');
  const [tone, setTone] = useState<ToneType>('professional');
  const [tonePrompts, setTonePrompts] = useState<Partial<Record<ToneType, string>>>({});
  const [chatContext, setChatContext] = useState(true);
  const [maxContext, setMaxContext] = useState(4);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings && !isInitialized) {
      setLanguage(settings.language || 'en');
      setProvider(settings.llmProvider || 'gemini');
      const keys = settings.apiKeys && settings.apiKeys.length > 0
        ? settings.apiKeys
        : settings.geminiApiKey
        ? [{ id: 'key-1', label: 'Primary key', key: settings.geminiApiKey }]
        : [];
      setApiKeys(keys);
      setAutoRotate(settings.autoRotateKeys ?? true);
      setModel(settings.selectedModel || 'gemini-3.5-flash-lite');
      setCustomBaseUrl(settings.customBaseUrl || 'https://api.openai.com/v1');
      setCustomApiKey(settings.customApiKey || '');
      setCustomModel(settings.customModel || 'gpt-4o-mini');
      setTone(settings.defaultTone || 'professional');
      setTonePrompts(settings.tonePrompts || {});
      setChatContext(settings.enableChatContext ?? true);
      setMaxContext(settings.maxContextMessages ?? 4);
      setIsInitialized(true);
    }
  }, [settings, isInitialized]);

  const handleSave = async () => {
    const saved = await updateSettings({
      language,
      llmProvider: provider,
      geminiApiKey: apiKeys[0]?.key || '',
      apiKeys,
      autoRotateKeys: autoRotate,
      selectedModel: model,
      customBaseUrl,
      customApiKey,
      customModel,
      defaultTone: tone,
      tonePrompts,
      enableChatContext: chatContext,
      maxContextMessages: Number(maxContext) || 4,
    });
    setSaveError(!saved);
    if (!saved) return;
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <OptionsContext.Provider
      value={{
        language, setLanguage,
        provider, setProvider,
        apiKeys, setApiKeys,
        autoRotate, setAutoRotate,
        model, setModel,
        customBaseUrl, setCustomBaseUrl,
        customApiKey, setCustomApiKey,
        customModel, setCustomModel,
        tone, setTone,
        tonePrompts,
        setTonePrompt: (prompt) => setTonePrompts((current) => ({ ...current, [tone]: prompt })),
        chatContext, setChatContext,
        maxContext, setMaxContext,
        saveSuccess, saveError, handleSave,
      }}
    >
      {children}
    </OptionsContext.Provider>
  );
};

export const useOptions = (): OptionsContextValue => {
  const ctx = useContext(OptionsContext);
  if (!ctx) throw new Error('useOptions must be used within OptionsProvider');
  return ctx;
};
