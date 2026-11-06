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

  const replaceButton = () =>
    document.getElementById('engchat-root-host')!.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Replace text in input"]');

  const runImprove = async () => {
    pending.length = 0;
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());
    pending[0].resolve({ success: true, data: 'Better text' });
    await flush();
  };

  it('offers no Replace for page text selected after leaving an input', async () => {
    const input = document.createElement('input');
    input.value = 'Draft I must keep';
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Read-only article text';
    document.body.append(input, paragraph);
    input.focus();
    input.blur();
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    await runImprove();

    expect(replaceButton()).toBeNull();
    expect(input.value).toBe('Draft I must keep');
    window.getSelection()!.removeAllRanges();
  });

  it('replaces only the part of an input that was selected when the request started', async () => {
    const input = document.createElement('input');
    input.value = 'Keep this bad text here';
    document.body.appendChild(input);
    input.focus();
    input.setSelectionRange(10, 18);

    await runImprove();
    input.setSelectionRange(0, 0);
    replaceButton()!.click();
    await flush();

    expect(input.value).toBe('Keep this Better text here');
  });

  it('keeps the result open instead of overwriting a field edited after the request', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'First version';
    document.body.appendChild(textarea);
    textarea.focus();

    await runImprove();
    textarea.value = 'Edited by the user';
    replaceButton()!.click();
    await flush();

    expect(textarea.value).toBe('Edited by the user');
    expect(replaceButton()).toBeNull();
    expect(shadowText()).toContain('Better text');
  });

  it.each([
    [{ type: 'password' }],
    [{ type: 'email' }],
    [{ type: 'text', autocomplete: 'one-time-code' }],
    [{ type: 'text', name: 'login' }],
  ])('never sends the value of a sensitive field %o', async (attrs) => {
    const field = document.createElement('input');
    Object.entries(attrs).forEach(([key, value]) => field.setAttribute(key, value));
    field.value = 'secret-value-3917';
    document.body.appendChild(field);
    field.focus();
    field.select();

    const sendMessage = (globalThis as any).chrome.runtime.sendMessage;
    sendMessage.mockClear();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());
    await flush();

    expect(sendMessage).not.toHaveBeenCalled();
    expect(shadowText()).toContain('does not read passwords');
    expect(shadowText()).not.toContain('secret-value-3917');
    field.blur();
  });

  it('shows a plain notice on a blocked request and works again in a normal field', async () => {
    const secret = document.createElement('input');
    secret.type = 'password';
    secret.value = 'secret-value-3917';
    document.body.appendChild(secret);
    secret.focus();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());
    await flush();
    const root = document.getElementById('engchat-root-host')!.shadowRoot!;
    const labels = Array.from(root.querySelectorAll('button')).map((b) => b.textContent?.trim());
    expect(labels).not.toContain('Try again');
    expect(root.querySelector('input[aria-label]')).toBeNull();
    expect(root.textContent).not.toContain('Action failed');

    const textarea = document.createElement('textarea');
    textarea.value = 'A normal message';
    document.body.appendChild(textarea);
    textarea.focus();
    const sendMessage = (globalThis as any).chrome.runtime.sendMessage;
    sendMessage.mockClear();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());

    expect(sendMessage.mock.calls[0][0].payload.text).toBe('A normal message');
  });
});
