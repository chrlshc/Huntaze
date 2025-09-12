"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Plug,
  CreditCard,
  Settings,
  Menu,
  X,
  Target,
  Bell,
  Shield,
  Zap
} from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { useSSECounter } from "@/src/hooks/useSSECounter";
import { AnimatePresence, motion } from "framer-motion";
import "./nav-styles.css";

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
  "/campaigns",
  "/automations",
  "/content"
];

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  { 
    label: "Main", 
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: { type: "unread", url: "/api/messages/unread-count" },
      },
      { label: "Fans", href: "/fans", icon: Users }
    ] 
  },
  {
    label: "Growth",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Target },
      { label: "AI Automations", href: "/automations", icon: Zap },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        badge: { type: "alerts", url: "/api/analytics/alerts-count" },
      },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Content Moderation", href: "/content/moderation", icon: Shield },
      { label: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
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
  const openBtnRef = useRef<HTMLButtonElement>(null);

  // Enable SSE for real-time updates
  useSSE(true);

  // Flag body so global CSS can indent main on desktop
  useEffect(() => {
    if (!isApp) return;
    document.body.dataset.appShell = "true";
    return () => {
      delete document.body.dataset.appShell;
    };
  }, [isApp]);

  // Mobile drawer a11y
  useEffect(() => {
    if (!drawerOpen) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (openBtnRef.current ?? prevFocused)?.focus();
    };
  }, [drawerOpen]);

  if (!isApp) return null;

  const NavList = (
    <nav className="nav-content" aria-label="App Navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="nav-section">
          <div className="nav-section-label">
            {section.label}
          </div>
          <div className="nav-item-list">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              const count = item.badge
                ? useSSECounter({
                    url: item.badge.type === "unread" ? `${item.badge.url}?sse=1` : item.badge.url,
                    eventName: item.badge.type === "unread" ? "unread" : "alerts",
                  })
                : 0;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`nav-item ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon aria-hidden className="nav-item-icon" />
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge && count > 0 ? (
                      <span
                        className={`nav-badge ${count > 0 ? "nav-badge-pulse" : ""}`}
                        role="status"
                        aria-label={`${count} ${item.badge.type === "unread" ? "new messages" : "alerts"}`}
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
      <aside className="app-sidebar">
        <div className="app-sidebar-header">
          <Link href="/dashboard" className="app-sidebar-logo" aria-label="Huntaze dashboard">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-content-primary">Huntaze</span>
          </Link>
        </div>
        <div className="app-sidebar-content">{NavList}</div>
        <div className="p-4 border-t border-border-light dark:border-border">
          <Link
            href="/campaigns/new"
            className="nav-action-button"
          >
            <Target className="inline-block w-4 h-4 mr-2" />
            New Campaign
          </Link>
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        ref={openBtnRef}
        aria-label="Open menu"
        className="mobile-drawer-trigger"
        onClick={() => setDrawerOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div className="lg:hidden fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="mobile-drawer-overlay"
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
              className="mobile-drawer"
              tabIndex={-1}
            >
              <div className="mobile-drawer-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">H</span>
                  </div>
                  <span className="text-xl font-bold text-content-primary">Huntaze</span>
                </div>
                <button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="mobile-drawer-close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                {NavList}
              </div>
              <div className="p-4 border-t border-border-light dark:border-border">
                <Link
                  href="/campaigns/new"
                  className="nav-action-button"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Target className="inline-block w-4 h-4 mr-2" />
                  New Campaign
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}