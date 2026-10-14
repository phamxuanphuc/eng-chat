import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
