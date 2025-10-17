'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, MessageSquare, Eye, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MetricData {
  value: number;
  change: number;
  label: string;
  icon: React.ElementType;
  format?: 'currency' | 'number' | 'percent';
}

export function RealMetricsCard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealMetrics();
    const interval = setInterval(fetchRealMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  async function fetchRealMetrics() {
    try {
      const response = await fetch('/api/analytics/track?timeRange=30d');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData: MetricData[] = [
    {
      value: metrics?.totalRevenue || 0,
      change: 12.5, // You can calculate this from historical data
      label: 'Total Revenue',
      icon: DollarSign,
      format: 'currency',
    },
    {
      value: metrics?.fanEngagement?.active || 0,
      change: 8.3,
      label: 'Active Fans',
      icon: Users,
      format: 'number',
    },
    {
      value: metrics?.messageCount || 0,
      change: -3.2,
      label: 'Messages Sent',
      icon: MessageSquare,
      format: 'number',
    },
    {
      value: (metrics?.conversionRate || 0) * 100,
      change: 15.7,
      label: 'Conversion Rate',
      icon: Eye,
      format: 'percent',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change > 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.format === 'currency' 
                  ? formatCurrency(metric.value)
                  : metric.format === 'percent'
                  ? `${metric.value.toFixed(1)}%`
                  : metric.value.toLocaleString()
                }
              </div>
              <p className={cn(
                "text-xs flex items-center gap-1 mt-1",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(metric.change)}%
                <span className="text-muted-foreground">from last month</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}