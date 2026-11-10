import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSensitiveField } from '../src/content/dom-utils';
import { setupDOMEvents } from '../src/content/content-events';

const makeInput = (attrs: Record<string, string> = {}, tag = 'input') => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.getBoundingClientRect = () => ({ left: 50, top: 50, width: 100, height: 30, right: 150, bottom: 80 } as DOMRect);
  document.body.appendChild(el);
  return el as HTMLInputElement;
};

describe('isSensitiveField', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    [{ type: 'password' }],
    [{ type: 'email' }],
    [{ type: 'tel' }],
    [{ type: 'number' }],
    [{ type: 'url' }],
    [{ type: 'text', autocomplete: 'username' }],
    [{ type: 'text', autocomplete: 'one-time-code' }],
    [{ type: 'text', autocomplete: 'cc-number' }],
    [{ type: 'text', name: 'user_email' }],
    [{ type: 'text', id: 'login-password' }],
    [{ type: 'text', name: 'otp' }],
  ])('flags %o as sensitive', (attrs) => {
    expect(isSensitiveField(makeInput(attrs))).toBe(true);
  });

  it.each([
    [{}],
    [{ type: 'text' }],
    [{ type: 'search' }],
    [{ type: 'text', name: 'message' }],
    [{ type: 'text', id: 'shipping-notes', autocomplete: 'off' }],
  ])('keeps %o usable', (attrs) => {
    expect(isSensitiveField(makeInput(attrs))).toBe(false);
  });

  it('never flags textareas, contenteditable, null or non-input elements', () => {
    expect(isSensitiveField(makeInput({ name: 'password' }, 'textarea'))).toBe(false);
    expect(isSensitiveField(makeInput({ contenteditable: 'true' }, 'div'))).toBe(false);
    expect(isSensitiveField(null)).toBe(false);
    expect(isSensitiveField(undefined)).toBe(false);
  });
});

describe('floating bar events on sensitive fields', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const setup = () => {
    const cb = { onFocus: vi.fn(), onSelect: vi.fn(), onClickOutside: vi.fn(), onSensitiveField: vi.fn() };
    const cleanup = setupDOMEvents(cb);
    return { cb, cleanup };
  };

  it('does not show the toolbar on focus and asks to hide it instead', () => {
    const { cb, cleanup } = setup();
    const pass = makeInput({ type: 'password' });
    pass.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(cb.onFocus).not.toHaveBeenCalled();
    expect(cb.onSensitiveField).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('does not show the toolbar when text is selected inside a login field', () => {
    const { cb, cleanup } = setup();
    const email = makeInput({ type: 'text', name: 'email' });
    email.value = 'someone@example.com';
    email.focus();
    email.setSelectionRange(0, 7);
    email.dispatchEvent(new Event('select'));
    expect(cb.onSelect).not.toHaveBeenCalled();
    cleanup();
  });

  it('selection check fires for the same setup on a normal field', () => {
    const { cb, cleanup } = setup();
    const note = makeInput({ type: 'text', name: 'note' });
    note.value = 'hello world';
    note.focus();
    note.setSelectionRange(0, 5);
    note.dispatchEvent(new Event('select'));
    expect(cb.onSelect).toHaveBeenCalled();
    cleanup();
  });

  it('still shows the toolbar for a normal text input and textarea', () => {
    const { cb, cleanup } = setup();
    const message = makeInput({ type: 'text', name: 'message' });
    message.value = 'Hello';
    message.dispatchEvent(new Event('focusin', { bubbles: true }));
    const area = makeInput({}, 'textarea');
    area.value = 'Hello';
    area.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(cb.onFocus).toHaveBeenCalledTimes(2);
    expect(cb.onSensitiveField).not.toHaveBeenCalled();
    cleanup();
  });
});
