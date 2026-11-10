import { vi } from 'vitest';

export const makeStreamConnect = (sendMessage: (message: any) => unknown) =>
  vi.fn(() => {
    const messageListeners: Array<(message: any) => void> = [];
    const emit = (message: unknown) => messageListeners.forEach((fn) => fn(message));
    return {
      postMessage: (message: { payload: unknown }) => {
        Promise.resolve(sendMessage({ action: 'EXECUTE_GEMINI', payload: message.payload })).then(
          (result: any) => emit(result?.success ? { type: 'done', data: result.data } : { type: 'error', error: result?.error, fallback: false }),
          (error: Error) => emit({ type: 'error', error: error?.message, fallback: false })
        );
      },
      disconnect: vi.fn(),
      onMessage: { addListener: (fn: (message: any) => void) => messageListeners.push(fn) },
      onDisconnect: { addListener: vi.fn() },
    };
  });
