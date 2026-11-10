import { OptimizeRequest } from '../types';
import { loadSettings } from '../services/storage';
import { executeOptimize } from '../services/gemini';
import { executeOptimizeStream, streamsPlainText } from '../services/optimize-stream';
import { ApiError, localizeError } from '../services/api-error';

export const STREAM_PORT_NAME = 'engchat_stream';

const FALLBACK_ERROR_KEYS = new Set([
  'error.invalidRequest',
  'error.geminiBadRequest',
  'error.openaiBadRequest',
  'error.openaiNotFound',
  'error.serverUnavailable',
  'error.geminiNetwork',
  'error.openaiNetwork',
]);

const canFallBack = (error: unknown, emitted: boolean): boolean =>
  !emitted && (!(error instanceof ApiError) || FALLBACK_ERROR_KEYS.has(error.key));

export const handleStreamPort = (port: chrome.runtime.Port): void => {
  const controller = new AbortController();
  let started = false;
  const send = (message: unknown) => {
    if (controller.signal.aborted) return;
    try {
      port.postMessage(message);
    } catch {}
  };

  port.onDisconnect.addListener(() => controller.abort());
  port.onMessage.addListener(async (message: { payload?: OptimizeRequest }) => {
    const request = message?.payload;
    if (started || !request) return;
    started = true;
    let emitted = false;
    try {
      const settings = await loadSettings();
      if (!streamsPlainText(request)) {
        const result = await executeOptimize(request, settings);
        send(result.success ? { type: 'done', data: result.data } : { type: 'error', error: result.error, fallback: false });
        return;
      }
      const data = await executeOptimizeStream(
        request,
        settings,
        (text) => { emitted = true; send({ type: 'chunk', text }); },
        controller.signal
      );
      send({ type: 'done', data });
    } catch (error) {
      if (controller.signal.aborted) return;
      const language = await loadSettings().then((settings) => settings.language).catch(() => undefined);
      send({ type: 'error', error: localizeError(error, language), fallback: canFallBack(error, emitted) });
    }
  });
};
