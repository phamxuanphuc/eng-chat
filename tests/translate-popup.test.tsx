import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';
import { mockTranslateExplainResult } from './mocks/gemini.mock';

describe('TranslatePopup Component', () => {
  it('TC-TP-01: Renders original text, translation and handles close', () => {
    const handleClose = vi.fn();
    render(
      <TranslatePopup
        originalText="Hello world, please review this PR."
        result="Xin chào thế giới, vui lòng xem xét PR này."
        isLoading={false}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Hello world, please review this PR.')).toBeDefined();
    expect(screen.getByText('Xin chào thế giới, vui lòng xem xét PR này.')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('TC-TP-02: Toggles collapse/expand of original text', () => {
    render(
      <TranslatePopup
        originalText="Long original sentence explaining crypto issue..."
        result="Bản dịch tiếng Việt."
        isLoading={false}
        onClose={() => {}}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /collapse/i })).toBeDefined();
  });

  it('TC-TP-03: Submits follow-up query on Enter', () => {
    const handleFollowUp = vi.fn();
    render(
      <TranslatePopup
        originalText="Some English text."
        result="Bản dịch."
        isLoading={false}
        onFollowUp={handleFollowUp}
        onClose={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/ask follow-up ↵/i);
    fireEvent.change(input, { target: { value: 'Make it more professional' } });
    fireEvent.submit(input.closest('form')!);

    expect(handleFollowUp).toHaveBeenCalledWith('Make it more professional');
  });

  it('TC-TP-04: Copies translation text to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(
      <TranslatePopup
        originalText="Hello world."
        result="Xin chào."
        isLoading={false}
        onClose={() => {}}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy translation/i });
    await React.act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(writeTextMock).toHaveBeenCalledWith('Xin chào.');
  });

  it('TC-TP-05: Handles language change and regeneration', () => {
    const handleLangChange = vi.fn();
    const handleRegenerate = vi.fn();
    render(
      <TranslatePopup
        originalText="Test phrase."
        result="Cụm từ kiểm tra."
        isLoading={false}
        targetLanguage="Vietnamese"
        onLanguageChange={handleLangChange}
        onRegenerate={handleRegenerate}
        onClose={() => {}}
      />
    );

    const langBtn = screen.getByRole('button', { name: /vietnamese/i });
    fireEvent.click(langBtn);

    const japaneseBtn = screen.getByRole('button', { name: /japanese/i });
    fireEvent.click(japaneseBtn);
    expect(handleLangChange).toHaveBeenCalledWith('Japanese');

    const regenBtn = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenBtn);
    expect(handleRegenerate).toHaveBeenCalled();
  });

  it('TC-TP-06: Displays detailed explanation breakdown when available', () => {
    render(
      <TranslatePopup
        originalText="Technical sentence."
        result={mockTranslateExplainResult}
        isLoading={false}
        onClose={() => {}}
      />
    );

    const explainBtn = screen.getByRole('button', { name: /phân tích & từ vựng/i });
    fireEvent.click(explainBtn);

    expect(screen.getByText('implementation')).toBeDefined();
    expect(screen.getByText('solid')).toBeDefined();
  });

  it('TC-TP-07: Renders Rewrite mode with PenLine icon and without language selector', () => {
    const handleModeChange = vi.fn();
    render(
      <TranslatePopup
        mode="rewrite"
        originalText="Currently the system works..."
        result="While section navigation functions correctly..."
        isLoading={false}
        onModeChange={handleModeChange}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Rewrite')).toBeDefined();
    expect(screen.getByText('While section navigation functions correctly...')).toBeDefined();
    expect(screen.queryByRole('button', { name: /vietnamese/i })).toBeNull();
    expect(screen.queryByText(/engchat translation are based/i)).toBeNull();

    const modeBtn = screen.getByText('Rewrite');
    fireEvent.click(modeBtn);
    const translateOption = screen.getByRole('button', { name: /^translate$/i });
    fireEvent.click(translateOption);
    expect(handleModeChange).toHaveBeenCalledWith('translate');
  });

  it('TC-TP-08: Renders light theme with light background card and slate styling', () => {
    const { container } = render(
      <TranslatePopup
        theme="light"
        mode="translate"
        originalText="Hello world"
        result="Xin chào thế giới"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const card = container.querySelector('.bg-white');
    expect(card).not.toBeNull();
  });

  it('TC-TP-09: Header remains sticky on top with scrollable content body', () => {
    const { container } = render(
      <TranslatePopup
        originalText="Hello world"
        result="Xin chào thế giới"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const stickyHeader = container.querySelector('.sticky.top-0');
    expect(stickyHeader).not.toBeNull();

    const scrollBody = container.querySelector('.overflow-y-auto');
    expect(scrollBody).not.toBeNull();
  });

  it('TC-TP-10: Renders and toggles Vietnamese translation collapse in rewrite mode', async () => {
    const handleTranslateVi = vi.fn().mockResolvedValue('Tất cả các API thanh toán đã được kiểm tra.');

    render(
      <TranslatePopup
        mode="rewrite"
        originalText="Tôi đã kiểm tra kỹ rồi."
        result="All payment APIs have been thoroughly tested."
        isLoading={false}
        onTranslateVi={handleTranslateVi}
        onClose={() => {}}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /dịch câu viết lại sang tiếng việt/i });
    expect(toggleBtn).toBeDefined();

    await React.act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(handleTranslateVi).toHaveBeenCalledWith('All payment APIs have been thoroughly tested.');
    expect(screen.getByText('Tất cả các API thanh toán đã được kiểm tra.')).toBeDefined();

    await React.act(async () => {
      fireEvent.click(toggleBtn);
    });
    expect(screen.queryByText('Tất cả các API thanh toán đã được kiểm tra.')).toBeNull();
  });
});
