import React from 'react';
import { describe, expect, it } from 'vitest';
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
