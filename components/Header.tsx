import type { ReactNode } from "react";
import { Bell, HelpCircle, Search } from "lucide-react";

type HeaderProps = {
  title: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
};

export function Header({ title, breadcrumb, actions }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-700 bg-gray-800 px-6">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gray-500">Workspace</p>
          <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
        </div>
        {breadcrumb ? <div className="hidden text-sm text-gray-400 lg:block">{breadcrumb}</div> : null}
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        {actions}
        <div className="hidden max-w-xs flex-1 items-center rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm text-gray-400 shadow-inner md:flex">
          <Search className="mr-2 h-4 w-4 text-gray-500" aria-hidden="true" />
          <span>Search workspace…</span>
        </div>
        <button
          type="button"
          className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          aria-label="Help center"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
          HM
        </div>
      </div>
    </header>
  );
}
