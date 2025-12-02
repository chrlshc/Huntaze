import type { ReactNode } from 'react';

interface AppPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AppPageHeader({ title, description, actions }: AppPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-heading)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--color-text-sub)]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

export default AppPageHeader;

