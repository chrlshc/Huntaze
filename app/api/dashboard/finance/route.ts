/**
 * Dashboard Finance API Endpoint
 * 
 * GET /api/dashboard/finance
 * Returns revenue breakdown, whale list, and AI metrics for the finance page.
 * 
 * Query params:
 * - from: ISO date (YYYY-MM-DD)
 * - to: ISO date (YYYY-MM-DD)
 * 
 * Requirements: 16.2, 16.4
 */

import { NextRequest, NextResponse } from 'next/server';
import type { FinanceResponse, ExpansionKpis, RiskKpis, MessagingKpis } from '@/lib/dashboard/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // TODO: Replace with real data fetching in future versions
    // For v0.1, return mock data
    
    // Generate P0 creator-specific KPIs
    const expansion: ExpansionKpis = generateMockExpansionKpis();
    const risk: RiskKpis = generateMockRiskKpis();
    const messaging: MessagingKpis = generateMockMessagingKpis();
    
    const mockResponse: FinanceResponse = {
      breakdown: {
        subscriptions: 5234.50,
        ppv: 3456.20,
        tips: 2345.67,
        customs: 1309.30,
        total: 12345.67,
        ppvAttachRate: 18.5,
        tipAttachRate: 12.3,
        customsAttachRate: 4.2
      },
      expansion,
      risk,
      whales: generateMockWhales(),
      aiMetrics: {
        rpm: {
          value: 2.45,
          deltaPct: 15.3,
          label: 'RPM',
          tooltip: 'Revenue Per Message = Attributed Revenue / Messages Sent (24h attribution window)'
        },
        avgResponseTime: {
          value: 3.2,
          deltaPct: -8.5,
          label: 'Avg Response Time',
          tooltip: 'Average AI response time in seconds'
        }
      },
      messaging
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock whale (top spender) data
 */
function generateMockWhales() {
  const names = [
    'Alex Thompson',
    'Jordan Smith',
    'Casey Williams',
    'Morgan Davis',
    'Riley Johnson',
    'Taylor Brown',
    'Cameron Wilson',
    'Avery Martinez',
    'Quinn Anderson',
    'Skyler Garcia'
  ];
  
  const whales = [];
  
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const lastPurchase = new Date();
    lastPurchase.setDate(lastPurchase.getDate() - daysAgo);
    
    whales.push({
      fanId: `fan_${i}_${Date.now()}`,
      name: names[i],
      totalSpent: Math.floor(Math.random() * 5000) + 1000,
      lastPurchaseAt: lastPurchase.toISOString(),
      isOnline: Math.random() > 0.5,
      aiPriority: (Math.random() > 0.7 ? 'high' : 'normal') as 'high' | 'normal'
    });
  }
  
  // Sort by totalSpent descending
  return whales.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Generate mock expansion KPIs (P0 Creator-specific)
 */
function generateMockExpansionKpis(): ExpansionKpis {
  return {
    arppu: {
      value: 45.80,
      deltaPct: 8.2,
      label: 'ARPPU',
      tooltip: 'Average Revenue Per Paying User (fans who made at least 1 purchase)'
    },
    ppvAttachRate: {
      value: 18.5,
      deltaPct: 3.1,
      label: 'PPV Attach Rate',
      tooltip: '% of active fans who purchased at least 1 PPV this period'
    },
    tipConversionRate: {
      value: 12.3,
      deltaPct: -1.2,
      label: 'Tip Conversion',
      tooltip: '% of active fans who sent at least 1 tip this period'
    },
    payersRatio: {
      value: 34.5,
      deltaPct: 5.8,
      label: 'Payers Ratio',
      tooltip: '% of fans with at least 1 transaction beyond subscription'
    }
  };
}

/**
 * Generate mock risk KPIs (P0)
 */
function generateMockRiskKpis(): RiskKpis {
  const chargebackAmount = Math.floor(Math.random() * 200) + 50;
  const refundAmount = Math.floor(Math.random() * 150) + 30;
  
  return {
    chargebackRate: {
      value: 0.8,
      deltaPct: -0.3,
      label: 'Chargeback Rate',
      tooltip: '% of transactions disputed by payment provider'
    },
    chargebackAmount,
    refundAmount,
    netRevenueImpact: chargebackAmount + refundAmount
  };
}

/**
 * Generate mock messaging KPIs (P0 if monetizing via DM/PPV)
 */
function generateMockMessagingKpis(): MessagingKpis {
  return {
    broadcastOpenRate: {
      value: 42.5,
      deltaPct: 5.2,
      label: 'Open Rate',
      tooltip: '% of mass messages opened by recipients'
    },
    unlockRate: {
      value: 8.3,
      deltaPct: 1.8,
      label: 'Unlock Rate',
      tooltip: 'PPV purchases / total recipients'
    },
    revenuePerBroadcast: {
      value: 156.40,
      deltaPct: 12.5,
      label: 'Rev/Broadcast',
      tooltip: 'Average revenue generated per broadcast message'
    },
    replyRate: {
      value: 15.2,
      deltaPct: 2.1,
      label: 'Reply Rate',
      tooltip: '% of conversations with at least 1 reply'
    },
    medianResponseTime: {
      value: 4.5,
      deltaPct: -15.3,
      label: 'Response Time',
      tooltip: 'Median time to first response in minutes'
    }
  };
}
