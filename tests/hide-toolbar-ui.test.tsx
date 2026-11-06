import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingToolbar } from '../src/content/ui/FloatingToolbar';

const renderBar = (props: Partial<React.ComponentProps<typeof FloatingToolbar>> = {}) =>
  render(
    <FloatingToolbar visible x={10} y={10} onSelectTone={() => {}} onHide={vi.fn()} siteLabel="mail.example.com" {...props} />
  );

describe('FloatingToolbar hide menu', () => {
  it('has no hide button unless a hide handler is provided', () => {
    renderBar({ onHide: undefined });
    expect(screen.queryByRole('button', { name: 'Hide toolbar' })).toBeNull();
  });

  it('opens a menu with the two hide choices and the current site', () => {
    renderBar();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Hide toolbar' }));
    expect(screen.getByRole('menuitem', { name: 'Hide in this tab session' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'Hide on mail.example.com' })).toBeDefined();
  });

  it('reports the chosen scope and closes the menu', () => {
    const onHide = vi.fn();
    renderBar({ onHide });
    fireEvent.click(screen.getByRole('button', { name: 'Hide toolbar' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide in this tab session' }));
    expect(onHide).toHaveBeenLastCalledWith('session');
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Hide toolbar' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide on mail.example.com' }));
    expect(onHide).toHaveBeenLastCalledWith('site');
  });

  it('toggles the menu closed when clicking the hide button again', () => {
    renderBar();
    const hide = screen.getByRole('button', { name: 'Hide toolbar' });
    fireEvent.click(hide);
    fireEvent.click(hide);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes the menu when the toolbar collapses or disappears', () => {
    const { rerender } = renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Hide toolbar' }));
    expect(screen.getByRole('menu')).toBeDefined();
    rerender(<FloatingToolbar visible={false} x={10} y={10} onSelectTone={() => {}} onHide={vi.fn()} />);
    rerender(<FloatingToolbar visible x={10} y={10} onSelectTone={() => {}} onHide={vi.fn()} />);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('localizes the menu in Vietnamese', () => {
    renderBar({ language: 'vi' });
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn thanh công cụ' }));
    expect(screen.getByRole('menuitem', { name: 'Ẩn trong phiên tab này' })).toBeDefined();
    expect(screen.getByRole('menuitem', { name: 'Ẩn trên mail.example.com' })).toBeDefined();
  });
});
