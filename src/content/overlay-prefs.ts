import type { Position } from './ui/popup-position';
import type { PopupMode } from './target-languages';

export interface OverlayPrefs {
  popupPosition: Position | null;
  pinnedBySection: Record<PopupMode, boolean>;
}

export const OVERLAY_PREFS_KEY = 'engchat_overlay_prefs';

const defaults = (): OverlayPrefs => ({
  popupPosition: null,
  pinnedBySection: { translate: false, rewrite: false, improve: false, summary: false },
});

let cache: OverlayPrefs = defaults();

const getChromeArea = () => (typeof chrome !== 'undefined' ? chrome.storage?.local : undefined);

const getFallbackStorage = (): Storage | null => {
  if (typeof chrome !== 'undefined' && chrome.storage) return null;
  try {
    return typeof window !== 'undefined' ? window.localStorage ?? null : null;
  } catch {
    return null;
  }
};

const isPosition = (value: unknown): value is Position =>
  !!value && typeof (value as Position).x === 'number' && typeof (value as Position).y === 'number';

const normalize = (raw: unknown): OverlayPrefs => {
  const base = defaults();
  if (!raw || typeof raw !== 'object') return base;
  const { popupPosition, pinnedBySection } = raw as Partial<OverlayPrefs>;
  const pinned: Partial<Record<PopupMode, unknown>> =
    pinnedBySection && typeof pinnedBySection === 'object' ? pinnedBySection : {};
  for (const mode of Object.keys(base.pinnedBySection) as PopupMode[]) {
    base.pinnedBySection[mode] = pinned[mode] === true;
  }
  base.popupPosition = isPosition(popupPosition) ? { x: popupPosition.x, y: popupPosition.y } : null;
  return base;
};

export const getOverlayPrefs = (): OverlayPrefs => cache;

export const applyOverlayPrefs = (raw: unknown): OverlayPrefs => {
  cache = normalize(raw);
  return cache;
};

export const loadOverlayPrefs = async (): Promise<OverlayPrefs> => {
  try {
    const area = getChromeArea();
    if (area) {
      const stored = (await area.get(OVERLAY_PREFS_KEY))?.[OVERLAY_PREFS_KEY];
      return applyOverlayPrefs(stored);
    }
    const fallback = getFallbackStorage();
    const text = fallback?.getItem(OVERLAY_PREFS_KEY);
    return applyOverlayPrefs(text ? JSON.parse(text) : null);
  } catch {
    return applyOverlayPrefs(null);
  }
};

export const saveOverlayPrefs = async (partial: Partial<OverlayPrefs>): Promise<void> => {
  cache = normalize({ ...cache, ...partial });
  try {
    const area = getChromeArea();
    if (area) {
      await area.set({ [OVERLAY_PREFS_KEY]: cache });
      return;
    }
    getFallbackStorage()?.setItem(OVERLAY_PREFS_KEY, JSON.stringify(cache));
  } catch {}
};
