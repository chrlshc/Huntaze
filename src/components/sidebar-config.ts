/**
 * Sidebar Navigation Configuration
 * 
 * This file contains the sidebar navigation structure data.
 * Separated from the component to allow testing without React dependencies.
 */

import {
  Home,
  Heart,
  BarChart3,
  Megaphone,
  Image,
  Zap,
  Plug,
  Settings,
  MessageSquare,
  Users,
  DollarSign,
  TrendingDown,
  Calendar,
  Target,
  Share2,
  FileText,
  Palette,
  Clock,
  LayoutGrid,
  CreditCard,
  User,
  type LucideIcon
} from "lucide-react";

// Types
export type BadgeConfig = { 
  type: "count" | "alert" | "new"; 
  url?: string;
  value?: number;
};

export type SidebarItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: BadgeConfig;
  isNew?: boolean;
};

export type SidebarSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  items?: SidebarItem[];
  badge?: BadgeConfig;
};

// App route prefixes for detecting if we're in the app shell
export const APP_PREFIXES = [
  "/dashboard",
  "/home",
  "/onlyfans",
  "/analytics",
  "/marketing",
  "/content",
  "/automations",
  "/integrations",
  "/settings",
  "/messages",
  "/fans",
  "/campaigns",
  "/billing",
  "/configure",
  "/profile",
  "/offers"
];

// Complete sidebar navigation structure per design spec
// Requirements 1.1: All main sections must be present
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    href: "/dashboard"
  },
  {
    id: "onlyfans",
    label: "OnlyFans",
    icon: Heart,
    items: [
      { label: "Overview", href: "/onlyfans", icon: LayoutGrid },
      { label: "Messages", href: "/onlyfans/messages", icon: MessageSquare, badge: { type: "count", url: "/api/messages/unread-count" } },
      { label: "Fans", href: "/onlyfans/fans", icon: Users },
      { label: "PPV", href: "/onlyfans/ppv", icon: DollarSign },
      { label: "Settings", href: "/onlyfans/settings", icon: Settings }
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { label: "Overview", href: "/analytics", icon: LayoutGrid },
      { label: "Revenue", href: "/analytics/revenue", icon: DollarSign },
      { label: "Fans", href: "/analytics/fans", icon: Users },
      { label: "Churn", href: "/analytics/churn", icon: TrendingDown },
      { label: "Pricing", href: "/analytics/pricing", icon: DollarSign },
      { label: "Forecast", href: "/analytics/forecast", icon: TrendingDown }
    ]
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { label: "Campaigns", href: "/marketing/campaigns", icon: Target },
      { label: "Social Planner", href: "/marketing/social", icon: Share2 },
      { label: "Calendar", href: "/marketing/calendar", icon: Calendar }
    ]
  },
  {
    id: "content",
    label: "Content",
    icon: Image,
    items: [
      { label: "Library", href: "/content", icon: LayoutGrid },
      { label: "Editor", href: "/content/editor", icon: Palette },
      { label: "Templates", href: "/content/templates", icon: FileText },
      { label: "Schedule", href: "/content/schedule", icon: Clock }
    ]
  },
  {
    id: "automations",
    label: "Automations",
    icon: Zap,
    items: [
      { label: "Overview", href: "/automations", icon: LayoutGrid },
      { label: "Flows", href: "/automations/flows", icon: Zap },
      { label: "Templates", href: "/automations/templates", icon: FileText },
      { label: "Analytics", href: "/automations/analytics", icon: BarChart3 }
    ]
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    href: "/integrations"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { label: "General", href: "/settings", icon: Settings },
      { label: "Billing", href: "/billing", icon: CreditCard },
      { label: "Profile", href: "/profile", icon: User }
    ]
  }
];

// Helper to check if a section or item is active
export function isRouteActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  // Check if pathname starts with href (for nested routes)
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

export function isSectionActive(pathname: string | null, section: SidebarSection): boolean {
  if (!pathname) return false;
  if (section.href && isRouteActive(pathname, section.href)) return true;
  if (section.items) {
    return section.items.some(item => isRouteActive(pathname, item.href));
  }
  return false;
}
