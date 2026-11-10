import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';

type Deferred = { resolve: (value: unknown) => void };

describe('Content script follow-ups', () => {
  const pending: Deferred[] = [];
  let onMessage: (message: any, sender: any, sendResponse: (r?: any) => void) => boolean;
  const sendMessage = vi.fn((_message: any) => new Promise((resolve) => pending.push({ resolve })));

  beforeAll(async () => {
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
    const callsBefore = sendMessage.mock.calls.length;
    click('Short');
    click('Formal');
    await flush();
    expect(sendMessage.mock.calls.length).toBe(callsBefore);
    click('Apply');
    await flush();

    expect(sendMessage.mock.calls.length).toBe(callsBefore + 1);
    expect(lastPayload().rewriteOptions).toMatchObject({ length: 'Short', formality: 'Formal' });
    expect(lastPayload().previousResult).toBeUndefined();
  });

  it('tells the background which mode the request is for', async () => {
    await open('improve', 'Result');
    expect(sendMessage.mock.calls[0][0].payload.mode).toBe('improve');
    await ask('Shorter');
    expect(lastPayload().mode).toBe('improve');
  });

  it('asks for a plain translation when showing the Vietnamese meaning', async () => {
    await open('improve', 'I agree with this approach.');
    const toggle = Array.from(root().querySelectorAll('button')).find((b) => b.textContent?.includes('Translate improved sentence to Vietnamese'))!;
    fireEvent.click(toggle);
    await flush();

    expect(lastPayload()).toMatchObject({ text: 'I agree with this approach.', targetLanguage: 'Vietnamese', translateOnly: true });
  });

  describe('context badge', () => {
    afterEach(() => {
      document.querySelectorAll('[role="log"]').forEach((el) => el.remove());
    });

    const badge = () => Array.from(root().querySelectorAll('span')).find((el) => /^Context: /.test(el.textContent || ''));

    const openWithChat = async (messages: string[]) => {
      const log = document.createElement('div');
      log.setAttribute('role', 'log');
      log.innerHTML = messages.map((text) => `<div data-qa="message_content">${text}</div>`).join('');
      const textarea = document.createElement('textarea');
      textarea.value = 'Toi dong y';
      log.appendChild(textarea);
      document.body.appendChild(log);
      textarea.focus();
      onMessage({ action: 'TRIGGER_OPTIMIZE', tone: 'professional', mode: 'improve' }, {}, vi.fn());
      pending[0].resolve({ success: true, data: 'I agree.' });
      await flush();
    };

    it('shows how many messages were sent and explains how to turn it off', async () => {
      await openWithChat(['First message', 'Second message', 'Third message']);
      expect(lastPayload().contextMessages).toHaveLength(3);
      expect(badge()?.textContent).toBe('Context: 3 messages');
      expect(badge()?.closest('[title]')?.getAttribute('title')).toContain('Settings');
    });

    it('uses the singular for one message', async () => {
      await openWithChat(['Only message']);
      expect(badge()?.textContent).toBe('Context: 1 message');
    });

    it('shows no badge when no context was found', async () => {
      await open('improve', 'I agree.');
      expect(lastPayload().contextMessages).toEqual([]);
      expect(badge()).toBeUndefined();
    });

    it('keeps the count across a follow-up', async () => {
      await openWithChat(['First message', 'Second message']);
      await ask('Shorter');
      pending[1]?.resolve({ success: true, data: 'Shorter result' });
      await flush();
      expect(badge()?.textContent).toBe('Context: 2 messages');
    });
  });
});
