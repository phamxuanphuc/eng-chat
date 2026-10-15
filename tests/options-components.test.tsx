import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ModelSelector } from '../src/options/ModelSelector';
import { ProviderSelector } from '../src/options/ProviderSelector';

describe('Options Sub-Components', () => {
  it('TC-OC-01: ModelSelector renders all models and calls onSelectModel when clicked', () => {
    const onSelect = vi.fn();
    render(
      <ModelSelector
        selectedModel="gemini-3.5-flash-lite"
        onSelectModel={onSelect}
      />
    );

    expect(screen.getAllByText('Gemini 3.5 Flash-Lite').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Gemini 3.5 Flash')).toBeDefined();

    const flashOption = screen.getByText('Gemini 3.5 Flash');
    fireEvent.click(flashOption);

    expect(onSelect).toHaveBeenCalledWith('gemini-3.5-flash');
  });

  it('TC-OC-02: ProviderSelector switches between Gemini and OpenAI compatible providers', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <ProviderSelector
        provider="gemini"
        onSelectProvider={onSelect}
      />
    );

    const customBtn = screen.getByText('Custom LLM');
    fireEvent.click(customBtn);
    expect(onSelect).toHaveBeenCalledWith('openai_compatible');

    rerender(
      <ProviderSelector
        provider="openai_compatible"
        onSelectProvider={onSelect}
      />
    );

    const geminiBtn = screen.getByText('Google Gemini');
    fireEvent.click(geminiBtn);
    expect(onSelect).toHaveBeenCalledWith('gemini');
  });
});
