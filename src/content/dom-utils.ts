export const getActiveEditableElement = (): HTMLElement | null => {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return null;

  if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
    return active;
  }

  if (active.isContentEditable || active.getAttribute('contenteditable') === 'true') {
    return active;
  }

  const editableParent = active.closest('[contenteditable="true"]');
  if (editableParent) {
    return editableParent as HTMLElement;
  }

  return null;
};

const PLAIN_INPUT_TYPES = new Set(['text', 'search']);
const SENSITIVE_AUTOCOMPLETE = /(^|\s)(username|email|tel\S*|one-time-code|cc-\S+|(current|new)-password|name|given-name|family-name)(\s|$)/i;
const SENSITIVE_NAME_HINT = /(^|[^a-z])(e-?mail|pass(word|wd)?|otp|username|user-?name|login|cvv|cvc|ssn)([^a-z]|$)/i;

export const isSensitiveField = (el?: Element | null): boolean => {
  if (!(el instanceof HTMLInputElement)) return false;
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  if (!PLAIN_INPUT_TYPES.has(type)) return true;
  if (SENSITIVE_AUTOCOMPLETE.test(el.getAttribute('autocomplete') || '')) return true;
  return [el.name, el.id].some((hint) => !!hint && SENSITIVE_NAME_HINT.test(hint));
};

export const getSelectedText = (): string => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    return selection.toString().trim();
  }

  const active = getActiveEditableElement();
  if (active) {
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      if (start !== end) {
        return active.value.substring(start, end).trim();
      }
      return active.value.trim();
    }
    if (active.isContentEditable) {
      return (active.innerText || active.textContent || '').trim();
    }
  }

  return '';
};

const insertWithUndo = (
  element: HTMLInputElement | HTMLTextAreaElement,
  from: number,
  to: number,
  text: string,
  expected: string
): boolean => {
  if (!text || typeof document.execCommand !== 'function') return false;
  try {
    element.setSelectionRange(from, to);
    return document.execCommand('insertText', false, text) && element.value === expected;
  } catch {
    return false;
  }
};

const selectAllContents = (element: HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection) return;
  const hasUsableSelection =
    selection.rangeCount > 0 && !selection.isCollapsed && element.contains(selection.anchorNode);
  if (hasUsableSelection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
};

const insertViaCommand = (text: string): boolean => {
  if (typeof document.execCommand !== 'function') return false;
  try {
    return document.execCommand('insertText', false, text) === true;
  } catch {
    return false;
  }
};

const insertViaPaste = (element: HTMLElement, text: string): boolean => {
  try {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  } catch {
    return false;
  }
};

const writeRichText = (element: HTMLElement, text: string): boolean => {
  selectAllContents(element);
  return insertViaCommand(text) || insertViaPaste(element, text);
};

export const replaceTextInElement = (
  element: HTMLElement,
  newText: string
): boolean => {
  try {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const prototype =
        element instanceof HTMLInputElement
          ? window.HTMLInputElement.prototype
          : window.HTMLTextAreaElement.prototype;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? element.value.length;
      const hasSelection = start !== end;

      const updatedVal = hasSelection
        ? element.value.substring(0, start) + newText + element.value.substring(end)
        : newText;

      element.focus();
      if (insertWithUndo(element, hasSelection ? start : 0, hasSelection ? end : element.value.length, newText, updatedVal)) {
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (descriptor && descriptor.set) {
        descriptor.set.call(element, updatedVal);
      } else {
        element.value = updatedVal;
      }

      const newCursorPos = (start !== end ? start : 0) + newText.length;
      element.setSelectionRange(newCursorPos, newCursorPos);

      element.dispatchEvent(new Event('beforeinput', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    const isEditable =
      (element as any).isContentEditable === true ||
      element.getAttribute('contenteditable') === 'true' ||
      (element as any).contentEditable === 'true';

    if (isEditable) {
      if (typeof element.focus === 'function') {
        element.focus();
      }
      if (writeRichText(element, newText)) return true;
      element.textContent = newText;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

const isUsableRect = (rect?: DOMRect | null): rect is DOMRect => !!rect && rect.width > 0 && rect.height > 0;

export const getSelectionRect = (): DOMRect | null => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    try {
      const range = selection.getRangeAt(0);
      const whole = range.getBoundingClientRect();
      if (isUsableRect(whole)) return whole;
      const first = range.getClientRects()[0];
      if (isUsableRect(first)) return first;
    } catch {
      return null;
    }
  }
  const active = getActiveEditableElement();
  const rect = active?.getBoundingClientRect();
  return isUsableRect(rect) ? rect : null;
};
