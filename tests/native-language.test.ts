import { describe, it, expect, vi, beforeEach } from 'vitest';

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));
const root = () => document.getElementById('engchat-root-host')!.shadowRoot!;

describe('Content script native language', () => {
  const sendMessage = vi.fn();
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;

  const load = async (settings: Record<string, unknown>) => {
    (globalThis as any).chrome = {
      storage: {
        local: { get: vi.fn(async (key: string) => (key === 'engchat_settings' ? { [key]: settings } : {})), set: vi.fn(async () => {}) },
        onChanged: { addListener: vi.fn() },
      },
      runtime: { sendMessage, onMessage: { addListener: vi.fn((fn) => { onMessage = fn; }) } },
    };
    vi.resetModules();
    await import('../src/content/index');
    await flush();
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ success: true, data: 'Improved text' });
  });

  const openImprove = async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Draft';
    document.body.appendChild(textarea);
    textarea.focus();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());
    await flush();
  };

  const toggle = (label: string) =>
    Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.includes(label));

  it('translates back into the saved native language', async () => {
    await load({ nativeLanguage: 'Japanese' });
    await openImprove();
    expect(toggle('Vietnamese')).toBeUndefined();
    toggle('Translate improved sentence to Japanese')!.click();
    await flush();
    const payload = sendMessage.mock.calls[sendMessage.mock.calls.length - 1][0].payload;
    expect(payload).toMatchObject({ text: 'Improved text', targetLanguage: 'Japanese', translateOnly: true });
  });

  it('falls back to Vietnamese for settings saved before the option existed', async () => {
    await load({});
    await openImprove();
    toggle('Translate improved sentence to Vietnamese')!.click();
    await flush();
    const payload = sendMessage.mock.calls[sendMessage.mock.calls.length - 1][0].payload;
    expect(payload).toMatchObject({ targetLanguage: 'Vietnamese', translateOnly: true });
  });
});
