import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';

type Deferred = { resolve: (value: unknown) => void };

describe('Content script quick replace shortcut', () => {
  const pending: Deferred[] = [];
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;

  beforeAll(async () => {
    (globalThis as any).chrome = {
      storage: {
        sync: { get: vi.fn(async () => ({})), set: vi.fn() },
        local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) },
        onChanged: { addListener: vi.fn() },
      },
      runtime: {
        sendMessage: vi.fn(() => new Promise((resolve) => pending.push({ resolve }))),
        onMessage: { addListener: vi.fn((fn) => { onMessage = fn; }) },
      },
    };
    await import('../src/content/index');
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  beforeEach(() => {
    pending.length = 0;
  });

  const root = () => document.getElementById('engchat-root-host')!.shadowRoot!;
  const dialog = () => root().querySelector('[role="dialog"]');
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  const pressShortcut = async (value: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.focus();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional' }, {}, vi.fn());
    await flush();
    return textarea;
  };

  it('shows progress while the request is running', async () => {
    await pressShortcut('toi dong y');

    expect(dialog()).not.toBeNull();
    expect(dialog()!.textContent).toContain('Rewriting with AI');
    expect(root().querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('replaces the text and closes the popup on success', async () => {
    const textarea = await pressShortcut('toi dong y');
    pending[0].resolve({ success: true, data: 'I agree.' });
    await flush();

    expect(textarea.value).toBe('I agree.');
    expect(dialog()).toBeNull();
    expect(root().querySelector('[role="toolbar"]')).toBeNull();
  });

  it('keeps the result in the popup when the field changed meanwhile', async () => {
    const textarea = await pressShortcut('toi dong y');
    textarea.value = 'toi dong y, cam on';
    pending[0].resolve({ success: true, data: 'I agree.' });
    await flush();

    expect(textarea.value).toBe('toi dong y, cam on');
    expect(dialog()!.textContent).toContain('I agree.');
  });

  it('shows the error with a retry action', async () => {
    await pressShortcut('toi dong y');
    pending[0].resolve({ success: false, error: 'API quota or rate limit exceeded.' });
    await flush();

    expect(dialog()!.textContent).toContain('API quota or rate limit exceeded.');
    expect(Array.from(root().querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Try again')).toBe(true);
  });

  it('discards the response after the popup is closed', async () => {
    const textarea = await pressShortcut('toi dong y');
    fireEvent.click(root().querySelector('[aria-label="Close"]')!);
    await flush();
    expect(dialog()).toBeNull();

    pending[0].resolve({ success: true, data: 'I agree.' });
    await flush();

    expect(textarea.value).toBe('toi dong y');
    expect(dialog()).toBeNull();
  });

  it('discards the response after a click outside the popup', async () => {
    const textarea = await pressShortcut('toi dong y');
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flush();
    pending[0].resolve({ success: true, data: 'I agree.' });
    await flush();

    expect(textarea.value).toBe('toi dong y');
    expect(dialog()).toBeNull();
  });
});
