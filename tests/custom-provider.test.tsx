import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomProviderManager } from '../src/options/CustomProviderManager';
import { ApiError } from '../src/services/api-error';
import { fetchOpenAiModels } from '../src/services/openai';

vi.mock('../src/services/openai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/services/openai')>()),
  fetchOpenAiModels: vi.fn(),
}));

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('CustomProviderManager Component', () => {
  it('TC-CPM-01: Renders input fields with current values', () => {
    const onUpdateBaseUrl = vi.fn();
    const onUpdateApiKey = vi.fn();
    const onUpdateModel = vi.fn();

    renderWithQuery(
      <CustomProviderManager
        baseUrl="https://api.openai.com/v1"
        onUpdateBaseUrl={onUpdateBaseUrl}
        apiKey="sk-test"
        onUpdateApiKey={onUpdateApiKey}
        model="gpt-4o-mini"
        onUpdateModel={onUpdateModel}
      />
    );

    expect(screen.getByDisplayValue('https://api.openai.com/v1')).toBeDefined();
    expect(screen.getByDisplayValue('sk-test')).toBeDefined();
    expect(screen.getByDisplayValue('gpt-4o-mini')).toBeDefined();
  });

  it('TC-CPM-02: Typing in Base URL and Model inputs triggers callbacks', () => {
    const onUpdateBaseUrl = vi.fn();
    const onUpdateApiKey = vi.fn();
    const onUpdateModel = vi.fn();

    renderWithQuery(
      <CustomProviderManager
        baseUrl="https://api.openai.com/v1"
        onUpdateBaseUrl={onUpdateBaseUrl}
        apiKey=""
        onUpdateApiKey={onUpdateApiKey}
        model="gpt-4o-mini"
        onUpdateModel={onUpdateModel}
      />
    );

    const baseUrlInput = screen.getByLabelText(/base url/i);
    fireEvent.change(baseUrlInput, { target: { value: 'https://api.deepseek.com/v1' } });
    expect(onUpdateBaseUrl).toHaveBeenCalledWith('https://api.deepseek.com/v1');

    const modelInput = screen.getByLabelText(/model/i);
    fireEvent.change(modelInput, { target: { value: 'deepseek-chat' } });
    expect(onUpdateModel).toHaveBeenCalledWith('deepseek-chat');
  });

  it('TC-CPM-03: Leaves saving to the shared settings bar', () => {
    renderWithQuery(
      <CustomProviderManager
        baseUrl="https://api.openai.com/v1"
        onUpdateBaseUrl={vi.fn()}
        apiKey="sk-123"
        onUpdateApiKey={vi.fn()}
        model="gpt-4o-mini"
        onUpdateModel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
  });
});

describe('CustomProviderManager presets and model loading', () => {
  const setup = (props: Partial<React.ComponentProps<typeof CustomProviderManager>> = {}) => {
    const handlers = { onUpdateBaseUrl: vi.fn(), onUpdateModel: vi.fn(), onUpdateApiKey: vi.fn() };
    renderWithQuery(
      <CustomProviderManager
        baseUrl="https://api.openai.com/v1"
        apiKey="sk-1"
        model="gpt-4o-mini"
        {...handlers}
        {...props}
      />
    );
    return handlers;
  };

  beforeEach(() => {
    vi.mocked(fetchOpenAiModels).mockReset();
    delete (globalThis as any).chrome;
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
  });

  it('lists a chip for every preset and marks the one matching the Base URL', () => {
    setup();
    for (const name of ['OpenAI', 'DeepSeek', 'Groq', 'OpenRouter', 'Ollama (Local)']) {
      expect(screen.getByRole('button', { name })).toBeDefined();
    }
    expect(screen.getByRole('button', { name: 'OpenAI' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Groq' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('fills Base URL and model from the chosen preset', () => {
    const handlers = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Groq' }));
    expect(handlers.onUpdateBaseUrl).toHaveBeenCalledWith('https://api.groq.com/openai/v1');
    expect(handlers.onUpdateModel).toHaveBeenCalledWith('llama-3.3-70b-versatile');
  });

  it('loads the model list and lets the user pick one', async () => {
    vi.mocked(fetchOpenAiModels).mockResolvedValue(['gpt-4o', 'gpt-4o-mini']);
    const handlers = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Load model list' }));

    const select = await screen.findByLabelText('Choose a model');
    expect(fetchOpenAiModels).toHaveBeenCalledWith({ baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-1' });
    fireEvent.change(select, { target: { value: 'gpt-4o' } });
    expect(handlers.onUpdateModel).toHaveBeenCalledWith('gpt-4o');
    expect((select as HTMLSelectElement).value).toBe('gpt-4o-mini');
  });

  it('shows a localized error and keeps manual entry when loading fails', async () => {
    vi.mocked(fetchOpenAiModels).mockRejectedValue(new ApiError('error.modelsNetwork'));
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Load model list' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined());
    expect(screen.queryByLabelText('Choose a model')).toBeNull();
    expect(screen.getByLabelText(/model name/i)).toBeDefined();
  });

  it('does not call the network when the user refuses host access', async () => {
    (globalThis as any).chrome = { permissions: { request: vi.fn(async () => false) } };
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Load model list' }));
    expect(await screen.findByText(/needs your permission to reach api\.openai\.com/)).toBeDefined();
    expect(fetchOpenAiModels).not.toHaveBeenCalled();
  });

  it('forgets the loaded list when the Base URL changes', async () => {
    vi.mocked(fetchOpenAiModels).mockResolvedValue(['gpt-4o']);
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Load model list' }));
    await screen.findByLabelText('Choose a model');
    fireEvent.click(screen.getByRole('button', { name: 'DeepSeek' }));
    await waitFor(() => expect(screen.queryByLabelText('Choose a model')).toBeNull());
  });
});
