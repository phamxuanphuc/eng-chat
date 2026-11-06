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

      const updatedVal =
        start !== end
          ? element.value.substring(0, start) + newText + element.value.substring(end)
          : newText;

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
      const selection = window.getSelection();

      if (
        typeof document.execCommand === 'function' &&
        selection &&
        selection.rangeCount > 0 &&
        !selection.isCollapsed
      ) {
        document.execCommand('insertText', false, newText);
      } else {
        element.textContent = newText;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  } catch {
    return false;
  }
};
