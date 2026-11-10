import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyOverlayPrefs,
  getOverlayPrefs,
  loadOverlayPrefs,
  OVERLAY_PREFS_KEY,
  saveOverlayPrefs,
} from '../src/content/overlay-prefs';

describe('overlay preferences', () => {
  let store: Record<string, unknown>;
  let pageStorage: Record<string, string>;

  const installPageStorage = () => {
    pageStorage = {};
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => pageStorage[key] ?? null,
        setItem: (key: string, value: string) => { pageStorage[key] = String(value); },
      },
    });
  };

  const installChrome = () => {
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: store[key] })),
          set: vi.fn(async (obj: Record<string, unknown>) => { Object.assign(store, obj); }),
        },
      },
    };
  };

  beforeEach(() => {
    store = {};
    applyOverlayPrefs(null);
    installPageStorage();
    delete (globalThis as any).chrome;
  });

  it('starts with no position and nothing pinned', () => {
    expect(getOverlayPrefs()).toEqual({
      popupPosition: null,
      pinnedBySection: { translate: false, rewrite: false, improve: false, summary: false },
    });
  });

  it('saves to chrome.storage.local and never writes to the page localStorage', async () => {
    installChrome();
    await saveOverlayPrefs({ popupPosition: { x: 10, y: 20 } });
    await saveOverlayPrefs({ pinnedBySection: { ...getOverlayPrefs().pinnedBySection, rewrite: true } });

    expect((store[OVERLAY_PREFS_KEY] as any).popupPosition).toEqual({ x: 10, y: 20 });
    expect((store[OVERLAY_PREFS_KEY] as any).pinnedBySection.rewrite).toBe(true);
    expect(Object.keys(pageStorage).filter((key) => key.startsWith('engchat'))).toEqual([]);
  });

  it('reads the saved values back and ignores malformed data', async () => {
    installChrome();
    store[OVERLAY_PREFS_KEY] = { popupPosition: { x: 5, y: 6 }, pinnedBySection: { summary: true, bogus: true } };
    const loaded = await loadOverlayPrefs();
    expect(loaded.popupPosition).toEqual({ x: 5, y: 6 });
    expect(loaded.pinnedBySection.summary).toBe(true);
    expect(getOverlayPrefs().pinnedBySection.translate).toBe(false);

    store[OVERLAY_PREFS_KEY] = { popupPosition: { x: 'a' }, pinnedBySection: 'nope' };
    expect((await loadOverlayPrefs()).popupPosition).toBeNull();
    store[OVERLAY_PREFS_KEY] = 'garbage';
    expect((await loadOverlayPrefs()).pinnedBySection.summary).toBe(false);
  });

  it('keeps the in-memory value when storage fails', async () => {
    (globalThis as any).chrome = { storage: { local: { get: vi.fn(async () => { throw new Error('x'); }), set: vi.fn(async () => { throw new Error('x'); }) } } };
    await saveOverlayPrefs({ popupPosition: { x: 1, y: 2 } });
    expect(getOverlayPrefs().popupPosition).toEqual({ x: 1, y: 2 });
    expect((await loadOverlayPrefs()).popupPosition).toBeNull();
  });

  it('falls back to localStorage only when chrome.storage does not exist', async () => {
    await saveOverlayPrefs({ popupPosition: { x: 7, y: 8 } });
    expect(JSON.parse(pageStorage[OVERLAY_PREFS_KEY]).popupPosition).toEqual({ x: 7, y: 8 });
    applyOverlayPrefs(null);
    expect((await loadOverlayPrefs()).popupPosition).toEqual({ x: 7, y: 8 });
  });
});
