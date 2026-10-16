export const EXTENSION_CONTEXT_ERROR = 'Extension was updated. Please reload this page to reconnect EngChat AI.';

export const isExtensionContextError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /extension context invalidated|receiving end does not exist|message port closed/i.test(message);
};

export const sendRuntimeMessage = async <T = any>(message: unknown): Promise<T> => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    throw new Error('EngChat AI is unavailable on this page.');
  }

  try {
    return await chrome.runtime.sendMessage(message) as T;
  } catch (error) {
    if (isExtensionContextError(error)) {
      throw new Error(EXTENSION_CONTEXT_ERROR);
    }
    throw error;
  }
};
