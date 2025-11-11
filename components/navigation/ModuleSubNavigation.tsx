'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAppState, type HuntazeModule } from '@/contexts/AppStateContext';

interface SubNavItem {
  href: string;
  label: string;
}

const SUB_NAV: Record<HuntazeModule, SubNavItem[]> = {
  home: [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Notifications', href: '/dashboard?panel=notifications' },
    { label: 'Quick Actions', href: '/dashboard?panel=quick-actions' },
  ],
  onlyfans: [
    { label: 'Management', href: '/dashboard/onlyfans' },
    { label: 'Campaigns', href: '/dashboard/onlyfans/campaigns' },
    { label: 'Analytics', href: '/dashboard/onlyfans/analytics' },
    { label: 'Settings', href: '/dashboard/onlyfans/settings' },
  ],
  social: [
    { label: 'Platforms', href: '/dashboard/social-media' },
    { label: 'Content', href: '/dashboard/social-media/content' },
    { label: 'Scheduler', href: '/dashboard/social-media/scheduler' },
  ],
  analytics: [
    { label: 'Reports', href: '/dashboard/analytics' },
    { label: 'Metrics', href: '/dashboard/analytics/metrics' },
    { label: 'Exports', href: '/dashboard/analytics/exports' },
  ],
  'cin-ai': [
    { label: 'Chat', href: '/dashboard/cin-ai' },
    { label: 'Monitoring', href: '/dashboard/cin-ai/monitoring' },
    { label: 'Training', href: '/dashboard/cin-ai/training' },
  ],
  settings: [
    { label: 'Account', href: '/dashboard/settings' },
    { label: 'Integrations', href: '/dashboard/settings/integrations' },
    { label: 'Security', href: '/dashboard/settings/security' },
  ],
};

export function ModuleSubNavigation() {
  const { activeModule, setActiveModule } = useAppState();
  const pathname = usePathname();

  const items = SUB_NAV[activeModule] ?? [];

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-6">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                const match = item.href.split('/')[2] as HuntazeModule | undefined;
                setActiveModule(match ?? 'home');
              }}
              className={[
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
