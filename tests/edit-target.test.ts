import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyEdit, captureEditSnapshot, resolveEditTarget } from '../src/content/edit-target';

const selectText = (node: Node, start: number, end: number) => {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
};

const addEditor = (text: string) => {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  editor.textContent = text;
  document.body.appendChild(editor);
  return editor;
};

describe('edit target', () => {
  afterEach(() => {
    window.getSelection()?.removeAllRanges();
    document.body.innerHTML = '';
    delete (document as any).execCommand;
  });

  it('forgets a remembered field that left the page', () => {
    const input = document.createElement('input');
    expect(resolveEditTarget(input)).toBeNull();
    expect(resolveEditTarget(null)).toBeNull();
  });

  it('keeps a remembered field when nothing else is selected', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    expect(resolveEditTarget(input)).toBe(input);
  });

  it('prefers the focused field over the remembered one', () => {
    const remembered = document.createElement('input');
    const focused = document.createElement('textarea');
    document.body.append(remembered, focused);
    focused.focus();
    expect(resolveEditTarget(remembered)).toBe(focused);
  });

  it('restores the original rich-text selection before writing', () => {
    const editor = addEditor('Keep this bad text here');
    selectText(editor.firstChild!, 10, 18);
    const snapshot = captureEditSnapshot(editor);
    window.getSelection()!.removeAllRanges();

    let selectedAtWrite = '';
    (document as any).execCommand = vi.fn(() => {
      selectedAtWrite = window.getSelection()!.toString();
      return true;
    });

    expect(applyEdit(snapshot, 'Better')).toBe(true);
    expect(selectedAtWrite).toBe('bad text');
    expect(editor.textContent).toBe('Keep this bad text here');
  });

  it('replaces the whole rich-text field when the request used all of it', () => {
    const editor = addEditor('Whole message');
    const snapshot = captureEditSnapshot(editor);

    expect(applyEdit(snapshot, 'New message')).toBe(true);
    expect(editor.textContent).toBe('New message');
  });

  it('writes through insertText after selecting the whole field when nothing was selected', () => {
    const editor = addEditor('Whole message');
    const snapshot = captureEditSnapshot(editor);
    let selectedAtWrite = '';
    (document as any).execCommand = vi.fn(() => {
      selectedAtWrite = window.getSelection()!.toString();
      return true;
    });

    expect(applyEdit(snapshot, 'New message')).toBe(true);
    expect(selectedAtWrite).toBe('Whole message');
    expect(editor.textContent).toBe('Whole message');
  });

  it('refuses to write when the content changed or the field is gone', () => {
    const editor = addEditor('Original');
    const changed = captureEditSnapshot(editor);
    editor.textContent = 'Edited later';
    expect(applyEdit(changed, 'New')).toBe(false);
    expect(editor.textContent).toBe('Edited later');

    const removed = captureEditSnapshot(editor);
    editor.remove();
    expect(applyEdit(removed, 'New')).toBe(false);
  });
});
