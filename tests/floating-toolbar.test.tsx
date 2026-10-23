import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FloatingToolbar } from '../src/content/ui/FloatingToolbar';
import { ContentOverlay } from '../src/content/ui/ContentOverlay';
import { loadToolbarCollapsed, saveToolbarCollapsed } from '../src/content/overlay-state';

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

  it('TC-FT-02: Renders toolbar with tooltips and triggers quick polish', () => {
    const onSelectTone = vi.fn();
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        onSelectTone={onSelectTone}
      />
    );

    expect(screen.getByRole('tooltip', { name: 'Improve text' })).toBeDefined();
    expect(screen.getByRole('tooltip', { name: 'Translate and explain' })).toBeDefined();
    expect(screen.getByRole('tooltip', { name: 'Rewrite text' })).toBeDefined();
    expect(screen.getByRole('tooltip', { name: 'Summarize text' })).toBeDefined();

    const polishBtn = screen.getByRole('button', { name: /rewrite text/i });
    fireEvent.click(polishBtn);
    expect(onSelectTone).toHaveBeenCalledWith('professional', 'rewrite');
  });

  it('TC-FT-03: Removes the overflow and standalone optimize buttons', () => {
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        onSelectTone={() => {}}
      />
    );

    expect(screen.queryByRole('button', { name: /more options/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /ai optimize/i })).toBeNull();
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

    const improveBtn = screen.getByRole('button', { name: /improve text/i });
    expect(improveBtn.hasAttribute('disabled')).toBe(true);
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

    const translateBtn = screen.getByRole('button', { name: /translate and explain/i });
    fireEvent.click(translateBtn);
    expect(onSelectTone).toHaveBeenCalledWith('translate_explain', 'translate');
  });

  it('TC-FT-06: Clicking summary triggers Vietnamese summary mode', () => {
    const onSelectTone = vi.fn();
    render(<FloatingToolbar visible={true} x={150} y={250} onSelectTone={onSelectTone} />);

    fireEvent.click(screen.getByRole('button', { name: /summarize text/i }));
    expect(onSelectTone).toHaveBeenCalledWith('summarize', 'summary');
  });

  it('TC-FT-07: Renders light theme with light background styling', () => {
    const onSelectTone = vi.fn();
    const { container } = render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        theme="light"
        onSelectTone={onSelectTone}
      />
    );

    const toolbarEl = container.querySelector('.bg-white');
    expect(toolbarEl).not.toBeNull();
  });

  it('TC-FT-07: Renders dark theme by default with dark background styling', () => {
    const onSelectTone = vi.fn();
    const { container } = render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        onSelectTone={onSelectTone}
      />
    );

    const toolbarEl = container.querySelector('.bg-slate-900');
    expect(toolbarEl).not.toBeNull();
  });

  it('TC-FT-08: Renders improve button and triggers improve mode', () => {
    const onSelectTone = vi.fn();
    render(
      <FloatingToolbar
        visible={true}
        x={150}
        y={250}
        isEditable={true}
        onSelectTone={onSelectTone}
      />
    );

    const improveBtn = screen.getByRole('button', { name: /improve text/i });
    expect(improveBtn).toBeDefined();
    fireEvent.click(improveBtn);
    expect(onSelectTone).toHaveBeenCalledWith('professional', 'improve');
  });

  it('TC-FT-09: Persists collapsed state in the current tab session store', () => {
    window.sessionStorage.clear();
    expect(loadToolbarCollapsed()).toBe(false);
    saveToolbarCollapsed(true);
    expect(loadToolbarCollapsed()).toBe(true);
    saveToolbarCollapsed(false);
    expect(loadToolbarCollapsed()).toBe(false);
  });

  it('TC-FT-10: Collapses and expands the toolbar', () => {
    const onToggleCollapse = vi.fn();
    const { rerender } = render(
      <FloatingToolbar visible={true} x={150} y={250} onSelectTone={() => {}} onToggleCollapse={onToggleCollapse} />
    );

    expect(screen.getByRole('button', { name: /collapse/i })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /collapse/i }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);

    rerender(
      <FloatingToolbar visible={true} x={150} y={250} collapsed onSelectTone={() => {}} onToggleCollapse={onToggleCollapse} />
    );
    expect(screen.queryByRole('button', { name: /rewrite text/i })).toBeNull();
    expect(screen.getByRole('button', { name: /expand/i })).toBeDefined();
  });

  it('TC-FT-11: ContentOverlay hides FloatingToolbar when tooltip popup is visible', () => {
    const { rerender } = render(
      <ContentOverlay
        toolbar={{ visible: true, x: 100, y: 100 }}
        tooltip={{ visible: false, isLoading: false, originalText: 'Hello', hasEditableTarget: false }}
        onSelectTone={() => {}}
        onCloseToolbar={() => {}}
        onToggleToolbarCollapse={() => {}}
        onInsertText={() => {}}
        onCloseTooltip={() => {}}
      />
    );
    expect(screen.getByRole('toolbar')).toBeDefined();

    rerender(
      <ContentOverlay
        toolbar={{ visible: true, x: 100, y: 100 }}
        tooltip={{ visible: true, isLoading: false, originalText: 'Hello', hasEditableTarget: false }}
        onSelectTone={() => {}}
        onCloseToolbar={() => {}}
        onToggleToolbarCollapse={() => {}}
        onInsertText={() => {}}
        onCloseTooltip={() => {}}
      />
    );
    expect(screen.queryByRole('toolbar')).toBeNull();
  });
});
