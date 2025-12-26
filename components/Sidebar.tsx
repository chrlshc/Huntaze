'use client';

import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from '@/hooks/useIsClient';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, Home, Megaphone, Settings, Video, Zap, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext';

// Mobile backdrop component - uses Portal to render at body level (outside CSS grid)
function MobileBackdrop({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div
      id="sidebar-backdrop"
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 60,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 39,
        transition: 'opacity 0.2s ease-out',
      }}
      className="lg:hidden"
    />,
    document.body
  );
}

interface SubNavItem {
  name: string;
  href: string;
}

type SidebarIconName = 'home' | 'onlyfans' | 'analytics' | 'marketing' | 'content' | 'automations' | 'integrations' | 'settings';

interface NavItem {
  name: string;
  href: string;
  icon: SidebarIconName;
  subItems?: SubNavItem[];
}

const SIDEBAR_ICONS: Record<SidebarIconName, LucideIcon> = {
  home: Home,
  onlyfans: Video,
  analytics: BarChart3,
  marketing: Megaphone,
  content: FileText,
  automations: Zap,
  integrations: Plug,
  settings: Settings,
};

const sidebarStyle: CSSProperties = {
  fontSize: '13px',
};

// Navigation structure - cleaned up
const navigation: NavItem[] = [
  {
    name: 'Home',
    href: '/home',
    icon: 'home',
  },
  {
    name: 'OnlyFans',
    href: '/onlyfans',
    icon: 'onlyfans',
    subItems: [
      { name: 'Messages', href: '/onlyfans/messages' },
      { name: 'Fans', href: '/onlyfans/fans' },
      { name: 'PPV', href: '/onlyfans/ppv' },
    ],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'analytics',
  },
  {
    name: 'Content',
    href: '/content',
    icon: 'content',
    subItems: [
      { name: 'Studio', href: '/content/factory' },
    ],
  },
  {
    name: 'Marketing',
    href: '/marketing',
    icon: 'marketing',
    subItems: [
      { name: 'Calendar', href: '/marketing/calendar' },
      { name: 'Campaigns', href: '/marketing/campaigns' },
    ],
  },
  {
    name: 'Automations',
    href: '/automations',
    icon: 'automations',
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: 'integrations',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentSection } = useNavigationContext();
  const { isOpen, close, sidebarRef } = useMobileSidebar();
  const isOnlyFansSettingsActive = pathname?.startsWith('/onlyfans/settings');
  const mounted = useIsClient();

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    close();
  };

  return (
    <>
      {/* Mobile backdrop - rendered via Portal to avoid CSS grid guardrail */}
      {mounted && isOpen && (
        <MobileBackdrop onClose={close} />
      )}

      <aside
        ref={sidebarRef as React.RefObject<HTMLElement>}
        className="huntaze-sidebar flex flex-col safe-area-top"
        style={sidebarStyle}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-label="Navigation menu"
        data-open={isOpen}
      >
        <nav className="huntaze-sidebar-nav px-2 py-1.5 flex-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
          <ul className="flex flex-col gap-px">
            {navigation.map((item) => {
              // Extract section name from href (e.g., '/analytics' -> 'analytics')
              const sectionName = item.href.split('/')[1] || 'home';
              const isActive = currentSection === sectionName;
              const Icon = SIDEBAR_ICONS[item.icon];
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const showSubNav = hasSubItems && isActive;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className="nav-item flex items-center gap-2.5 rounded-lg px-2 py-1.5 font-normal transition-colors min-h-[44px] lg:min-h-0"
                    data-active={isActive}
                    data-testid={`nav-${sectionName}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="shrink-0"
                      size={14}
                      strokeWidth={2}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>

                  {/* Sub-navigation */}
                  {showSubNav && item.subItems && (
                    <ul className="huntaze-sidebar-subnav">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              onClick={handleNavClick}
                              data-active={isSubActive}
                              data-testid={`nav-${sectionName}-${subItem.href.split('/').slice(2).join('-') || 'sub'}`}
                              className="huntaze-sidebar-subnav-item min-h-[44px] lg:min-h-0 flex items-center"
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="huntaze-sidebar-footer">
          <Link
            href="/onlyfans/settings"
            onClick={handleNavClick}
            className="nav-item flex items-center gap-2.5 rounded-lg px-2 py-1.5 font-normal transition-colors min-h-[44px] lg:min-h-0"
            data-active={isOnlyFansSettingsActive}
            data-testid="nav-settings"
          >
            <Settings
              aria-hidden="true"
              className="shrink-0"
              size={14}
              strokeWidth={2}
            />
            <span className="truncate">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
