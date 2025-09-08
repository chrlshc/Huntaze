"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Plug,
  CreditCard,
  Settings,
} from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { useSSECounter } from "@/src/hooks/useSSECounter";
import { AnimatePresence, motion } from "framer-motion";

type BadgeConfig = { type: "unread" | "alerts"; url: string };
type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  badge?: BadgeConfig;
};

const APP_PREFIXES = [
  "/dashboard",
  "/messages",
  "/fans",
  "/analytics",
  "/integrations",
  "/settings",
  "/platforms",
  "/billing",
  "/configure",
  "/profile",
  "/social",
];

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  { label: "Home", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Communication",
    items: [
      {
        label: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: { type: "unread", url: "/api/messages/unread-count" },
      },
    ],
  },
  { label: "Customers", items: [{ label: "Fans", href: "/fans", icon: Users }] },
  {
    label: "Insights",
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        badge: { type: "alerts", url: "/api/analytics/alerts-count" },
      },
    ],
  },
  { label: "Integrations", items: [{ label: "Apps", href: "/integrations", icon: Plug }] },
  {
    label: "Settings",
    items: [
      { label: "Billing", href: "/billing", icon: CreditCard },
      { label: "General", href: "/configure", icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const isApp = useMemo(() => APP_PREFIXES.some((p) => pathname?.startsWith(p)), [pathname]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Enable SSE (we're in app only) to update counters globally
  useSSE(true);

  // Flag body so global CSS can indent main on desktop
  useEffect(() => {
    if (!isApp) return;
    document.body.dataset.appShell = "true";
    return () => {
      delete document.body.dataset.appShell;
    };
  }, [isApp]);

  // Mobile drawer a11y: ESC to close, focus trap
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
      if (e.key !== "Tab") return;
      const root = drawerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // Scroll lock and initial focus
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirst = () => {
      const root = drawerRef.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      first?.focus();
    };
    setTimeout(focusFirst, 0);
    // Hide main content from screen readers
    const mainEl = document.querySelector('main');
    const headerEl = document.querySelector('header');
    const prevMainHidden = mainEl?.getAttribute('aria-hidden') || null;
    const prevHeaderHidden = headerEl?.getAttribute('aria-hidden') || null;
    mainEl?.setAttribute('aria-hidden', 'true');
    headerEl?.setAttribute('aria-hidden', 'true');
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (prevMainHidden === null) mainEl?.removeAttribute('aria-hidden'); else mainEl?.setAttribute('aria-hidden', prevMainHidden);
      if (prevHeaderHidden === null) headerEl?.removeAttribute('aria-hidden'); else headerEl?.setAttribute('aria-hidden', prevHeaderHidden);
    };
  }, [drawerOpen]);

  if (!isApp) return null;

  const NavList = (
    <nav className="mt-3" aria-label="App Navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-3">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {section.label}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              const count = item.badge
                ? useSSECounter({
                    url: item.badge.url,
                    eventName: item.badge.type === "unread" ? "unread" : "alerts",
                  })
                : 0;
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon aria-hidden className={`w-5 h-5 ${active ? "text-purple-700" : "text-gray-500 dark:text-gray-400"}`} />
                    <span className="font-medium truncate flex-1">{item.label}</span>
                    {item.badge && count > 0 ? (
                      <span
                        className="ml-auto min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-red-500 rounded-full text-center"
                        role="status"
                        aria-label={`${count} ${item.badge.type === "unread" ? "nouveaux messages" : "alertes"}`}
                        suppressHydrationWarning
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 z-40 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-16 px-4 flex items-center border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Huntaze dashboard">
            <Image src="/huntaze-logo.png" alt="Huntaze" width={120} height={32} className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">{NavList}</div>
        <div className="p-3 border-top border-gray-200 dark:border-gray-800">
          <Link
            href="/campaigns/new"
            className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            New Campaign
          </Link>
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        aria-label="Open menu"
        className="lg:hidden fixed top-3 left-3 z-40 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 backdrop-blur px-3 py-2 shadow"
        onClick={() => setDrawerOpen(true)}
      >
        <span className="sr-only">Open menu</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <motion.div className="lg:hidden fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 focus:outline-none"
              tabIndex={-1}
            >
              <div className="h-10 flex items-center justify-between">
                <Image src="/huntaze-logo.png" alt="Huntaze" width={110} height={30} className="h-8 w-auto" />
                <button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">{NavList}</div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
