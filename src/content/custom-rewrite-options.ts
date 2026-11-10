export interface CustomRewriteOptions {
  format: string[];
  tone: string[];
}

export const EMPTY_CUSTOM_OPTIONS: CustomRewriteOptions = { format: [], tone: [] };

const STORAGE_KEY = 'engchat_custom_rewrite_options';

const getArea = () => (typeof chrome !== 'undefined' ? chrome.storage?.local : undefined);

const cleanList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

export const loadCustomRewriteOptions = async (): Promise<CustomRewriteOptions> => {
  try {
    const stored = (await getArea()?.get(STORAGE_KEY))?.[STORAGE_KEY];
    if (!stored || typeof stored !== 'object') return { ...EMPTY_CUSTOM_OPTIONS };
    return { format: cleanList(stored.format), tone: cleanList(stored.tone) };
  } catch {
    return { ...EMPTY_CUSTOM_OPTIONS };
  }
};

export const saveCustomRewriteOptions = async (options: CustomRewriteOptions): Promise<void> => {
  try {
    await getArea()?.set({ [STORAGE_KEY]: options });
  } catch {}
};
