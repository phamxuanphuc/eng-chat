import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';

describe('Draggable TranslatePopup with LocalStorage', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
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

  it('TC-DRAG-02: Restores position from localStorage on initial render', () => {
    localStorage.setItem('engchat_popup_position', JSON.stringify({ x: 120, y: 240 }));

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

  it('TC-DRAG-03: Drags popup to new position and persists to localStorage', () => {
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

    const saved = JSON.parse(localStorage.getItem('engchat_popup_position') || '{}');
    expect(saved.x).toBe(150);
    expect(saved.y).toBe(170);
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

    const rewriteOption = screen.getByRole('button', { name: /^rewrite$/i });
    fireEvent.click(rewriteOption);
    expect(handleModeChange).toHaveBeenCalledWith('rewrite');
  });
});
