import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Textarea } from '../src/components/ui/Textarea';
import { Switch } from '../src/components/ui/Switch';
import { Loader } from '../src/components/ui/Loader';
import { ToneCard } from '../src/components/ui/ToneCard';
import { Alert } from '../src/components/ui/Alert';
import { Badge } from '../src/components/ui/Badge';
import { Select } from '../src/components/ui/Select';

describe('Uiverse Galaxy UI Components', () => {
  it('TC-UI-01: Button renders variants and handles click & loading', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" onClick={handleClick}>
        Click Me
      </Button>
    );

    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeDefined();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button variant="primary" isLoading onClick={handleClick}>
        Click Me
      </Button>
    );
    expect(btn.hasAttribute('disabled')).toBe(true);
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('TC-UI-02: Input handles typing and toggling password visibility', () => {
    const handleChange = vi.fn();
    render(
      <Input
        label="API Key"
        type="password"
        placeholder="Enter key"
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText('Enter key') as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.change(input, { target: { value: 'secret-123' } });
    expect(handleChange).toHaveBeenCalled();

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');
  });

  it('TC-UI-03: Textarea renders label and handles input', () => {
    const handleChange = vi.fn();
    render(
      <Textarea label="Source Text" placeholder="Type here" onChange={handleChange} />
    );

    const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement;
    expect(screen.getByText('Source Text')).toBeDefined();

    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('TC-UI-04: Switch toggles checked state and fires onChange', () => {
    const handleToggle = vi.fn();
    render(
      <Switch
        label="Chat Context"
        description="Include context"
        checked={false}
        onChange={handleToggle}
      />
    );

    const switchBtn = screen.getByRole('switch');
    expect(switchBtn.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(switchBtn);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('TC-UI-05: Loader displays text and renders orbital animation', () => {
    render(<Loader size="md" text="Optimizing with Gemini..." />);
    expect(screen.getByText('Optimizing with Gemini...')).toBeDefined();
  });

  it('TC-UI-06: ToneCard triggers onClick with tone identifier', () => {
    const handleSelect = vi.fn();
    render(
      <ToneCard
        tone="polite"
        title="Lịch sự & Trang trọng"
        description="Phù hợp email công việc"
        icon="🎩"
        selected={true}
        onClick={handleSelect}
      />
    );

    expect(screen.getByText('Lịch sự & Trang trọng')).toBeDefined();
    const card = screen.getByText('Lịch sự & Trang trọng').closest('div');
    if (card) fireEvent.click(card);
    expect(handleSelect).toHaveBeenCalledWith('polite');
  });

  it('TC-UI-07: Alert displays message and triggers onClose', () => {
    const handleClose = vi.fn();
    render(
      <Alert
        variant="success"
        message="Saved successfully"
        description="Settings stored"
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Saved successfully')).toBeDefined();
    expect(screen.getByText('Settings stored')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close alert/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('TC-UI-08: Select renders Galaxy styling and handles selection', () => {
    const handleChange = vi.fn();
    render(
      <Select
        label="Language"
        value="en"
        options={[{ value: 'en', label: 'English' }, { value: 'vi', label: 'Vietnamese' }]}
        onChange={handleChange}
      />
    );

    const select = screen.getByLabelText('Language') as HTMLSelectElement;
    expect(select.value).toBe('en');
    fireEvent.change(select, { target: { value: 'vi' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('TC-UI-09: Badge renders with text and variant style', () => {
    const { container } = render(
      <Badge variant="success" size="sm">
        Hoạt động
      </Badge>
    );
    expect(screen.getByText('Hoạt động')).toBeDefined();
    expect((container.firstChild as HTMLElement).className).toContain('text-emerald-300');
    expect((container.firstChild as HTMLElement).className).not.toContain('text-[10px]');
  });

  it('TC-UI-10: Inputs use an accessible placeholder color', () => {
    render(<><Input placeholder="in" /><Textarea placeholder="ta" /></>);
    expect(screen.getByPlaceholderText('in').className).toContain('placeholder-slate-400');
    expect(screen.getByPlaceholderText('ta').className).toContain('placeholder-slate-400');
  });

  it('TC-UI-11: Primary button gradient keeps white text readable', () => {
    render(<Button variant="primary">Go</Button>);
    const cls = screen.getByRole('button', { name: 'Go' }).className;
    expect(cls).toContain('to-pink-600');
    expect(cls).not.toContain('to-pink-500');
  });

  it('TC-UI-12: Surfaces avoid colored glows and sub-12px text', () => {
    render(
      <>
        <Button variant="primary">Glow</Button>
        <ToneCard tone="polite" title="Card" description="d" icon="🎩" selected onClick={() => {}} index={1} />
        <Badge size="sm">Tag</Badge>
      </>
    );
    expect(screen.getByRole('button', { name: 'Glow' }).className).not.toContain('shadow-indigo');
    const card = screen.getByText('Card').closest('[aria-pressed]')!;
    expect(card.className).not.toContain('bg-gradient');
    expect(card.className).toContain('bg-indigo-500/10');
    expect(screen.getByText('01').className).toContain('text-xs');
    expect(screen.getByText("Tag").parentElement!.className).toContain('text-xs');
  });

});

