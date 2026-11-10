const COMPOSER = '<div id="composer"><textarea></textarea></div>';

export const slackDom = `
<div class="primary">
  <div data-qa="message_container"><div data-qa="message_content">
    <button data-qa="message_sender_name">Alice</button><a class="c-timestamp">10:31 AM</a>
    <div class="c-message_kit__blocks"><div data-qa="message-text">Can you review the PR?</div></div>
  </div></div>
  <div data-qa="message_container"><div data-qa="message_content">
    <div class="c-message_kit__blocks"><div data-qa="message-text">It is the payment one.</div></div>
  </div></div>
  <div data-qa="message_container"><div data-qa="message_content">
    <button data-qa="message_sender_name">Bob</button><a class="c-timestamp">10:33 AM</a>
    <div class="c-message_kit__blocks"><div data-qa="message-text">On it.</div></div>
  </div></div>
  ${COMPOSER}
</div>
<div class="thread">
  <div data-qa="message_container"><div data-qa="message_content">
    <button data-qa="message_sender_name">Carol</button>
    <div data-qa="message-text">Thread only message</div>
  </div></div>
  <div id="thread-composer"><textarea></textarea></div>
</div>`;

export const discordDom = `
<ol>
  <li id="chat-messages-1-10">
    <span id="message-username-10">Dana</span><time>Today at 9:00</time>
    <div id="message-content-10">anyone up for a game?</div>
  </li>
  <li id="chat-messages-1-11">
    <div class="repliedMessage_x"><div id="message-content-10" class="repliedTextContent_x">anyone up for a game?</div></div>
    <span id="message-username-11">Eli</span>
    <div id="message-content-11">sure, give me 5</div>
  </li>
  <li id="chat-messages-1-12"><div id="message-content-12">brb</div></li>
</ol>${COMPOSER}`;

export const teamsDom = `
<div class="fui-ChatMessage">
  <span data-tid="message-author-name">Frank</span>
  <div data-tid="chat-pane-message"><div id="content-1">Is the report ready?</div></div>
</div>
<div class="fui-ChatMyMessage">
  <div data-tid="chat-pane-message"><div id="content-2">Almost, one hour.</div></div>
</div>${COMPOSER}`;

export const whatsappDom = `
<div class="message-in"><div class="copyable-text" data-pre-plain-text="[10:32, 11/10/2026] Giang: ">
  <span class="quoted-mention selectable-text">old quoted line</span>
  <span class="selectable-text copyable-text">Tối nay đi ăn không?</span><span class="meta">10:32</span>
</div></div>
<div class="message-out"><div class="copyable-text" data-pre-plain-text="[10:33, 11/10/2026] Me Myself: ">
  <span class="selectable-text copyable-text">Ok 7h nhé</span>
</div></div>${COMPOSER}`;

export const telegramADom = `
<div class="Message"><div class="message-title-name">Hana</div>
  <div class="text-content">See you at noon<span class="MessageMeta">12:01</span></div></div>
<div class="Message own"><div class="text-content">Deal<span class="MessageMeta">12:02</span></div></div>
${COMPOSER}`;

export const telegramKDom = `
<div class="bubble is-in"><div class="name"><span class="peer-title">Ivan</span></div>
  <div class="message">Where are you?<span class="time">12:05</span></div></div>
<div class="bubble is-out"><div class="message">Parking<span class="time">12:06</span></div></div>
${COMPOSER}`;

export const messengerDom = `
<div role="grid" aria-label="Messages in conversation">
  <div role="row"><div role="gridcell"><h5>Khoa</h5><div dir="auto">Mai họp mấy giờ?</div></div></div>
  <div role="row"><div role="gridcell"><span>Today 10:00</span></div></div>
  <div role="row"><div role="gridcell"><div dir="auto">9h sáng</div></div></div>
</div>${COMPOSER}`;

export const zaloDom = `
<div class="chat-item"><div class="message-sender-name-content">Lan</div>
  <div data-component="message-text-content"><span class="text">Chị gửi file chưa?</span></div></div>
<div class="chat-item me"><div data-component="message-text-content"><span class="text">Em gửi rồi ạ</span></div></div>
${COMPOSER}`;

export const linkedinDom = `
<div class="msg-s-event-listitem msg-s-event-listitem--other">
  <span class="msg-s-message-group__name">Minh</span>
  <div class="msg-s-event-listitem__body">Are you open to a quick call?</div></div>
<div class="msg-s-event-listitem"><div class="msg-s-event-listitem__body">Yes, Thursday works.</div></div>
${COMPOSER}`;

export const xDom = `
<div data-testid="messageEntry"><div data-testid="tweetText">Loved your thread</div><time>1h</time></div>
${COMPOSER}`;
