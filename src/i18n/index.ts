import en from './en.json';
import vi from './vi.json';
import { Language } from '../types';

export type TranslationKey = keyof typeof en;
type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = { en, vi };

export const normalizeLanguage = (value?: string): Language => value === 'vi' ? 'vi' : 'en';

export const translate = (language: Language | undefined, key: TranslationKey, values?: Record<string, string | number>): string => {
  const dictionary = dictionaries[normalizeLanguage(language)];
  const fallback = dictionaries.en[key] || key;
  return (dictionary[key] || fallback).replace(/{{(\w+)}}/g, (_, name) => String(values?.[name] ?? `{{${name}}}`));
};

export const getTranslator = (language?: Language) => (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values);

export const languageOptions: Array<{ value: Language; labelKey: 'language.english' | 'language.vietnamese' }> = [
  { value: 'en', labelKey: 'language.english' },
  { value: 'vi', labelKey: 'language.vietnamese' },
];
