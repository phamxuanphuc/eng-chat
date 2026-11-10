import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';
import { applyOverlayPrefs, getOverlayPrefs } from '../src/content/overlay-prefs';

describe('Draggable TranslatePopup with stored overlay preferences', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    applyOverlayPrefs(null);
    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  it('TC-DRAG-01: Renders drag handle in header and default position when no saved pos', () => {
    const { container } = render(
      <TranslatePopup
        originalText="Original query"
        result="Bản dịch kiểm tra"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const dragHandle = screen.getByTestId('drag-handle');
    expect(dragHandle).toBeDefined();

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.classList.contains('bottom-6')).toBe(true);
    expect(dialog.classList.contains('right-6')).toBe(true);
  });

  it('TC-DRAG-02: Restores position from the stored preferences on initial render', () => {
    applyOverlayPrefs({ popupPosition: { x: 120, y: 240 } });

    const { container } = render(
      <TranslatePopup
        originalText="Original query"
        result="Bản dịch kiểm tra"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.style.left).toBe('120px');
    expect(dialog.style.top).toBe('240px');
  });

  it('TC-DRAG-03: Drags popup to new position and persists it in the preferences', () => {
    const { container } = render(
      <TranslatePopup
        originalText="Original query"
        result="Bản dịch kiểm tra"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 560,
      bottom: 400,
      width: 460,
      height: 300,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    const dragHandle = screen.getByTestId('drag-handle');
    fireEvent.mouseDown(dragHandle, { clientX: 200, clientY: 110, button: 0 });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 180 }));
    });

    expect(dialog.style.left).toBe('150px');
    expect(dialog.style.top).toBe('170px');

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(getOverlayPrefs().popupPosition).toEqual({ x: 150, y: 170 });
  });

  it('TC-DRAG-04: Clamps position to keep popup within window boundaries', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });

    const { container } = render(
      <TranslatePopup
        originalText="Original query"
        result="Bản dịch kiểm tra"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 560,
      bottom: 400,
      width: 460,
      height: 300,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    const dragHandle = screen.getByTestId('drag-handle');
    fireEvent.mouseDown(dragHandle, { clientX: 100, clientY: 100, button: 0 });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: -500, clientY: -500 }));
    });

    expect(dialog.style.left).toBe('8px');
    expect(dialog.style.top).toBe('8px');

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 2000, clientY: 2000 }));
    });

    expect(dialog.style.left).toBe(`${1024 - 460 - 8}px`);
    expect(dialog.style.top).toBe(`${768 - 300 - 8}px`);

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
  });

  it('TC-DRAG-05: Renders Improve mode with Improve it header and Replace button', () => {
    const handleInsert = vi.fn();
    render(
      <TranslatePopup
        mode="improve"
        originalText="Original input text"
        result="Improved polished text"
        isLoading={false}
        hasEditableTarget={true}
        onInsert={handleInsert}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Improve it')).toBeDefined();
    expect(screen.getByPlaceholderText('Tell me how to improve... ↵')).toBeDefined();

    const replaceBtn = screen.getByRole('button', { name: /replace text in input/i });
    expect(replaceBtn).toBeDefined();

    fireEvent.click(replaceBtn);
    expect(handleInsert).toHaveBeenCalledWith('Improved polished text');
  });

  it('TC-DRAG-06: Header mode menu switches between Improve it, Rewrite, and Translate', () => {
    const handleModeChange = vi.fn();
    render(
      <TranslatePopup
        mode="improve"
        originalText="Original input text"
        result="Improved text"
        isLoading={false}
        onModeChange={handleModeChange}
        onClose={() => {}}
      />
    );

    const modeBtn = screen.getByText('Improve it');
    fireEvent.click(modeBtn);

    const rewriteOption = screen.getByRole('menuitem', { name: /^rewrite$/i });
    fireEvent.click(rewriteOption);
    expect(handleModeChange).toHaveBeenCalledWith('rewrite');
  });

  describe('anchored placement', () => {
    const dialogFor = (anchor: { x: number; y: number; top?: number } | null) => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
      const { container } = render(
        <TranslatePopup originalText="Text" result="Result" isLoading={false} anchor={anchor} onClose={() => {}} />
      );
      return container.querySelector('[role="dialog"]') as HTMLElement;
    };

    it('opens right below the anchor', () => {
      const dialog = dialogFor({ x: 100, y: 200, top: 180 });
      expect(dialog.style.left).toBe('100px');
      expect(dialog.style.top).toBe('200px');
      expect(dialog.classList.contains('bottom-6')).toBe(false);
    });

    it('clamps horizontally into the viewport', () => {
      const dialog = dialogFor({ x: 900, y: 200, top: 180 });
      expect(dialog.style.left).toBe(`${1024 - 560 - 8}px`);
    });

    it('opens above the anchor when there is no room below', () => {
      const dialog = dialogFor({ x: 100, y: 700, top: 680 });
      expect(dialog.style.top).toBe(`${680 - 8 - 300}px`);
    });

    it('keeps the position the user dragged to over the anchor', () => {
      applyOverlayPrefs({ popupPosition: { x: 120, y: 240 } });
      const dialog = dialogFor({ x: 100, y: 200, top: 180 });
      expect(dialog.style.left).toBe('120px');
      expect(dialog.style.top).toBe('240px');
    });

    it('falls back to the bottom-right corner without an anchor', () => {
      const dialog = dialogFor(null);
      expect(dialog.classList.contains('bottom-6')).toBe(true);
      expect(dialog.classList.contains('right-6')).toBe(true);
    });
  });
});
