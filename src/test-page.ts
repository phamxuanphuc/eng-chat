export const toggleTheme = () => {
  const body = document.body;
  const html = document.documentElement;
  body.classList.toggle('light-mode');
  html.classList.toggle('light-mode');

  const isLight = body.classList.contains('light-mode');
  const theme = isLight ? 'light' : 'dark';
  html.setAttribute('data-theme', theme);
  body.setAttribute('data-theme', theme);

  const btn = document.getElementById('toggle-theme-btn');
  if (btn) {
    btn.textContent = isLight ? '🌙 Dark Mode' : '☀️ / 🌙 Change Theme';
  }

  const logEl = document.getElementById('event-log');
  if (logEl) {
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML = `[${time}] Theme changed to: <b>${theme}</b><br/>` + logEl.innerHTML;
  }
};

(window as any).toggleTheme = toggleTheme;

const initTestPage = () => {
  const toggleBtn = document.getElementById('toggle-theme-btn');
  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.preventDefault();
      toggleTheme();
    };
  }

  const clearBtn = document.getElementById('clear-log-btn');
  const logEl = document.getElementById('event-log');
  if (clearBtn && logEl) {
    clearBtn.onclick = () => {
      logEl.innerHTML = 'Log cleared.';
    };
  }

  const appendLog = (text: string) => {
    if (!logEl) return;
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML = `[${time}] ${text}<br/>` + logEl.innerHTML;
  };

  ['chat-input-test', 'textarea-test', 'contenteditable-test'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    ['beforeinput', 'input', 'change'].forEach((evt) => {
      el.addEventListener(evt, () => {
        const inputEl = el as HTMLInputElement;
        const val = inputEl.value !== undefined ? inputEl.value : el.innerText;
        appendLog(`Event <b>${evt}</b> on <i>#${id}</i> (Length: ${val.length})`);
      });
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestPage);
} else {
  initTestPage();
}