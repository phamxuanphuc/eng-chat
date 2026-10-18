import { describe, it, expect, vi, beforeAll } from 'vitest';

type Deferred = { resolve: (value: unknown) => void };

describe('Content script request handling', () => {
  const pending: Deferred[] = [];
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;

  beforeAll(async () => {
    (globalThis as any).chrome = {
      storage: { sync: { get: vi.fn(async () => ({})), set: vi.fn() } },
      runtime: {
        sendMessage: vi.fn(() => new Promise((resolve) => pending.push({ resolve }))),
        onMessage: { addListener: vi.fn((fn) => { onMessage = fn; }) },
      },
    };
    await import('../src/content/index');
  });

  const shadowText = () => document.getElementById('engchat-root-host')?.shadowRoot?.textContent || '';
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('mounts a single shadow host', () => {
    expect(document.querySelectorAll('#engchat-root-host')).toHaveLength(1);
  });

  it('ignores a stale response that resolves after a newer request', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Source sentence';
    document.body.appendChild(textarea);
    textarea.focus();

    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'rewrite' }, {}, vi.fn());
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'rewrite' }, {}, vi.fn());
    expect(pending).toHaveLength(2);

    pending[1].resolve({ success: true, data: 'Newest result' });
    await flush();
    pending[0].resolve({ success: true, data: 'Stale result' });
    await flush();

    expect(shadowText()).toContain('Newest result');
    expect(shadowText()).not.toContain('Stale result');
  });
});
