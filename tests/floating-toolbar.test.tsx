import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FloatingToolbar } from '../src/content/ui/FloatingToolbar';

describe('FloatingToolbar Component', () => {
  it('TC-FT-01: Does not render when visible is false', () => {
    const onSelectTone = vi.fn();
    const { container } = render(
      <FloatingToolbar
        visible={false}
        x={100}
        y={200}
        onSelectTone={onSelectTone}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('TC-FT-02: Renders toolbar and triggers quick polish and AI optimize', () => {
    const onSelectTone = vi.fn();
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        onSelectTone={onSelectTone}
      />
    );

    const polishBtn = screen.getByRole('button', { name: /rewrite text/i });
    fireEvent.click(polishBtn);
    expect(onSelectTone).toHaveBeenCalledWith('professional', 'rewrite');

    const optimizeBtn = screen.getByRole('button', { name: /ai optimize/i });
    fireEvent.click(optimizeBtn);
    expect(onSelectTone).toHaveBeenCalledWith('polite');
  });

  it('TC-FT-03: Opens tone dropdown and selects specific tone', () => {
    const onSelectTone = vi.fn();
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        onSelectTone={onSelectTone}
      />
    );

    const dropdownBtn = screen.getByRole('button', { name: /more options/i });
    fireEvent.click(dropdownBtn);

    const conciseOption = screen.getByText(/ngắn gọn \(concise\)/i);
    fireEvent.click(conciseOption);
    expect(onSelectTone).toHaveBeenCalledWith('concise');
  });

  it('TC-FT-04: Disables buttons when isLoading is true', () => {
    const onSelectTone = vi.fn();
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        isLoading={true}
        onSelectTone={onSelectTone}
      />
    );

    const polishBtn = screen.getByRole('button', { name: /rewrite text/i });
    expect(polishBtn.hasAttribute('disabled')).toBe(true);

    const optimizeBtn = screen.getByRole('button', { name: /ai optimize/i });
    expect(optimizeBtn.hasAttribute('disabled')).toBe(true);
  });

  it('TC-FT-05: Clicking translate button directly triggers translate_explain to open popup', () => {
    const onSelectTone = vi.fn();
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        onSelectTone={onSelectTone}
      />
    );

    const translateBtn = screen.getByRole('button', { name: /dịch & giải thích/i });
    fireEvent.click(translateBtn);
    expect(onSelectTone).toHaveBeenCalledWith('translate_explain', 'translate');
  });
});
