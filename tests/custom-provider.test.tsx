import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomProviderManager } from '../src/options/CustomProviderManager';

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

  it('TC-CPM-02: Clicking preset button updates baseUrl and defaultModel', () => {
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

    const deepseekBtn = screen.getByRole('button', { name: /deepseek/i });
    fireEvent.click(deepseekBtn);

    expect(onUpdateBaseUrl).toHaveBeenCalledWith('https://api.deepseek.com/v1');
    expect(onUpdateModel).toHaveBeenCalledWith('deepseek-chat');
  });

  it('TC-CPM-03: Clicking save button triggers onSave callback', () => {
    const onSave = vi.fn();

    renderWithQuery(
      <CustomProviderManager
        baseUrl="https://api.openai.com/v1"
        onUpdateBaseUrl={vi.fn()}
        apiKey="sk-123"
        onUpdateApiKey={vi.fn()}
        model="gpt-4o-mini"
        onUpdateModel={vi.fn()}
        onSave={onSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /lưu cấu hình/i });
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalled();
  });
});
