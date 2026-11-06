import React from 'react';
import { CheckCircle2, Keyboard, Settings } from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useSettingsStore } from '../store/useSettingsStore';
import { getTranslator } from '../i18n';

const getVersion = () => {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return __APP_VERSION__;
  }
};

const getShortcut = () => (/mac/i.test(navigator.platform) ? '⌘⇧E' : 'Ctrl+Shift+E');

export const App: React.FC = () => {
  const settings = useSettingsStore((state) => state.settings);
  const hasLoaded = useSettingsStore((state) => state.hasLoaded);
  const t = getTranslator(settings.language);
  const isGemini = (settings.llmProvider || 'gemini') === 'gemini';
  const isConfigured = isGemini
    ? !!settings.geminiApiKey?.trim() || !!settings.apiKeys?.some((item) => item.key.trim())
    : !!settings.customModel?.trim();
  const activeModel = isGemini ? settings.selectedModel : settings.customModel;

  React.useEffect(() => { useSettingsStore.getState().fetchSettings(); }, []);
  React.useEffect(() => { document.documentElement.lang = settings.language || 'en'; }, [settings.language]);

  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  return (
    <div className="flex w-[380px] flex-col gap-5 bg-slate-950 p-6 font-sans text-slate-100">
      <div className="flex items-center gap-3">
        <Logo size={36} />
        <h1 className="text-lg font-bold tracking-tight text-slate-100">{t('app.name')}</h1>
      </div>

      {hasLoaded && !isConfigured && (
        <Alert variant="warning" message={t('app.noKeyTitle')} description={t('app.noKeyDescription')} />
      )}
      {hasLoaded && isConfigured && (
        <p role="status" className="flex items-center gap-2 text-xs text-slate-300">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
          <span className="min-w-0 truncate">{t('app.ready', { model: activeModel || '' })}</span>
        </p>
      )}

      <Button
        variant="primary"
        size="md"
        icon={<Settings size={16} />}
        onClick={openOptions}
        aria-label={t('app.openSettings')}
      >
        {t('app.openSettings')}
      </Button>

      <section className="flex flex-col gap-2 border-t border-slate-800 pt-4" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-sm font-semibold text-slate-200">{t('app.about')}</h2>
        <p className="text-xs leading-relaxed text-slate-400">{t('app.description')}</p>
        <p className="text-xs leading-relaxed text-slate-400">{t('app.optionsDescription')}</p>
        <p className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
          <span>{t('app.version', { version: getVersion() })}</span>
          <span className="inline-flex items-center gap-1.5">
            <Keyboard size={13} aria-hidden="true" />
            {t('app.shortcut', { keys: getShortcut() })}
          </span>
        </p>
      </section>
    </div>
  );
};
