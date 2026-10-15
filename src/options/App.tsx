import React from 'react';
import { HashRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OptionsProvider } from './OptionsContext';
import { OptionsLayout } from './OptionsLayout';
import { AiProviderPage } from './pages/AiProviderPage';
import { TonePage } from './pages/TonePage';
import { ContextPage } from './pages/ContextPage';

export interface AppProps {
  useMemoryRouter?: boolean;
  initialEntries?: string[];
}

export const App: React.FC<AppProps> = ({
  useMemoryRouter = typeof (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'undefined'
    ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test'
    : import.meta.env?.MODE === 'test',
  initialEntries = ['/'],
}) => {
  const Router = useMemoryRouter ? MemoryRouter : HashRouter;
  const routerProps = useMemoryRouter ? { initialEntries } : {};

  return (
    <OptionsProvider>
      <Router {...routerProps}>
        <Routes>
          <Route element={<OptionsLayout />}>
            <Route index element={<AiProviderPage />} />
            <Route path="ai" element={<Navigate to="/" replace />} />
            <Route path="tone" element={<TonePage />} />
            <Route path="context" element={<ContextPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </OptionsProvider>
  );
};
