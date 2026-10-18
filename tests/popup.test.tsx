import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App as PopupApp } from '../src/popup/App';

describe('Popup', () => {
  beforeEach(() => {
    (globalThis as any).chrome = {
      runtime: {
        openOptionsPage: vi.fn(),
      },
    };
  });

  it('shows the app name, configuration button, and About information', () => {
    render(<PopupApp />);

    expect(screen.getByRole('heading', { name: 'LingoFlow' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'About' })).toBeDefined();
    expect(screen.getByText(/Optimize and translate your messages with AI/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Type or paste text/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Optimize Now/i })).toBeNull();
  });

  it('opens the configuration page when clicked', () => {
    render(<PopupApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect((globalThis as any).chrome.runtime.openOptionsPage).toHaveBeenCalledOnce();
  });
});
