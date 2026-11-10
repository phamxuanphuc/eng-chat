export type DiffPart = { type: 'same' | 'added' | 'removed'; text: string };

export const MAX_DIFF_CELLS = 250_000;

const tokenize = (text: string): string[] => text.split(/(\s+)/).filter((token) => token.length > 0);

const pushPart = (parts: DiffPart[], type: DiffPart['type'], text: string): void => {
  const last = parts[parts.length - 1];
  if (last && last.type === type) last.text += text;
  else parts.push({ type, text });
};

export const diffWords = (before: string, after: string): DiffPart[] | null => {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length * b.length > MAX_DIFF_CELLS) return null;

  const width = b.length + 1;
  const lengths = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i * width + j] =
        a[i] === b[j]
          ? lengths[(i + 1) * width + j + 1] + 1
          : Math.max(lengths[(i + 1) * width + j], lengths[i * width + j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pushPart(parts, 'same', a[i]);
      i++;
      j++;
    } else if (lengths[(i + 1) * width + j] >= lengths[i * width + j + 1]) {
      pushPart(parts, 'removed', a[i++]);
    } else {
      pushPart(parts, 'added', b[j++]);
    }
  }
  while (i < a.length) pushPart(parts, 'removed', a[i++]);
  while (j < b.length) pushPart(parts, 'added', b[j++]);
  return parts;
};
