import React from 'react';
import { useOptions } from '../OptionsContext';
import { ProviderSelector } from '../ProviderSelector';
import { ApiKeyManager } from '../ApiKeyManager';
import { ModelSelector } from '../ModelSelector';
import { CustomProviderManager } from '../CustomProviderManager';

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

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
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
