/**
 * Dashboard Mock Data
 * 
 * Données mock pour le développement v0.1.
 * Feature: creator-analytics-dashboard
 */

import type {
  OverviewResponse,
  FinanceResponse,
  AcquisitionResponse,
  TimeSeriesPoint,
  LiveEvent,
  Whale,
  PlatformMetrics,
  TopContent,
} from './types';

// Génère des données de revenus quotidiens
function generateDailyRevenue(days: number, baseValue: number): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * baseValue * 0.4;
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue + variation),
    });
  }
  
  return data;
}

// Génère des événements live
function generateLiveEvents(count: number): LiveEvent[] {
  const types: LiveEvent['type'][] = ['NEW_SUB', 'AI_MESSAGE', 'TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER'];
  const sources: LiveEvent['source'][] = ['Instagram', 'TikTok', 'Twitter', 'OnlyFans'];
  const handles = ['@fan_123', '@vip_user', '@loyal_sub', '@new_fan', '@whale_99'];
  
  const events: LiveEvent[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const timestamp = new Date(now.getTime() - i * 5 * 60000); // 5 min apart
    
    events.push({
      id: `evt_${i}`,
      timestamp: timestamp.toISOString(),
      type,
      amount: type !== 'AI_MESSAGE' ? Math.round(Math.random() * 100 + 10) : undefined,
      source: sources[Math.floor(Math.random() * sources.length)],
      fanHandle: handles[Math.floor(Math.random() * handles.length)],
    });
  }
  
  return events;
}

// Génère des whales
function generateWhales(count: number): Whale[] {
  const names = ['Alex M.', 'Jordan K.', 'Taylor S.', 'Morgan P.', 'Casey R.', 'Riley B.', 'Quinn D.', 'Avery L.'];
  
  return Array.from({ length: count }, (_, i) => ({
    fanId: `fan_${i}`,
    name: names[i % names.length],
    totalSpent: Math.round(5000 - i * 400 + Math.random() * 200),
    lastPurchaseAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    isOnline: Math.random() > 0.6,
    aiPriority: i < 2 ? 'high' : 'normal',
  }));
}

export const mockOverviewResponse: OverviewResponse = {
  kpis: {
    netRevenue: {
      value: 12345,
      deltaPct: 12.5,
      label: 'Net Revenue',
      tooltip: 'Subscriptions + PPV + Tips + Customs - Refunds - Chargebacks - Platform Fees',
    },
    activeFans: {
      value: 847,
      deltaPct: 8.2,
      label: 'Active Fans',
      tooltip: 'Fans with active paid subscription at period end',
    },
    conversionRate: {
      value: 3.2,
      deltaPct: -1.5,
      label: 'Conversion Rate',
      tooltip: 'New Subscribers / Link Taps × 100',
    },
    ltv: {
      value: 89,
      deltaPct: 5.8,
      label: 'LTV',
      tooltip: 'Total Revenue / Unique Paying Fans',
    },
  },
  revenueDaily: generateDailyRevenue(30, 400),
  revenueDailyPrev: generateDailyRevenue(30, 350),
  liveFeed: generateLiveEvents(15),
  lastSyncAt: new Date(Date.now() - 5 * 60000).toISOString(),
};

export const mockFinanceResponse: FinanceResponse = {
  breakdown: {
    subscriptions: 6500,
    ppv: 3200,
    tips: 1800,
    customs: 845,
    total: 12345,
  },
  whales: generateWhales(12),
  aiMetrics: {
    rpm: {
      value: 2.45,
      deltaPct: 15.3,
      label: 'Revenue Per Message',
      tooltip: 'Attributed Revenue / Messages Sent (24h attribution window)',
    },
    avgResponseTime: {
      value: 12,
      deltaPct: -8.5,
      label: 'Avg Response Time',
      tooltip: 'Average time for AI to respond to fan messages',
    },
  },
};

const mockPlatformMetrics: PlatformMetrics[] = [
  { platform: 'TikTok', views: 125000, profileClicks: 8500, linkTaps: 2100, newSubs: 45 },
  { platform: 'Instagram', views: 45000, profileClicks: 3200, linkTaps: 890, newSubs: 28 },
  { platform: 'Twitter', views: 18000, profileClicks: 1100, linkTaps: 320, newSubs: 12 },
];

const mockTopContent: TopContent[] = [
  {
    contentId: 'content_1',
    platform: 'TikTok',
    title: 'Behind the scenes vlog',
    thumbnailUrl: '/placeholder-thumb.jpg',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 85000,
    linkTaps: 1200,
    newSubs: 28,
  },
  {
    contentId: 'content_2',
    platform: 'Instagram',
    title: 'Q&A Story highlights',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    views: 32000,
    linkTaps: 650,
    newSubs: 18,
  },
  {
    contentId: 'content_3',
    platform: 'TikTok',
    title: 'Day in my life',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    views: 45000,
    linkTaps: 480,
    newSubs: 12,
  },
];

export const mockAcquisitionResponse: AcquisitionResponse = {
  funnel: {
    views: 188000,
    profileClicks: 12800,
    linkTaps: 3310,
    newSubs: 85,
  },
  platformMetrics: mockPlatformMetrics,
  topContent: mockTopContent,
  insight: 'TikTok drives 53% of new subs despite lower conversion rate',
};
