import { describe, it, expect } from 'vitest';
import { buildSystemInstruction, buildUserPrompt } from '../src/services/prompt';
import { mockChatContext } from './mocks/gemini.mock';

describe('Prompt Builder Service', () => {
  it('TC-PR-01: builds specific system instruction for each tone', () => {
    const polite = buildSystemInstruction('polite');
    expect(polite).toContain('courteous, respectful, and tactful');

    const professional = buildSystemInstruction('professional');
    expect(professional).toContain('clear, precise, objective');

    const friendly = buildSystemInstruction('friendly');
    expect(friendly).toContain('natural, warm, casual');

    const concise = buildSystemInstruction('concise');
    expect(concise).toContain('direct, efficient English');
    expect(concise).toContain('Write like a real person');
    expect(concise).toContain('Do not add filler');
  });

  it('TC-PR-02: builds JSON schema system instruction for translate_explain', () => {
    const instruction = buildSystemInstruction('translate_explain');
    expect(instruction).toContain('translation');
    expect(instruction).toContain('vocabulary');
    expect(instruction).toContain('grammar');
    expect(instruction).toContain('nuances');
    expect(instruction).toContain('raw JSON only');
  });

  it('TC-PR-03: formats user prompt without chat context', () => {
    const prompt = buildUserPrompt('  Xin chào bạn  ');
    expect(prompt).not.toContain('<conversation_context>');
    expect(prompt).toContain('<target_text>\nXin chào bạn\n</target_text>');
  });

  it('TC-PR-04: formats user prompt with labeled, delimited chat context', () => {
    const prompt = buildUserPrompt('I agree with the approach', mockChatContext);
    expect(prompt).toContain('<conversation_context>');
    expect(prompt).toContain('[Alice] Can you please review the PR');
    expect(prompt).toContain('[Bob] Sure, I am on it right now');
    expect(prompt).toContain('</conversation_context>');
    expect(prompt).toContain('<target_text>\nI agree with the approach\n</target_text>');
  });

  it('TC-PR-05: ignores empty context messages and preserves empty target boundaries', () => {
    const prompt = buildUserPrompt('  ', [
      { sender: 'Ignored', text: '   ' },
      { text: 'Useful context' },
    ]);

    expect(prompt).toContain('[Message 1] Useful context');
    expect(prompt).not.toContain('Ignored');
    expect(prompt).toContain('<target_text>\n\n</target_text>');
  });
});
