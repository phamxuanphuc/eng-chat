import { describe, it, expect, vi, beforeAll } from 'vitest';

type Deferred = { resolve: (value: unknown) => void };

describe('Content script request handling', () => {
  const pending: Deferred[] = [];
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;

  beforeAll(async () => {
    (globalThis as any).chrome = {
      storage: {
        sync: { get: vi.fn(async () => ({ engchat_settings: { enableChatContext: false } })), set: vi.fn() },
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

  it('does not send chat context when the user disabled it', async () => {
    const log = document.createElement('div');
    log.setAttribute('role', 'log');
    log.innerHTML = '<div data-qa="message_content">Private teammate message</div>';
    const textarea = document.createElement('textarea');
    textarea.value = 'Reply text';
    log.appendChild(textarea);
    document.body.appendChild(log);
    textarea.focus();

    const sendMessage = (globalThis as any).chrome.runtime.sendMessage;
    sendMessage.mockClear();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'rewrite' }, {}, vi.fn());
    expect(sendMessage.mock.calls[0][0].payload.contextMessages).toEqual([]);
  });

  it('switches mode after a failed request', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Text that failed';
    document.body.appendChild(textarea);
    textarea.focus();

    const sendMessage = (globalThis as any).chrome.runtime.sendMessage;
    pending.length = 0;
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional' }, {}, vi.fn());
    pending[0].resolve({ success: false, error: 'API key is not configured' });
    await flush();

    const root = document.getElementById('engchat-root-host')!.shadowRoot!;
    const buttons = () => Array.from(root.querySelectorAll('button'));
    buttons().find((b) => b.textContent?.trim() === 'Rewrite')!.click();
    await flush();
    sendMessage.mockClear();
    buttons().find((b) => b.textContent?.trim() === 'Summary')!.click();
    await flush();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][0].payload).toMatchObject({ text: 'Text that failed', tone: 'summarize' });
  });

  it('sends the chosen target language and remembers it per mode', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Xin chao';
    document.body.appendChild(textarea);
    textarea.focus();

    const sendMessage = (globalThis as any).chrome.runtime.sendMessage;
    pending.length = 0;
    sendMessage.mockClear();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'summarize', mode: 'summary' }, {}, vi.fn());
    expect(sendMessage.mock.calls[0][0].payload.targetLanguage).toBe('Vietnamese');
    pending[0].resolve({ success: true, data: 'Tom tat' });
    await flush();

    const root = document.getElementById('engchat-root-host')!.shadowRoot!;
    const click = (label: string) => Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!.click();
    click('Vietnamese');
    await flush();
    sendMessage.mockClear();
    click('English');
    await flush();
    expect(sendMessage.mock.calls[0][0].payload).toMatchObject({ tone: 'summarize', targetLanguage: 'English' });
    expect((globalThis as any).chrome.storage.local.set).toHaveBeenCalledWith({ engchat_target_languages: expect.objectContaining({ summary: 'English', translate: 'Vietnamese' }) });

    sendMessage.mockClear();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'translate_explain', mode: 'translate' }, {}, vi.fn());
    expect(sendMessage.mock.calls[0][0].payload.targetLanguage).toBe('Vietnamese');
  });
});
