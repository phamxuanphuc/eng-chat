import { useCallback, useEffect, useState } from 'react';
import { HIDDEN_SITES_STORAGE_KEY, clearHiddenSites, loadHiddenSites, unhideSite } from '../services/hidden-sites';

export const useHiddenSites = () => {
  const [sites, setSites] = useState<string[]>([]);

  const refresh = useCallback(() => {
    void loadHiddenSites().then(setSites);
  }, []);

  useEffect(() => {
    refresh();
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && HIDDEN_SITES_STORAGE_KEY in changes) refresh();
    };
    const hasListener = typeof chrome !== 'undefined' && !!chrome.storage?.onChanged;
    if (hasListener) chrome.storage.onChanged.addListener(onChanged as any);
    return () => {
      if (hasListener) chrome.storage.onChanged.removeListener(onChanged as any);
    };
  }, [refresh]);

  const remove = useCallback(async (origin: string) => {
    await unhideSite(origin);
    refresh();
  }, [refresh]);

  const removeAll = useCallback(async () => {
    await clearHiddenSites();
    refresh();
  }, [refresh]);

  return { sites, remove, removeAll };
};
