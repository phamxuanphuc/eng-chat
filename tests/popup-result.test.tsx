import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PopupResult } from '../src/content/ui/PopupResult';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';

const renderResult = (explanation: any) =>
  render(<PopupResult language="en" mode="translate" text="Xin chào" explanation={explanation} isLoading={false} />);

describe('PopupResult explanation', () => {
  it('shows vocabulary notes, grammar and nuances', () => {
    renderResult({ vocabulary: [{ word: 'Hello', meaning: 'Xin chào', note: 'informal' }], grammar: 'Simple greeting.', nuances: 'Friendly register.' });
    fireEvent.click(screen.getByRole('button', { name: /analysis & vocabulary/i }));

    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('(informal)')).toBeDefined();
    expect(screen.getByText('Simple greeting.', { exact: false })).toBeDefined();
    expect(screen.getByText('Nuance:')).toBeDefined();
    expect(screen.getByText('Friendly register.', { exact: false })).toBeDefined();
  });

  it('hides the analysis toggle when there is nothing to explain', () => {
    renderResult({ vocabulary: [], grammar: '', nuances: '' });
    expect(screen.queryByRole('button', { name: /analysis & vocabulary/i })).toBeNull();
  });

  it('survives a malformed explanation', () => {
    renderResult({ vocabulary: 'none', grammar: 12, nuances: null });
    expect(screen.getByText('Xin chào')).toBeDefined();
    expect(screen.queryByRole('button', { name: /analysis & vocabulary/i })).toBeNull();
  });
});

describe('TranslatePopup result safety', () => {
  it('renders the empty state instead of crashing on an unexpected result shape', () => {
    render(<TranslatePopup originalText="Hello" result={{ text: 'wrong shape' } as any} isLoading={false} onClose={() => {}} />);
    expect(screen.getByText('No translation yet.')).toBeDefined();
  });
});

describe('PopupResult changes view', () => {
  const renderImprove = (props: Partial<React.ComponentProps<typeof PopupResult>> = {}) =>
    render(
      <PopupResult language="en" mode="improve" originalText="She go home" text="She goes home" isLoading={false} {...props} />
    );

  it('offers a toggle and shows additions and deletions when it is on', () => {
    const { container } = renderImprove();
    const toggle = screen.getByRole('button', { name: 'Show changes' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[data-diff]')).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide changes' }).getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-diff="removed"]')?.textContent).toBe('go');
    expect(container.querySelector('[data-diff="removed"]')?.className).toContain('line-through');
    expect(container.querySelector('[data-diff="added"]')?.textContent).toBe('goes');
    expect(container.querySelector('[data-diff="added"]')?.className).toContain('bg-emerald-500/15');

    fireEvent.click(screen.getByRole('button', { name: 'Hide changes' }));
    expect(container.querySelector('[data-diff]')).toBeNull();
    expect(screen.getByText('She goes home')).toBeDefined();
  });

  it('is also available for rewrite', () => {
    renderImprove({ mode: 'rewrite' });
    expect(screen.getByRole('button', { name: 'Show changes' })).toBeDefined();
  });

  it.each(['translate', 'summary'] as const)('is not offered for %s', (mode) => {
    renderImprove({ mode });
    expect(screen.queryByRole('button', { name: /changes/i })).toBeNull();
  });

  it('is hidden while loading, on errors and without a result', () => {
    const { rerender } = renderImprove({ isLoading: true });
    expect(screen.queryByRole('button', { name: /changes/i })).toBeNull();
    rerender(<PopupResult language="en" mode="improve" originalText="a" text="b" isLoading={false} error="Failed" />);
    expect(screen.queryByRole('button', { name: /changes/i })).toBeNull();
    rerender(<PopupResult language="en" mode="improve" originalText="a" text="" isLoading={false} />);
    expect(screen.queryByRole('button', { name: /changes/i })).toBeNull();
  });

  it('is hidden when the texts are too long to compare', () => {
    const long = Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ');
    renderImprove({ originalText: long, text: long + ' extra' });
    expect(screen.queryByRole('button', { name: /changes/i })).toBeNull();
  });

  it('keeps copy and replace on the clean result in the popup', () => {
    const onInsert = vi.fn();
    render(
      <TranslatePopup mode="improve" originalText="She go home" result="She goes home" isLoading={false} hasEditableTarget onInsert={onInsert} onClose={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show changes' }));
    fireEvent.click(screen.getByRole('button', { name: /replace text in input/i }));
    expect(onInsert).toHaveBeenCalledWith('She goes home');
  });
});
