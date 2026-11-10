import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useOptions } from './OptionsContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Logo } from '../components/ui/Logo';
import { AlertCircle, Check, CircleDot, Save, MessageSquare, Palette, Cpu, EyeOff } from 'lucide-react';
import { getTranslator } from '../i18n';
import { getServerHost } from '../services/host-permission';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

const NAV_ITEMS = [
  { path: '/', labelKey: 'options.aiProvider' as const, icon: Cpu },
  { path: '/tone', labelKey: 'options.writingStyle' as const, icon: Palette },
  { path: '/context', labelKey: 'options.context' as const, icon: MessageSquare },
  { path: '/sites', labelKey: 'options.hiddenSites' as const, icon: EyeOff },
];

export const OptionsLayout: React.FC = () => {
  const { language, setLanguage, isReady, isDirty, saveSuccess, saveError, permissionDenied, customBaseUrl, handleSave } = useOptions();
  const t = getTranslator(language);
  const { pathname } = useLocation();
  const showSaveBar = pathname !== '/sites' || isDirty;
  const status = permissionDenied
    ? { Icon: AlertCircle, tone: 'text-rose-400', text: t('options.permissionDenied', { server: getServerHost(customBaseUrl) }) }
    : saveError
    ? { Icon: AlertCircle, tone: 'text-rose-400', text: t('options.saveFailed') }
    : saveSuccess
    ? { Icon: Check, tone: 'text-emerald-400', text: t('options.savedBrowser', { settings: t('app.settings') }) }
    : isDirty
    ? { Icon: CircleDot, tone: 'text-amber-400', text: t('options.unsaved') }
    : isReady
    ? { Icon: Check, tone: 'text-slate-400', text: t('options.allSaved') }
    : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Logo size={38} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-100">VinaWrite</h1>
                <Badge variant="primary" size="sm">{t('app.settings')}</Badge>
              </div>
              <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">{t('options.subtitle')}</p>
            </div>
          </div>

          <nav aria-label={t('app.settings')} className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-1 text-xs [scrollbar-width:none] md:order-2 md:w-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex min-w-max flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 transition-colors ${
                      isActive
                        ? 'bg-indigo-500/15 font-semibold text-indigo-200 ring-1 ring-indigo-400/30'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon size={14} />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="order-2 flex shrink-0 items-center justify-end gap-2 md:order-3">
            <LanguageToggle language={language} onChange={setLanguage} />
            <ThemeToggle language={language} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
        <Outlet />
        {showSaveBar && (
          <div className="sticky bottom-4 z-30 mt-auto flex items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/95 p-3 pl-4 shadow-xl shadow-slate-950/50 backdrop-blur-xl sm:px-5">
            <div role="status" aria-live="polite" className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
              {status && (
                <>
                  <status.Icon size={15} className={`shrink-0 ${status.tone}`} />
                  <span className="min-w-0">{status.text}</span>
                </>
              )}
            </div>
            <Button
              variant={isDirty ? 'primary' : 'secondary'}
              size="md"
              className="shrink-0 whitespace-nowrap"
              icon={saveSuccess ? <Check size={16} /> : <Save size={16} />}
              onClick={handleSave}
            >
              {saveSuccess ? t('options.saved') : t('options.saveSettings')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
