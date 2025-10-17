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
  Zap,
  Sparkles,
  LogOut,
  UserRound,
  Bot,
  FileText,
  Package,
  Image,
  DollarSign,
  Calendar,
  TrendingUp,
  Activity,
  Share2
} from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { useSSECounter } from "@/src/hooks/useSSECounter";
import { AnimatePresence, motion } from "framer-motion";
import "./nav-styles.css";
import { useAuth } from "@/components/providers/AuthProvider";
import Avatar from "./avatar";

type BadgeConfig = { type: "unread" | "alerts"; url: string };
type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  badge?: BadgeConfig;
};

const APP_PREFIXES = [
  "/dashboard",
  "/manager-ai",
  "/onlyfans",
  "/ai",
  "/content",
  "/growth",
  "/analytics",
  "/billing",
  "/settings",
  "/messages",
  "/fans",
  "/campaigns",
  "/automations",
  "/integrations",
  "/configure",
  "/profile",
  "/social"
];

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  { 
    label: "Main", 
    items: [
      { label: "Home", href: "/app/home", icon: LayoutDashboard },
      { label: "Manager AI (CIN)", href: "/app/manager-ai", icon: Bot, badge: { type: "alerts", url: "/api/cin/status?badge=true" } }
    ] 
  },
  {
    label: "OnlyFans Hub",
    items: [
      { label: "Command Center", href: "/app/onlyfans-hub/command-center", icon: Shield },
      { label: "Inbox (AI Messages)", href: "/app/onlyfans-hub/inbox", icon: MessageSquare, badge: { type: "unread", url: "/api/messages/unread-count" } },
      { label: "Fan CRM", href: "/app/onlyfans-hub/fan-crm", icon: Users },
      { label: "PPV Campaigns", href: "/app/onlyfans-hub/ppv-campaigns", icon: Target }
    ],
  },
  {
    label: "AI Studio",
    items: [
      { label: "Ghostwriter Pro", href: "/app/ai-studio/ghostwriter-pro", icon: FileText },
      { label: "Content Creator", href: "/app/ai-studio/content-creator", icon: Image },
      { label: "Sales Copywriter", href: "/app/ai-studio/sales-copywriter", icon: DollarSign },
      { label: "Strategy Coach", href: "/app/ai-studio/strategy-coach", icon: Target },
      { label: "Predictive Insights", href: "/app/ai-studio/predictive-insights", icon: TrendingUp },
      { label: "Smart Scheduler", href: "/app/ai-studio/smart-scheduler", icon: Calendar }
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Media Library", href: "/app/content/media-library", icon: Image },
      { label: "Editor Pro", href: "/app/content/editor-pro", icon: FileText },
      { label: "Templates", href: "/app/content/templates", icon: Package },
      { label: "Scheduler", href: "/app/content/scheduler", icon: Calendar }
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Campaigns", href: "/app/growth/campaigns", icon: Target },
      { label: "Automations", href: "/app/growth/automations", icon: Zap },
      { label: "Social Media", href: "/app/growth/social-media", icon: Share2 }
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Overview", href: "/app/analytics/overview", icon: Activity, badge: { type: "alerts", url: "/api/analytics/alerts-count" } },
      { label: "Revenue", href: "/app/analytics/revenue", icon: DollarSign },
      { label: "Fan Analytics", href: "/app/analytics/fan-analytics", icon: Users },
      { label: "Content Performance", href: "/app/analytics/content-performance", icon: Package },
      { label: "Conversion Funnels", href: "/app/analytics/conversion-funnels", icon: Target },
      { label: "Custom Reports", href: "/app/analytics/custom-reports", icon: FileText }
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Billing", href: "/app/billing", icon: CreditCard },
      { label: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

export function AppSidebarUnified() {
  const pathname = usePathname();
  const isApp = useMemo(() => APP_PREFIXES.some((p) => pathname?.startsWith(p)), [pathname]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();

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

  const handleNavigate = () => setDrawerOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setDrawerOpen(false);
    }
  };

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
              <div className="px-4 pb-4 border-b border-border-light dark:border-border space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={user?.username || "Huntaze User"}
                    size="sm"
                    className="shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-content-primary truncate">
                      {user?.username || "Guest user"}
                    </p>
                    <p className="text-xs text-content-secondary truncate">
                      {user?.email || "Stay on top of your workspace"}
                    </p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={handleNavigate}
                    className="p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover transition-colors"
                    aria-label="Open account settings"
                  >
                    <UserRound className="w-5 h-5" aria-hidden />
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="search"
                      placeholder="Search"
                      className="w-full px-4 py-2 pl-10 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <MobileQuickActions onNavigate={handleNavigate} />
                </div>

                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-content-secondary border border-border-light dark:border-border rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"
                  >
                    <LogOut className="w-4 h-4" aria-hidden />
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={handleNavigate}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    Join Huntaze
                  </Link>
                )}
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

type MobileQuickActionProps = {
  href: string;
  label: string;
  Icon: NavItem["icon"];
  count?: number;
  onNavigate: () => void;
};

function MobileQuickActions({ onNavigate }: { onNavigate: () => void }) {
  const alertCount = useSSECounter({ url: "/api/analytics/alerts-count", eventName: "alerts" });
  const unreadMessages = useSSECounter({ url: "/api/messages/unread-count?sse=1", eventName: "unread" });

  return (
    <div className="flex items-center gap-2">
      <MobileQuickAction
        href="/analytics"
        label="View analytics alerts"
        Icon={Bell}
        count={alertCount}
        onNavigate={onNavigate}
      />
      <MobileQuickAction
        href="/messages"
        label="Open messages inbox"
        Icon={MessageSquare}
        count={unreadMessages}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function MobileQuickAction({ href, label, Icon, count, onNavigate }: MobileQuickActionProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="relative flex items-center justify-center w-11 h-11 rounded-xl border border-border-light dark:border-border bg-surface-light dark:bg-surface transition-colors hover:bg-surface-hover-light dark:hover:bg-surface-hover"
      aria-label={label}
    >
      <Icon className="w-5 h-5 text-content-primary" aria-hidden />
      {typeof count === "number" && count > 0 ? (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-red-500 rounded-full text-center font-semibold"
          suppressHydrationWarning
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
