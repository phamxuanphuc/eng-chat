import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectPageTheme, observePageTheme } from '../src/content/theme-detector';

describe('theme-detector', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-color-mode');
    document.body.className = '';
    document.body.removeAttribute('data-theme');
    document.body.removeAttribute('data-color-mode');
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-TD-01: Detects dark theme when html has dark class', () => {
    document.documentElement.className = 'dark theme-dark';
    expect(detectPageTheme()).toBe('dark');
  });

  it('TC-TD-02: Detects dark theme when data-theme="dark"', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(detectPageTheme()).toBe('dark');
  });

  it('TC-TD-03: Detects light theme when html has light class', () => {
    document.documentElement.className = 'light';
    expect(detectPageTheme()).toBe('light');
  });

  it('TC-TD-04: Detects light theme when data-theme="light"', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    expect(detectPageTheme()).toBe('light');
  });

  it('TC-TD-05: Detects theme based on computed dark background color', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      backgroundColor: 'rgb(24, 24, 27)',
    } as any);
    expect(detectPageTheme()).toBe('dark');
  });

  it('TC-TD-06: Detects theme based on computed light background color', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      backgroundColor: 'rgb(255, 255, 255)',
    } as any);
    expect(detectPageTheme()).toBe('light');
  });

  it('TC-TD-07: Falls back to prefers-color-scheme media query', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      backgroundColor: 'transparent',
    } as any);
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(detectPageTheme()).toBe('dark');
  });

  it('TC-TD-08: observePageTheme notifies listener when mutation occurs', async () => {
    const callback = vi.fn();
    const cleanup = observePageTheme(callback);

    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(callback).toHaveBeenCalledWith('dark');
    cleanup();
  });
});
