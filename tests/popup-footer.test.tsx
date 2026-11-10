import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TranslatePopupFooter } from '../src/content/ui/TranslatePopupFooter';

describe('TranslatePopupFooter', () => {
  afterEach(() => {
    cleanup();
    delete (globalThis as any).chrome;
  });

  it('shows the active model name on the model picker button', () => {
    const onOpen = vi.fn();
    render(<TranslatePopupFooter translationText="hi" isLoading={false} modelName="gemini-3.5-flash-lite" onOpenModelPicker={onOpen} />);
    const button = screen.getByRole('button', { name: 'Open model picker' });
    expect(button.textContent).toContain('gemini-3.5-flash-lite');
    expect(button.querySelector('.truncate')?.className).toContain('max-w-[120px]');
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic label when the model name is unknown', () => {
    render(<TranslatePopupFooter translationText="hi" isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Open model picker' }).textContent).toContain('Choose AI model');
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
