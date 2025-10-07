"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { APP_SECTIONS } from "@/config/app-sections";

type NavItem = { href: string; label: string; icon: any; badgeKey?: string };
const NAV: NavItem[] = APP_SECTIONS.filter(s => s.enabled).map(s => ({ href: s.href, label: s.label, icon: s.icon, badgeKey: s.badgeKey }));

export default function AppShell({ children, navBadges }: { children: React.ReactNode; navBadges?: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-black px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-gray-300 hover:text-white" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/app/app" className="hidden md:inline-flex items-center gap-2">
            <img src="/logo.svg" alt="Huntaze" className="h-6" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800" />
        </div>
      </header>

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-slate-200 bg-white pt-16">
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, badgeKey }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            const badge = badgeKey ? navBadges?.[badgeKey as string] : 0;
            return (
              <Link key={href} href={href} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </span>
                {badge && badge > 0 ? (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] px-2 py-0.5 min-w-[20px]">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white pt-16 shadow-xl">
            <nav className="p-4 space-y-1">
              {NAV.map(({ href, label, icon: Icon, badgeKey }) => {
                const active = pathname === href || pathname?.startsWith(href + "/");
                const badge = badgeKey ? navBadges?.[badgeKey as string] : 0;
                return (
                  <Link key={href} href={href} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`} onClick={() => setOpen(false)}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </span>
                    {badge && badge > 0 ? (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] px-2 py-0.5 min-w-[20px]">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="pt-16 lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-10 py-6">{children}</div>
      </main>
    </div>
  );
}
