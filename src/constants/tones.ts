import { ToneType } from '../types';

export interface ToneItem {
  id: ToneType;
  title: string;
  desc: string;
  icon: string;
}

export const TONES_LIST: ToneItem[] = [
  { id: 'polite', title: 'Polite & Formal', desc: 'Partner emails and formal correspondence', icon: '🎩' },
  { id: 'professional', title: 'Professional & Business', desc: 'Technical reports and workplace communication', icon: '💼' },
  { id: 'friendly', title: 'Friendly & Natural', desc: 'Colleague conversations and group chats', icon: '🤝' },
  { id: 'concise', title: 'Concise & Direct', desc: 'Shorten wording and remove filler', icon: '⚡' },
  { id: 'translate_explain', title: 'Translate & Explain', desc: 'Two-way translation with grammar and vocabulary', icon: '📖' },
];
