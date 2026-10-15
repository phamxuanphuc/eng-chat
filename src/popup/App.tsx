import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const App: React.FC = () => {
  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  return (
    <div className="w-[380px] p-6 flex flex-col gap-6 font-sans bg-slate-950 text-slate-100">
      <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        EngChat AI
      </h1>

      <Button
        variant="primary"
        size="md"
        icon={<Settings size={16} />}
        onClick={openOptions}
        aria-label="Open settings"
      >
        Open settings
      </Button>

      <section className="flex flex-col gap-2 border-t border-slate-800 pt-4" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-sm font-semibold text-slate-200">About</h2>
        <p className="text-xs leading-relaxed text-slate-400">Optimize and translate your messages with AI.</p>
        <p className="text-xs leading-relaxed text-slate-400">Configure your API provider and preferences from the options page.</p>
        <p className="text-xs leading-relaxed text-slate-500">Version 1.0.0 · Shortcut: Ctrl+Shift+E</p>
      </section>
    </div>
  );
};
