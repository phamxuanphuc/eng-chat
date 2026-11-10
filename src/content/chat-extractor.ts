import { ChatMessage } from '../types';
import { CHAT_PLATFORMS, ChatPlatform } from './chat-platforms';
import { extractTextFallback } from './chat-text-fallback';

const LOG_ROW_SELECTOR = '[role="row"] [role="gridcell"]';
const PARAGRAPH_SELECTOR = 'p, div[dir="auto"], span[dir="auto"]';
const MAX_MESSAGE_CHARS = 600;
const MAX_SENDER_CHARS = 40;
const MAX_SCANNED_ITEMS = 40;

const isLog = (element: Element): boolean => element.getAttribute('role') === 'log';

const clean = (value: string): string => value.replace(/\s+/g, ' ').trim();

const truncate = (value: string): string =>
  value.length > MAX_MESSAGE_CHARS ? `${value.slice(0, MAX_MESSAGE_CHARS).trimEnd()}…` : value;

const within = (root: ParentNode, selector: string, field: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (node) => !node.contains(field) && !field.contains(node)
  );

const readText = (node: HTMLElement, strip?: string): string => {
  let source = node;
  if (strip && node.querySelector(strip)) {
    source = node.cloneNode(true) as HTMLElement;
    source.querySelectorAll(strip).forEach((extra) => extra.remove());
  }
  return clean(source.innerText || source.textContent || '');
};

const readSender = (item: HTMLElement, platform: ChatPlatform): string => {
  const node = platform.sender ? item.querySelector<HTMLElement>(platform.sender) : null;
  if (!node) return '';
  const raw = platform.senderAttr ? node.getAttribute(platform.senderAttr) || '' : node.innerText || node.textContent || '';
  const sender = clean(raw).replace(/^\[[^\]]*\]\s*/, '').replace(/:$/, '').trim();
  return sender.length <= MAX_SENDER_CHARS ? sender : '';
};

const readItem = (item: HTMLElement, platform: ChatPlatform): ChatMessage | null => {
  const textNode = platform.text ? item.querySelector<HTMLElement>(platform.text) : item;
  const text = textNode ? readText(textNode, platform.strip) : '';
  if (!text) return null;
  const own = !!platform.own && item.matches(platform.own);
  const sender = readSender(item, platform);
  return { text: truncate(text), ...(sender ? { sender } : {}), ...(own ? { own } : {}) };
};

const inheritSenders = (messages: ChatMessage[]): ChatMessage[] => {
  let previous: ChatMessage | null = null;
  return messages.map((message) => {
    const inherited: ChatMessage =
      !message.sender && !message.own && previous?.sender && !previous.own
        ? { ...message, sender: previous.sender }
        : message;
    previous = inherited;
    return inherited;
  });
};

const findPlatformMessages = (field: HTMLElement, hostname: string): ChatMessage[] | null => {
  const candidates = CHAT_PLATFORMS.filter(
    (platform) => (!platform.hosts || platform.hosts.test(hostname)) && document.querySelector(platform.item)
  );
  for (let scope = field.parentElement; scope && candidates.length > 0; scope = scope.parentElement) {
    for (const platform of candidates) {
      const items = within(scope, platform.item, field);
      if (items.length === 0) continue;
      const messages = items
        .slice(-MAX_SCANNED_ITEMS)
        .map((item) => readItem(item, platform))
        .filter((message): message is ChatMessage => !!message);
      if (messages.length > 0) return inheritSenders(messages);
    }
  }
  return null;
};

const findLog = (field: HTMLElement): HTMLElement | null => {
  let current = field.parentElement;
  while (current && current !== document.body) {
    const overflowY = window.getComputedStyle(current).overflowY;
    if (isLog(current)) return current;
    if (overflowY === 'auto' || overflowY === 'scroll') return current.querySelector<HTMLElement>('[role="log"]');
    current = current.parentElement;
  }
  return null;
};

const findLogMessages = (field: HTMLElement): ChatMessage[] => {
  const log = findLog(field);
  if (!log) return [];
  const rows = within(log, LOG_ROW_SELECTOR, field);
  const nodes = rows.length > 0 ? rows : within(log, PARAGRAPH_SELECTOR, field);
  return nodes
    .map((node) => readText(node))
    .filter((text) => text && (rows.length > 0 || (text.length > 3 && text.length < 500)))
    .map((text) => ({ text: truncate(text) }));
};

export interface ChatContextOptions {
  hostname?: string;
  textFallback?: boolean;
}

export const extractChatContext = (
  targetElement: HTMLElement | null,
  maxMessages = 4,
  options: ChatContextOptions = {}
): ChatMessage[] => {
  if (!targetElement) return [];
  const hostname = options.hostname ?? window.location.hostname;
  const messages = findPlatformMessages(targetElement, hostname) ?? findLogMessages(targetElement);
  if (messages.length > 0 || !options.textFallback) return messages.slice(-maxMessages);
  return extractTextFallback(targetElement);
};
