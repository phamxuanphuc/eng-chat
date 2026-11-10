import { describe, it, expect, beforeEach } from 'vitest';
import { extractChatContext } from '../src/content/chat-extractor';
import { buildUserPrompt } from '../src/services/prompt';
import * as dom from './mocks/chat-dom.mock';

const mount = (html: string, composer = '#composer'): HTMLElement => {
  document.body.innerHTML = html;
  return document.querySelector<HTMLElement>(`${composer} textarea`)!;
};

describe('Chat context per platform', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('Slack: reads only the message text, names the sender and carries it over grouped messages', () => {
    expect(extractChatContext(mount(dom.slackDom), 4, 'app.slack.com')).toEqual([
      { sender: 'Alice', text: 'Can you review the PR?' },
      { sender: 'Alice', text: 'It is the payment one.' },
      { sender: 'Bob', text: 'On it.' },
    ]);
  });

  it('Slack: a thread composer reads its own thread, the channel composer ignores the thread', () => {
    expect(extractChatContext(mount(dom.slackDom, '#thread-composer'), 4, 'app.slack.com')).toEqual([
      { sender: 'Carol', text: 'Thread only message' },
    ]);
    const channel = extractChatContext(mount(dom.slackDom), 10, 'app.slack.com');
    expect(channel.map((message) => message.text)).not.toContain('Thread only message');
  });

  it('Discord: skips the quoted reply preview and timestamps', () => {
    expect(extractChatContext(mount(dom.discordDom), 4, 'discord.com')).toEqual([
      { sender: 'Dana', text: 'anyone up for a game?' },
      { sender: 'Eli', text: 'sure, give me 5' },
      { sender: 'Eli', text: 'brb' },
    ]);
  });

  it('Teams: marks my own messages', () => {
    expect(extractChatContext(mount(dom.teamsDom), 4, 'teams.microsoft.com')).toEqual([
      { sender: 'Frank', text: 'Is the report ready?' },
      { text: 'Almost, one hour.', own: true },
    ]);
  });

  it('WhatsApp: takes the sender from the message metadata and skips quoted text', () => {
    expect(extractChatContext(mount(dom.whatsappDom), 4, 'web.whatsapp.com')).toEqual([
      { sender: 'Giang', text: 'Tối nay đi ăn không?' },
      { sender: 'Me Myself', text: 'Ok 7h nhé', own: true },
    ]);
  });

  it('Telegram: strips the time stamp in both web clients', () => {
    expect(extractChatContext(mount(dom.telegramADom), 4, 'web.telegram.org')).toEqual([
      { sender: 'Hana', text: 'See you at noon' },
      { text: 'Deal', own: true },
    ]);
    expect(extractChatContext(mount(dom.telegramKDom), 4, 'web.telegram.org')).toEqual([
      { sender: 'Ivan', text: 'Where are you?' },
      { text: 'Parking', own: true },
    ]);
  });

  it('Messenger and Instagram: reads message rows and skips rows without message text', () => {
    const expected = [
      { sender: 'Khoa', text: 'Mai họp mấy giờ?' },
      { sender: 'Khoa', text: '9h sáng' },
    ];
    expect(extractChatContext(mount(dom.messengerDom), 4, 'www.messenger.com')).toEqual(expected);
    expect(extractChatContext(mount(dom.messengerDom), 4, 'www.instagram.com')).toEqual(expected);
  });

  it('Zalo, LinkedIn and X', () => {
    expect(extractChatContext(mount(dom.zaloDom), 4, 'chat.zalo.me')).toEqual([
      { sender: 'Lan', text: 'Chị gửi file chưa?' },
      { text: 'Em gửi rồi ạ', own: true },
    ]);
    expect(extractChatContext(mount(dom.linkedinDom), 4, 'www.linkedin.com')).toEqual([
      { sender: 'Minh', text: 'Are you open to a quick call?' },
      { text: 'Yes, Thursday works.', own: true },
    ]);
    expect(extractChatContext(mount(dom.xDom), 4, 'x.com')).toEqual([{ text: 'Loved your thread' }]);
  });

  it('does not apply a host-specific platform on another site', () => {
    expect(extractChatContext(mount(dom.whatsappDom), 4, 'example.com')).toEqual([]);
    expect(extractChatContext(mount(dom.messengerDom), 4, 'mail.example.com')).toEqual([]);
    expect(extractChatContext(mount(dom.telegramKDom), 4, 'nottelegram.org')).toEqual([]);
  });

  it('truncates a very long message and drops an implausible sender', () => {
    const field = mount(dom.xDom);
    document.querySelector('[data-testid="tweetText"]')!.textContent = 'a'.repeat(2000);
    const [message] = extractChatContext(field, 4, 'x.com');
    expect(message.text).toHaveLength(601);
    expect(message.text.endsWith('…')).toBe(true);

    const slackField = mount(dom.slackDom);
    document.querySelector('[data-qa="message_sender_name"]')!.textContent = 'x'.repeat(80);
    expect(extractChatContext(slackField, 1, 'app.slack.com')).toEqual([{ sender: 'Bob', text: 'On it.' }]);
    expect(extractChatContext(slackField, 4, 'app.slack.com')[0]).toEqual({ text: 'Can you review the PR?' });
  });

  it('keeps only the latest messages', () => {
    const result = extractChatContext(mount(dom.discordDom), 2, 'discord.com');
    expect(result.map((message) => message.text)).toEqual(['sure, give me 5', 'brb']);
  });

  it('labels my own messages as Me in the prompt', () => {
    const prompt = buildUserPrompt('ok', [
      { sender: 'Frank', text: 'Is the report ready?' },
      { sender: 'Me Myself', text: 'Almost', own: true },
    ]);
    expect(prompt).toContain('[Frank] Is the report ready?');
    expect(prompt).toContain('[Me] Almost');
  });
});
