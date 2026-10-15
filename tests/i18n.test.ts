import { describe, expect, it } from 'vitest';
import { getTranslator, translate } from '../src/i18n';

describe('i18n', () => {
  it('translates the same key in English and Vietnamese', () => {
    expect(translate('en', 'app.openSettings')).toBe('Open settings');
    expect(translate('vi', 'app.openSettings')).toBe('Mở cài đặt');
  });

  it('interpolates values and falls back to English for unsupported languages', () => {
    expect(getTranslator('vi')('context.messages', { count: 4 })).toBe('4 tin nhắn');
    expect(translate('fr' as any, 'content.close')).toBe('Close');
  });
});
