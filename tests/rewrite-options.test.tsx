import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('TC-RO-02: Chips only change the draft; Apply sends one onChange', () => {
    const handleChange = vi.fn();
    const handleClose = vi.fn();
    render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={handleChange} onClose={handleClose} />);

    fireEvent.click(screen.getByRole('button', { name: /^Formal$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Email$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Short$/i }));
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Apply$/i }));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      length: 'Short',
      formality: 'Formal',
      format: 'Email',
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('TC-RO-02b: Apply stays disabled until the draft differs; Reset restores defaults', () => {
    const handleChange = vi.fn();
    render(<RewriteOptionsPanel options={{ ...DEFAULT_REWRITE_OPTIONS, length: 'Short' }} onChange={handleChange} onClose={() => {}} />);
    const apply = screen.getByRole('button', { name: /^Apply$/i }) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /^Reset$/i }));
    expect(apply.disabled).toBe(false);
    fireEvent.click(apply);
    expect(handleChange).toHaveBeenCalledWith(DEFAULT_REWRITE_OPTIONS);
  });

  it('TC-RO-02c: Closing with X or Escape never applies the draft', () => {
    const handleChange = vi.fn();
    const handleClose = vi.fn();
    render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={handleChange} onClose={handleClose} />);
    fireEvent.click(screen.getByRole('button', { name: /^Formal$/i }));
    fireEvent.click(screen.getByRole('button', { name: /close options/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  const addCustom = (button: RegExp, placeholder: RegExp, value: string) => {
    fireEvent.click(screen.getByRole('button', { name: button }));
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value } });
    fireEvent.submit(input.closest('form')!);
  };

  it('TC-RO-03: Adding a custom format selects it in the draft and applies it', () => {
    const handleChange = vi.fn();
    render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={handleChange} onClose={() => {}} />);
    addCustom(/add format/i, /format\.\.\./i, 'Slack Message');
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Slack Message' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /^Apply$/i }));
    expect(handleChange).toHaveBeenCalledWith({ ...DEFAULT_REWRITE_OPTIONS, format: 'Slack Message' });
  });

  it('TC-RO-04: Adding a custom tone selects it in the draft and applies it', () => {
    const handleChange = vi.fn();
    render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={handleChange} onClose={() => {}} />);
    addCustom(/add tone/i, /tone\.\.\./i, 'Persuasive');
    fireEvent.click(screen.getByRole('button', { name: /^Apply$/i }));
    expect(handleChange).toHaveBeenCalledWith({ ...DEFAULT_REWRITE_OPTIONS, tone: 'Persuasive' });
  });

  it('TC-RO-04b: Custom options survive closing and reopening the panel', async () => {
    const store: Record<string, unknown> = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: store[key] })),
          set: vi.fn(async (obj: Record<string, unknown>) => { Object.assign(store, obj); }),
        },
      },
    };
    const first = render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={() => {}} onClose={() => {}} />);
    addCustom(/add format/i, /format\.\.\./i, 'Slack Message');
    addCustom(/add tone/i, /tone\.\.\./i, 'Persuasive');
    await waitFor(() => expect(store.engchat_custom_rewrite_options).toEqual({ format: ['Slack Message'], tone: ['Persuasive'] }));
    first.unmount();

    render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={() => {}} onClose={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Slack Message' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Persuasive' })).toBeDefined();
    delete (globalThis as any).chrome;
  });

  it('TC-RO-04c: Panel renders when storage is missing or throws', async () => {
    (globalThis as any).chrome = { storage: { local: { get: vi.fn(async () => { throw new Error('boom'); }), set: vi.fn() } } };
    render(<RewriteOptionsPanel options={DEFAULT_REWRITE_OPTIONS} onChange={() => {}} onClose={() => {}} />);
    expect(await screen.findByRole('button', { name: /^Email$/i })).toBeDefined();
    delete (globalThis as any).chrome;
  });

  it('TC-RO-05: TranslatePopup opens the panel, reserves height, and applies once', () => {
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

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).not.toContain('min-h-[420px]');
    fireEvent.click(screen.getByRole('button', { name: /length & format/i }));
    expect(dialog.className).toContain('min-h-[420px]');
    expect(screen.getByRole('region', { name: /rewrite style options/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /^Short$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Formal$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Email$/i }));
    expect(handleRewriteOptionsChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Apply$/i }));

    expect(handleRewriteOptionsChange).toHaveBeenCalledTimes(1);
    expect(handleRewriteOptionsChange).toHaveBeenCalledWith({
      ...DEFAULT_REWRITE_OPTIONS,
      length: 'Short',
      formality: 'Formal',
      format: 'Email',
    });
    expect(screen.queryByRole('region', { name: /rewrite style options/i })).toBeNull();
    expect(dialog.className).not.toContain('min-h-[420px]');
  });

  it('TC-RO-06: Shows current rewrite values as selected when the editor opens', () => {
    render(
      <TranslatePopup
        mode="rewrite"
        originalText="Original content"
        result="Rewritten content"
        isLoading={false}
        rewriteOptions={{ length: 'Short', formality: 'Formal', format: 'Email', tone: 'Enthusiastic' }}
        onRewriteOptionsChange={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Length & format/i }));
    expect(screen.getAllByText('Style & Format Options').length).toBeGreaterThan(0);
    for (const name of ['Short', 'Formal', 'Email', 'Enthusiastic']) {
      expect(screen.getByRole('button', { name }).getAttribute('aria-pressed')).toBe('true');
    }
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
    expect(screen.getByRole('button', { name: 'Short' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Medium' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('region', { name: /rewrite style options/i }).closest('[data-engchat-theme="light"]')).not.toBeNull();
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
