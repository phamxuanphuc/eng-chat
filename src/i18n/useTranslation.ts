import { useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { getTranslator } from './index';

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.settings.language);
  return useMemo(() => ({ language, t: getTranslator(language) }), [language]);
};
