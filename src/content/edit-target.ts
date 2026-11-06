import { getActiveEditableElement, replaceTextInElement } from './dom-utils';

export interface EditSnapshot {
  element: HTMLElement;
  content: string;
  start?: number;
  end?: number;
  range?: Range;
}

const isTextField = (element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;

const readContent = (element: HTMLElement): string =>
  isTextField(element) ? element.value : element.innerText || element.textContent || '';

const hasSelectionOutside = (element: HTMLElement): boolean => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return false;
  return !element.contains(selection.anchorNode);
};

export const resolveEditTarget = (remembered: HTMLElement | null): HTMLElement | null => {
  const active = getActiveEditableElement();
  if (active) return active;
  if (!remembered?.isConnected || hasSelectionOutside(remembered)) return null;
  return remembered;
};

export const captureEditSnapshot = (element: HTMLElement): EditSnapshot => {
  const content = readContent(element);
  if (isTextField(element)) {
    return { element, content, start: element.selectionStart ?? 0, end: element.selectionEnd ?? 0 };
  }
  const selection = window.getSelection();
  const range = selection && selection.rangeCount > 0 && !selection.isCollapsed ? selection.getRangeAt(0) : null;
  return { element, content, range: range && element.contains(range.commonAncestorContainer) ? range.cloneRange() : undefined };
};

export const applyEdit = (snapshot: EditSnapshot, text: string): boolean => {
  const { element, content, start, end, range } = snapshot;
  if (!element.isConnected || readContent(element) !== content) return false;

  if (isTextField(element)) {
    try {
      element.setSelectionRange(start ?? 0, end ?? 0);
    } catch {
      return false;
    }
    return replaceTextInElement(element, text);
  }

  if (range?.collapsed) return false;
  const selection = window.getSelection();
  element.focus();
  selection?.removeAllRanges();
  if (range) selection?.addRange(range);
  return replaceTextInElement(element, text);
};
