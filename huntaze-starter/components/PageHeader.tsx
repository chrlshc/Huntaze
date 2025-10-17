import { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  actions
}: { title: string; description?: string; actions?: ReactNode; }) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
