import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchOpenAiModels, formatOpenAiModelsEndpoint } from '../src/services/openai';
import { fetchGeminiModels } from '../src/services/gemini';

vi.mock('axios');

describe('model discovery services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the compatible models endpoint from a base URL', () => {
    expect(formatOpenAiModelsEndpoint('https://example.test/v1/')).toBe('https://example.test/v1/models');
  });

  it('normalizes OpenAI-compatible model ids', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { data: [{ id: 'z-model' }, { id: 'a-model' }, 'b-model'] } });
    await expect(fetchOpenAiModels({ baseUrl: 'https://example.test/v1', apiKey: 'secret' })).resolves.toEqual(['a-model', 'b-model', 'z-model']);
    expect(axios.get).toHaveBeenCalledWith('https://example.test/v1/models', expect.objectContaining({ headers: { Authorization: 'Bearer secret' } }));
  });

  it('filters Gemini models to generateContent models', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { models: [{ name: 'models/gemini-a', supportedGenerationMethods: ['generateContent'] }, { name: 'models/embed', supportedGenerationMethods: ['embedContent'] }] } });
    await expect(fetchGeminiModels('gemini-key')).resolves.toEqual(['gemini-a']);
  });
});
