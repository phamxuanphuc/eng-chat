import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useSettingsStore } from '../store/useSettingsStore';
import { getTranslator } from '../i18n';

export const App: React.FC = () => {
  const language = useSettingsStore((state) => state.settings.language);
  const t = getTranslator(language);

  React.useEffect(() => { useSettingsStore.getState().fetchSettings(); }, []);

  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  return (
    <div className="w-[380px] p-6 flex flex-col gap-6 font-sans bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3">
        <Logo size={36} />
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          {t('app.name')}
        </h1>
      </div>

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
        <p className="text-xs leading-relaxed text-slate-400">{t('app.version')}</p>
      </section>
    </div>
  );
};
