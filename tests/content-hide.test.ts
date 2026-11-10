import { describe, it, expect, vi, beforeEach } from 'vitest';

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));
const root = () => document.getElementById('engchat-root-host')?.shadowRoot ?? null;
const hasToolbar = () => !!root()?.querySelector('[role="toolbar"]');
const clickByName = (name: string) => {
  const el = Array.from(root()!.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === name || b.textContent === name);
  if (!el) throw new Error(`No button ${name}`);
  el.click();
};
const focusNewTextarea = () => {
  const textarea = document.createElement('textarea');
  textarea.value = 'Draft text';
  textarea.getBoundingClientRect = () => ({ left: 50, top: 50, width: 200, height: 40, right: 250, bottom: 90 } as DOMRect);
  document.body.appendChild(textarea);
  textarea.dispatchEvent(new Event('focusin', { bubbles: true }));
  return textarea;
};

describe('Content script hide toolbar', () => {
  let data: Record<string, any>;
  let changeListener: (changes: Record<string, any>, area: string) => void;

  const load = async () => {
    vi.resetModules();
    await import('../src/content/index');
    await flush();
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    window.sessionStorage.clear();
    data = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: data[key] })),
          set: vi.fn(async (obj: Record<string, any>) => {
            Object.assign(data, obj);
          }),
        },
        onChanged: { addListener: vi.fn((fn) => { changeListener = fn; }) },
      },
      runtime: { sendMessage: vi.fn(), onMessage: { addListener: vi.fn() } },
    };
  });

  it('shows the toolbar by default on focus', async () => {
    await load();
    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(true);
  });

  it('stays hidden on focus when the setting is off but still shows for a selection', async () => {
    data.engchat_settings = { showToolbarOnFocus: false };
    await load();
    const field = focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(false);
    field.setSelectionRange(0, 5);
    field.dispatchEvent(new Event('select'));
    await flush();
    expect(hasToolbar()).toBe(true);
  });

  it('does not show on an empty field and shows after the first typed character', async () => {
    await load();
    const field = document.createElement('textarea');
    field.getBoundingClientRect = () => ({ left: 50, top: 50, width: 200, height: 40, right: 250, bottom: 90 } as DOMRect);
    document.body.appendChild(field);
    field.focus();
    field.dispatchEvent(new Event('focusin', { bubbles: true }));
    await flush();
    expect(hasToolbar()).toBe(false);
    field.value = 'H';
    field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    await flush();
    expect(hasToolbar()).toBe(true);
  });

  it('hides for this tab session and stays hidden for later fields', async () => {
    await load();
    focusNewTextarea();
    await flush();
    clickByName('Hide toolbar');
    await flush();
    clickByName('Hide in this tab session');
    await flush();
    expect(hasToolbar()).toBe(false);
    expect(window.sessionStorage.getItem('engchat_toolbar_hidden_session')).toBe('true');
    expect(data.engchat_hidden_sites).toBeUndefined();

    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(false);
  });

  it('keeps the session hide after the page reloads in the same tab', async () => {
    window.sessionStorage.setItem('engchat_toolbar_hidden_session', 'true');
    await load();
    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(false);
  });

  it('hides on the whole site, saves the origin and reacts when it is removed in Options', async () => {
    await load();
    focusNewTextarea();
    await flush();
    clickByName('Hide toolbar');
    await flush();
    clickByName(`Hide on ${window.location.host}`);
    await flush();
    expect(hasToolbar()).toBe(false);
    expect(data.engchat_hidden_sites).toEqual([window.location.origin]);

    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(false);

    data.engchat_hidden_sites = [];
    changeListener({ engchat_hidden_sites: { newValue: [] } }, 'local');
    await flush();
    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(true);
  });

  it('hides an already visible toolbar when the site is hidden from another tab', async () => {
    await load();
    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(true);

    data.engchat_hidden_sites = [window.location.origin];
    changeListener({ engchat_hidden_sites: { newValue: data.engchat_hidden_sites } }, 'local');
    await flush();
    expect(hasToolbar()).toBe(false);
  });

  it('does not hide other origins', async () => {
    data.engchat_hidden_sites = ['https://other.example.com'];
    await load();
    focusNewTextarea();
    await flush();
    expect(hasToolbar()).toBe(true);
  });
});
