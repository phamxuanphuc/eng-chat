import { describe, it, expect, beforeEach } from 'vitest';
import { extractChatContext } from '../src/content/chat-extractor';

describe('Chat Context Extractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('TC-DM-01: returns empty array when target element is null', () => {
    const result = extractChatContext(null);
    expect(result).toEqual([]);
  });

  it('TC-DM-02: extracts messages from known chat selectors', () => {
    const container = document.createElement('div');
    container.setAttribute('role', 'log');

    const msg1 = document.createElement('div');
    msg1.setAttribute('data-qa', 'message_content');
    msg1.innerText = 'Could you check the server logs?';

    const msg2 = document.createElement('div');
    msg2.setAttribute('data-qa', 'message_content');
    msg2.innerText = 'I see a 500 error on the auth endpoint.';

    const input = document.createElement('input');

    container.appendChild(msg1);
    container.appendChild(msg2);
    container.appendChild(input);
    document.body.appendChild(container);

    const result = extractChatContext(input, 4);

    expect(result.length).toBe(2);
    expect(result[0].text).toBe('Could you check the server logs?');
    expect(result[1].text).toBe('I see a 500 error on the auth endpoint.');
  });

  it('TC-DM-03: limits messages to maxMessages count', () => {
    const container = document.createElement('div');
    container.setAttribute('role', 'log');

    for (let i = 1; i <= 6; i++) {
      const msg = document.createElement('div');
      msg.className = 'c-message__body';
      msg.innerText = `Message ${i}`;
      container.appendChild(msg);
    }

    const textarea = document.createElement('textarea');
    container.appendChild(textarea);
    document.body.appendChild(container);

    const result = extractChatContext(textarea, 3);

    expect(result.length).toBe(3);
    expect(result[0].text).toBe('Message 4');
    expect(result[2].text).toBe('Message 6');
  });
});
