import { ToneType, ChatMessage } from '../types';

export const buildSystemInstruction = (tone: ToneType): string => {
  if (tone === 'translate_explain') {
    return [
      'You are a professional bilingual linguist (English and Vietnamese).',
      'Your task is to accurately translate the input text between Vietnamese and English, and provide clear educational explanations.',
      'You MUST return ONLY a valid JSON object strictly matching this schema:',
      '{',
      '  "translation": "translated text string",',
      '  "explanation": {',
      '    "vocabulary": [{ "word": "term", "meaning": "definition/meaning", "note": "optional context/usage" }],',
      '    "grammar": "concise explanation of notable grammatical structures used",',
      '    "nuances": "explanation of tone, cultural context, or why specific words were chosen"',
      '  }',
      '}',
      'Do NOT output markdown backticks, do NOT output any conversational text or prefix/suffix. Return raw JSON only.',
    ].join(' ');
  }

  const toneGuidelines: Record<Exclude<ToneType, 'translate_explain'>, string> = {
    polite:
      'Rewrite the text into polite, courteous, and respectful English suitable for clients, senior partners, or formal correspondence.',
    professional:
      'Rewrite the text into professional, clear, and objective English suitable for business workplace, technical documentation, or team meetings.',
    friendly:
      'Rewrite the text into friendly, natural, and casual English suitable for close colleagues, chat groups, or social messaging.',
    concise:
      'Rewrite the text into concise, direct, and efficient English, removing all filler and fluff while preserving the core intent.',
  };

  return [
    'You are an expert native English communication specialist.',
    toneGuidelines[tone],
    'CRITICAL RULE: Return ONLY the revised English text.',
    'Do NOT include explanations, greetings, quotes, or conversational filler.',
  ].join(' ');
};

export const buildUserPrompt = (
  text: string,
  contextMessages?: ChatMessage[]
): string => {
  const parts: string[] = [];

  if (contextMessages && contextMessages.length > 0) {
    parts.push('--- RECENT CONVERSATION CONTEXT ---');
    contextMessages.forEach((msg, idx) => {
      const sender = msg.sender ? `${msg.sender}: ` : `Message ${idx + 1}: `;
      parts.push(`${sender}${msg.text}`);
    });
    parts.push('--- END OF CONTEXT ---\n');
  }

  parts.push('Target text to process:');
  parts.push(text);

  return parts.join('\n');
};
