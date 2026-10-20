import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Shared heading layout for admin pages. Page-specific actions remain supplied by the page. */
export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold text-[#212121]">{title}</h1>
        {description && <p className="mt-1 text-[#9E9E9E]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
