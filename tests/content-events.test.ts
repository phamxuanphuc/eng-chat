import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeToolbarPos, setupDOMEvents } from '../src/content/content-events';

describe('content-events', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('TC-CE-01: computeToolbarPos calculates valid coordinates within bounds', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

    const rect = { left: 200, right: 300, top: 100, bottom: 120, width: 100, height: 20 } as DOMRect;
    const pos = computeToolbarPos(rect);

    expect(pos.x).toBe(130);
    expect(pos.y).toBe(128);
  });

  it('TC-CE-02: computeToolbarPos flips above if toolbar overflows viewport bottom', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });

    const rect = { left: 200, right: 300, top: 350, bottom: 370, width: 100, height: 20 } as DOMRect;
    const pos = computeToolbarPos(rect);

    expect(pos.y).toBe(302);
  });

  it('TC-CE-03: setupDOMEvents triggers onFocus on focusin of editable input', () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const input = document.createElement('input');
    input.getBoundingClientRect = () => ({ left: 50, top: 50, width: 100, height: 30, right: 150, bottom: 80 } as DOMRect);
    document.body.appendChild(input);

    input.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(onFocus).toHaveBeenCalled();
  });

  it('TC-CE-04: setupDOMEvents triggers onSelect when text is selected in input', () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const input = document.createElement('input');
    input.value = 'Hello world';
    input.selectionStart = 0;
    input.selectionEnd = 5;
    input.getBoundingClientRect = () => ({ left: 50, top: 50, width: 100, height: 30, right: 150, bottom: 80 } as DOMRect);
    document.body.appendChild(input);

    input.dispatchEvent(new Event('select', { bubbles: false }));
    expect(onSelect).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('TC-CE-05: setupDOMEvents triggers onClickOutside on mousedown outside root host', () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const div = document.createElement('div');
    document.body.appendChild(div);

    div.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClickOutside).toHaveBeenCalled();
  });

  it('TC-CE-06: setupDOMEvents triggers onSelect when webpage text is selected on mouseup', async () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const p = document.createElement('p');
    p.textContent = 'Sample text selection on web page';
    document.body.appendChild(p);

    const range = {
      getBoundingClientRect: () => ({ left: 100, top: 100, right: 200, bottom: 120, width: 100, height: 20 } as DOMRect),
      getClientRects: () => [],
    };

    const mockSelection = {
      isCollapsed: false,
      toString: () => 'Sample text',
      getRangeAt: () => range,
      anchorNode: p,
    };

    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onSelect).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('TC-CE-07: setupDOMEvents uses the selected node bounds when range bounds are empty', async () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const p = document.createElement('p');
    p.textContent = 'Selected text';
    p.getBoundingClientRect = () => ({ left: 120, top: 80, right: 220, bottom: 100, width: 100, height: 20 } as DOMRect);
    document.body.appendChild(p);

    const range = {
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect),
      getClientRects: () => [],
    };
    const mockSelection = {
      isCollapsed: false,
      toString: () => 'Selected text',
      getRangeAt: () => range,
      anchorNode: p,
    };

    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(onSelect).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('TC-CE-08: setupDOMEvents does not trigger onClickOutside when clicking inside root host', () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const host = document.createElement('div');
    host.id = 'engchat-root-host';
    const innerBtn = document.createElement('button');
    host.appendChild(innerBtn);
    document.body.appendChild(host);

    innerBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onClickOutside).not.toHaveBeenCalled();
  });
});
