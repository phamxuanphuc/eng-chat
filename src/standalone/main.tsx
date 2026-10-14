import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StandaloneApp } from './App';
import '../styles/index.css';

if (typeof window !== 'undefined' && !(window as any).chrome?.storage) {
  const LOCAL_STORAGE_PREFIX = 'engchat_standalone_';

  (window as any).chrome = {
    storage: {
      sync: {
        get: async (key: string) => {
          const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
          return raw ? { [key]: JSON.parse(raw) } : {};
        },
        set: async (obj: Record<string, any>) => {
          Object.entries(obj).forEach(([k, v]) => {
            localStorage.setItem(LOCAL_STORAGE_PREFIX + k, JSON.stringify(v));
          });
        },
      },
    },
    runtime: {
      openOptionsPage: () => {
        window.location.hash = '#options';
      },
      sendMessage: async (msg: any) => {
        if (msg?.action === 'EXECUTE_GEMINI') {
          const { executeOptimize } = await import('../services/gemini');
          const { loadSettings } = await import('../services/storage');
          const settings = await loadSettings();
          return await executeOptimize(msg.payload, settings);
        }
        return { success: false };
      },
    },
  };
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <StandaloneApp />
    </QueryClientProvider>
  </React.StrictMode>
);
