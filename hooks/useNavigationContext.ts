'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SubNavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
}

export interface NavigationContext {
  currentSection: string;
  currentSubSection?: string;
  breadcrumbs: BreadcrumbItem[];
  subNavItems?: SubNavItem[];
  showSubNav: boolean;
}

// Section/Sub-section mapping
const SECTION_CONFIG: Record<string, {
  label: string;
  hasSubNav: boolean;
  subPages?: Array<{ path: string; label: string; icon?: string }>;
}> = {
  home: {
    label: 'Home',
    hasSubNav: false,
  },
  dashboard: {
    label: 'Dashboard',
    hasSubNav: true,
    subPages: [
      { path: 'overview', label: 'Overview', icon: 'chart-bar' },
      { path: 'finance', label: 'Finance', icon: 'currency-dollar' },
      { path: 'acquisition', label: 'Acquisition', icon: 'users' },
    ],
  },
  analytics: {
    label: 'Analytics',
    hasSubNav: true,
    subPages: [
      { path: '', label: 'Overview', icon: 'chart-bar' },
      { path: 'pricing', label: 'Pricing', icon: 'currency-dollar' },
      { path: 'churn', label: 'Churn', icon: 'trending-down' },
      { path: 'upsells', label: 'Upsells', icon: 'trending-up' },
      { path: 'forecast', label: 'Forecast', icon: 'crystal-ball' },
      { path: 'payouts', label: 'Payouts', icon: 'cash' },
    ],
  },
  onlyfans: {
    label: 'OnlyFans',
    hasSubNav: true,
    subPages: [
      { path: '', label: 'Overview', icon: 'home' },
      { path: 'messages', label: 'Messages', icon: 'chat' },
      { path: 'smart-messages', label: 'Smart Messages', icon: 'sparkles' },
      { path: 'fans', label: 'Fans', icon: 'users' },
      { path: 'ppv', label: 'PPV', icon: 'photo' },
      { path: 'settings', label: 'Settings', icon: 'cog' },
    ],
  },
  'onlyfans-assisted': {
    label: 'OnlyFans Assisted',
    hasSubNav: false,
  },
  marketing: {
    label: 'Marketing',
    hasSubNav: true,
    subPages: [
      { path: '', label: 'Campaigns', icon: 'megaphone' },
      { path: 'social', label: 'Social', icon: 'share' },
      { path: 'calendar', label: 'Calendar', icon: 'calendar' },
    ],
  },
  'social-marketing': {
    label: 'Social Marketing',
    hasSubNav: false,
  },
  content: {
    label: 'Content',
    hasSubNav: false,
  },
  messages: {
    label: 'Messages',
    hasSubNav: false,
  },
  integrations: {
    label: 'Integrations',
    hasSubNav: false,
  },
  billing: {
    label: 'Billing',
    hasSubNav: true,
    subPages: [
      { path: '', label: 'Overview', icon: 'credit-card' },
      { path: 'packs', label: 'Packs', icon: 'shopping-bag' },
    ],
  },
  'smart-onboarding': {
    label: 'Smart Onboarding',
    hasSubNav: true,
    subPages: [
      { path: '', label: 'Overview', icon: 'sparkles' },
      { path: 'analytics', label: 'Analytics', icon: 'chart-bar' },
    ],
  },
};

function generateBreadcrumbs(segments: string[]): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with Home (but don't show it on home page)
  if (segments.length > 0 && segments[0] !== 'home') {
    breadcrumbs.push({ label: 'Home', href: '/home' });
  }
  
  // Build breadcrumbs from segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const config = SECTION_CONFIG[segment];
    const label = config?.label || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Last segment is current page (no link)
    if (index === segments.length - 1) {
      breadcrumbs.push({ label });
    } else {
      breadcrumbs.push({ label, href: currentPath });
    }
  });
  
  return breadcrumbs;
}

function getSubNavItems(section: string, basePath: string): SubNavItem[] | undefined {
  const config = SECTION_CONFIG[section];
  if (!config?.subPages) return undefined;
  
  return config.subPages.map(page => ({
    label: page.label,
    href: page.path ? `${basePath}/${page.path}` : basePath,
    icon: page.icon,
  }));
}

export function useNavigationContext(): NavigationContext {
  const pathname = usePathname();
  
  return useMemo(() => {
    // Parse pathname to determine section/sub-section
    const segments = pathname.split('/').filter(Boolean);
    
    // Handle root or empty path
    if (segments.length === 0) {
      return {
        currentSection: 'home',
        breadcrumbs: [],
        showSubNav: false,
      };
    }
    
    const currentSection = segments[0] || 'home';
    const currentSubSection = segments[1];
    
    // Determine if section has sub-navigation
    const config = SECTION_CONFIG[currentSection];
    const showSubNav = config?.hasSubNav || false;
    
    // Generate breadcrumbs
    const breadcrumbs = generateBreadcrumbs(segments);
    
    // Get sub-nav items for current section
    const basePath = `/${currentSection}`;
    const subNavItems = showSubNav ? getSubNavItems(currentSection, basePath) : undefined;
    
    return {
      currentSection,
      currentSubSection,
      breadcrumbs,
      subNavItems,
      showSubNav,
    };
  }, [pathname]);
}
