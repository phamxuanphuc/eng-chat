export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'engchat_theme';
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

const systemPrefersLight = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false;

export const resolveTheme = (preference: ThemePreference): 'light' | 'dark' =>
  preference === 'system' ? (systemPrefersLight() ? 'light' : 'dark') : preference;

export const getThemePreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return stored && THEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

export const applyTheme = (preference: ThemePreference = getThemePreference()) => {
  document.documentElement.dataset.engchatTheme = resolveTheme(preference);
};

export const setThemePreference = (preference: ThemePreference) => {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {}
  applyTheme(preference);
};

export const nextTheme = (preference: ThemePreference): ThemePreference =>
  THEMES[(THEMES.indexOf(preference) + 1) % THEMES.length];

export const initTheme = () => {
  applyTheme();
  if (typeof window === 'undefined') return;
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => applyTheme());
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) applyTheme();
  });
};
