import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  formatOpenAiEndpoint,
  callOpenAiApi,
  CUSTOM_PROVIDER_PRESETS,
} from '../src/services/openai';
import { executeOptimize } from '../src/services/gemini';
import { DEFAULT_SETTINGS } from '../src/services/storage';

vi.mock('axios');

describe('OpenAI Compatible Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-OA-01: formatOpenAiEndpoint normalizes URLs and adds /chat/completions', () => {
    expect(formatOpenAiEndpoint()).toBe('https://api.openai.com/v1/chat/completions');
    expect(formatOpenAiEndpoint('api.deepseek.com/v1')).toBe('https://api.deepseek.com/v1/chat/completions');
    expect(formatOpenAiEndpoint('https://api.groq.com/openai/v1/')).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(formatOpenAiEndpoint('http://localhost:11434/v1/chat/completions')).toBe('http://localhost:11434/v1/chat/completions');
  });

  it('TC-OA-02: callOpenAiApi throws error when model is empty', async () => {
    await expect(
      callOpenAiApi({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'test-key',
        model: '',
        systemInstruction: 'sys',
        prompt: 'user',
      })
    ).rejects.toThrow('Model is not configured. Enter a model name.');
  });

  it('TC-OA-03: callOpenAiApi sends correct headers and payload and returns content', async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: 'Hello, this is a polished text.',
            },
          },
        ],
      },
    });

    const res = await callOpenAiApi({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test123',
      model: 'gpt-4o-mini',
      systemInstruction: 'You are an optimizer.',
      prompt: 'Test text',
    });

    expect(res).toBe('Hello, this is a polished text.');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an optimizer.' },
          { role: 'user', content: 'Test text' },
        ],
        temperature: 0.7,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test123',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('TC-OA-04: callOpenAiApi handles call without apiKey (e.g. local Ollama)', async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: 'Local response' } }],
      },
    });

    const res = await callOpenAiApi({
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
      model: 'llama3.2',
      systemInstruction: 'sys',
      prompt: 'ping',
    });

    expect(res).toBe('Local response');
    const calledHeaders = (axios.post as any).mock.calls[0][2].headers;
    expect(calledHeaders['Authorization']).toBeUndefined();
  });

  it('TC-OA-05: callOpenAiApi handles error status codes properly', async () => {
    const error401 = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { error: { message: 'Incorrect API key provided' } },
      },
    };
    (axios.isAxiosError as any).mockReturnValue(true);
    (axios.post as any).mockRejectedValueOnce(error401);

    await expect(
      callOpenAiApi({
        apiKey: 'invalid',
        model: 'gpt-4o',
        systemInstruction: 'sys',
        prompt: 'user',
      })
    ).rejects.toThrow('The API key is invalid or access is unauthorized (401)');
  });

  it('TC-OA-06: executeOptimize routes to openai_compatible when configured', async () => {
    (axios.post as any).mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: 'Polished via custom LLM' } }],
      },
    });

    const res = await executeOptimize(
      { text: 'Xin chào', tone: 'professional' },
      {
        ...DEFAULT_SETTINGS,
        llmProvider: 'openai_compatible',
        customBaseUrl: 'https://api.deepseek.com/v1',
        customApiKey: 'sk-deepseek',
        customModel: 'deepseek-chat',
      }
    );

    expect(res.success).toBe(true);
    expect(res.data).toBe('Polished via custom LLM');
  });

  it('TC-OA-07: executeOptimize parses JSON translate_explain with custom LLM', async () => {
    const jsonOutput = JSON.stringify({
      translation: 'Hello World',
      explanation: {
        vocabulary: [{ word: 'Hello', meaning: 'Xin chào' }],
        grammar: 'Present tense',
        nuances: 'Casual',
      },
    });

    (axios.post as any).mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: `\`\`\`json\n${jsonOutput}\n\`\`\`` } }],
      },
    });

    const res = await executeOptimize(
      { text: 'Xin chào thế giới', tone: 'translate_explain' },
      {
        ...DEFAULT_SETTINGS,
        llmProvider: 'openai_compatible',
        customModel: 'gpt-4o-mini',
      }
    );

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.translation).toBe('Hello World');
    expect(data.explanation.vocabulary[0].word).toBe('Hello');
  });

  it('TC-OA-08: CUSTOM_PROVIDER_PRESETS contains essential presets', () => {
    const ids = CUSTOM_PROVIDER_PRESETS.map((p) => p.id);
    expect(ids).toContain('openai');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('groq');
    expect(ids).toContain('openrouter');
    expect(ids).toContain('ollama');
  });
});
