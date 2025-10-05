"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  TrendingUp,
  Share2,
  Bot,
  MessageSquare,
  Users,
  Package,
  CreditCard,
  Settings,
  Menu,
  X,
  BarChart3,
  Zap,
  Shield,
  Image,
  Calendar,
  DollarSign,
  Target,
  Activity,
  FileText,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { useSSECounter } from "@/src/hooks/useSSECounter";
import { AnimatePresence, motion } from "framer-motion";
import "./nav-styles.css";

type BadgeConfig = { type: "unread" | "alerts"; url: string };
type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  badge?: BadgeConfig;
  children?: NavItem[];
};

const APP_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/social",
  "/ai",
  "/messages",
  "/fans",
  "/campaigns",
  "/content",
  "/billing",
  "/settings"
];

export const NAV_SECTIONS: NavItem[] = [
  { 
    label: "Home", 
    href: "/dashboard", 
    icon: Home 
  },
  {
    label: "Analytics",
    icon: TrendingUp,
    children: [
      { label: "Overview", href: "/analytics", icon: BarChart3, badge: { type: "alerts", url: "/api/analytics/alerts-count" } },
      { label: "Revenue", href: "/analytics/revenue", icon: DollarSign },
      { label: "Engagement", href: "/analytics/engagement", icon: Activity },
      { label: "RFM Analysis", href: "/analytics/rfm", icon: Target },
      { label: "Reports", href: "/analytics/reports", icon: FileText }
    ]
  },
  {
    label: "Social Media",
    icon: Share2,
    children: [
      { 
        label: "OnlyFans", 
        href: "/social/onlyfans", 
        icon: MessageSquare,
        badge: { type: "unread", url: "/api/messages/unread-count" }
      },
      { label: "Instagram", href: "/social/instagram", icon: Image },
      { label: "TikTok", href: "/social/tiktok", icon: Zap },
      { label: "Twitter/X", href: "/social/twitter", icon: Share2 },
      { label: "Schedule Posts", href: "/social/schedule", icon: Calendar }
    ]
  },
  {
    label: "AI Assistant",
    icon: Bot,
    children: [
      { label: "Chat Automation", href: "/dashboard/huntaze-ai", icon: MessageSquare },
      { label: "Content Generator", href: "/ai/content", icon: FileText },
      { label: "Training", href: "/ai/training", icon: Bot },
      { label: "Quick Replies", href: "/ai/replies", icon: Zap }
    ]
  },
  { 
    label: "Fans", 
    href: "/fans", 
    icon: Users 
  },
  { 
    label: "Campaigns", 
    href: "/campaigns", 
    icon: Target 
  },
  {
    label: "Content",
    icon: Package,
    children: [
      { label: "Media Library", href: "/content/library", icon: Image },
      { label: "Moderation", href: "/content/moderation", icon: Shield },
      { label: "Templates", href: "/content/templates", icon: FileText }
    ]
  },
  { 
    label: "Billing", 
    href: "/billing", 
    icon: CreditCard 
  },
  { 
    label: "Settings", 
    href: "/settings", 
    icon: Settings 
  }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const isApp = useMemo(() => APP_PREFIXES.some((p) => pathname?.startsWith(p)), [pathname]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  // Enable SSE for real-time updates
  useSSE(true);

  // Auto-expand active sections
  useEffect(() => {
    const expanded: string[] = [];
    NAV_SECTIONS.forEach(section => {
      if (section.children) {
        const hasActiveChild = section.children.some(child => 
          pathname === child.href || pathname?.startsWith(child.href + "/")
        );
        if (hasActiveChild) {
          expanded.push(section.label);
        }
      }
    });
    setExpandedItems(expanded);
  }, [pathname]);

  // Flag body for CSS
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

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const Icon = item.icon;
    
    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
            className={`nav-item w-full text-left ${depth > 0 ? 'pl-8' : ''}`}
          >
            <Icon aria-hidden className="nav-item-icon" />
            <span className="nav-item-label">{item.label}</span>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-auto"
            >
              <ChevronRight className="w-4 h-4 text-content-tertiary" />
            </motion.div>
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {item.children?.map(child => renderNavItem(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    const active = pathname === item.href || pathname?.startsWith(item.href + "/");
    const count = item.badge
      ? useSSECounter({
          url: item.badge.type === "unread" ? `${item.badge.url}?sse=1` : item.badge.url,
          eventName: item.badge.type === "unread" ? "unread" : "alerts",
        })
      : 0;

    return (
      <Link key={item.label} href={item.href!}>
        <div
          className={`nav-item ${active ? "active" : ""} ${depth > 0 ? 'pl-8' : ''}`}
          aria-current={active ? "page" : undefined}
        >
          <Icon aria-hidden className="nav-item-icon" />
          <span className="nav-item-label">{item.label}</span>
          {item.badge && count > 0 && (
            <span
              className={`nav-badge ${count > 0 ? "nav-badge-pulse" : ""}`}
              role="status"
              aria-label={`${count} ${item.badge.type === "unread" ? "new messages" : "alerts"}`}
              suppressHydrationWarning
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const NavList = (
    <nav className="nav-content" aria-label="App Navigation">
      <div className="nav-item-list">
        {NAV_SECTIONS.map(item => renderNavItem(item))}
      </div>
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
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search"
              className="w-full px-4 py-2 pl-10 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="app-sidebar-content">{NavList}</div>
        
        {/* Sales Channel Section */}
        <div className="p-4 border-t border-border-light dark:border-border">
          <p className="text-xs font-semibold text-content-tertiary mb-2">SALES CHANNELS</p>
          <Link href="/platforms/connect" className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors">
            <div className="w-6 h-6 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
              <span className="text-primary text-xs">+</span>
            </div>
            <span>Add platform</span>
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
              
              {/* Mobile Search */}
              <div className="px-4 pb-4">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search"
                    className="w-full px-4 py-2 pl-10 bg-surface-light dark:bg-surface border border-border-light dark:border-border rounded-lg text-sm"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                {NavList}
              </div>
              
              {/* Mobile Sales Channels */}
              <div className="p-4 border-t border-border-light dark:border-border">
                <p className="text-xs font-semibold text-content-tertiary mb-2">SALES CHANNELS</p>
                <Link 
                  href="/platforms/connect" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors"
                  onClick={() => setDrawerOpen(false)}
                >
                  <div className="w-6 h-6 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
                    <span className="text-primary text-xs">+</span>
                  </div>
                  <span>Add platform</span>
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}