"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

export default function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 bg-black border-b border-gray-800">
        <div className="container-default h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 focus-ring">
            <img src="/logo.svg" alt="Huntaze" className="h-6" />
            <span className="sr-only">Huntaze</span>
          </Link>
          <nav className="actions-row">
            <Link className="btn btn-ghost" href="/marketing">
              Product
            </Link>
            <Link className="btn btn-ghost" href="/pricing">
              Pricing
            </Link>
            <Link className="btn btn-ghost" href="/customers">
              Customers
            </Link>
            <Link className="btn btn-ghost" href="/auth">
              Sign in
            </Link>
            <Link className="btn btn-primary" href="/app">
              Open App
            </Link>
          </nav>
        </div>
      </header>

      <div className="container-default grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-8 py-8">
        <aside className="sidebar rounded-xl">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-gray-800 text-white grid place-items-center font-bold">
                H
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">HUNTAZE APPVISUEL</span>
            </div>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="h2-page">{title}</h1>
              {subtitle ? <p className="mt-1 t-subtle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="actions-row">{actions}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
