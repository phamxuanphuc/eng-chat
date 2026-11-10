import { describe, it, expect, vi, beforeEach } from 'vitest';

const flush = () => new Promise((resolve) => setTimeout(resolve, 40));
const root = () => document.getElementById('engchat-root-host')?.shadowRoot ?? null;
const toolbar = () => root()?.querySelector<HTMLElement>('[role="toolbar"]') ?? null;

describe('Toolbar follows its anchor', () => {
  let box: { top: number; bottom: number };

  const rectFor = () =>
    ({ left: 50, right: 250, width: 200, height: 40, top: box.top, bottom: box.bottom } as DOMRect);

  beforeEach(async () => {
    document.body.innerHTML = '';
    window.sessionStorage.clear();
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    box = { top: 100, bottom: 140 };
    (globalThis as any).chrome = {
      storage: {
        local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) },
        onChanged: { addListener: vi.fn() },
      },
      runtime: { sendMessage: vi.fn(), onMessage: { addListener: vi.fn() } },
    };
    vi.resetModules();
    await import('../src/content/index');
    await flush();
  });

  const focusField = () => {
    const field = document.createElement('textarea');
    field.value = 'Draft';
    field.getBoundingClientRect = rectFor;
    document.body.appendChild(field);
    field.dispatchEvent(new Event('focusin', { bubbles: true }));
    return field;
  };

  it('moves with the field when the page scrolls', async () => {
    focusField();
    await flush();
    expect(toolbar()!.style.top).toBe('148px');
    box = { top: 60, bottom: 100 };
    document.dispatchEvent(new Event('scroll'));
    await flush();
    expect(toolbar()!.style.top).toBe('108px');
  });

  it('follows when a nested container scrolls', async () => {
    const field = focusField();
    await flush();
    box = { top: 200, bottom: 240 };
    field.dispatchEvent(new Event('scroll'));
    await flush();
    expect(toolbar()!.style.top).toBe('248px');
  });

  it('hides when the anchor scrolls out of the viewport', async () => {
    focusField();
    await flush();
    box = { top: -300, bottom: -260 };
    document.dispatchEvent(new Event('scroll'));
    await flush();
    expect(toolbar()).toBeNull();
  });

  it('hides when the anchor leaves the page', async () => {
    const field = focusField();
    await flush();
    field.remove();
    window.dispatchEvent(new Event('resize'));
    await flush();
    expect(toolbar()).toBeNull();
  });

  it('follows the current selection after a text selection', async () => {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Read this sentence';
    document.body.appendChild(paragraph);
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.getBoundingClientRect = rectFor;
    range.getClientRects = () => [rectFor()] as unknown as DOMRectList;
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    vi.spyOn(selection, 'getRangeAt').mockReturnValue(range);
    document.dispatchEvent(new Event('selectionchange'));
    await flush();
    expect(toolbar()!.style.top).toBe('148px');
    box = { top: 30, bottom: 70 };
    document.dispatchEvent(new Event('scroll'));
    await flush();
    expect(toolbar()!.style.top).toBe('78px');
  });
});
