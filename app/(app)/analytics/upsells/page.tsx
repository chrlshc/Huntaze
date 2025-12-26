'use client';

/**
 * Analytics - Upsells Page
 * Placeholder until upsell automation is wired.
 */

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyCard, ShopifyEmptyState, ShopifySectionHeader } from '@/components/ui/shopify';
import { Sparkles } from 'lucide-react';

export default function UpsellsAnalyticsPage() {
  return (
    <ShopifyPageLayout title="Upsell Automation">
      <div className="space-y-6">
        <ShopifySectionHeader title="Upsell Automation" />
        <ShopifyCard>
          <ShopifyEmptyState
            icon={Sparkles}
            title="Upsells are not available yet"
            description="This dashboard will be enabled once the upsell automation endpoints are live."
          />
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
