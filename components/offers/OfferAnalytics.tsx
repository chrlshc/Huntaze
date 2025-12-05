"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users,
  Tag,
  Download,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import type { OfferAnalytics as OfferAnalyticsType, OfferComparison } from '@/lib/offers/types';

interface OfferAnalyticsProps {
  offerId?: string;
}

// Mock analytics data
const mockAnalytics: OfferAnalyticsType[] = [
  { offerId: '1', redemptionCount: 145, totalRevenue: 2900, conversionRate: 0.32, averageOrderValue: 20 },
  { offerId: '2', redemptionCount: 89, totalRevenue: 1780, conversionRate: 0.28, averageOrderValue: 20 },
  { offerId: '3', redemptionCount: 234, totalRevenue: 5850, conversionRate: 0.45, averageOrderValue: 25 },
  { offerId: '4', redemptionCount: 67, totalRevenue: 1340, conversionRate: 0.22, averageOrderValue: 20 },
  { offerId: '5', redemptionCount: 312, totalRevenue: 7800, conversionRate: 0.52, averageOrderValue: 25 },
];

const mockOfferNames: Record<string, string> = {
  '1': 'Summer Sale 20% Off',
  '2': 'New Subscriber Welcome',
  '3': 'Black Friday Bundle',
  '4': 'Flash Sale Draft',
  '5': 'Spring Promo',
};

const mockTrends = [
  { date: 'Mon', redemptions: 45, revenue: 900 },
  { date: 'Tue', redemptions: 52, revenue: 1040 },
  { date: 'Wed', redemptions: 38, revenue: 760 },
  { date: 'Thu', redemptions: 65, revenue: 1300 },
  { date: 'Fri', redemptions: 78, revenue: 1560 },
  { date: 'Sat', redemptions: 92, revenue: 1840 },
  { date: 'Sun', redemptions: 71, revenue: 1420 },
];

export function OfferAnalytics({ offerId }: OfferAnalyticsProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [isExporting, setIsExporting] = useState(false);

  // Calculate totals
  const totals = mockAnalytics.reduce((acc, a) => ({
    redemptions: acc.redemptions + a.redemptionCount,
    revenue: acc.revenue + a.totalRevenue,
    avgConversion: acc.avgConversion + a.conversionRate,
    avgOrderValue: acc.avgOrderValue + a.averageOrderValue,
  }), { redemptions: 0, revenue: 0, avgConversion: 0, avgOrderValue: 0 });

  totals.avgConversion = totals.avgConversion / mockAnalytics.length;
  totals.avgOrderValue = totals.avgOrderValue / mockAnalytics.length;

  // Mock comparison data
  const previousPeriod = {
    redemptions: totals.redemptions * 0.85,
    revenue: totals.revenue * 0.82,
    avgConversion: totals.avgConversion * 0.9,
  };

  const changes = {
    redemptions: ((totals.redemptions - previousPeriod.redemptions) / previousPeriod.redemptions) * 100,
    revenue: ((totals.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100,
    avgConversion: ((totals.avgConversion - previousPeriod.avgConversion) / previousPeriod.avgConversion) * 100,
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/offers/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv', dateRange }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `offer-analytics-${dateRange}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const maxRedemptions = Math.max(...mockTrends.map(t => t.redemptions));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Offer Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track performance and optimize your offers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              changes.redemptions >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {changes.redemptions >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(changes.redemptions).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold">{totals.redemptions.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Redemptions</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              changes.revenue >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {changes.revenue >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(changes.revenue).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold">${totals.revenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-500" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              changes.avgConversion >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {changes.avgConversion >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(changes.avgConversion).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold">{(totals.avgConversion * 100).toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">Avg Conversion Rate</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">${totals.avgOrderValue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Redemption Trends
        </h3>
        
        <div className="h-48 flex items-end gap-2">
          {mockTrends.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                style={{ 
                  height: `${(day.redemptions / maxRedemptions) * 100}%`,
                  minHeight: '4px'
                }}
                title={`${day.redemptions} redemptions`}
              />
              <span className="text-xs text-muted-foreground">{day.date}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-sm text-muted-foreground">Redemptions</span>
          </div>
        </div>
      </Card>

      {/* Top Performing Offers */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Top Performing Offers
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Offer</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Redemptions</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Revenue</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Conversion</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">AOV</th>
              </tr>
            </thead>
            <tbody>
              {mockAnalytics
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((analytics, index) => (
                  <tr key={analytics.offerId} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{mockOfferNames[analytics.offerId]}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">{analytics.redemptionCount}</td>
                    <td className="text-right py-3 px-2 font-medium">${analytics.totalRevenue.toLocaleString()}</td>
                    <td className="text-right py-3 px-2">
                      <span className={`${
                        analytics.conversionRate >= 0.4 ? 'text-green-500' : 
                        analytics.conversionRate >= 0.25 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {(analytics.conversionRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">${analytics.averageOrderValue}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          AI Insights
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-500">•</span>
            <span>Your "Spring Promo" has the highest conversion rate at 52%. Consider extending similar offers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500">•</span>
            <span>Weekend redemptions are 30% higher than weekdays. Schedule flash sales for Saturdays.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Bundle offers generate 25% more revenue per redemption than single-item discounts.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
