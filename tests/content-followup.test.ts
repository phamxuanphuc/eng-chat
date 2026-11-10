import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';

type Deferred = { resolve: (value: unknown) => void };

describe('Content script follow-ups', () => {
  const pending: Deferred[] = [];
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    sendMessage = vi.fn(() => new Promise((resolve) => pending.push({ resolve })));
    (globalThis as any).chrome = {
      storage: {
        sync: { get: vi.fn(async () => ({})), set: vi.fn() },
        local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) },
        onChanged: { addListener: vi.fn() },
      },
      runtime: { sendMessage, onMessage: { addListener: vi.fn((fn) => { onMessage = fn; }) } },
    };
    await import('../src/content/index');
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  beforeEach(() => {
    pending.length = 0;
    sendMessage.mockClear();
  });

  const root = () => document.getElementById('engchat-root-host')!.shadowRoot!;
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const lastPayload = () => sendMessage.mock.calls[sendMessage.mock.calls.length - 1][0].payload;

  const open = async (mode: 'improve' | 'translate', data: unknown) => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Toi dong y';
    document.body.appendChild(textarea);
    textarea.focus();
    onMessage({ action: 'TRIGGER_OPTIMIZE', tone: mode === 'translate' ? 'translate_explain' : 'professional', mode }, {}, vi.fn());
    pending[0].resolve({ success: true, data });
    await flush();
    return textarea;
  };

  const ask = async (question: string) => {
    const field = root().querySelector<HTMLInputElement>('form input')!;
    fireEvent.change(field, { target: { value: question } });
    fireEvent.submit(field.closest('form')!);
    await flush();
  };

  it('sends the current result with a typed follow-up', async () => {
    await open('improve', 'I agree with this approach.');
    await ask('Make it friendlier');

    expect(lastPayload()).toMatchObject({
      text: 'Toi dong y',
      taskInstruction: 'Make it friendlier',
      previousResult: 'I agree with this approach.',
    });
  });

  it('chains follow-ups on the newest result', async () => {
    await open('improve', 'First result');
    await ask('Shorter');
    pending[pending.length - 1].resolve({ success: true, data: 'Second result' });
    await flush();
    await ask('Add a greeting');

    expect(lastPayload()).toMatchObject({ taskInstruction: 'Add a greeting', previousResult: 'Second result' });
  });

  it('uses the translation text of a translate result', async () => {
    await open('translate', { translation: 'I agree', explanation: { vocabulary: [], grammar: '', nuances: '' } });
    await ask('More formal');

    expect(lastPayload()).toMatchObject({ tone: 'translate_explain', previousResult: 'I agree' });
  });

  it('does not anchor a style option change on the previous result', async () => {
    await open('improve', 'I agree with this approach.');
    const click = (label: string) => fireEvent.click(Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!);
    click('Style & Format Options');
    await flush();
    click('Short');
    await flush();

    expect(lastPayload().rewriteOptions).toMatchObject({ length: 'Short' });
    expect(lastPayload().previousResult).toBeUndefined();
  });
});
