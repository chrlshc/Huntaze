"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, PropsWithChildren, SVGProps } from "react";
import {
  BarChart3,
  Calendar,
  Home,
  MessageCircleQuestion,
  MessagesSquare,
  Settings as SettingsIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/home", label: "Dashboard", icon: Home },
  { href: "/onlyfans-assisted", label: "OnlyFans assisted", icon: MessagesSquare },
  { href: "/social-marketing", label: "Social Marketing", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/cin-chat", label: "CIN chat", icon: MessageCircleQuestion },
];

type ShopifyShellProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ShopifyShell({ title, description, children }: ShopifyShellProps) {
  const pathname = usePathname();

  return (
    <div>
      {/* Top bar V2 */}
      <header className="topbar">
        <div className="logo">Huntaze</div>
        <div className="search">
          <input type="search" placeholder="Rechercher…" aria-label="Search" />
        </div>
        <div className="account">
          <span aria-hidden>🔔</span>
          <div className="avatar" aria-hidden />
          <span className="store">Ma boutique</span>
        </div>
      </header>

      {/* Sidebar V2 */}
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="nav-group">
          <div className="nav-group-title">Navigation</div>
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-group">
          <div className="nav-group-title">Paramètres</div>
          <Link
            href="/profile"
            className={`nav-link${pathname?.startsWith("/profile") ? " active" : ""}`}
            aria-current={pathname?.startsWith("/profile") ? "page" : undefined}
          >
            <SettingsIcon className="h-4 w-4" aria-hidden="true" />
            <span className="label">Paramètres</span>
          </Link>
        </div>
      </aside>

      {/* Main V2 */}
      <main className="main">
        <div className="content-wrap">
          <h1 style={{ marginTop: 0 }}>{title}</h1>
          <div style={{ marginTop: 16 }}>{children}</div>
        </div>
      </main>
    </div>
  );
}
