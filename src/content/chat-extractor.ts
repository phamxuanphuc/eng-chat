import { ChatMessage } from '../types';

const CHAT_SELECTORS = [
  '[data-qa="message_content"]',
  '.c-message__body',
  '[id^="message-content-"]',
  '[role="log"] [role="article"]',
  '.message-text',
];
const LOG_ONLY_SELECTORS = ['[role="row"] [role="gridcell"]'];
const PARAGRAPH_SELECTOR = 'p, div[dir="auto"], span[dir="auto"]';

const isLog = (element: Element): boolean => element.getAttribute('role') === 'log';

const findContainer = (field: HTMLElement): HTMLElement | null => {
  let current = field.parentElement;
  while (current && current !== document.body) {
    const overflowY = window.getComputedStyle(current).overflowY;
    if (isLog(current) || overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
};

const queryFirst = (root: ParentNode, selectors: string[], exclude: HTMLElement): HTMLElement[] => {
  for (const selector of selectors) {
    const found = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
      (node) => !node.contains(exclude) && !exclude.contains(node)
    );
    if (found.length > 0) return found;
  }
  return [];
};

const findMessageNodes = (field: HTMLElement): HTMLElement[] => {
  const container = findContainer(field);
  const known = queryFirst(container || document.body, CHAT_SELECTORS, field);
  if (known.length > 0 || !container) return known.length > 0 ? known : queryFirst(document.body, CHAT_SELECTORS, field);

  const log = isLog(container) ? container : container.querySelector<HTMLElement>('[role="log"]');
  if (!log) return queryFirst(document.body, CHAT_SELECTORS, field);

  const rows = queryFirst(log, LOG_ONLY_SELECTORS, field);
  if (rows.length > 0) return rows;
  return queryFirst(log, [PARAGRAPH_SELECTOR], field).filter((node) => {
    const length = (node.innerText || node.textContent || '').trim().length;
    return length > 3 && length < 500;
  });
};

export const extractChatContext = (
  targetElement: HTMLElement | null,
  maxMessages = 4
): ChatMessage[] => {
  if (!targetElement) return [];

  return findMessageNodes(targetElement)
    .slice(-maxMessages)
    .map((node) => ({ text: (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim() }))
    .filter((message) => message.text);
};
