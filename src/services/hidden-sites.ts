export const HIDDEN_SITES_STORAGE_KEY = 'engchat_hidden_sites';
const SESSION_KEY = 'engchat_toolbar_hidden_session';

export const normalizeOrigin = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
};

export const getCurrentOrigin = (): string | null => {
  try {
    return normalizeOrigin(window.location.origin);
  } catch {
    return null;
  }
};

const sanitize = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const origins = raw.map(normalizeOrigin).filter((o): o is string => !!o);
  return Array.from(new Set(origins)).sort();
};

export const loadHiddenSites = async (): Promise<string[]> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return sanitize((await chrome.storage.local.get(HIDDEN_SITES_STORAGE_KEY))?.[HIDDEN_SITES_STORAGE_KEY]);
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(HIDDEN_SITES_STORAGE_KEY);
      return sanitize(stored ? JSON.parse(stored) : []);
    }
  } catch {}
  return [];
};

const saveHiddenSites = async (sites: string[]): Promise<void> => {
  const clean = sanitize(sites);
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [HIDDEN_SITES_STORAGE_KEY]: clean });
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(HIDDEN_SITES_STORAGE_KEY, JSON.stringify(clean));
  }
};

export const hideSite = async (origin: string): Promise<boolean> => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  await saveHiddenSites([...(await loadHiddenSites()), normalized]);
  return true;
};

export const unhideSite = async (origin: string): Promise<void> => {
  await saveHiddenSites((await loadHiddenSites()).filter((site) => site !== origin));
};

export const clearHiddenSites = async (): Promise<void> => {
  await saveHiddenSites([]);
};

export const isSiteHidden = (sites: string[], origin: string | null = getCurrentOrigin()): boolean =>
  !!origin && sites.includes(origin);

export const isHiddenForSession = (): boolean => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
};

export const hideForSession = (): void => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {}
};
