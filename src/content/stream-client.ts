import { OptimizeRequest, OptimizeResponse } from '../types';

export const STREAM_PORT_NAME = 'engchat_stream';

export interface StreamResult extends OptimizeResponse {
  fallback?: boolean;
  cancelled?: boolean;
}

let cancelActive: (() => void) | null = null;

export const cancelStream = (): void => {
  cancelActive?.();
};

export const streamOptimize = (payload: OptimizeRequest, onChunk: (text: string) => void): Promise<StreamResult> =>
  new Promise((resolve) => {
    cancelStream();
    if (typeof chrome === 'undefined' || !chrome.runtime?.connect) {
      resolve({ success: false, fallback: true });
      return;
    }

    let port: chrome.runtime.Port;
    try {
      port = chrome.runtime.connect({ name: STREAM_PORT_NAME });
    } catch {
      resolve({ success: false, fallback: true });
      return;
    }

    let emitted = false;
    let settled = false;
    const finish = (result: StreamResult) => {
      if (settled) return;
      settled = true;
      if (cancelActive === cancel) cancelActive = null;
      try { port.disconnect(); } catch {}
      resolve(result);
    };
    const cancel = () => finish({ success: false, cancelled: true });
    cancelActive = cancel;

    port.onMessage.addListener((message: any) => {
      if (message?.type === 'chunk' && typeof message.text === 'string') {
        emitted = true;
        onChunk(message.text);
      } else if (message?.type === 'done') {
        finish({ success: true, data: message.data });
      } else if (message?.type === 'error') {
        finish({ success: false, error: message.error, fallback: !!message.fallback && !emitted });
      }
    });
    port.onDisconnect.addListener(() => finish({ success: false, fallback: !emitted }));

    try {
      port.postMessage({ payload });
    } catch {
      finish({ success: false, fallback: true });
    }
  });
