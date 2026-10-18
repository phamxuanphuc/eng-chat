export type PopupMode = 'translate' | 'rewrite' | 'improve' | 'summary';
export type TargetLanguages = Record<PopupMode, string>;

export const DEFAULT_TARGET_LANGUAGES: TargetLanguages = {
  improve: 'English',
  rewrite: 'English',
  summary: 'Vietnamese',
  translate: 'Vietnamese',
};

const STORAGE_KEY = 'engchat_target_languages';

const getArea = () => (typeof chrome !== 'undefined' ? chrome.storage?.local : undefined);

export const loadTargetLanguages = async (): Promise<TargetLanguages> => {
  try {
    const stored = (await getArea()?.get(STORAGE_KEY))?.[STORAGE_KEY];
    return { ...DEFAULT_TARGET_LANGUAGES, ...(stored && typeof stored === 'object' ? stored : {}) };
  } catch {
    return { ...DEFAULT_TARGET_LANGUAGES };
  }
};

export const saveTargetLanguages = async (languages: TargetLanguages): Promise<void> => {
  try {
    await getArea()?.set({ [STORAGE_KEY]: languages });
  } catch {}
};
