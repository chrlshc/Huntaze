'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function RealTimeAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/analytics/track?timeRange=7d');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const revenue = analytics?.revenue || {};

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.fanEngagement?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.fanEngagement?.total || 0} total fans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.messageCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgResponseTime ? `${metrics.avgResponseTime}s avg response` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.conversionRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>
            Revenue by content type over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatRevenueData(revenue.breakdown)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trending Content */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Content</CardTitle>
          <CardDescription>
            Your best performing content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.trending?.map((content: any, index: number) => (
              <div key={content.contentId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-semibold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {content.contentId.substring(0, 20)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {content.views} views • {content.likes} likes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(content.revenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((content.conversionRate || 0) * 100).toFixed(1)}% conversion
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatRevenueData(breakdown: Record<string, number> = {}) {
  return Object.entries(breakdown).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));
}