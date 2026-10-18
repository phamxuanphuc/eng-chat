import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, within, act } from '@testing-library/react';
import { TranslatePopupHeader } from '../src/content/ui/TranslatePopupHeader';

const renderInShadow = (ui: React.ReactElement) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  shadow.appendChild(container);
  render(ui, { container });
  return { host, container };
};

const retargetedPointerDown = (host: HTMLElement, inner: HTMLElement) => {
  const event = new PointerEvent('pointerdown', { bubbles: true, composed: true });
  const path: EventTarget[] = [];
  for (let node: Node | null = inner; node; node = (node as any).parentNode ?? (node as ShadowRoot).host ?? null) path.push(node);
  Object.defineProperty(event, 'composedPath', { value: () => [...path, window] });
  act(() => { host.dispatchEvent(event); });
};

describe('TranslatePopupHeader inside shadow DOM', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('selects a mode from the dropdown instead of closing it', () => {
    const onModeChange = vi.fn();
    const { host, container } = renderInShadow(
      <TranslatePopupHeader mode="improve" targetLanguage="English" theme="dark" onModeChange={onModeChange} onClose={() => {}} />
    );
    const view = within(container);

    fireEvent.click(view.getByRole('button', { name: /Improve It/i }));
    retargetedPointerDown(host, view.getByRole('button', { name: /Rewrite/i }));
    fireEvent.click(view.getByRole('button', { name: /Rewrite/i }));

    expect(onModeChange).toHaveBeenCalledWith('rewrite');
  });

  it('closes the dropdown on an outside pointerdown', () => {
    const { container } = renderInShadow(
      <TranslatePopupHeader mode="improve" targetLanguage="English" theme="dark" onClose={() => {}} />
    );
    const view = within(container);

    fireEvent.click(view.getByRole('button', { name: /Improve It/i }));
    expect(view.getByRole('button', { name: /Rewrite/i })).toBeDefined();

    fireEvent.pointerDown(document.body);
    expect(view.queryByRole('button', { name: /Rewrite/i })).toBeNull();
  });
});
