import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiKeyManager } from '../src/options/ApiKeyManager';
import { formatCountdown } from '../src/options/useKeyCooldowns';
import { markKeyCooldown } from '../src/services/key-cooldown';

const keys = [
  { id: 'k1', label: 'Main', key: 'AIzaSy-main-key-1111' },
  { id: 'k2', label: 'Backup', key: 'AIzaSy-backup-key-2222' },
];

const renderManager = (props: Partial<React.ComponentProps<typeof ApiKeyManager>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiKeyManager
        language="en"
        apiKeys={keys}
        onUpdateKeys={vi.fn()}
        autoRotate
        onToggleAutoRotate={vi.fn()}
        selectedModel="gemini-3.5-flash-lite"
        {...props}
      />
    </QueryClientProvider>
  );

describe('formatCountdown', () => {
  it('formats milliseconds as m:ss and never goes negative', () => {
    expect(formatCountdown(300_000)).toBe('5:00');
    expect(formatCountdown(61_001)).toBe('1:02');
    expect(formatCountdown(9_000)).toBe('0:09');
    expect(formatCountdown(-500)).toBe('0:00');
  });
});

describe('Options key cooldown display', () => {
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
  });

  it('shows nothing when no key is cooling down', async () => {
    renderManager();
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByText(/skipped for/)).toBeNull();
  });

  it('marks only the cooling key with its reason and remaining time', async () => {
    await markKeyCooldown(keys[1].key, 'invalid');
    renderManager();
    expect(await screen.findByText(/Key rejected · skipped for 29:5\d|Key rejected · skipped for 30:00/)).toBeDefined();
    expect(screen.getAllByText(/skipped for/)).toHaveLength(1);
  });

  it('shows the quota badge under the primary field when there is a single key', async () => {
    await markKeyCooldown(keys[0].key, 'quota');
    renderManager({ apiKeys: [keys[0]] });
    expect(await screen.findByText(/Quota reached · skipped for 4:5\d|Quota reached · skipped for 5:00/)).toBeDefined();
  });

  it('counts down every second', async () => {
    await markKeyCooldown(keys[0].key, 'quota', Date.now() - 240_000);
    renderManager({ apiKeys: [keys[0]] });
    const first = (await screen.findByText(/skipped for/)).textContent;
    await waitFor(() => expect(screen.getByText(/skipped for/).textContent).not.toBe(first), { timeout: 3000 });
  });

  it('disappears once the cooldown expires', async () => {
    await markKeyCooldown(keys[0].key, 'quota', Date.now() - 298_500);
    renderManager({ apiKeys: [keys[0]] });
    await screen.findByText(/skipped for/);
    await waitFor(() => expect(screen.queryByText(/skipped for/)).toBeNull(), { timeout: 4000 });
  });

  it('is hidden when automatic rotation is off', async () => {
    await markKeyCooldown(keys[0].key, 'quota');
    renderManager({ autoRotate: false });
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByText(/skipped for/)).toBeNull();
  });

  it('localizes the badge in Vietnamese', async () => {
    await markKeyCooldown(keys[0].key, 'quota');
    renderManager({ language: 'vi', apiKeys: [keys[0]] });
    expect(await screen.findByText(/Hết hạn mức · bỏ qua trong/)).toBeDefined();
  });
});
