/**
 * Dashboard Overview API Endpoint
 * 
 * GET /api/dashboard/overview
 * Returns KPIs, revenue time series, and live feed for the overview page.
 * 
 * Query params:
 * - from: ISO date (YYYY-MM-DD)
 * - to: ISO date (YYYY-MM-DD)
 * 
 * Requirements: 16.1, 16.4
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OverviewResponse, RetentionKpis } from '@/lib/dashboard/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // TODO: Replace with real data fetching in future versions
    // For v0.1, return mock data
    
    // Generate retention KPIs (P0 Creator-specific)
    const retention: RetentionKpis = generateMockRetentionKpis();
    
    const mockResponse: OverviewResponse = {
      kpis: {
        netRevenue: {
          value: 12345.67,
          deltaPct: 12.5,
          label: 'Net Revenue',
          tooltip: 'Subscriptions + PPV + Tips + Customs - Refunds - Chargebacks - Platform Fees'
        },
        activeFans: {
          value: 1234,
          deltaPct: 8.3,
          label: 'Active Fans',
          tooltip: 'Fans with active paid subscriptions at period end'
        },
        conversionRate: {
          value: 3.2,
          deltaPct: -1.5,
          label: 'Conversion Rate',
          tooltip: 'New Subs / Link Taps × 100'
        },
        ltv: {
          value: 245.80,
          deltaPct: 5.7,
          label: 'LTV',
          tooltip: 'Lifetime Value = Net Revenue / Unique Paying Fans'
        }
      },
      retention,
      revenueDaily: generateMockTimeSeries(from, to, 300, 500),
      revenueDailyPrev: generateMockTimeSeries(from, to, 250, 450),
      liveFeed: generateMockLiveFeed(),
      lastSyncAt: new Date().toISOString()
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock time series data for revenue chart
 */
function generateMockTimeSeries(
  from: string | null,
  to: string | null,
  minValue: number,
  maxValue: number
) {
  const days = 30; // Default to 30 days
  const data = [];
  const endDate = to ? new Date(to) : new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const value = Math.floor(Math.random() * (maxValue - minValue) + minValue);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value
    });
  }
  
  return data;
}

/**
 * Generate mock live feed events
 */
function generateMockLiveFeed() {
  const eventTypes = ['NEW_SUB', 'AI_MESSAGE', 'TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER'] as const;
  const sources = ['Instagram', 'TikTok', 'Twitter', 'OnlyFans'] as const;
  const fanHandles = ['@fan_user1', '@creator_fan', '@subscriber123', '@top_supporter', '@new_member'];
  
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 min intervals
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    events.push({
      id: `event_${i}_${Date.now()}`,
      timestamp: timestamp.toISOString(),
      type,
      amount: ['TIP', 'PPV_PURCHASE', 'CUSTOM_ORDER', 'NEW_SUB'].includes(type)
        ? Math.floor(Math.random() * 100) + 10
        : undefined,
      source: sources[Math.floor(Math.random() * sources.length)],
      fanHandle: fanHandles[Math.floor(Math.random() * fanHandles.length)]
    });
  }
  
  return events;
}

/**
 * Generate mock retention KPIs (P0 Creator-specific)
 */
function generateMockRetentionKpis(): RetentionKpis {
  const newSubs = Math.floor(Math.random() * 150) + 80;
  const churnedSubs = Math.floor(Math.random() * 60) + 20;
  const netNew = newSubs - churnedSubs;
  
  return {
    rebillRate: {
      value: 78.5 + Math.random() * 10,
      deltaPct: 2.3,
      label: 'Rebill Rate',
      tooltip: '% of subscriptions that renewed at expiry this period'
    },
    netNewSubs: {
      value: netNew,
      deltaPct: netNew > 50 ? 15.2 : -8.4,
      label: 'Net New Subs',
      tooltip: 'New subscribers minus churned subscribers'
    },
    avgTenure: {
      value: 45 + Math.floor(Math.random() * 30),
      deltaPct: 5.1,
      label: 'Avg Tenure',
      tooltip: 'Average subscriber tenure in days before churn'
    },
    churnedSubs,
    newSubs
  };
}
