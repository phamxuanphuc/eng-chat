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

  const addField = (parent: HTMLElement, tag: 'textarea' | 'input' = 'textarea') => {
    const field = document.createElement(tag);
    parent.appendChild(field);
    return field;
  };

  it('ignores the scroll box of the field itself and still finds the chat log', () => {
    const log = document.createElement('div');
    log.setAttribute('role', 'log');
    log.innerHTML = '<div class="message-text">Earlier message</div>';
    document.body.appendChild(log);
    const textarea = addField(log);
    textarea.style.overflowY = 'auto';

    expect(extractChatContext(textarea)).toEqual([{ text: 'Earlier message' }]);
  });

  it('finds chat messages when the composer sits outside the message list', () => {
    const list = document.createElement('div');
    list.innerHTML = '<div data-qa="message_content">From the list</div>';
    const composer = document.createElement('div');
    document.body.append(list, composer);

    expect(extractChatContext(addField(composer))).toEqual([{ text: 'From the list' }]);
  });

  it('does not read a data grid on a page that is not a chat', () => {
    const grid = document.createElement('div');
    grid.innerHTML = '<div role="row"><div role="gridcell">Private inbox subject</div></div>';
    const form = document.createElement('div');
    document.body.append(grid, form);

    expect(extractChatContext(addField(form))).toEqual([]);
  });

  it('does not read a data grid inside a scrollable page region', () => {
    const main = document.createElement('main');
    main.style.overflowY = 'auto';
    main.innerHTML = '<div role="row"><div role="gridcell">Spreadsheet cell</div></div>';
    document.body.appendChild(main);

    expect(extractChatContext(addField(main))).toEqual([]);
  });

  it('does not read article paragraphs around a comment box', () => {
    const main = document.createElement('main');
    main.style.overflowY = 'scroll';
    main.innerHTML = '<p>A paragraph of the article the user is reading.</p>';
    document.body.appendChild(main);

    expect(extractChatContext(addField(main))).toEqual([]);
  });

  it('reads grid rows and plain paragraphs only inside a chat log', () => {
    const log = document.createElement('div');
    log.setAttribute('role', 'log');
    log.innerHTML = '<div role="row"><div role="gridcell">Teams style message</div></div>';
    document.body.appendChild(log);
    expect(extractChatContext(addField(log))).toEqual([{ text: 'Teams style message' }]);

    document.body.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.overflowY = 'auto';
    wrapper.innerHTML = '<div role="log"><p>Plain chat line</p><p>ok</p></div>';
    document.body.appendChild(wrapper);
    expect(extractChatContext(addField(wrapper))).toEqual([{ text: 'Plain chat line' }]);
  });

  it('never returns the draft being written as context', () => {
    const log = document.createElement('div');
    log.setAttribute('role', 'log');
    const editor = document.createElement('div');
    editor.className = 'message-text';
    editor.contentEditable = 'true';
    editor.textContent = 'My unsent draft';
    log.appendChild(editor);
    document.body.appendChild(log);

    expect(extractChatContext(editor)).toEqual([]);
  });

  it('skips empty messages', () => {
    const log = document.createElement('div');
    log.setAttribute('role', 'log');
    log.innerHTML = '<div class="message-text">   </div><div class="message-text">Real</div>';
    document.body.appendChild(log);

    expect(extractChatContext(addField(log))).toEqual([{ text: 'Real' }]);
  });
});
