import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  clearHiddenSites,
  hideForSession,
  hideSite,
  isHiddenForSession,
  isSiteHidden,
  loadHiddenSites,
  normalizeOrigin,
  unhideSite,
} from '../src/services/hidden-sites';

describe('hidden sites service', () => {
  let data: Record<string, any>;

  beforeEach(() => {
    data = {};
    window.sessionStorage.clear();
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(data, obj);
          }),
        },
      },
    };
  });

  it('normalizes only http(s) origins', () => {
    expect(normalizeOrigin('https://mail.example.com/inbox?q=1')).toBe('https://mail.example.com');
    expect(normalizeOrigin('http://localhost:3000/a')).toBe('http://localhost:3000');
    expect(normalizeOrigin('chrome://extensions')).toBeNull();
    expect(normalizeOrigin('about:blank')).toBeNull();
    expect(normalizeOrigin('null')).toBeNull();
    expect(normalizeOrigin(42)).toBeNull();
  });

  it('starts empty and stores sorted unique origins', async () => {
    expect(await loadHiddenSites()).toEqual([]);
    await hideSite('https://b.example.com/page');
    await hideSite('https://a.example.com');
    await hideSite('https://b.example.com');
    expect(await loadHiddenSites()).toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  it('treats different protocols and ports as different origins', async () => {
    await hideSite('https://example.com');
    const sites = await loadHiddenSites();
    expect(isSiteHidden(sites, 'https://example.com')).toBe(true);
    expect(isSiteHidden(sites, 'http://example.com')).toBe(false);
    expect(isSiteHidden(sites, 'https://example.com:8443')).toBe(false);
    expect(isSiteHidden(sites, null)).toBe(false);
  });

  it('rejects invalid origins without writing', async () => {
    expect(await hideSite('chrome://settings')).toBe(false);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('removes one site or all sites', async () => {
    await hideSite('https://a.example.com');
    await hideSite('https://b.example.com');
    await unhideSite('https://a.example.com');
    expect(await loadHiddenSites()).toEqual(['https://b.example.com']);
    await clearHiddenSites();
    expect(await loadHiddenSites()).toEqual([]);
  });

  it('ignores corrupted stored data and survives storage errors', async () => {
    data.engchat_hidden_sites = ['https://ok.example.com', 'junk', 5, null];
    expect(await loadHiddenSites()).toEqual(['https://ok.example.com']);
    data.engchat_hidden_sites = 'not-an-array';
    expect(await loadHiddenSites()).toEqual([]);
    (chrome.storage.local.get as any).mockRejectedValue(new Error('boom'));
    expect(await loadHiddenSites()).toEqual([]);
  });

  it('remembers the per-tab session hide in sessionStorage', () => {
    expect(isHiddenForSession()).toBe(false);
    hideForSession();
    expect(isHiddenForSession()).toBe(true);
  });
});
