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

    expect(pos.x).toBe(135);
    expect(pos.y).toBe(128);
  });

  it('TC-CE-02: computeToolbarPos flips above if toolbar overflows viewport bottom', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });

    const rect = { left: 200, right: 300, top: 350, bottom: 370, width: 100, height: 20 } as DOMRect;
    const pos = computeToolbarPos(rect);

    expect(pos.y).toBe(296);
  });

  it('TC-CE-03: setupDOMEvents triggers onFocus on focusin of editable input', () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const input = document.createElement('input');
    input.value = 'Hello';
    input.getBoundingClientRect = () => ({ left: 50, top: 50, width: 100, height: 30, right: 150, bottom: 80 } as DOMRect);
    document.body.appendChild(input);

    input.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(onFocus).toHaveBeenCalled();
  });

  describe('viewport changes', () => {
    const frames = () => new Promise((resolve) => setTimeout(resolve, 40));

    it('batches scroll and resize into one callback per frame', async () => {
      const onViewportChange = vi.fn();
      setupDOMEvents({ onFocus: vi.fn(), onSelect: vi.fn(), onClickOutside: vi.fn(), onViewportChange });
      document.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      await frames();
      expect(onViewportChange).toHaveBeenCalledTimes(1);
      window.dispatchEvent(new Event('resize'));
      await frames();
      expect(onViewportChange).toHaveBeenCalledTimes(2);
    });

    it('catches scrolls from nested containers', async () => {
      const onViewportChange = vi.fn();
      setupDOMEvents({ onFocus: vi.fn(), onSelect: vi.fn(), onClickOutside: vi.fn(), onViewportChange });
      const inner = document.createElement('div');
      document.body.appendChild(inner);
      inner.dispatchEvent(new Event('scroll'));
      await frames();
      expect(onViewportChange).toHaveBeenCalledTimes(1);
    });

    it('removes listeners and the pending frame on cleanup', async () => {
      const onViewportChange = vi.fn();
      const cleanup = setupDOMEvents({ onFocus: vi.fn(), onSelect: vi.fn(), onClickOutside: vi.fn(), onViewportChange });
      document.dispatchEvent(new Event('scroll'));
      cleanup();
      document.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      await frames();
      expect(onViewportChange).not.toHaveBeenCalled();
    });
  });

  describe('focus toolbar only for fields with text', () => {
    const box = () => ({ left: 50, top: 50, width: 100, height: 30, right: 150, bottom: 80 } as DOMRect);
    const makeField = (tag: 'input' | 'textarea', value = '') => {
      const field = document.createElement(tag);
      field.value = value;
      field.getBoundingClientRect = box;
      document.body.appendChild(field);
      return field;
    };

    it('ignores focus on an empty or whitespace-only field', () => {
      const onFocus = vi.fn();
      setupDOMEvents({ onFocus, onSelect: vi.fn(), onClickOutside: vi.fn() });
      makeField('input').dispatchEvent(new Event('focusin', { bubbles: true }));
      makeField('textarea', '   ').dispatchEvent(new Event('focusin', { bubbles: true }));
      expect(onFocus).not.toHaveBeenCalled();
    });

    it('ignores focus on an empty contenteditable but accepts one with text', () => {
      const onFocus = vi.fn();
      setupDOMEvents({ onFocus, onSelect: vi.fn(), onClickOutside: vi.fn() });
      const empty = document.createElement('div');
      empty.setAttribute('contenteditable', 'true');
      empty.getBoundingClientRect = box;
      const filled = empty.cloneNode() as HTMLElement;
      filled.textContent = 'Some text';
      filled.getBoundingClientRect = box;
      document.body.append(empty, filled);
      empty.dispatchEvent(new Event('focusin', { bubbles: true }));
      expect(onFocus).not.toHaveBeenCalled();
      filled.dispatchEvent(new Event('focusin', { bubbles: true }));
      expect(onFocus).toHaveBeenCalledWith(expect.anything(), filled);
    });

    it('shows the toolbar after the first typed character in a focused empty field', () => {
      const onFocus = vi.fn();
      setupDOMEvents({ onFocus, onSelect: vi.fn(), onClickOutside: vi.fn() });
      const field = makeField('textarea');
      field.focus();
      field.dispatchEvent(new Event('focusin', { bubbles: true }));
      expect(onFocus).not.toHaveBeenCalled();
      field.value = 'H';
      field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      expect(onFocus).toHaveBeenCalledTimes(1);
      field.value = 'Hi';
      field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('does not announce a typed sensitive field', () => {
      const onFocus = vi.fn();
      setupDOMEvents({ onFocus, onSelect: vi.fn(), onClickOutside: vi.fn() });
      const field = makeField('input');
      field.setAttribute('type', 'password');
      field.value = 'secret';
      field.focus();
      field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      expect(onFocus).not.toHaveBeenCalled();
    });
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

  it('TC-CE-08: setupDOMEvents retries selection after delayed browser updates', async () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const p = document.createElement('p');
    p.textContent = 'Delayed selection';
    document.body.appendChild(p);
    const range = {
      getBoundingClientRect: () => ({ left: 40, top: 40, right: 180, bottom: 60, width: 140, height: 20 } as DOMRect),
      getClientRects: () => [],
    };
    const selection = { isCollapsed: false, toString: () => 'Delayed selection', getRangeAt: () => range, anchorNode: p };
    let ready = false;
    vi.spyOn(window, 'getSelection').mockImplementation(() => (ready ? selection : null) as any);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    setTimeout(() => { ready = true; }, 75);
    await new Promise((resolve) => setTimeout(resolve, 280));

    expect(onSelect).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('TC-CE-09: setupDOMEvents does not trigger onClickOutside when clicking inside root host', () => {
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

  it('TC-CE-10: captures selection events during the capture phase', async () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });

    const p = document.createElement('p');
    p.textContent = 'Captured selection';
    document.body.appendChild(p);
    const range = {
      getBoundingClientRect: () => ({ left: 20, top: 20, right: 160, bottom: 40, width: 140, height: 20 } as DOMRect),
      getClientRects: () => [],
    };
    const selection = { isCollapsed: false, toString: () => 'Captured selection', getRangeAt: () => range, anchorNode: p };
    vi.spyOn(window, 'getSelection').mockReturnValue(selection as any);

    p.addEventListener('mouseup', (event) => event.stopPropagation());
    p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onSelect).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('TC-CE-11: removes listeners and pending selection checks on cleanup', async () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    const cleanup = setupDOMEvents({ onFocus, onSelect, onClickOutside });
    cleanup();

    const input = document.createElement('input');
    input.getBoundingClientRect = () => ({ left: 50, top: 50, width: 100, height: 30, right: 150, bottom: 80 } as DOMRect);
    document.body.appendChild(input);
    input.dispatchEvent(new Event('focusin', { bubbles: true }));
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onFocus).not.toHaveBeenCalled();
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it('TC-CE-12: ignores selectionchange events without an active selection', () => {
    const onFocus = vi.fn();
    const onSelect = vi.fn();
    const onClickOutside = vi.fn();

    setupDOMEvents({ onFocus, onSelect, onClickOutside });
    vi.spyOn(window, 'getSelection').mockReturnValue({
      isCollapsed: true,
      toString: () => '',
    } as any);

    document.dispatchEvent(new Event('selectionchange'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
