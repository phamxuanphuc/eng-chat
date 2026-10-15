import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useOptions } from './OptionsContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Check, Save, MessageSquare, Palette, Cpu } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'AI Provider', icon: Cpu },
  { path: '/tone', label: 'Writing style', icon: Palette },
  { path: '/context', label: 'Context', icon: MessageSquare },
];

export const OptionsLayout: React.FC = () => {
  const { saveSuccess, handleSave } = useOptions();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
        <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-md shadow-indigo-500/25 shrink-0">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  EngChat AI
                </h1>
                <Badge variant="primary" size="sm">Settings</Badge>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI configuration and English optimization center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`
                    }
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {saveSuccess && (
              <Badge variant="success" size="sm" icon={<Check size={12} />}>
                Saved
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-6 flex flex-col gap-6">
        {saveSuccess && (
          <Alert variant="success" message="Settings saved successfully in your browser!" />
        )}

        <Outlet />

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-slate-800/80 mt-4">
          <div className="flex flex-col text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Finish configuration</span>
            <span>Changes on every page take effect immediately after saving.</span>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={saveSuccess ? <Check size={16} /> : <Save size={16} />}
            onClick={handleSave}
          >
            {saveSuccess ? 'Saved' : 'Save Settings'}
          </Button>
        </div>
      </main>
    </div>
  );
};
