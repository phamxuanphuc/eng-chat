import { ChatMessage } from '../types';

const OVERLAY_HOST_ID = 'engchat-root-host';
const PROBE_OFFSETS = [24, 96, 200];
const MIN_SCROLLER_HEIGHT = 150;
const PIN_TOLERANCE = 80;
const MAX_CHARS = 1500;
const MIN_LINES = 2;

const isPinnedToBottom = (element: HTMLElement, style: CSSStyleDeclaration): boolean =>
  style.flexDirection === 'column-reverse'
    ? Math.abs(element.scrollTop) <= PIN_TOLERANCE
    : element.scrollHeight - element.scrollTop - element.clientHeight <= PIN_TOLERANCE;

const isChatScroller = (element: HTMLElement, field: HTMLElement): boolean => {
  if (element === document.body || element === document.documentElement || element.contains(field)) return false;
  const style = window.getComputedStyle(element);
  if (style.overflowY !== 'auto' && style.overflowY !== 'scroll') return false;
  if (element.clientHeight < MIN_SCROLLER_HEIGHT || element.scrollHeight <= element.clientHeight) return false;
  return isPinnedToBottom(element, style);
};

const findScrollerAbove = (field: HTMLElement): HTMLElement | null => {
  if (typeof document.elementsFromPoint !== 'function') return null;
  const rect = field.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const x = rect.left + rect.width / 2;

  for (const offset of PROBE_OFFSETS) {
    const y = rect.top - offset;
    if (y <= 0) break;
    const topmost = document.elementsFromPoint(x, y).find((element) => element.id !== OVERLAY_HOST_ID);
    for (let current = topmost ?? null; current; current = current.parentElement) {
      if (current instanceof HTMLElement && isChatScroller(current, field)) return current;
    }
  }
  return null;
};

const tailLines = (lines: string[]): string => {
  const kept: string[] = [];
  let size = 0;
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index];
    if (size + line.length + 1 > MAX_CHARS) {
      if (kept.length === 0) kept.push(line.slice(-MAX_CHARS));
      break;
    }
    kept.unshift(line);
    size += line.length + 1;
  }
  return kept.join('\n');
};

export const extractTextFallback = (field: HTMLElement): ChatMessage[] => {
  const scroller = findScrollerAbove(field);
  if (!scroller) return [];
  const lines = (scroller.innerText || scroller.textContent || '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (lines.length < MIN_LINES) return [];
  return [{ text: tailLines(lines), raw: true }];
};
