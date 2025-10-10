'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { AppStateProvider, useAppState, type HuntazeModule } from '@/contexts/AppStateContext';
import { MainSidebar } from '@/components/navigation/MainSidebar';
import { ModuleSubNavigation } from '@/components/navigation/ModuleSubNavigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppStateProvider initialModule="home">
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AppStateProvider>
  );
}

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setActiveModule } = useAppState();

  useEffect(() => {
    setActiveModule(resolveModuleFromPath(pathname));
  }, [pathname, setActiveModule]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <MainSidebar />
      <div className="flex flex-1 flex-col">
        <ModuleSubNavigation />
        <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

function resolveModuleFromPath(pathname?: string | null): HuntazeModule {
  if (!pathname) return 'home';
  if (pathname.startsWith('/dashboard/onlyfans')) return 'onlyfans';
  if (pathname.startsWith('/dashboard/social-media')) return 'social';
  if (pathname.startsWith('/dashboard/analytics')) return 'analytics';
  if (pathname.startsWith('/dashboard/cin-ai')) return 'cin-ai';
  if (pathname.startsWith('/dashboard/settings')) return 'settings';
  return 'home';
}
