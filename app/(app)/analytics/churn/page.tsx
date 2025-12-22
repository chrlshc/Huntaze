'use client';

/**
 * Analytics - Churn Page
 * Customer churn analysis and retention metrics
 */

export const dynamic = 'force-dynamic';

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { 
  ShopifyMetricCard,
  ShopifyMetricGrid,
  ShopifySectionHeader,
  ShopifyCard,
} from '@/components/ui/shopify';
import { TrendingDown, Users, AlertTriangle, Target } from 'lucide-react';

export default function ChurnAnalyticsPage() {
  return (
    <ShopifyPageLayout>
      <div className="space-y-6">
        <ShopifySectionHeader 
          title="Churn Analytics" 
          description="Track customer retention and identify at-risk fans"
          icon={TrendingDown}
        />

        <ShopifyMetricGrid>
          <ShopifyMetricCard
            title="Churn Rate"
            value="12.3%"
            change="-2.1%"
            changeType="positive"
            icon={TrendingDown}
          />
          <ShopifyMetricCard
            title="At Risk Fans"
            value="234"
            change="+18"
            changeType="negative"
            icon={AlertTriangle}
          />
          <ShopifyMetricCard
            title="Retention Rate"
            value="87.7%"
            change="+2.1%"
            changeType="positive"
            icon={Users}
          />
          <ShopifyMetricCard
            title="Recovered"
            value="45"
            change="+12"
            changeType="positive"
            icon={Target}
          />
        </ShopifyMetricGrid>

        <ShopifyCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Churn Trends</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Churn visualization chart</p>
            </div>
          </div>
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
