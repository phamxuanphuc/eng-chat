import ReactDOM from 'react-dom/client';
import styles from '../styles/index.css?inline';

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;

export const ensureShadowHost = (): { shadowRoot: ShadowRoot; reactRoot: ReactDOM.Root } => {
  if (shadowRoot && reactRoot) {
    return { shadowRoot, reactRoot };
  }

  document.getElementById('engchat-root-host')?.remove();
  const host = document.createElement('div');
  host.id = 'engchat-root-host';
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleLink = document.createElement('style');
  styleLink.textContent = `
    :host { all: initial; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    * { box-sizing: border-box; }
    ${styles}
  `;
  shadowRoot.appendChild(styleLink);

  const appContainer = document.createElement('div');
  appContainer.id = 'engchat-app-container';
  shadowRoot.appendChild(appContainer);

  reactRoot = ReactDOM.createRoot(appContainer);
  return { shadowRoot, reactRoot };
};
