import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getActiveEditableElement,
  getSelectedText,
  replaceTextInElement,
} from '../src/content/dom-utils';

describe('DOM Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('TC-DM-04: identifies active input element', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(getActiveEditableElement()).toBe(input);
  });

  it('TC-DM-05: gets text from input when nothing is selected', () => {
    const input = document.createElement('input');
    input.value = 'Chuyển sang tiếng Anh giúp tôi';
    document.body.appendChild(input);
    input.focus();

    expect(getSelectedText()).toBe('Chuyển sang tiếng Anh giúp tôi');
  });

  it('TC-DM-06: replaces text in input and dispatches events', () => {
    const input = document.createElement('input');
    input.value = 'Cũ';
    document.body.appendChild(input);

    const inputListener = vi.fn();
    const changeListener = vi.fn();
    input.addEventListener('input', inputListener);
    input.addEventListener('change', changeListener);

    const success = replaceTextInElement(input, 'Mới');

    expect(success).toBe(true);
    expect(input.value).toBe('Mới');
    expect(inputListener).toHaveBeenCalled();
    expect(changeListener).toHaveBeenCalled();
  });

  it('TC-DM-07: replaces text in contenteditable', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.innerText = 'Đoạn văn cũ';
    document.body.appendChild(div);

    const inputListener = vi.fn();
    div.addEventListener('input', inputListener);

    const success = replaceTextInElement(div, 'Đoạn văn mới');

    expect(success).toBe(true);
    expect(div.textContent).toBe('Đoạn văn mới');
    expect(inputListener).toHaveBeenCalled();
  });

  describe('contenteditable replace', () => {
    const original = document.execCommand;
    afterEach(() => {
      (document as any).execCommand = original;
      window.getSelection()?.removeAllRanges();
      document.body.innerHTML = '';
    });

    const makeEditor = (text: string) => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.textContent = text;
      document.body.appendChild(div);
      return div;
    };

    it('selects all content and inserts through execCommand without touching textContent', () => {
      const div = makeEditor('old text');
      let selected = '';
      (document as any).execCommand = vi.fn(() => {
        selected = window.getSelection()!.toString();
        return true;
      });
      expect(replaceTextInElement(div, 'new text')).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'new text');
      expect(selected).toBe('old text');
      expect(div.textContent).toBe('old text');
    });

    it('keeps an existing selection inside the element', () => {
      const div = makeEditor('keep bad text');
      const range = document.createRange();
      range.setStart(div.firstChild!, 5);
      range.setEnd(div.firstChild!, 8);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      let selected = '';
      (document as any).execCommand = vi.fn(() => {
        selected = window.getSelection()!.toString();
        return true;
      });
      replaceTextInElement(div, 'good');
      expect(selected).toBe('bad');
    });

    it('falls back to a paste event when the command is refused', () => {
      const div = makeEditor('old');
      (document as any).execCommand = vi.fn(() => false);
      let pasted = '';
      div.addEventListener('paste', (event) => {
        pasted = (event as ClipboardEvent).clipboardData?.getData('text/plain') ?? '';
        event.preventDefault();
      });
      expect(replaceTextInElement(div, 'via paste')).toBe(true);
      expect(pasted).toBe('via paste');
      expect(div.textContent).toBe('old');
    });

    it('assigns textContent only when command and paste both fail', () => {
      const div = makeEditor('old');
      (document as any).execCommand = vi.fn(() => false);
      const inputListener = vi.fn();
      div.addEventListener('input', inputListener);
      expect(replaceTextInElement(div, 'last resort')).toBe(true);
      expect(div.textContent).toBe('last resort');
      expect(inputListener).toHaveBeenCalled();
    });
  });

  describe('undoable replace', () => {
    const original = document.execCommand;
    afterEach(() => {
      (document as any).execCommand = original;
    });

    const makeTextarea = (value: string, start: number, end: number) => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.setSelectionRange(start, end);
      return textarea;
    };

    it('inserts through the editing command so the browser keeps an undo step', () => {
      const textarea = makeTextarea('Hello old world', 6, 9);
      const seen: Array<[number | null, number | null]> = [];
      (document as any).execCommand = vi.fn((command: string, _ui: boolean, text: string) => {
        const active = document.activeElement as HTMLTextAreaElement;
        seen.push([active.selectionStart, active.selectionEnd]);
        active.value = active.value.slice(0, active.selectionStart!) + text + active.value.slice(active.selectionEnd!);
        return command === 'insertText';
      });
      const changeListener = vi.fn();
      textarea.addEventListener('change', changeListener);

      expect(replaceTextInElement(textarea, 'new')).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'new');
      expect(seen).toEqual([[6, 9]]);
      expect(textarea.value).toBe('Hello new world');
      expect(document.activeElement).toBe(textarea);
      expect(changeListener).toHaveBeenCalledTimes(1);
    });

    it('replaces the whole value when nothing is selected', () => {
      const textarea = makeTextarea('Old draft', 3, 3);
      const seen: Array<[number | null, number | null]> = [];
      (document as any).execCommand = vi.fn((_c: string, _ui: boolean, text: string) => {
        seen.push([textarea.selectionStart, textarea.selectionEnd]);
        textarea.value = text;
        return true;
      });

      expect(replaceTextInElement(textarea, 'New draft')).toBe(true);
      expect(seen).toEqual([[0, 9]]);
      expect(textarea.value).toBe('New draft');
    });

    it('falls back to setting the value when the command is refused', () => {
      const textarea = makeTextarea('Hello old world', 6, 9);
      (document as any).execCommand = vi.fn(() => false);
      const inputListener = vi.fn();
      textarea.addEventListener('input', inputListener);

      expect(replaceTextInElement(textarea, 'new')).toBe(true);
      expect(textarea.value).toBe('Hello new world');
      expect(inputListener).toHaveBeenCalled();
    });

    it('falls back when the page rewrites the inserted text', () => {
      const textarea = makeTextarea('Hello old world', 6, 9);
      (document as any).execCommand = vi.fn(() => {
        textarea.value = 'Hello NE world';
        return true;
      });

      expect(replaceTextInElement(textarea, 'new')).toBe(true);
      expect(textarea.value).toBe('Hello new world');
    });

    it('returns focus to the field after replacing', () => {
      const textarea = makeTextarea('Old', 0, 3);
      (document.activeElement as HTMLElement | null)?.blur?.();
      expect(replaceTextInElement(textarea, 'New')).toBe(true);
      expect(document.activeElement).toBe(textarea);
    });
  });
});
