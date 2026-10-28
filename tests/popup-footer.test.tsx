import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TranslatePopupFooter } from '../src/content/ui/TranslatePopupFooter';

describe('TranslatePopupFooter', () => {
  afterEach(() => {
    cleanup();
    delete (globalThis as any).chrome;
  });

  it('has no bookmark button', () => {
    render(<TranslatePopupFooter translationText="hi" isLoading={false} />);
    expect(screen.queryByRole('button', { name: /^Save$/i })).toBeNull();
  });

  it('keeps the follow-up input container unchanged when focused', () => {
    render(<TranslatePopupFooter translationText="hi" isLoading={false} />);
    const input = screen.getByRole('textbox');
    const form = input.closest('form');

    expect(form?.className).not.toContain('focus-within:ring');
    expect(form?.className).not.toContain('focus-within:border-indigo');
  });

  it('asks the service worker to open the options page', () => {
    const sendMessage = vi.fn(async () => ({ success: true }));
    (globalThis as any).chrome = { runtime: { sendMessage } };
    render(<TranslatePopupFooter translationText="hi" isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(sendMessage).toHaveBeenCalledWith({ action: 'OPEN_OPTIONS_PAGE' });
  });
});
