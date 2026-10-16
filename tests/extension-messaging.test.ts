import { describe, expect, it, vi } from 'vitest';
import { EXTENSION_CONTEXT_ERROR, getRuntimeErrorMessage, isExtensionContextError, sendRuntimeMessage } from '../src/services/extension-messaging';

describe('extension messaging', () => {
  it('recognizes stale extension context errors', () => {
    expect(isExtensionContextError(new Error('Extension context invalidated.'))).toBe(true);
    expect(isExtensionContextError(new Error('Could not establish connection. Receiving end does not exist.'))).toBe(true);
  });

  it('maps stale context failures to a reload message', async () => {
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn().mockRejectedValue(new Error('Extension context invalidated.')) } });
    await expect(sendRuntimeMessage({ action: 'GET_SETTINGS' })).rejects.toThrow(EXTENSION_CONTEXT_ERROR);
  });

  it('formats stale runtime errors for UI surfaces', () => {
    expect(getRuntimeErrorMessage(new Error('Extension context invalidated.'), 'Fallback')).toBe(EXTENSION_CONTEXT_ERROR);
    expect(getRuntimeErrorMessage(new Error('Network failed'), 'Fallback')).toBe('Network failed');
  });

  it('preserves non-context errors', async () => {
    const error = new Error('Network failed');
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn().mockRejectedValue(error) } });
    await expect(sendRuntimeMessage({ action: 'GET_SETTINGS' })).rejects.toThrow(error);
  });
});
