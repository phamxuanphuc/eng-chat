import { translate, TranslationKey } from '../i18n';
import { Language } from '../types';

export type ErrorKey = Extract<TranslationKey, `error.${string}`>;
type ErrorParams = Record<string, string | number>;

export class ApiError extends Error {
  readonly key: ErrorKey;
  readonly params: ErrorParams;

  constructor(key: ErrorKey, params: ErrorParams = {}) {
    super(translate('en', key, params).trim());
    this.name = 'ApiError';
    this.key = key;
    this.params = params;
  }
}

export const localizeError = (error: unknown, language?: Language, fallbackKey: TranslationKey = 'error.generic'): string => {
  if (error instanceof ApiError) return translate(language, error.key, error.params).trim();
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return message.trim() || translate(language, fallbackKey);
};
