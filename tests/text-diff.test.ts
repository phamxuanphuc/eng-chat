import { describe, expect, it } from 'vitest';
import { diffWords, MAX_DIFF_CELLS } from '../src/services/text-diff';

const join = (parts: NonNullable<ReturnType<typeof diffWords>>, types: Array<'same' | 'added' | 'removed'>) =>
  parts.filter((part) => types.includes(part.type)).map((part) => part.text).join('');

describe('diffWords', () => {
  it('returns one same part for identical strings', () => {
    expect(diffWords('Hello there world', 'Hello there world')).toEqual([{ type: 'same', text: 'Hello there world' }]);
  });

  it('returns nothing for two empty strings', () => {
    expect(diffWords('', '')).toEqual([]);
  });

  it('marks everything as added when the original is empty', () => {
    expect(diffWords('', 'New text')).toEqual([{ type: 'added', text: 'New text' }]);
  });

  it('marks everything as removed when the result is empty', () => {
    expect(diffWords('Old text', '')).toEqual([{ type: 'removed', text: 'Old text' }]);
  });

  it('detects an added word', () => {
    const parts = diffWords('I agree', 'I fully agree')!;
    expect(join(parts, ['added']).trim()).toBe('fully');
    expect(join(parts, ['removed'])).toBe('');
    expect(join(parts, ['same', 'added'])).toBe('I fully agree');
  });

  it('detects a removed word', () => {
    const parts = diffWords('I really agree', 'I agree')!;
    expect(join(parts, ['removed']).trim()).toBe('really');
    expect(join(parts, ['same', 'removed'])).toBe('I really agree');
  });

  it('detects a replaced word and keeps the surroundings', () => {
    const parts = diffWords('She go home', 'She goes home')!;
    expect(join(parts, ['removed'])).toBe('go');
    expect(join(parts, ['added'])).toBe('goes');
    expect(join(parts, ['same'])).toBe('She  home');
  });

  it('rebuilds both texts exactly from the parts', () => {
    const before = 'Hi team,\n  please review the   draft today.';
    const after = 'Hello team,\n  kindly review the draft by today.';
    const parts = diffWords(before, after)!;
    expect(join(parts, ['same', 'removed'])).toBe(before);
    expect(join(parts, ['same', 'added'])).toBe(after);
  });

  it('handles non-Latin text', () => {
    const parts = diffWords('Tôi đồng ý', 'Tôi hoàn toàn đồng ý')!;
    expect(join(parts, ['added']).trim()).toBe('hoàn toàn');
  });

  it('skips the diff above the size threshold', () => {
    const words = (count: number) => Array.from({ length: count }, (_, i) => `w${i}`).join(' ');
    const side = Math.ceil(Math.sqrt(MAX_DIFF_CELLS / 4)) + 5;
    expect(diffWords(words(side), words(side))).toBeNull();
    expect(diffWords(words(10), words(10))).not.toBeNull();
  });
});
