import { ChatMessage } from '../types';

export const extractChatContext = (
  targetElement: HTMLElement | null,
  maxMessages = 4
): ChatMessage[] => {
  if (!targetElement) return [];

  const knownSelectors = [
    '[data-qa="message_content"]',
    '.c-message__body',
    '[id^="message-content-"]',
    '[role="row"] [role="gridcell"]',
    '[role="log"] [role="article"]',
    '.message-text',
  ];

  let chatContainer: HTMLElement | null = null;
  let curr: HTMLElement | null = targetElement;

  while (curr && curr !== document.body) {
    const overflowY = window.getComputedStyle(curr).overflowY;
    if (
      curr.getAttribute('role') === 'log' ||
      overflowY === 'auto' ||
      overflowY === 'scroll'
    ) {
      chatContainer = curr;
      break;
    }
    curr = curr.parentElement;
  }

  const root = chatContainer || document.body;
  let messageNodes: HTMLElement[] = [];

  for (const selector of knownSelectors) {
    const found = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (found.length > 0) {
      messageNodes = found;
      break;
    }
  }

  if (messageNodes.length === 0 && chatContainer) {
    const paragraphs = Array.from(chatContainer.querySelectorAll<HTMLElement>('p, div[dir="auto"], span[dir="auto"]'));
    messageNodes = paragraphs.filter((p) => {
      const text = p.innerText?.trim();
      return text && text.length > 3 && text.length < 500;
    });
  }

  const recentNodes = messageNodes.slice(-maxMessages);
  const messages: ChatMessage[] = [];

  for (const node of recentNodes) {
    const rawText = node.innerText || node.textContent || '';
    const cleanText = rawText.replace(/\s+/g, ' ').trim();
    if (cleanText) {
      messages.push({ text: cleanText });
    }
  }

  return messages;
};
