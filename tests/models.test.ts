import { describe, expect, it } from 'vitest';
import { GEMINI_MODELS } from '../src/constants/models';
import { DEFAULT_SETTINGS } from '../src/services/storage';
import en from '../src/i18n/en.json';

describe('Gemini model catalog', () => {
  it('has unique ids and includes the default model', () => {
    const ids = GEMINI_MODELS.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_SETTINGS.selectedModel);
  });

  it('points every label at an existing translation', () => {
    for (const model of GEMINI_MODELS) {
      expect(en[model.tagKey]).toBeTruthy();
      expect(en[model.descriptionKey]).toBeTruthy();
      expect(model.name.trim()).not.toBe('');
    }
  });
});
