import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as OptionsApp } from '../src/options/App';
import { DEFAULT_SETTINGS } from '../src/services/storage';
import { useSettingsStore } from '../src/store/useSettingsStore';

const renderSites = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OptionsApp initialEntries={['/sites']} />
    </QueryClientProvider>
  );

describe('Hidden sites options page', () => {
  let data: Record<string, any>;

  beforeEach(() => {
    document.body.innerHTML = '';
    data = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(data, obj);
          }),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    };
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, hasLoaded: false });
  });

  it('is reachable from the navigation', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OptionsApp />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole('link', { name: /hidden sites/i }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Hidden sites' })).toBeDefined();
  });

  it('shows an empty state when nothing is hidden', async () => {
    renderSites();
    expect(await screen.findByText(/No hidden sites yet/)).toBeDefined();
    expect(screen.getByText('0 sites')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Show on all sites' })).toBeNull();
  });

  it('lists hidden origins and shows one again', async () => {
    data.engchat_hidden_sites = ['https://a.example.com', 'https://b.example.com'];
    renderSites();
    expect(await screen.findByText('https://a.example.com')).toBeDefined();
    expect(screen.getByText('2 sites')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Show again https://a.example.com' }));
    await waitFor(() => expect(screen.queryByText('https://a.example.com')).toBeNull());
    expect(screen.getByText('https://b.example.com')).toBeDefined();
    expect(data.engchat_hidden_sites).toEqual(['https://b.example.com']);
  });

  it('shows the toolbar again on all sites', async () => {
    data.engchat_hidden_sites = ['https://a.example.com', 'https://b.example.com'];
    renderSites();
    fireEvent.click(await screen.findByRole('button', { name: 'Show on all sites' }));
    expect(await screen.findByText(/No hidden sites yet/)).toBeDefined();
    expect(data.engchat_hidden_sites).toEqual([]);
  });

  it('turns the toolbar-on-focus setting off and saves immediately', async () => {
    renderSites();
    const toggle = await screen.findByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    await waitFor(() => expect(data.engchat_settings?.showToolbarOnFocus).toBe(false));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });
});
