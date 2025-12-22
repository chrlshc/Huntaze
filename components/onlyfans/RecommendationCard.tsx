/**
 * RecommendationCard Component
 * Feature: onlyfans-settings-saas-transformation
 * Requirements: 3.3, 3.5
 * 
 * Compact AI recommendation row for the AI Recommendations list.
 * Scannable layout: icon + title + 1 line, with CTA + dismiss.
 */

'use client';

import { Sparkles } from 'lucide-react';
import { ShopifyButton } from '@/components/ui/ShopifyButton';

export interface RecommendationCardProps {
  id: string;
  insight: string;
  impact: string;
  metric: string;
  metricColor?: 'success' | 'warning' | 'info';
  onFixNow?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function RecommendationCard({
  id,
  insight,
  impact,
  metric,
  metricColor = 'info',
  onFixNow,
  onDismiss,
}: RecommendationCardProps) {
  const getMetricConfig = () => {
    switch (metricColor) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return '#4F46E5';
    }
  };

  const metricConfig = (() => {
    switch (metricColor) {
      case 'success':
        return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
      case 'warning':
        return { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' };
      case 'info':
      default:
        return { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' };
    }
  })();

  const handleFixNow = () => {
    onFixNow?.(id);
  };

  const handleDismiss = () => {
    onDismiss?.(id);
  };

  return (
    <div
      className="flex items-center gap-4 hover:bg-[var(--shopify-bg-surface-hover)] transition-colors"
      style={{ padding: 'var(--of-space-4, 16px) var(--of-space-6, 24px)' }}
    >
      <div
        className="w-9 h-9 flex items-center justify-center flex-shrink-0"
        style={{ borderRadius: 'var(--of-radius-input)', backgroundColor: 'rgba(79, 70, 229, 0.10)' }}
        aria-hidden="true"
      >
        <Sparkles className="w-5 h-5" style={{ color: getMetricConfig() }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-[#1a1a1a] leading-snug line-clamp-1">
          {insight}
        </div>
        <div className="text-[13px] text-[#6b7177] line-clamp-1">
          {impact}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[12px] font-semibold border whitespace-nowrap"
          style={{
            backgroundColor: metricConfig.bg,
            color: metricConfig.text,
            borderColor: metricConfig.border,
          }}
        >
          {metric}
        </span>
        <ShopifyButton variant="secondary" size="sm" onClick={handleFixNow}>
          Fix now
        </ShopifyButton>
        <ShopifyButton
          variant="plain"
          size="sm"
          className="text-slate-500 hover:text-slate-900"
          onClick={handleDismiss}
        >
          Dismiss
        </ShopifyButton>
      </div>
    </div>
  );
}
