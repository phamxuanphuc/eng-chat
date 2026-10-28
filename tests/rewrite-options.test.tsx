import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RewriteOptionsPanel } from '../src/content/ui/RewriteOptionsPanel';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';
import { DEFAULT_REWRITE_OPTIONS } from '../src/types';

describe('RewriteOptionsPanel Component', () => {
  it('TC-RO-01: Renders all 4 categories with base chips', () => {
    const handleChange = vi.fn();
    const handleClose = vi.fn();

    render(
      <RewriteOptionsPanel
        options={DEFAULT_REWRITE_OPTIONS}
        onChange={handleChange}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Length')).toBeDefined();
    expect(screen.getByText('Formality')).toBeDefined();
    expect(screen.getByText('Format')).toBeDefined();
    expect(screen.getByText('Tone')).toBeDefined();

    expect(screen.getByRole('button', { name: /^Short$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Casual$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Email$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Enthusiastic$/i })).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close options/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('TC-RO-02: Clicking a chip triggers onChange with updated options', () => {
    const handleChange = vi.fn();

    render(
      <RewriteOptionsPanel
        options={DEFAULT_REWRITE_OPTIONS}
        onChange={handleChange}
        onClose={() => {}}
      />
    );

    const formalBtn = screen.getByRole('button', { name: /^Formal$/i });
    fireEvent.click(formalBtn);
    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      formality: 'Formal',
    });

    const emailBtn = screen.getByRole('button', { name: /^Email$/i });
    fireEvent.click(emailBtn);
    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      format: 'Email',
    });
  });

  it('TC-RO-03: Adding custom format via inline form updates options', () => {
    const handleChange = vi.fn();

    render(
      <RewriteOptionsPanel
        options={DEFAULT_REWRITE_OPTIONS}
        onChange={handleChange}
        onClose={() => {}}
      />
    );

    const addFormatBtn = screen.getByRole('button', { name: /add format/i });
    fireEvent.click(addFormatBtn);

    const input = screen.getByPlaceholderText(/format\.\.\./i);
    fireEvent.change(input, { target: { value: 'Slack Message' } });
    fireEvent.submit(input.closest('form')!);

    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      format: 'Slack Message',
    });
  });

  it('TC-RO-04: Adding custom tone via inline form updates options', () => {
    const handleChange = vi.fn();

    render(
      <RewriteOptionsPanel
        options={DEFAULT_REWRITE_OPTIONS}
        onChange={handleChange}
        onClose={() => {}}
      />
    );

    const addToneBtn = screen.getByRole('button', { name: /add tone/i });
    fireEvent.click(addToneBtn);

    const input = screen.getByPlaceholderText(/tone\.\.\./i);
    fireEvent.change(input, { target: { value: 'Persuasive' } });
    fireEvent.submit(input.closest('form')!);

    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      tone: 'Persuasive',
    });
  });

  it('TC-RO-05: TranslatePopup integrates Length & format button and opens panel', () => {
    const handleRewriteOptionsChange = vi.fn();

    render(
      <TranslatePopup
        mode="rewrite"
        originalText="Original content"
        result="Rewritten content"
        isLoading={false}
        rewriteOptions={DEFAULT_REWRITE_OPTIONS}
        onRewriteOptionsChange={handleRewriteOptionsChange}
        onClose={() => {}}
      />
    );

    const lengthFormatBtn = screen.getByRole('button', { name: /length & format/i });
    expect(lengthFormatBtn).toBeDefined();

    fireEvent.click(lengthFormatBtn);
    expect(screen.getByRole('region', { name: /rewrite style options/i })).toBeDefined();

    const shortBtn = screen.getByRole('button', { name: /^Short$/i });
    fireEvent.click(shortBtn);

    expect(handleRewriteOptionsChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      length: 'Short',
    });
  });

  it('TC-RO-06: Displays all current rewrite values in the popup header and opens the editor', () => {
    const handleRewriteOptionsChange = vi.fn();
    render(
      <TranslatePopup
        mode="rewrite"
        originalText="Original content"
        result="Rewritten content"
        isLoading={false}
        rewriteOptions={{ length: 'Short', formality: 'Formal', format: 'Email', tone: 'Enthusiastic' }}
        onRewriteOptionsChange={handleRewriteOptionsChange}
        onClose={() => {}}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /Rewrite Popup/i });
    const styleButton = screen.getByRole('button', { name: /Length & format/i });
    fireEvent.click(styleButton);
    expect(dialog).toBeDefined();
    const panelHeading = 'Style & Format Options';
    expect(screen.getAllByText(panelHeading).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Short' }));
    fireEvent.click(screen.getByRole('button', { name: 'Formal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Email' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enthusiastic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close options' }));

    fireEvent.click(styleButton);
    expect(screen.getAllByText(panelHeading).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Humorous' }));
    expect(handleRewriteOptionsChange).toHaveBeenCalledWith({
      length: 'Short',
      formality: 'Formal',
      format: 'Email',
      tone: 'Humorous',
    });
  });

  it('TC-RO-07: Light theme uses readable chip colors in the popup header', () => {
    render(
      <TranslatePopup
        mode="rewrite"
        theme="light"
        originalText="Original content"
        result="Rewritten content"
        isLoading={false}
        rewriteOptions={{ length: 'Short', formality: 'Auto', format: 'Email', tone: 'Auto' }}
        onRewriteOptionsChange={() => {}}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Length & format/i }));
    const optionButtons = screen.getAllByRole('button');
    const selectedChip = optionButtons.find((button) => button.textContent === 'Short');
    const autoChip = optionButtons.find((button) => button.textContent === 'Auto' && button.className.includes('bg-slate-100'));
    expect(selectedChip?.className).toContain('bg-indigo-50');
    expect(selectedChip?.className).toContain('text-indigo-700');
    expect(selectedChip?.className).toContain('border-indigo-400');
    expect(autoChip?.className).toContain('bg-slate-100');
    expect(autoChip?.className).toContain('text-slate-700');
    expect(autoChip?.className).toContain('border-slate-200');
  });

  it('TC-RO-08: Header remains sticky on top with scrollable chip body', () => {
    const { container } = render(
      <RewriteOptionsPanel
        options={DEFAULT_REWRITE_OPTIONS}
        onChange={() => {}}
        onClose={() => {}}
      />
    );

    const stickyHeader = container.querySelector('.sticky.top-0');
    expect(stickyHeader).not.toBeNull();
    expect(stickyHeader?.textContent).toContain('Style & Format Options');

    const scrollBody = container.querySelector('.overflow-y-auto');
    expect(scrollBody).not.toBeNull();
  });
});
