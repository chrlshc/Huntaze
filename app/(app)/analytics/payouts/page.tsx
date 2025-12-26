'use client';

/**
 * Analytics - Payouts Page
 * Placeholder until payout endpoints are wired.
 */

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyCard, ShopifyEmptyState, ShopifySectionHeader } from '@/components/ui/shopify';
import { Wallet } from 'lucide-react';

export default function PayoutsAnalyticsPage() {
  return (
    <ShopifyPageLayout title="Payouts">
      <div className="space-y-6">
        <ShopifySectionHeader title="Payouts" />
        <ShopifyCard>
          <ShopifyEmptyState
            icon={Wallet}
            title="Payouts are not available yet"
            description="This dashboard will be enabled once the payouts endpoints are live."
          />
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
