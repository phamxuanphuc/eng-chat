export type ToneType =
  | 'polite'
  | 'professional'
  | 'friendly'
  | 'concise'
  | 'translate_explain';

export interface ToneOption {
  id: ToneType;
  title: string;
  description: string;
  icon: string;
}

export interface ApiKeyItem {
  id: string;
  label: string;
  key: string;
}

export type LLMProvider = 'gemini' | 'openai_compatible';
export type Language = 'en' | 'vi';

export interface AppSettings {
  language?: Language;
  llmProvider?: LLMProvider;
  geminiApiKey: string;
  apiKeys?: ApiKeyItem[];
  autoRotateKeys?: boolean;
  selectedModel: string;
  defaultTone: ToneType;
  tonePrompts?: Partial<Record<ToneType, string>>;
  enableChatContext: boolean;
  maxContextMessages: number;
  customBaseUrl?: string;
  customApiKey?: string;
  customModel?: string;
}

export interface ChatMessage {
  sender?: string;
  text: string;
}

export interface TranslateExplainResult {
  translation: string;
  explanation: {
    vocabulary: Array<{ word: string; meaning: string; note?: string }>;
    grammar: string;
    nuances: string;
  };
}

export interface OptimizeRequest {
  text: string;
  tone: ToneType;
  contextMessages?: ChatMessage[];
  rewriteOptions?: RewriteOptions;
  taskInstruction?: string;
}

export interface OptimizeResponse {
  success: boolean;
  data?: string | TranslateExplainResult;
  error?: string;
}

export interface ContextMenuActionMessage {
  action: 'TRIGGER_OPTIMIZE';
  tone: ToneType;
  mode?: 'translate' | 'rewrite' | 'improve';
}

export interface ContentScriptQueryPayload {
  action: 'PROCESS_OPTIMIZE';
  payload: OptimizeRequest;
}

export interface RewriteOptions {
  length: 'Auto' | 'Short' | 'Medium' | 'Long';
  formality: 'Auto' | 'Casual' | 'Neutral' | 'Formal';
  format: string;
  tone: string;
}

export const DEFAULT_REWRITE_OPTIONS: RewriteOptions = {
  length: 'Auto',
  formality: 'Auto',
  format: 'Auto',
  tone: 'Auto',
};

