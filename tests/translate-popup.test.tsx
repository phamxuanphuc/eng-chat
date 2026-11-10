import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TranslatePopup } from '../src/content/ui/TranslatePopup';
import { mockTranslateExplainResult } from './mocks/gemini.mock';

describe('TranslatePopup native language section', () => {
  const toggle = (name: RegExp) => screen.queryByRole('button', { name });

  it('names the configured native language and translates into it', async () => {
    const onTranslateNative = vi.fn().mockResolvedValue('Japanese text');
    render(<TranslatePopup mode="improve" originalText="a" result="Better" isLoading={false} nativeLanguage="Japanese" onTranslateNative={onTranslateNative} onClose={() => {}} />);
    expect(toggle(/translate improved sentence to japanese/i)).not.toBeNull();
    expect(toggle(/vietnamese/i)).toBeNull();
    await React.act(async () => { fireEvent.click(toggle(/japanese/i)!); });
    expect(onTranslateNative).toHaveBeenCalledWith('Better');
    expect(screen.getByText('Japanese text')).toBeDefined();
  });

  it('keeps the Vietnamese behavior when no native language is set', () => {
    render(<TranslatePopup mode="rewrite" originalText="a" result="Better" isLoading={false} onClose={() => {}} />);
    expect(toggle(/translate rewritten sentence to vietnamese/i)).not.toBeNull();
  });

  it('is hidden when the result is already in the native language', () => {
    render(<TranslatePopup mode="improve" originalText="a" result="Tốt hơn" isLoading={false} targetLanguage="Vietnamese" onClose={() => {}} />);
    expect(toggle(/translate improved sentence/i)).toBeNull();
  });

  it('localizes the label with a lowercase language name in Vietnamese', () => {
    render(<TranslatePopup language="vi" mode="improve" originalText="a" result="Better" isLoading={false} nativeLanguage="French" onClose={() => {}} />);
    expect(toggle(/^Dịch câu đã cải thiện sang tiếng pháp$/i)).not.toBeNull();
  });
});

describe('TranslatePopup Component', () => {
  it('shows a context badge only when messages were sent', () => {
    const { rerender } = render(<TranslatePopup originalText="Hello" result="Hi" isLoading={false} contextCount={4} onClose={vi.fn()} />);
    expect(screen.getByText('Context: 4 messages')).toBeDefined();
    rerender(<TranslatePopup originalText="Hello" result="Hi" isLoading={false} contextCount={0} onClose={vi.fn()} />);
    expect(screen.queryByText(/^Context:/)).toBeNull();
  });

  it('shows the context badge in Vietnamese', () => {
    render(<TranslatePopup language="vi" originalText="Hello" result="Hi" isLoading={false} contextCount={2} onClose={vi.fn()} />);
    expect(screen.getByText('Ngữ cảnh: 2 tin nhắn')).toBeDefined();
  });

  it('does not show the translation disclaimer line', () => {
    render(<TranslatePopup mode="translate" originalText="Hello" result="Xin chào" isLoading={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/based on web content/i)).toBeNull();
  });

  it('shows the model name passed in and keeps the picker reachable', async () => {
    render(<TranslatePopup originalText="Hello" result="Xin chào" isLoading={false} modelName="gpt-4o-mini" onClose={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Open model picker' });
    expect(button.textContent).toContain('gpt-4o-mini');
    fireEvent.click(button);
    expect(await screen.findByRole('dialog', { name: 'LLM model picker' })).toBeDefined();
  });

  it('opens the model picker from the sparkle button', async () => {
    render(<TranslatePopup originalText="Hello" result="Xin chào" isLoading={false} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open model picker' }));
    expect(await screen.findByRole('dialog', { name: 'LLM model picker' })).toBeDefined();
  });

  it('renders pin control beside close and toggles pin state', () => {
    const onTogglePin = vi.fn();
    const { rerender } = render(
      <TranslatePopup originalText="Hello" result="Xin chào" isLoading={false} onClose={() => {}} onTogglePin={onTogglePin} />
    );

    const pinButton = screen.getByRole('button', { name: /pin dialog/i });
    fireEvent.click(pinButton);
    expect(onTogglePin).toHaveBeenCalledTimes(1);

    rerender(
      <TranslatePopup originalText="Hello" result="Xin chào" isLoading={false} onClose={() => {}} isPinned onTogglePin={onTogglePin} />
    );
    expect(screen.getByRole('button', { name: /unpin dialog/i }).getAttribute('aria-pressed')).toBe('true');
  });

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
        mode="rewrite"
        originalText="Test phrase."
        result="Cụm từ kiểm tra."
        isLoading={false}
        targetLanguage="Vietnamese"
        onLanguageChange={handleLangChange}
        onRegenerate={handleRegenerate}
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /length & format/i })).toBeDefined();
    const langBtn = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(langBtn);

    const japaneseBtn = screen.getByRole('menuitem', { name: /japanese/i });
    fireEvent.click(japaneseBtn);
    expect(handleLangChange).toHaveBeenCalledWith('Japanese');

    const regenBtn = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenBtn);
    expect(handleRegenerate).toHaveBeenCalled();
  });

  it.each([
    ['improve', true],
    ['rewrite', true],
    ['translate', true],
    ['summary', false],
  ] as const)('in %s mode shows replace: %s', (mode, expected) => {
    render(
      <TranslatePopup
        mode={mode}
        originalText="Original content"
        result="Result content"
        isLoading={false}
        hasEditableTarget
        onInsert={() => {}}
        onClose={() => {}}
      />
    );

    expect(!!screen.queryByRole('button', { name: /replace/i })).toBe(expected);
  });

  it('uses the light-theme accent on the regenerate button hover state', () => {
    render(
      <TranslatePopup
        mode="rewrite"
        theme="light"
        originalText="Original content"
        result="Rewritten content"
        isLoading={false}
        onRegenerate={() => {}}
        onClose={() => {}}
      />
    );

    const regenerate = screen.getByRole('button', { name: /regenerate/i });
    expect(regenerate.closest('[data-engchat-theme="light"]')).not.toBeNull();
    expect(regenerate.className).toContain('hover:bg-slate-800');
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

    const explainBtn = screen.getByRole('button', { name: /analysis & vocabulary/i });
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
    expect(screen.queryByRole('button', { name: /select language/i })).not.toBeNull();
    expect(screen.queryByText(/engchat translation are based/i)).toBeNull();

    const modeBtn = screen.getByText('Rewrite');
    fireEvent.click(modeBtn);
    const translateOption = screen.getByRole('menuitem', { name: /^translate$/i });
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

    const card = container.querySelector('[role="dialog"][data-engchat-theme="light"]');
    expect(card).not.toBeNull();
  });

  it('TC-TP-09: Short content does not force a tall popup', () => {
    const { container } = render(
      <TranslatePopup
        originalText="labels"
        result="nhãn"
        isLoading={false}
        onClose={() => {}}
      />
    );

    const popup = container.querySelector('[role="dialog"]');
    expect(popup?.className).toContain('min-h-0');
    expect(popup?.className).not.toContain('min-h-[360px]');
    expect(container.querySelector('.min-h-\\[70px\\]')).toBeNull();
  });

  it('TC-TP-10: Header remains sticky on top with scrollable content body', () => {
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
        onTranslateNative={handleTranslateVi}
        onClose={() => {}}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /translate rewritten sentence to vietnamese/i });
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

  it('TC-TP-11: Renders Length & format and Language selector in improve mode and triggers language change', () => {
    const handleLanguageChange = vi.fn();
    render(
      <TranslatePopup
        mode="improve"
        originalText="Currently system operates as follows"
        result="Currently section navigation functions correctly"
        isLoading={false}
        targetLanguage="English"
        onLanguageChange={handleLanguageChange}
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /length & format/i })).toBeDefined();
    const langBtn = screen.getByRole('button', { name: /select language/i });
    expect(langBtn).toBeDefined();
    expect(screen.getByRole('button', { name: /select language/i }).textContent).toContain('English');

    fireEvent.click(langBtn);
    const vnOption = screen.getByRole('menuitem', { name: /^vietnamese$/i });
    fireEvent.click(vnOption);

    expect(handleLanguageChange).toHaveBeenCalledWith('Vietnamese');
  });
});
