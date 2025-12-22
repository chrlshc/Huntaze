'use client';

/**
 * Analytics - Forecast Page
 * Revenue and growth forecasting
 */

export const dynamic = 'force-dynamic';

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { 
  ShopifyMetricCard,
  ShopifyMetricGrid,
  ShopifySectionHeader,
  ShopifyCard,
} from '@/components/ui/shopify';
import { TrendingDown, DollarSign, Users, Target } from 'lucide-react';

export default function ForecastAnalyticsPage() {
  return (
    <ShopifyPageLayout>
      <div className="space-y-6">
        <ShopifySectionHeader 
          title="Revenue Forecast" 
          description="AI-powered predictions for future growth"
          icon={TrendingDown}
        />

        <ShopifyMetricGrid>
          <ShopifyMetricCard
            title="Next Month Forecast"
            value="$12,450"
            change="+15%"
            changeType="positive"
            icon={DollarSign}
          />
          <ShopifyMetricCard
            title="Quarterly Projection"
            value="$45,230"
            change="+22%"
            changeType="positive"
            icon={Target}
          />
          <ShopifyMetricCard
            title="Expected New Fans"
            value="1,234"
            change="+8%"
            changeType="positive"
            icon={Users}
          />
          <ShopifyMetricCard
            title="Confidence Score"
            value="94%"
            change="+3%"
            changeType="positive"
            icon={TrendingDown}
          />
        </ShopifyMetricGrid>

        <ShopifyCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Forecast Chart</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Revenue forecast visualization</p>
            </div>
          </div>
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
