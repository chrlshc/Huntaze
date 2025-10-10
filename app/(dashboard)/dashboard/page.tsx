'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { useAppState, type HuntazeModule } from '@/contexts/AppStateContext';
import { useModuleLazyLoader, type LazyModuleName } from '@/hooks/useModuleLazyLoader';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createModuleStatus } from '@/types/branded';

const quickLinks: Array<{
  module: LazyModuleName;
  title: string;
  description: string;
  href: string;
}> = [
  {
    module: 'onlyfans',
    title: 'OnlyFans Management',
    description: 'View smart replies, campaigns, and compliance queues.',
    href: '/dashboard/onlyfans',
  },
  {
    module: 'social',
    title: 'Social Scheduler',
    description: 'Plan cross-platform content and manage queue health.',
    href: '/dashboard/social-media',
  },
  {
    module: 'analytics',
    title: 'Performance Analytics',
    description: 'Monitor revenue growth, cohort health, and exports.',
    href: '/dashboard/analytics',
  },
  {
    module: 'cin-ai',
    title: 'CIN AI Assistant',
    description: 'Check chat performance, live signals, and model training.',
    href: '/dashboard/cin-ai',
  },
];

export default function DashboardOverviewPage() {
  const { activeModule } = useAppState();
  const { loadedModules, loadModule, modules } = useModuleLazyLoader();
  const {
    onlyfans: OnlyFansModule,
    social: SocialMediaModule,
    analytics: AnalyticsModule,
    'cin-ai': CINAIModule,
  } = modules;
  const loadedCount = loadedModules.size;

  useEffect(() => {
    const lazyModule = mapActiveModuleToLazy(activeModule);
    if (lazyModule) loadModule(lazyModule);
  }, [activeModule, loadModule]);

  useEffect(() => {
    if (loadedCount) {
      void PerformanceMonitor.flush();
    }
  }, [loadedCount]);

  return (
    <DashboardShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-gray-900">Creator Operations Hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Track system health, switch between growth modules, and respond to alerts from a single console.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {quickLinks.map((link) => (
            <ModuleCard
              key={link.module}
              module={link.module}
              title={link.title}
              status={createModuleStatus(loadedModules.has(link.module) ? 'active' : 'idle')}
              onMouseEnter={() => loadModule(link.module)}
            >
              <p className="text-sm text-gray-600">{link.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => loadModule(link.module)}
                  className="text-xs font-medium text-gray-700 underline-offset-4 hover:underline"
                >
                  Load preview
                </button>
                <Link
                  href={link.href}
                  className="inline-flex items-center text-sm font-medium text-gray-900 underline-offset-4 hover:underline"
                >
                  Open module
                </Link>
              </div>
            </ModuleCard>
          ))}
        </div>

        <Suspense
          fallback={
            <div className="grid gap-4 lg:grid-cols-2">
              <ModuleCard.Skeleton module="onlyfans" />
              <ModuleCard.Skeleton module="social" />
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {loadedModules.has('onlyfans') ? <OnlyFansModule key="onlyfans" /> : null}
            {loadedModules.has('social') ? <SocialMediaModule key="social" /> : null}
            {loadedModules.has('analytics') ? <AnalyticsModule key="analytics" /> : null}
            {loadedModules.has('cin-ai') ? <CINAIModule key="cin-ai" /> : null}
          </div>
        </Suspense>
      </section>
    </DashboardShell>
  );
}

function mapActiveModuleToLazy(module: HuntazeModule): LazyModuleName | null {
  switch (module) {
    case 'onlyfans':
    case 'social':
    case 'analytics':
    case 'cin-ai':
      return module;
    default:
      return null;
  }
}
