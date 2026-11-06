import { getTranslator, TranslationKey } from '../../i18n';

export const POPUP_LANGUAGES = [
  'English',
  'Vietnamese',
  'Japanese',
  'Korean',
  'Chinese',
  'French',
  'Spanish',
  'German',
] as const;

export const getLanguageLabel = (t: ReturnType<typeof getTranslator>, language: string): string =>
  POPUP_LANGUAGES.includes(language as (typeof POPUP_LANGUAGES)[number])
    ? t(`language.name.${language}` as TranslationKey)
    : language;
