'use client';

import { usePathname } from 'next/navigation';
import { BottomNavBar } from '@/components/mobile/BottomNavBar';
import { MobileHeader } from '@/components/mobile/MobileHeader';

interface MobileLayoutProps {
  children: React.ReactNode;
}

// Pages that should show bottom nav
const BOTTOM_NAV_PAGES = [
  '/dashboard',
  '/analytics',
  '/messages',
  '/profile',
  '/create'
];

// Pages that need special header treatment
const TRANSPARENT_HEADER_PAGES = [
  '/',
  '/pricing',
  '/features'
];

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname();
  
  // Determine if we should show mobile navigation
  const showBottomNav = BOTTOM_NAV_PAGES.some(page => 
    pathname.startsWith(page)
  );
  
  const showMobileHeader = pathname !== '/' && !pathname.startsWith('/auth');
  
  const transparentHeader = TRANSPARENT_HEADER_PAGES.includes(pathname);

  return (
    <>
      {showMobileHeader && (
        <MobileHeader
          title={getPageTitle(pathname)}
          showBack={pathname !== '/dashboard'}
          transparent={transparentHeader}
        />
      )}
      
      <div className={showBottomNav ? 'pb-16' : ''}>
        {children}
      </div>
      
      {showBottomNav && <BottomNavBar />}
    </>
  );
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return 'Huntaze';
  
  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    messages: 'Messages',
    profile: 'Profile',
    create: 'Create',
    ai: 'AI Tools',
    campaigns: 'Campaigns',
    settings: 'Settings'
  };
  
  return titleMap[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
}