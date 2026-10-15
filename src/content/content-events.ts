import { getActiveEditableElement } from './dom-utils';

export interface ContentEventCallbacks {
  onFocus: (rect: DOMRect, element: HTMLElement) => void;
  onSelect: (rect: DOMRect, isEditable?: boolean) => void;
  onClickOutside: () => void;
}

export const computeToolbarPos = (rect: DOMRect) => {
  const width = 240;
  const height = 40;
  let x = rect.left + rect.width / 2 - width / 2;
  let y = rect.bottom + 8;

  if (y + height > window.innerHeight) {
    y = Math.max(8, rect.top - height - 8);
  }
  x = Math.max(8, Math.min(window.innerWidth - width - 8, x));
  return { x: Math.round(x), y: Math.round(y) };
};

export const setupDOMEvents = (callbacks: ContentEventCallbacks) => {
  const checkInputSelection = () => {
    const active = getActiveEditableElement();
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      if (start !== end && active.value.substring(start, end).trim().length > 0) {
        const rect = active.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          callbacks.onSelect(rect, true);
          return true;
        }
      }
    }
    return false;
  };

  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const isEditable =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.getAttribute('contenteditable') === 'true' ||
      target.closest('[contenteditable="true"]');

    if (isEditable) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        callbacks.onFocus(rect, target);
      }
    }
  });

  document.addEventListener('select', () => {
    checkInputSelection();
  });

  document.addEventListener('keyup', (e) => {
    if (e.shiftKey || e.key === 'Shift' || e.key.startsWith('Arrow') || e.ctrlKey || e.metaKey) {
      checkInputSelection();
    }
  });

  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      if (checkInputSelection()) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            callbacks.onSelect(rect, false);
          }
        } catch {}
      }
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    const host = document.getElementById('engchat-root-host');
    if (host && (host === target || host.contains(target))) return;

    const active = getActiveEditableElement();
    if (target === active || (active && active.contains(target))) return;

    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      if (start !== end) return;
    }

    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;

    callbacks.onClickOutside();
  });
};
