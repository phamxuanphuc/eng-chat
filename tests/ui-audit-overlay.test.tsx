import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';
import { TranslatePopupFooter } from '../src/content/ui/TranslatePopupFooter';
import { FloatingToolbar } from '../src/content/ui/FloatingToolbar';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { copyText } from '../src/services/clipboard';

const pressEscape = () => act(() => { fireEvent.keyDown(document.body, { key: 'Escape' }); });

describe('Overlay UX', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true, writable: true });
  });

  it('keeps the popup viewport-anchored instead of offset from the page origin', () => {
    render(<TranslatePopup originalText="Hi" result="Xin chào" isLoading={false} onClose={() => {}} />);
    const classes = screen.getByRole('dialog').className.split(/\s+/);
    expect(classes).toContain('fixed');
    expect(classes).not.toContain('relative');
  });

  it('labels each popup mode with its own dialog name', () => {
    render(<TranslatePopup mode="improve" originalText="Hi" result="Hello" isLoading={false} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'VinaWrite Improve Popup' })).toBeDefined();
  });

  it('closes the innermost layer first when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<TranslatePopup originalText="Hi" result="Xin chào" isLoading={false} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /select language/i }));
    expect(screen.getByRole('menu')).toBeDefined();

    pressEscape();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves between menu items with the arrow keys', () => {
    render(<TranslatePopup originalText="Hi" result="Xin chào" isLoading={false} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /select language/i }));
    const items = screen.getAllByRole('menuitem');

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it('offers retry on errors', () => {
    const onRegenerate = vi.fn();
    render(<TranslatePopup originalText="Hi" error="Quota exceeded" isLoading={false} onRegenerate={onRegenerate} onClose={() => {}} />);

    expect(screen.getByRole('alert').textContent).toContain('Quota exceeded');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('never lets Replace or Copy act on an empty result', () => {
    const onInsert = vi.fn();
    render(<TranslatePopupFooter mode="improve" translationText="" isLoading={false} hasEditableTarget onInsert={onInsert} />);

    const replace = screen.getByRole('button', { name: /replace text in input/i }) as HTMLButtonElement;
    fireEvent.click(replace);
    expect(replace.disabled).toBe(true);
    expect(onInsert).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Copy result' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('names the follow-up field and the copy action for the current mode', () => {
    render(<TranslatePopupFooter mode="rewrite" translationText="Text" isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeDefined();
    expect(screen.getByRole('textbox').getAttribute('aria-label')).toBeTruthy();
  });

  it('reports a failed copy instead of an unhandled rejection', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    (document as any).execCommand = vi.fn(() => false);
    render(<TranslatePopupFooter translationText="Text" isLoading={false} />);

    fireEvent.click(screen.getByRole('button', { name: /copy translation/i }));
    expect(await screen.findByRole('button', { name: 'Could not copy' })).toBeDefined();
  });

  it('opens the hide menu upward when there is no room below', () => {
    Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true, writable: true });
    render(<FloatingToolbar visible x={100} y={440} onSelectTone={() => {}} onHide={() => {}} siteLabel="mail.example.org" />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide toolbar' }));
    expect(screen.getByRole('menu').className).toContain('bottom-full');
  });

  it('dismisses the hide menu with Escape and themes it with the toolbar', () => {
    render(<FloatingToolbar visible theme="light" x={100} y={100} onSelectTone={() => {}} onHide={() => {}} siteLabel="mail.example.org" />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide toolbar' }));
    expect(screen.getByRole('menu').closest('[data-engchat-theme="light"]')).not.toBeNull();
    pressEscape();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('keeps the password toggle inside its field', () => {
    render(<Input label="API key" type="password" />);
    const classes = screen.getByRole('button', { name: 'Show password' }).className.split(/\s+/);
    expect(classes).toContain('absolute');
    expect(classes).not.toContain('relative');
  });

  it('keeps primary buttons on the dark palette so white text stays readable', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('data-engchat-theme')).toBe('dark');
  });
});

describe('copyText', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('falls back to a selection copy when the clipboard API is missing', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    (document as any).execCommand = vi.fn(() => true);

    await waitFor(async () => expect(await copyText('Xin chào')).toBe(true));
    expect(document.querySelector('textarea')).toBeNull();
  });
});
