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

export const setupDOMEvents = (callbacks: ContentEventCallbacks): (() => void) => {
  let isMouseDown = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const animationFrames = new Set<number>();

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
        const rects = Array.from(range.getClientRects());
        let rect = range.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          rect = rects[0] || rect;
        }

        // Some sites report a zero-sized range while the selection is being
        // committed. Use the first visible client rect before falling back to
        // the selected node's bounds.
        if (rect.width === 0 || rect.height === 0) {
          const anchorEl = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement;
          const anchorRect = anchorEl?.getBoundingClientRect();
          if (anchorRect && anchorRect.width > 0 && anchorRect.height > 0) {
            rect = anchorRect;
          }
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

  const isInsideHost = (e: Event): boolean => {
    const host = document.getElementById('engchat-root-host');
    if (!host) return false;
    const path = e.composedPath ? e.composedPath() : [];
    return path.includes(host) || host === e.target || host.contains(e.target as Node);
  };

  const hasUsableSelection = (target?: HTMLElement | null): boolean => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) return true;
    const active = target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
      ? target
      : getActiveEditableElement();
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      return start !== end && active.value.substring(start, end).trim().length > 0;
    }
    return false;
  };

  const handleFocusIn = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target && isEditable(target)) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        callbacks.onFocus(rect, target);
      }
    }
  };

  const handleSelect = (e: Event) => checkSelection(e.target as HTMLElement);
  const handleMouseDown = (e: Event) => {
    if (isInsideHost(e)) return;
    isMouseDown = true;
    callbacks.onClickOutside();
  };

  const scheduleSelectionChecks = (target?: HTMLElement | null) => {
    const run = () => {
      animationFrames.delete(frameId);
      checkSelection(target);
    };
    const frameId = requestAnimationFrame(run);
    animationFrames.add(frameId);
    [30, 100, 250].forEach((delay) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        run();
      }, delay);
      timers.add(timer);
    });
  };

  const checkAfterPointerSelection = (e: Event) => {
    if (isInsideHost(e)) return;
    isMouseDown = false;
    // Some sites commit the Selection asynchronously after pointerup. Retry
    // briefly so the toolbar still appears when the first range is empty.
    scheduleSelectionChecks(e.target as HTMLElement);
  };

  const handleKeyUp = (e: Event) => {
    if (isInsideHost(e)) return;
    scheduleSelectionChecks(e.target as HTMLElement);
  };
  const handleSelectionChange = () => {
    if (hasUsableSelection()) scheduleSelectionChecks();
  };

  // Capture selection events before page frameworks can stop propagation.
  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('select', handleSelect, true);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', checkAfterPointerSelection, true);
  document.addEventListener('pointerup', checkAfterPointerSelection, true);
  document.addEventListener('touchend', checkAfterPointerSelection, true);
  document.addEventListener('keyup', handleKeyUp, true);
  document.addEventListener('selectionchange', handleSelectionChange, true);

  return () => {
    document.removeEventListener('focusin', handleFocusIn);
    document.removeEventListener('select', handleSelect, true);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mouseup', checkAfterPointerSelection, true);
    document.removeEventListener('pointerup', checkAfterPointerSelection, true);
    document.removeEventListener('touchend', checkAfterPointerSelection, true);
    document.removeEventListener('keyup', handleKeyUp, true);
    document.removeEventListener('selectionchange', handleSelectionChange, true);
    animationFrames.forEach((frameId) => cancelAnimationFrame(frameId));
    timers.forEach((timer) => clearTimeout(timer));
    animationFrames.clear();
    timers.clear();
  };
};
