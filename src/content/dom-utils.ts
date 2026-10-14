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
