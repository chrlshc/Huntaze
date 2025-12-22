'use client';

/**
 * Analytics Filters Context
 * 
 * Global state for all analytics filters (date range, compare, granularity, platform)
 * Propagates to all widgets on the page
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import type { DateRange } from '@/lib/dashboard/types';

type CompareMode = 'none' | 'previous-period' | 'previous-year' | 'custom';
type Granularity = 'hourly' | 'daily' | 'weekly';
type PlatformFilter = 'all' | 'instagram' | 'tiktok' | 'twitter' | 'onlyfans';

interface AnalyticsFilters {
  dateRange: DateRange;
  compareMode: CompareMode;
  granularity: Granularity;
  platformFilter: PlatformFilter;
}

interface AnalyticsFiltersContextValue extends AnalyticsFilters {
  setDateRange: (range: DateRange) => void;
  setCompareMode: (mode: CompareMode) => void;
  setGranularity: (granularity: Granularity) => void;
  setPlatformFilter: (platform: PlatformFilter) => void;
}

const AnalyticsFiltersContext = createContext<AnalyticsFiltersContextValue | undefined>(undefined);

export function AnalyticsFiltersProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');

  return (
    <AnalyticsFiltersContext.Provider
      value={{
        dateRange,
        compareMode,
        granularity,
        platformFilter,
        setDateRange,
        setCompareMode,
        setGranularity,
        setPlatformFilter,
      }}
    >
      {children}
    </AnalyticsFiltersContext.Provider>
  );
}

export function useAnalyticsFilters() {
  const context = useContext(AnalyticsFiltersContext);
  if (!context) {
    throw new Error('useAnalyticsFilters must be used within AnalyticsFiltersProvider');
  }
  return context;
}
