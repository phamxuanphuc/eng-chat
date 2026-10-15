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
  let isMouseDown = false;

  const isEditable = (el?: HTMLElement | null): boolean => {
    if (!el) return false;
    return (
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.isContentEditable ||
      el.getAttribute('contenteditable') === 'true' ||
      !!el.closest?.('[contenteditable="true"]')
    );
  };

  const checkSelection = (target?: HTMLElement | null) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      try {
        const range = sel.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          const rects = range.getClientRects();
          if (rects.length > 0) rect = rects[0];
        }
        if (rect && rect.width > 0 && rect.height > 0) {
          const anchorEl = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement;
          callbacks.onSelect(rect, isEditable(anchorEl));
          return true;
        }
      } catch {}
    }

    const active =
      target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
        ? target
        : getActiveEditableElement();
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
    if (target && isEditable(target)) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        callbacks.onFocus(rect, target);
      }
    }
  });

  document.addEventListener('select', (e) => {
    checkSelection(e.target as HTMLElement);
  }, true);

  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const host = document.getElementById('engchat-root-host');
    if (host && (host === target || host.contains(target))) return;
    isMouseDown = true;
    callbacks.onClickOutside();
  });

  document.addEventListener('mouseup', (e) => {
    isMouseDown = false;
    const target = e.target as HTMLElement;
    const host = document.getElementById('engchat-root-host');
    if (host && (host === target || host.contains(target))) return;
    setTimeout(() => checkSelection(target), 10);
  });

  document.addEventListener('keyup', (e) => {
    const target = e.target as HTMLElement;
    const host = document.getElementById('engchat-root-host');
    if (host && (host === target || host.contains(target))) return;
    checkSelection(target);
  });

  document.addEventListener('selectionchange', () => {
    if (!isMouseDown) {
      setTimeout(checkSelection, 20);
    }
  });
};
