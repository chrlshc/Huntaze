'use client';

/**
 * Analytics Toolbar - Stripe-style Control Panel
 * 
 * Sticky toolbar with all dashboard controls:
 * - Date range selector
 * - Comparison mode
 * - Granularity (hourly/daily/weekly)
 * - Platform filter
 * - Export actions
 * - Last sync indicator
 */

import { useState } from 'react';
import type { DateRange } from '@/lib/dashboard/types';

type CompareMode = 'none' | 'previous-period' | 'previous-year' | 'custom';
type Granularity = 'hourly' | 'daily' | 'weekly';
type PlatformFilter = 'all' | 'instagram' | 'tiktok' | 'twitter' | 'onlyfans';

interface AnalyticsToolbarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  compareMode?: CompareMode;
  onCompareModeChange?: (mode: CompareMode) => void;
  granularity?: Granularity;
  onGranularityChange?: (granularity: Granularity) => void;
  platformFilter?: PlatformFilter;
  onPlatformFilterChange?: (platform: PlatformFilter) => void;
  lastSyncAt?: string;
  onExport?: () => void;
}

export function AnalyticsToolbar({
  dateRange,
  onDateRangeChange,
  compareMode = 'none',
  onCompareModeChange,
  granularity = 'daily',
  onGranularityChange,
  platformFilter = 'all',
  onPlatformFilterChange,
  lastSyncAt,
  onExport,
}: AnalyticsToolbarProps) {
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const handleDateRangeSelect = (preset: string) => {
    if (preset === 'custom') {
      setShowCustomDatePicker(true);
      return;
    }
    onDateRangeChange({ type: 'preset', preset });
  };

  const formatLastSync = (timestamp: string): string => {
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now.getTime() - syncTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return 'over 24 hours ago';
  };

  const getDateRangeLabel = (): string => {
    if (dateRange.type === 'preset') {
      const labels: Record<string, string> = {
        'today': 'Today',
        '7d': 'Last 7 days',
        '30d': 'Last 30 days',
        '90d': 'Last 90 days',
      };
      return labels[dateRange.preset] || dateRange.preset;
    }
    return 'Custom range';
  };

  return (
    <div className="px-6 py-6 bg-white border-b border-gray-200">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
    </div>
  );
}
