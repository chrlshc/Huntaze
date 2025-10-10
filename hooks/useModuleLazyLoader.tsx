'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState, type ComponentType } from 'react';

import { ModuleCard } from '@/components/ui/ModuleCard';
import type { HuntazeModule } from '@/contexts/AppStateContext';
import { PerformanceMonitor } from '@/lib/monitoring/performance-monitor';

export type LazyModuleName = Exclude<HuntazeModule, 'home' | 'settings'>;

const OnlyFansModule = dynamic(() => import('@/features/onlyfans'), {
  loading: () => <ModuleCard.Skeleton module="onlyfans" />,
  ssr: false,
});

const SocialMediaModule = dynamic(() => import('@/features/social-media'), {
  loading: () => <ModuleCard.Skeleton module="social" />,
  ssr: false,
});

const AnalyticsModule = dynamic(() => import('@/features/analytics'), {
  loading: () => <ModuleCard.Skeleton module="analytics" />,
  ssr: false,
});

const CINAIModule = dynamic(() => import('@/features/cin-ai'), {
  loading: () => <ModuleCard.Skeleton module="cin-ai" />,
  ssr: false,
});

const moduleComponentMap: Record<LazyModuleName, ComponentType> = {
  onlyfans: OnlyFansModule,
  social: SocialMediaModule,
  analytics: AnalyticsModule,
  'cin-ai': CINAIModule,
};

export function useModuleLazyLoader() {
  const [loadedModules, setLoadedModules] = useState<Set<LazyModuleName>>(() => new Set());

  const loadModule = useCallback((moduleName: LazyModuleName) => {
    setLoadedModules((prev) => {
      if (prev.has(moduleName)) return prev;
      const next = new Set(prev);
      next.add(moduleName);
      PerformanceMonitor.recordMetric(`module_load_request_${moduleName}`, 1);
      return next;
    });
  }, []);

  return {
    loadedModules,
    loadModule,
    modules: moduleComponentMap,
  } as const;
}
