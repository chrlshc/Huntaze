"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, HelpCircle, Search } from "lucide-react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app", icon: "📊" },
  { label: "Messages", href: "/messages", icon: "💬" },
  { label: "Fans", href: "/fans", icon: "👥" },
  { label: "Analytics", href: "/analytics", icon: "📈" },
  { label: "OnlyFans", href: "/onlyfans", icon: "💎" },
  { label: "Integrations", href: "/integrations", icon: "🔌" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

const HEADER_LINKS = [
  { label: "Product", href: "/product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Customers", href: "/customers" },
  { label: "Docs", href: "/docs" },
];

export default function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="container-default h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 focus-ring">
            <img src="/logo.svg" alt="Huntaze" className="h-6" />
            <span className="hidden sm:inline">Huntaze</span>
          </Link>

          <form className="hidden flex-1 md:flex" role="search">
            <label className="relative w-full max-w-lg">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">Search across Huntaze</span>
              <input
                type="search"
                className="input-quiet pl-9"
                placeholder="Search messages, fans, or automations"
              />
            </label>
          </form>

          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
            {HEADER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1 transition-colors hover:text-slate-900 focus-ring"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="icon-button md:hidden" aria-label="Open search">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" className="icon-button" aria-label="Help center">
              <HelpCircle className="h-4 w-4" />
            </button>
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <Link
              href="/auth"
              className="hidden sm:inline-flex rounded-md px-3 py-1 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-ring"
            >
              Log out
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              MB
            </div>
          </div>
        </div>
      </header>

      <div className="container-default grid grid-cols-1 gap-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="border-b border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Huntaze AppVisuel</p>
          </div>
          <nav className="p-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <span className="w-5 text-center" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="page-stack">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            {actions ? <div className="actions-row">{actions}</div> : null}
          </div>

          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
