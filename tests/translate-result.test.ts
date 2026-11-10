import { describe, expect, it } from 'vitest';
import { parseTranslateResult } from '../src/services/translate-result';

const empty = { vocabulary: [], grammar: '', nuances: '' };

describe('parseTranslateResult', () => {
  it('parses a clean JSON object', () => {
    const raw = '{"translation":"Xin chào","explanation":{"vocabulary":[{"word":"Hello","meaning":"Xin chào","note":"greeting"}],"grammar":"G","nuances":"N"}}';
    expect(parseTranslateResult(raw)).toEqual({
      translation: 'Xin chào',
      explanation: { vocabulary: [{ word: 'Hello', meaning: 'Xin chào', note: 'greeting' }], grammar: 'G', nuances: 'N' },
    });
  });

  it('strips Markdown fences', () => {
    expect(parseTranslateResult('```json\n{"translation":"Hi"}\n```')).toEqual({ translation: 'Hi', explanation: empty });
  });

  it('finds the object inside surrounding commentary', () => {
    const raw = 'Here is the result:\n{"translation":"Hi","explanation":{"grammar":"G"}}\nHope this helps!';
    expect(parseTranslateResult(raw)).toEqual({ translation: 'Hi', explanation: { ...empty, grammar: 'G' } });
  });

  it('falls back to the raw text when the output is not JSON', () => {
    expect(parseTranslateResult('  Just a plain translation. ')).toEqual({ translation: 'Just a plain translation.', explanation: empty });
  });

  it.each(['"a string"', '[1,2]', '42', 'null', '{"text":"no translation key"}', '{"translation":{"nested":true}}', '{"translation":"   "}'])(
    'never returns a non-string translation for %s',
    (raw) => {
      const result = parseTranslateResult(raw);
      expect(result.translation).toBe(raw);
      expect(result.explanation).toEqual(empty);
    },
  );

  it('drops malformed explanation fields instead of passing them to the UI', () => {
    const raw = '{"translation":"Hi","explanation":{"vocabulary":"none","grammar":["x"],"nuances":7}}';
    expect(parseTranslateResult(raw).explanation).toEqual(empty);
  });

  it('keeps only complete vocabulary entries and omits empty notes', () => {
    const raw = '{"translation":"Hi","explanation":{"vocabulary":[{"word":"a","meaning":"b","note":""},{"word":"c"},null,"x"]}}';
    expect(parseTranslateResult(raw).explanation.vocabulary).toEqual([{ word: 'a', meaning: 'b' }]);
  });

  it('handles empty output', () => {
    expect(parseTranslateResult('')).toEqual({ translation: '', explanation: empty });
  });
});
