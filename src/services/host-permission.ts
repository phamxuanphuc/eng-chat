import { formatOpenAiEndpoint } from './openai';

export const getServerHost = (baseUrl?: string): string => {
  try {
    return new URL(formatOpenAiEndpoint(baseUrl)).host;
  } catch {
    return (baseUrl || '').trim();
  }
};

export const toOriginPattern = (baseUrl?: string): string | null => {
  try {
    const url = new URL(formatOpenAiEndpoint(baseUrl));
    return url.protocol === 'http:' || url.protocol === 'https:' ? `${url.protocol}//${url.hostname}/*` : null;
  } catch {
    return null;
  }
};

const run = async (method: 'contains' | 'request', baseUrl: string | undefined, onFailure: boolean): Promise<boolean> => {
  const pattern = toOriginPattern(baseUrl);
  const permissions = typeof chrome !== 'undefined' ? chrome.permissions : undefined;
  if (!pattern || !permissions?.[method]) return true;
  try {
    return await permissions[method]({ origins: [pattern] });
  } catch {
    return onFailure;
  }
};

export const hasHostPermission = (baseUrl?: string): Promise<boolean> => run('contains', baseUrl, true);

export const requestHostPermission = (baseUrl?: string): Promise<boolean> => run('request', baseUrl, false);
