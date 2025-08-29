export type OverviewMetrics = {
  metrics: {
    revenueMonthly: number;
    activeSubscribers: number;
    avgResponseSeconds: number;
    aiAutomationRate: number; // 0..1
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
    badge: string;
    trend: number;
  }>;
  platformDistribution: Array<{ platform: string; share: number; revenue: number }>;
  revenueSeries: { labels: string[]; values: number[] };
  fanGrowth: { labels: string[]; newFans: number[]; activeFans: number[] };
};

