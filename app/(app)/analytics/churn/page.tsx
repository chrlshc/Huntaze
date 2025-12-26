'use client';

/**
 * Analytics - Churn Page
 * Customer churn analysis and retention metrics
 */

export const dynamic = 'force-dynamic';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import {
  ShopifyMetricCard,
  ShopifyMetricGrid,
  ShopifyCard,
  ShopifyBanner,
  ShopifyEmptyState,
} from '@/components/ui/shopify';
import { ChurnRiskList } from '@/components/revenue/churn/ChurnRiskList';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { useAuthSession } from '@/hooks/useAuthSession';
import type { ChurnRiskResponse } from '@/lib/services/revenue/types';
import { AlertTriangle, TrendingDown, Users } from 'lucide-react';

export default function ChurnAnalyticsPage() {
  const { user, isAuthenticated, isLoading: sessionLoading } = useAuthSession();
  const [banner, setBanner] = useState<{
    status: 'info' | 'success' | 'critical';
    title: string;
    description?: string;
  } | null>(null);

  const churnKey = user?.id ? `/api/revenue/churn?creatorId=${encodeURIComponent(user.id)}` : null;
  const { data, error, isLoading, mutate } = useSWR<ChurnRiskResponse>(
    churnKey,
    (url: string) => internalApiFetch<ChurnRiskResponse>(url),
  );

  const summary = data?.summary;
  const fans = data?.fans ?? [];

  const metrics = useMemo(() => ({
    totalAtRisk: summary?.totalAtRisk ?? 0,
    highRisk: summary?.highRisk ?? 0,
    mediumRisk: summary?.mediumRisk ?? 0,
    lowRisk: summary?.lowRisk ?? 0,
  }), [summary]);

  const handleReEngage = useCallback(async (fanId: string) => {
    if (!user?.id) {
      setBanner({
        status: 'critical',
        title: 'Sign-in required',
        description: 'Please sign in to re-engage fans.',
      });
      return;
    }

    try {
      await internalApiFetch('/api/revenue/churn/reengage', {
        method: 'POST',
        body: { creatorId: user.id, fanId },
      });
      setBanner({
        status: 'success',
        title: 'Re-engagement sent',
        description: 'The fan will receive a follow-up message shortly.',
      });
    } catch (err: any) {
      setBanner({
        status: 'critical',
        title: 'Re-engagement failed',
        description: err?.message || 'Please try again.',
      });
    }
  }, [user]);

  const handleViewDetails = useCallback(() => {
    setBanner({
      status: 'info',
      title: 'Details view not wired yet',
      description: 'We will add a fan detail drill-down once the endpoint is available.',
    });
  }, []);

  if (sessionLoading || isLoading) {
    return (
      <ShopifyPageLayout
        title="Churn Analytics"
        subtitle="Track customer retention and identify at-risk fans"
      >
        <div className="space-y-6">
          <ShopifyMetricGrid>
            <ShopifyMetricCard label="Total at risk" value="—" loading icon={Users} />
            <ShopifyMetricCard label="High risk" value="—" loading icon={AlertTriangle} />
            <ShopifyMetricCard label="Medium risk" value="—" loading icon={TrendingDown} />
            <ShopifyMetricCard label="Low risk" value="—" loading icon={Users} />
          </ShopifyMetricGrid>
          <ShopifyCard>
            <ShopifyEmptyState
              icon={Users}
              title="Loading churn insights"
              description="Fetching the latest churn risk data."
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  if (!sessionLoading && !isAuthenticated) {
    return (
      <ShopifyPageLayout
        title="Churn Analytics"
        subtitle="Track customer retention and identify at-risk fans"
      >
        <div className="space-y-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={Users}
              title="Sign in to view churn data"
              description="Your churn insights are available once you are authenticated."
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  if (error) {
    return (
      <ShopifyPageLayout
        title="Churn Analytics"
        subtitle="Track customer retention and identify at-risk fans"
      >
        <div className="space-y-6">
          <ShopifyCard>
            <ShopifyEmptyState
              icon={AlertTriangle}
              title="Unable to load churn data"
              description={error instanceof Error ? error.message : 'Please try again.'}
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </ShopifyCard>
        </div>
      </ShopifyPageLayout>
    );
  }

  return (
    <ShopifyPageLayout
      title="Churn Analytics"
      subtitle="Track customer retention and identify at-risk fans"
    >
      <div className="space-y-6">
        {banner && (
          <ShopifyBanner
            status={banner.status}
            title={banner.title}
            description={banner.description}
            onDismiss={() => setBanner(null)}
          />
        )}

        <ShopifyMetricGrid>
          <ShopifyMetricCard label="Total at risk" value={metrics.totalAtRisk} icon={AlertTriangle} />
          <ShopifyMetricCard label="High risk" value={metrics.highRisk} icon={AlertTriangle} />
          <ShopifyMetricCard label="Medium risk" value={metrics.mediumRisk} icon={TrendingDown} />
          <ShopifyMetricCard label="Low risk" value={metrics.lowRisk} icon={Users} />
        </ShopifyMetricGrid>

        <ShopifyCard>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">At-risk fans</h3>
            {fans.length === 0 ? (
              <ShopifyEmptyState
                icon={Users}
                title="No fans at risk"
                description="Great news! None of your fans are currently at risk of churning."
              />
            ) : (
              <ChurnRiskList
                fans={fans}
                onReEngage={handleReEngage}
                onViewDetails={handleViewDetails}
              />
            )}
          </div>
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
