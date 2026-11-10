import { TranslationKey } from '../i18n';

export interface GeminiModel {
  id: string;
  name: string;
  tagKey: TranslationKey;
  descriptionKey: TranslationKey;
  tagVariant: 'success' | 'primary' | 'secondary' | 'warning';
}

export const GEMINI_MODELS: GeminiModel[] = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', tagKey: 'model.recommended', descriptionKey: 'model.flashLiteDescription', tagVariant: 'success' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tagKey: 'model.highQuality', descriptionKey: 'model.flashDescription', tagVariant: 'primary' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', tagKey: 'model.stable', descriptionKey: 'model.stableDescription', tagVariant: 'secondary' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tagKey: 'model.standard', descriptionKey: 'model.standardDescription', tagVariant: 'secondary' },
];
