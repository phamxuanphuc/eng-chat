import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageToggle } from '../src/options/LanguageToggle';

describe('LanguageToggle', () => {
  it('shows compact code and switches en to vi', () => {
    const onChange = vi.fn();
    render(<LanguageToggle language="en" onChange={onChange} />);
    const button = screen.getByRole('button', { name: /language: english/i });
    expect(button.textContent).toBe('EN');
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('vi');
  });

  it('switches vi back to en', () => {
    const onChange = vi.fn();
    render(<LanguageToggle language="vi" onChange={onChange} />);
    const button = screen.getByRole('button', { name: /ngôn ngữ: tiếng việt/i });
    expect(button.textContent).toBe('VI');
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith('en');
  });
});
