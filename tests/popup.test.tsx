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

    expect(screen.getByRole('heading', { name: 'EngChat AI' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'About' })).toBeDefined();
    expect(screen.getByText(/Optimize and translate your messages with AI/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Gõ hoặc dán văn bản/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Tối Ưu Ngay/i })).toBeNull();
  });

  it('opens the configuration page when clicked', () => {
    render(<PopupApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect((globalThis as any).chrome.runtime.openOptionsPage).toHaveBeenCalledOnce();
  });
});
