import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { applyTheme, getThemePreference, nextTheme, resolveTheme, setThemePreference } from '../src/services/theme';
import { ThemeToggle } from '../src/options/ThemeToggle';

const store = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    clear: () => store.clear(),
  },
});
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: window.localStorage });

const mockSystemLight = (light: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: light, addEventListener: vi.fn() }) as any;
};

describe('theme service', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.engchatTheme;
    mockSystemLight(false);
  });

  it('defaults to system and follows the OS preference', () => {
    expect(getThemePreference()).toBe('system');
    mockSystemLight(true);
    expect(resolveTheme('system')).toBe('light');
    applyTheme();
    expect(document.documentElement.dataset.engchatTheme).toBe('light');
  });

  it('persists an explicit choice and applies it', () => {
    setThemePreference('dark');
    expect(localStorage.getItem('engchat_theme')).toBe('dark');
    expect(document.documentElement.dataset.engchatTheme).toBe('dark');
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('engchat_theme', 'neon');
    expect(getThemePreference()).toBe('system');
  });

  it('cycles system → light → dark → system', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    mockSystemLight(false);
  });

  it('cycles the theme and exposes an accessible label', () => {
    render(<ThemeToggle language="en" />);
    const button = screen.getByRole('button', { name: 'Theme: System' });
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: 'Theme: Light' })).toBeDefined();
    expect(document.documentElement.dataset.engchatTheme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'Theme: Light' }));
    expect(document.documentElement.dataset.engchatTheme).toBe('dark');
  });
});
