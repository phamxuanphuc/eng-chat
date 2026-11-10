import { describe, it, expect, vi, beforeEach } from 'vitest';

type FakePort = {
  payload: any;
  disconnect: ReturnType<typeof vi.fn>;
  emit: (message: unknown) => void;
};

describe('Content script streaming', () => {
  const ports: FakePort[] = [];
  const sendMessage = vi.fn();
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;
  let connect: any;

  const flush = () => new Promise((resolve) => setTimeout(resolve, 10));
  const root = () => document.getElementById('engchat-root-host')!.shadowRoot!;
  const resultText = () => root().querySelector('[aria-live="polite"]')?.textContent ?? '';
  const button = (label: string) => root().querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  const replace = () => button('Replace text in input');
  const copy = () => button('Copy result');

  const load = async (withConnect = true) => {
    connect = withConnect
      ? vi.fn(() => {
          const listeners: Array<(message: any) => void> = [];
          const port: FakePort = { payload: null, disconnect: vi.fn(), emit: (message) => listeners.forEach((fn) => fn(message)) };
          ports.push(port);
          return {
            postMessage: (message: { payload: unknown }) => { port.payload = message.payload; },
            disconnect: port.disconnect,
            onMessage: { addListener: (fn: (message: any) => void) => listeners.push(fn) },
            onDisconnect: { addListener: vi.fn() },
          };
        })
      : undefined;
    (globalThis as any).chrome = {
      storage: {
        local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) },
        onChanged: { addListener: vi.fn() },
      },
      runtime: { sendMessage, connect, onMessage: { addListener: vi.fn((fn) => { onMessage = fn; }) } },
    };
    vi.resetModules();
    await import('../src/content/index');
    await flush();
  };

  const startImprove = async (mode: 'improve' | 'summary' | 'translate' | 'direct' = 'improve') => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Toi dong y';
    document.body.appendChild(textarea);
    textarea.focus();
    const tone = mode === 'translate' ? 'translate_explain' : mode === 'summary' ? 'summarize' : 'professional';
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone, mode: mode === 'direct' ? undefined : mode }, {}, vi.fn());
    await flush();
    return textarea;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    ports.length = 0;
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ success: true, data: 'Plain result' });
  });

  it('shows text as it arrives, keeps Replace and Copy disabled until done', async () => {
    await load();
    await startImprove();
    expect(connect).toHaveBeenCalledWith({ name: 'engchat_stream' });
    expect(ports[0].payload).toMatchObject({ text: 'Toi dong y', mode: 'improve' });
    expect(root().textContent).toContain('Improving');

    ports[0].emit({ type: 'chunk', text: 'I agree' });
    await flush();
    expect(resultText()).toContain('I agree');
    expect(replace()!.disabled).toBe(true);
    expect(copy()!.disabled).toBe(true);

    ports[0].emit({ type: 'chunk', text: ' with this.' });
    await flush();
    expect(resultText()).toContain('I agree with this.');

    ports[0].emit({ type: 'done', data: 'I agree with this.' });
    await flush();
    expect(resultText()).toContain('I agree with this.');
    expect(replace()!.disabled).toBe(false);
    expect(copy()!.disabled).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('cancels the request when the popup is closed mid-stream', async () => {
    await load();
    await startImprove();
    ports[0].emit({ type: 'chunk', text: 'Half' });
    await flush();
    button('Close')!.click();
    await flush();
    expect(ports[0].disconnect).toHaveBeenCalled();
    ports[0].emit({ type: 'chunk', text: ' ignored' });
    await flush();
    expect(root().querySelector('[role="dialog"]')).toBeNull();
  });

  it('cancels the previous stream and ignores its chunks when a new request starts', async () => {
    await load();
    await startImprove();
    ports[0].emit({ type: 'chunk', text: 'Old' });
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());
    await flush();
    expect(ports).toHaveLength(2);
    expect(ports[0].disconnect).toHaveBeenCalled();
    ports[0].emit({ type: 'chunk', text: ' stale' });
    ports[1].emit({ type: 'chunk', text: 'New' });
    await flush();
    expect(resultText()).toContain('New');
    expect(resultText()).not.toContain('stale');
  });

  it('shows the error text the background sends, like the non-streaming path', async () => {
    await load();
    await startImprove();
    ports[0].emit({ type: 'error', error: 'API quota or rate limit exceeded. Please try again later.', fallback: false });
    await flush();
    expect(root().textContent).toContain('API quota or rate limit exceeded. Please try again later.');
    expect(sendMessage).not.toHaveBeenCalled();
    expect(root().querySelector('[aria-label="Replace text in input"]')?.hasAttribute('disabled')).not.toBe(false);
  });

  it('falls back to the plain request once when streaming fails before any chunk', async () => {
    await load();
    await startImprove();
    ports[0].emit({ type: 'error', error: 'Server error', fallback: true });
    await flush();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][0]).toMatchObject({ action: 'EXECUTE_GEMINI', payload: { text: 'Toi dong y' } });
    expect(resultText()).toContain('Plain result');
  });

  it('does not fall back after chunks arrived', async () => {
    await load();
    await startImprove();
    ports[0].emit({ type: 'chunk', text: 'Some' });
    ports[0].emit({ type: 'error', error: 'Connection lost', fallback: true });
    await flush();
    expect(sendMessage).not.toHaveBeenCalled();
    expect(root().textContent).toContain('Connection lost');
  });

  it('uses the plain request when runtime.connect is unavailable', async () => {
    await load(false);
    await startImprove();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(resultText()).toContain('Plain result');
  });

  it('streams summaries but not translations', async () => {
    await load();
    await startImprove('summary');
    expect(ports).toHaveLength(1);
    ports[0].emit({ type: 'done', data: 'Short' });
    await flush();

    await startImprove('translate');
    expect(ports).toHaveLength(1);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('keeps direct replacement from the shortcut on the plain request', async () => {
    await load();
    const textarea = await startImprove('direct');
    expect(connect).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(textarea.value).toBe('Plain result');
  });

  it('streams follow-ups too and keeps the old text out of the way', async () => {
    await load();
    await startImprove();
    ports[0].emit({ type: 'done', data: 'First answer' });
    await flush();

    const field = root().querySelector<HTMLInputElement>('form input')!;
    const form = field.closest('form')!;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(field, { target: { value: 'Shorter' } });
    fireEvent.submit(form);
    await flush();
    expect(ports).toHaveLength(2);
    expect(ports[1].payload).toMatchObject({ taskInstruction: 'Shorter' });
    ports[1].emit({ type: 'chunk', text: 'Short' });
    await flush();
    expect(resultText()).toContain('Short');
    expect(resultText()).not.toContain('First answer');
    ports[1].emit({ type: 'done', data: 'Short' });
    await flush();
    expect(replace()!.disabled).toBe(false);
  });
});
