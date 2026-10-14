import { describe, it, expect } from 'vitest';
import { buildSystemInstruction, buildUserPrompt } from '../src/services/prompt';
import { mockChatContext } from './mocks/gemini.mock';

describe('Prompt Builder Service', () => {
  it('TC-PR-01: builds specific system instruction for each tone', () => {
    const polite = buildSystemInstruction('polite');
    expect(polite).toContain('polite, courteous, and respectful');

    const professional = buildSystemInstruction('professional');
    expect(professional).toContain('professional, clear, and objective');

    const friendly = buildSystemInstruction('friendly');
    expect(friendly).toContain('friendly, natural, and casual');

    const concise = buildSystemInstruction('concise');
    expect(concise).toContain('concise, direct, and efficient');
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
    const prompt = buildUserPrompt('Xin chào bạn');
    expect(prompt).not.toContain('RECENT CONVERSATION CONTEXT');
    expect(prompt).toContain('Xin chào bạn');
  });

  it('TC-PR-04: formats user prompt with chat context', () => {
    const prompt = buildUserPrompt('I agree with the approach', mockChatContext);
    expect(prompt).toContain('--- RECENT CONVERSATION CONTEXT ---');
    expect(prompt).toContain('Alice: Can you please review the PR');
    expect(prompt).toContain('Bob: Sure, I am on it right now');
    expect(prompt).toContain('Target text to process:');
    expect(prompt).toContain('I agree with the approach');
  });
});
