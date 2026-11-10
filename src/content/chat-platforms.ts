export interface ChatPlatform {
  id: string;
  hosts?: RegExp;
  item: string;
  text?: string;
  strip?: string;
  sender?: string;
  senderAttr?: string;
  own?: string;
}

export const CHAT_PLATFORMS: ChatPlatform[] = [
  {
    id: 'slack',
    item: '[data-qa="message_container"]',
    text: '[data-qa="message-text"], .c-message_kit__blocks',
    sender: '[data-qa="message_sender_name"]',
  },
  {
    id: 'discord',
    item: '[id^="chat-messages-"]',
    text: '[id^="message-content-"]:not([class*="repliedTextContent"])',
    sender: '[id^="message-username-"]',
  },
  {
    id: 'teams',
    hosts: /(^|\.)teams\.(microsoft\.com|live\.com|cloud\.microsoft)$/,
    item: '.fui-ChatMessage, .fui-ChatMyMessage',
    text: '[id^="content-"], [data-tid="chat-pane-message"]',
    sender: '[data-tid="message-author-name"]',
    own: '.fui-ChatMyMessage',
  },
  {
    id: 'whatsapp',
    hosts: /(^|\.)web\.whatsapp\.com$/,
    item: '.message-in, .message-out',
    text: '.selectable-text.copyable-text',
    sender: '[data-pre-plain-text]',
    senderAttr: 'data-pre-plain-text',
    own: '.message-out',
  },
  {
    id: 'telegram-a',
    hosts: /(^|\.)web\.telegram\.org$/,
    item: '.Message',
    text: '.text-content',
    strip: '.MessageMeta, .Reactions',
    sender: '.message-title-name, .sender-title',
    own: '.own',
  },
  {
    id: 'telegram-k',
    hosts: /(^|\.)web\.telegram\.org$/,
    item: '.bubble',
    text: '.message',
    strip: '.time, .reactions, .reply',
    sender: '.name .peer-title',
    own: '.is-out',
  },
  {
    id: 'messenger',
    hosts: /(^|\.)(messenger\.com|facebook\.com|instagram\.com)$/,
    item: '[role="grid"] [role="row"]',
    text: 'div[dir="auto"]',
    sender: 'h5, h4',
  },
  {
    id: 'zalo',
    hosts: /(^|\.)chat\.zalo\.me$/,
    item: '.chat-item',
    text: '[data-component="message-text-content"], .text-message__container .text, span.text',
    sender: '.message-sender-name-content',
    own: '.me',
  },
  {
    id: 'linkedin',
    hosts: /(^|\.)linkedin\.com$/,
    item: '.msg-s-event-listitem',
    text: '.msg-s-event-listitem__body',
    sender: '.msg-s-message-group__name',
    own: ':not(.msg-s-event-listitem--other)',
  },
  {
    id: 'x',
    hosts: /(^|\.)(x|twitter)\.com$/,
    item: '[data-testid="messageEntry"]',
    text: '[data-testid="tweetText"]',
  },
  { id: 'slack-content', item: '[data-qa="message_content"]' },
  { id: 'slack-body', item: '.c-message__body' },
  { id: 'discord-content', item: '[id^="message-content-"]:not([class*="repliedTextContent"])' },
  { id: 'generic', item: '.message-text' },
];
