import { useEffect, useState } from 'react';
import { COOLDOWN_STORAGE_KEY, KeyCooldown, getKeyCooldowns } from '../services/key-cooldown';

export interface KeyCooldownStatus extends KeyCooldown {
  remainingMs: number;
}

export const useKeyCooldowns = (keys: string[]): Record<string, KeyCooldownStatus> => {
  const [cooldowns, setCooldowns] = useState<Record<string, KeyCooldown>>({});
  const [now, setNow] = useState(() => Date.now());
  const signature = keys.join('\u0000');

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getKeyCooldowns(keys).then((next) => {
        if (active) setCooldowns(next);
      });
    };
    refresh();
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && COOLDOWN_STORAGE_KEY in changes) refresh();
    };
    const hasListener = typeof chrome !== 'undefined' && !!chrome.storage?.onChanged;
    if (hasListener) chrome.storage.onChanged.addListener(onChanged as any);
    return () => {
      active = false;
      if (hasListener) chrome.storage.onChanged.removeListener(onChanged as any);
    };
  }, [signature]);

  const hasActive = Object.keys(cooldowns).length > 0;
  useEffect(() => {
    if (!hasActive) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasActive]);

  const result: Record<string, KeyCooldownStatus> = {};
  for (const [key, entry] of Object.entries(cooldowns)) {
    const remainingMs = entry.until - now;
    if (remainingMs > 0) result[key] = { ...entry, remainingMs };
  }
  return result;
};

export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
