export interface OverviewMetrics {
  metrics: {
    revenueMonthly: number;
    activeSubscribers: number;
    avgResponseSeconds: number;
    aiAutomationRate: number;
    change: {
      revenue: number;
      subscribers: number;
      response: number;
      automation: number;
    };
  };
  topFans: Array<{
    name: string;
    username: string;
    revenue: number;
    messages: number;
    lastActive: string;
    badge: 'vip' | 'loyal' | 'new' | 'regular';
    trend: number;
  }>;
  revenueSeries: {
    labels: string[];
    values: number[];
  };
  fanGrowth: {
    labels: string[];
    newFans: number[];
    activeFans: number[];
  };
  platformDistribution: Array<{
    platform: string;
    share: number;
  }>;
}