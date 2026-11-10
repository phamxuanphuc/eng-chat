import { beforeAll, describe, it, expect, vi } from 'vitest';
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
import { PageHeader } from '../src/options/PageHeader';

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
    fireEvent.click(screen.getByRole('button', { name: /Lịch sự & Trang trọng/ }));
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
    expect(screen.getByPlaceholderText('in').className).toContain('placeholder-placeholder');
    expect(screen.getByPlaceholderText('ta').className).toContain('placeholder-placeholder');
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

  it('TC-UI-13: PageHeader renders title, description, aside and hides decorative icon', () => {
    const { container } = render(
      <PageHeader icon={<svg data-testid="icon" />} title="Context" description="Desc" aside={<span>Aside</span>} />
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Context' })).toBeDefined();
    expect(screen.getByText('Desc')).toBeDefined();
    expect(screen.getByText('Aside')).toBeDefined();
    expect(screen.getByTestId('icon').parentElement!.getAttribute('aria-hidden')).toBe('true');
    render(<PageHeader icon={null} title="Bare" />, { container: container.appendChild(document.createElement('div')) });
    expect(screen.getByRole('heading', { name: 'Bare' }).nextSibling).toBeNull();
  });
});

describe('Placeholder contrast tokens', () => {
  let css = '';
  beforeAll(async () => {
    const fs: any = await import(/* @vite-ignore */ ['node', 'fs'].join(':'));
    css = fs.readFileSync('src/styles/index.css', 'utf8');
  });
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const blend = (fg: number[], bg: number[], alpha: number) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));
  const token = (theme: 'dark' | 'light'): number[] => {
    const block = css.slice(css.indexOf(`[data-engchat-theme='${theme}'] {`));
    const match = block.match(/--c-placeholder:\s*(\d+) (\d+) (\d+)/);
    return match!.slice(1).map(Number);
  };

  it('defines distinct values for dark and light themes', () => {
    expect(token('dark')).toEqual([148, 163, 184]);
    expect(token('light')).toEqual([100, 116, 139]);
  });

  it('meets 4.5:1 on the input surface in both themes', () => {
    const darkInput = blend([15, 23, 42], [2, 6, 23], 0.9);
    const lightInput = blend([255, 255, 255], [248, 250, 252], 0.9);
    expect(ratio(token('dark'), darkInput)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token('light'), lightInput)).toBeGreaterThanOrEqual(4.5);
  });

  it('is lighter than entered text in the light theme', () => {
    expect(ratio(token('light'), [15, 23, 42])).toBeGreaterThan(1);
    expect(luminance(token('light'))).toBeGreaterThan(luminance([71, 85, 105]));
  });
});
