import React from 'react';
import { useOptions } from '../OptionsContext';
import { ProviderSelector } from '../ProviderSelector';
import { ApiKeyManager } from '../ApiKeyManager';
import { ModelSelector } from '../ModelSelector';
import { CustomProviderManager } from '../CustomProviderManager';
import { getTranslator } from '../../i18n';

export const AiProviderPage: React.FC = () => {
  const {
    language,
    provider,
    setProvider,
    apiKeys,
    setApiKeys,
    autoRotate,
    setAutoRotate,
    model,
    setModel,
    customBaseUrl,
    setCustomBaseUrl,
    customApiKey,
    setCustomApiKey,
    customModel,
    setCustomModel,
    handleSave,
  } = useOptions();
  const t = getTranslator(language);

  return (
    <div className="flex flex-col gap-7 animate-fadeIn">
      <div className="rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-950/45 via-slate-900/80 to-slate-950/80 p-5 shadow-xl shadow-indigo-950/15 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">{t('provider.heroTitle')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{t('provider.heroDescription')}</p>
          </div>
        </div>
      </div>
      <ProviderSelector language={language} provider={provider} onSelectProvider={setProvider} />

      {provider === 'gemini' ? (
        <>
          <ApiKeyManager
            language={language}
            apiKeys={apiKeys}
            onUpdateKeys={setApiKeys}
            autoRotate={autoRotate}
            onToggleAutoRotate={setAutoRotate}
            selectedModel={model}
            onSave={handleSave}
          />
          <ModelSelector language={language} selectedModel={model} onSelectModel={setModel} />
        </>
      ) : (
        <CustomProviderManager
          language={language}
          baseUrl={customBaseUrl}
          onUpdateBaseUrl={setCustomBaseUrl}
          apiKey={customApiKey}
          onUpdateApiKey={setCustomApiKey}
          model={customModel}
          onUpdateModel={setCustomModel}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
