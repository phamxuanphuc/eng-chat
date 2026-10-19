import React from 'react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  aside?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description, aside }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>}
      </div>
    </div>
    {aside && <div className="shrink-0">{aside}</div>}
  </div>
);
