import React, { useRef } from 'react';
import { Check } from 'lucide-react';

export interface MenuProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

const getActiveElement = (element: HTMLElement) =>
  (element.getRootNode() as Document | ShadowRoot).activeElement;

export const Menu: React.FC<MenuProps> = ({ label, className = '', children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const menu = menuRef.current;
    if (!menu) return;
    event.preventDefault();
    const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const current = items.indexOf(getActiveElement(menu) as HTMLElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(current + step + items.length) % items.length]?.focus();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={`absolute z-50 flex animate-popIn flex-col gap-0.5 rounded-xl border border-slate-700 bg-slate-900 p-1 text-slate-300 shadow-[0_12px_32px_rgb(2_6_23/0.35)] ${className}`}
    >
      {children}
    </div>
  );
};

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({ active = false, icon, className = '', children, ...props }) => (
  <button
    type="button"
    role="menuitem"
    aria-current={active || undefined}
    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
      active ? 'bg-indigo-500/15 font-semibold text-indigo-200' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
    } ${className}`}
    {...props}
  >
    {icon}
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {active && <Check size={12} className="shrink-0 text-indigo-400" />}
  </button>
);
