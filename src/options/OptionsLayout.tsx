import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useOptions } from './OptionsContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Check, Save, MessageSquare, Palette, Cpu, Sparkles, ArrowUpRight } from 'lucide-react';
import { getTranslator } from '../i18n';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

const NAV_ITEMS = [
  { path: '/', labelKey: 'options.aiProvider' as const, icon: Cpu },
  { path: '/tone', labelKey: 'options.writingStyle' as const, icon: Palette },
  { path: '/context', labelKey: 'options.context' as const, icon: MessageSquare },
];

export const OptionsLayout: React.FC = () => {
  const { language, setLanguage, saveSuccess, saveError, handleSave } = useOptions();
  const t = getTranslator(language);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/25 shadow-lg shadow-indigo-950/40">
              <Sparkles size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-100">EngChat AI</h1>
                <Badge variant="primary" size="sm">{t('app.settings')}</Badge>
              </div>
              <p className="mt-0.5 hidden truncate text-[11px] text-slate-400 sm:block">{t('options.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageToggle language={language} onChange={setLanguage} />
            <ThemeToggle language={language} />
            {saveSuccess && (
              <Badge variant="success" size="sm" icon={<Check size={12} />}>
                {t('options.saved')}
              </Badge>
            )}
          </div>

          <nav aria-label={t('app.settings')} className="order-last flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-1 text-xs sm:order-none sm:w-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex min-w-max flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 font-semibold text-indigo-200 ring-1 ring-indigo-400/30 shadow-sm shadow-indigo-950/50'
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
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          <span className="h-px w-6 bg-indigo-400/60" />
          <span>{t('app.settings')}</span>
        </div>
        {saveSuccess && (
          <Alert variant="success" message={t('options.savedBrowser', { settings: t('app.settings') })} />
        )}
        {saveError && <Alert variant="error" message={t('options.saveFailed')} />}
        <Outlet />
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-400/20 bg-slate-900/95 p-4 shadow-xl shadow-slate-950/50 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3 text-xs text-slate-400">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-400/20 sm:flex">
              <ArrowUpRight size={16} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold text-slate-200">{t('options.finish')}</span>
              <span className="truncate">{t('options.saveHint')}</span>
            </div>
          </div>
          <Button variant="primary" size="md" icon={saveSuccess ? <Check size={16} /> : <Save size={16} />} onClick={handleSave}>
            {saveSuccess ? t('options.saved') : t('options.saveSettings')}
          </Button>
        </div>
      </main>
    </div>
  );
};
