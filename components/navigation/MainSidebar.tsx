'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

import { useAppState, type HuntazeModule } from '@/contexts/AppStateContext';

interface SidebarItem {
  module: HuntazeModule;
  href: string;
  label: string;
  icon: (props: ComponentProps<'svg'>) => JSX.Element;
}

const NAV_ITEMS: SidebarItem[] = [
  { module: 'home', href: '/dashboard', label: 'Home', icon: LayoutIcon },
  { module: 'onlyfans', href: '/dashboard/onlyfans', label: 'OnlyFans', icon: SparkleIcon },
  { module: 'social', href: '/dashboard/social-media', label: 'Social Media', icon: ShareIcon },
  { module: 'analytics', href: '/dashboard/analytics', label: 'Analytics', icon: ChartIcon },
  { module: 'cin-ai', href: '/dashboard/cin-ai', label: 'CIN AI', icon: BrainIcon },
  { module: 'settings', href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

export function MainSidebar() {
  const pathname = usePathname();
  const { setActiveModule } = useAppState();

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="px-6 py-6">
        <Link href="/dashboard" className="block text-xl font-semibold tracking-tight text-gray-900">
          Huntaze
        </Link>
        <p className="mt-1 text-sm text-gray-500">Creator growth console</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.module}
              href={item.href}
              onClick={() => setActiveModule(item.module)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ].join(' ')}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function LayoutIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.5h16.5M3.75 19.5h16.5M4.5 4.5v15M19.5 4.5v15M9 9h6v6H9z"
      />
    </svg>
  );
}

function SparkleIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v6m0 6v6m-9-9h6m6 0h6M9 9l6 6m0-6-6 6"
      />
    </svg>
  );
}

function ShareIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm9 9a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-9L9 9"
      />
    </svg>
  );
}

function ChartIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5 9 15l3 3 7.5-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 11.25V4.5h6.75" />
    </svg>
  );
}

function BrainIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 4.5C7.619 4.5 6.5 5.619 6.5 7v5.25A2.25 2.25 0 0 1 4.25 14.5h0A2.25 2.25 0 0 1 2 12.25V9.75a5.25 5.25 0 0 1 5.25-5.25H9Zm6 0c1.381 0 2.5 1.119 2.5 2.5v5.25a2.25 2.25 0 0 0 2.25 2.25h0A2.25 2.25 0 0 0 22 12.25V9.75a5.25 5.25 0 0 0-5.25-5.25H15Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19.5c-1.381 0-2.5-1.119-2.5-2.5V12m8.5 7.5c1.381 0 2.5-1.119 2.5-2.5V12M9 12l3-3 3 3"
      />
    </svg>
  );
}

function SettingsIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.76 6.76 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}
