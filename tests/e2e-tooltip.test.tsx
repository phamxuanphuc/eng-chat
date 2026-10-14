import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipApp } from '../src/content/ui/TooltipApp';
import { mockTranslateExplainResult } from './mocks/gemini.mock';

describe('E2E Tooltip & In-place UI Flow', () => {
  it('E2E-05: Translate & Explain mode displays translation and interactive explanation', async () => {
    const handleInsert = vi.fn();
    const handleClose = vi.fn();

    render(
      <TooltipApp
        isLoading={false}
        result={mockTranslateExplainResult}
        hasEditableTarget={true}
        onInsert={handleInsert}
        onClose={handleClose}
      />
    );

    expect(
      screen.getByText('Tôi đã xem xét việc triển khai cổng thanh toán và nó rất ổn định.')
    ).toBeDefined();

    expect(screen.getByText('implementation')).toBeDefined();
    expect(screen.getByText('solid')).toBeDefined();
    expect(screen.getByText(/have reviewed/i)).toBeDefined();

    const insertBtn = screen.getByRole('button', { name: /Chèn vào ô/i });
    fireEvent.click(insertBtn);
    expect(handleInsert).toHaveBeenCalledWith(
      'Tôi đã xem xét việc triển khai cổng thanh toán và nó rất ổn định.'
    );
  });
});
