import { TranslateExplainResult } from '../types';

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const extractObject = (raw: string): Record<string, unknown> | null => {
  const unfenced = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  const parsed = parseJson(unfenced) ?? (start !== -1 && end > start ? parseJson(unfenced.slice(start, end + 1)) : null);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
};

export const parseTranslateResult = (raw: string): TranslateExplainResult => {
  const parsed = extractObject(raw);
  const translation = asText(parsed?.translation);
  if (!translation) {
    return { translation: raw.trim(), explanation: { vocabulary: [], grammar: '', nuances: '' } };
  }

  const explanation = parsed?.explanation && typeof parsed.explanation === 'object'
    ? (parsed.explanation as Record<string, unknown>)
    : {};
  const vocabulary = (Array.isArray(explanation.vocabulary) ? explanation.vocabulary : [])
    .map((item: any) => ({ word: asText(item?.word), meaning: asText(item?.meaning), note: asText(item?.note) }))
    .filter((item) => item.word && item.meaning)
    .map(({ word, meaning, note }) => (note ? { word, meaning, note } : { word, meaning }));

  return {
    translation,
    explanation: { vocabulary, grammar: asText(explanation.grammar), nuances: asText(explanation.nuances) },
  };
};
