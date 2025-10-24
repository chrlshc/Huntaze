"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquare, Megaphone, BarChart3, Calendar, Settings, Menu, X } from "lucide-react";

type NavItem = { href: string; label: string; icon: any };
const NAV: NavItem[] = [
  { href: "/of-messages", label: "Inbox", icon: MessageSquare },
  { href: "/of-messages#campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/of-analytics", label: "Analytics", icon: BarChart3 },
  { href: "/features/content-scheduler", label: "Scheduler", icon: Calendar },
  { href: "/configure", label: "Settings", icon: Settings },
];

export default function AppShell({ title, children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar (md+) */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-gray-200 dark:md:border-gray-800 bg-white dark:bg-black/40">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="text-lg font-semibold">Huntaze</Link>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((it) => (
            <Link key={it.href} href={it.href} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <it.icon className="w-4 h-4 text-gray-500" />
              <span>{it.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content column */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-black/60 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="p-2 -ml-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base font-semibold">{title || "Huntaze"}</h1>
            <div className="w-6 h-6" />
          </div>
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="absolute top-0 left-0 h-full w-72 bg-white dark:bg-black shadow-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Huntaze</span>
                <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {NAV.map((it) => (
                  <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <it.icon className="w-4 h-4 text-gray-500" />
                    <span>{it.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

