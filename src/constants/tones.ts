import { BookOpen, Briefcase, Handshake, LucideIcon, Sparkle, Zap } from 'lucide-react';
import { ToneType } from '../types';

export interface ToneItem {
  id: ToneType;
  title: string;
  desc: string;
  Icon: LucideIcon;
}

export const TONES_LIST: ToneItem[] = [
  { id: 'polite', title: 'Polite & Formal', desc: 'Partner emails and formal correspondence', Icon: Sparkle },
  { id: 'professional', title: 'Professional & Business', desc: 'Technical reports and workplace communication', Icon: Briefcase },
  { id: 'friendly', title: 'Friendly & Natural', desc: 'Colleague conversations and group chats', Icon: Handshake },
  { id: 'concise', title: 'Concise & Direct', desc: 'Shorten wording and remove filler', Icon: Zap },
  { id: 'translate_explain', title: 'Translate & Explain', desc: 'Two-way translation with grammar and vocabulary', Icon: BookOpen },
];
