"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, MessageSquare, Users, BarChart3, Settings, Heart, Megaphone, Plug, CalendarDays } from "lucide-react";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: any };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/fans", label: "Fans", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/automations", label: "Automations", icon: Plug },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/onlyfans/dashboard", label: "OnlyFans", icon: Heart },
  { href: "/platforms/connect", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-black px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-gray-300 hover:text-white" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/app" className="hidden md:inline-flex items-center gap-2">
            <img src="/logo.svg" alt="Huntaze" className="h-6" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800" />
        </div>
      </header>

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-slate-200 bg-white pt-16">
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
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
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <Link key={href} href={href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`} onClick={() => setOpen(false)}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
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
