import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';

const explain = { translation: 'I agree.', explanation: { vocabulary: [], grammar: '', nuances: '' } };
const replace = () => screen.queryByRole('button', { name: 'Replace text in input' });

describe('Replace availability per mode', () => {
  it('replaces the draft with its translation', () => {
    const onInsert = vi.fn();
    render(<TranslatePopup mode="translate" originalText="Toi dong y" result={explain} isLoading={false} hasEditableTarget onInsert={onInsert} onClose={() => {}} />);
    fireEvent.click(replace()!);
    expect(onInsert).toHaveBeenCalledWith('I agree.');
  });

  it('offers no Replace for translated page text', () => {
    render(<TranslatePopup mode="translate" originalText="Read-only" result={explain} isLoading={false} onClose={() => {}} />);
    expect(replace()).toBeNull();
  });

  it('never replaces a draft with its summary', () => {
    render(<TranslatePopup mode="summary" originalText="Long draft" result="Short" isLoading={false} hasEditableTarget onClose={() => {}} />);
    expect(replace()).toBeNull();
  });

  it('keeps Replace disabled while the translation is loading', () => {
    render(<TranslatePopup mode="translate" originalText="Toi dong y" result={null} isLoading hasEditableTarget onClose={() => {}} />);
    expect((replace() as HTMLButtonElement).disabled).toBe(true);
  });
});
