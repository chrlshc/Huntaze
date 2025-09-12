import { NextRequest, NextResponse } from 'next/server';
import { 
  calculateBulkRFMScores, 
  getSegmentDistribution,
  FanMetrics 
} from '@/src/utils/rfm-segmentation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { importData, timeRange } = await request.json();

    // If no import data provided, fetch from backend
    let fanData: any[] = [];
    
    if (importData) {
      // Use provided import data (from recent OF import)
      fanData = processImportData(importData);
    } else {
      // Fetch from backend
      const response = await fetch(`${API_URL}/ofm/fans/metrics?${new URLSearchParams({
        timeRange: timeRange || '90d'
      })}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        fanData = await response.json();
      }
    }

    if (fanData.length === 0) {
      return NextResponse.json({
        message: 'No fan data available for RFM calculation',
        segments: {},
        distribution: {}
      });
    }

    // Convert to FanMetrics format
    const fanMetrics: FanMetrics[] = fanData.map(fan => ({
      userId: fan.userId || fan.subscriberId || `fan_${Math.random().toString(36).slice(2)}`,
      username: fan.username || fan.name || 'Unknown',
      lastInteraction: new Date(fan.lastActive || fan.lastTransaction || new Date()),
      totalSpent: fan.totalSpent || 0,
      transactionCount: fan.transactionCount || fan.transactions?.length || 0,
      messageCount: fan.messageCount || 0,
      avgTransactionValue: fan.totalSpent ? (fan.totalSpent / (fan.transactionCount || 1)) : 0,
      daysSinceLastInteraction: calculateDaysSince(fan.lastActive || fan.lastTransaction)
    }));

    // Calculate RFM scores
    const rfmScores = calculateBulkRFMScores(fanMetrics);
    const distribution = getSegmentDistribution(rfmScores);

    // Convert Map to object for JSON serialization
    const segments: Record<string, any> = {};
    rfmScores.forEach((score, userId) => {
      const metrics = fanMetrics.find(m => m.userId === userId);
      segments[userId] = {
        ...score,
        username: metrics?.username,
        lastInteraction: metrics?.lastInteraction,
        totalSpent: metrics?.totalSpent,
        metrics: {
          daysSince: metrics?.daysSinceLastInteraction,
          transactions: metrics?.transactionCount,
          avgValue: metrics?.avgTransactionValue
        }
      };
    });

    // Store results in backend
    try {
      await fetch(`${API_URL}/ofm/rfm/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ segments, distribution })
      });
    } catch (error) {
      console.error('Failed to store RFM segments:', error);
    }

    return NextResponse.json({
      message: 'RFM segmentation calculated successfully',
      totalFans: fanMetrics.length,
      segments,
      distribution,
      summary: {
        whales: distribution.WHALE || 0,
        vips: distribution.VIP || 0,
        casual: distribution.CASUAL || 0,
        churnRisk: distribution.CHURN_RISK || 0,
        new: distribution.NEW || 0,
        unknown: distribution.UNKNOWN || 0
      }
    });

  } catch (error: any) {
    console.error('RFM calculation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to calculate RFM segmentation' 
    }, { status: 500 });
  }
}

function processImportData(importData: any): any[] {
  const fanMap = new Map<string, any>();

  // Process transactions
  if (importData.transactions) {
    importData.transactions.forEach((tx: any) => {
      if (!tx.subscriberId) return;
      
      const fan = fanMap.get(tx.subscriberId) || {
        userId: tx.subscriberId,
        username: `User_${tx.subscriberId.slice(-6)}`,
        transactions: [],
        totalSpent: 0,
        lastTransaction: null
      };
      
      fan.transactions.push(tx);
      fan.totalSpent += tx.amount || 0;
      
      const txDate = new Date(tx.date);
      if (!fan.lastTransaction || txDate > new Date(fan.lastTransaction)) {
        fan.lastTransaction = tx.date;
      }
      
      fanMap.set(tx.subscriberId, fan);
    });
  }

  // Process subscribers
  if (importData.subscribers) {
    importData.subscribers.forEach((sub: any) => {
      const fan = fanMap.get(sub.userId) || {
        userId: sub.userId,
        totalSpent: 0,
        transactions: []
      };
      
      fan.username = sub.username;
      fan.subscribedDate = sub.subscribedDate;
      fan.subscriptionStatus = sub.status;
      fan.subscriptionPrice = sub.price;
      
      // Add subscription as a transaction if not already counted
      if (sub.price > 0) {
        fan.totalSpent = Math.max(fan.totalSpent, sub.price);
        fan.transactionCount = Math.max(fan.transactions.length, 1);
      }
      
      fanMap.set(sub.userId, fan);
    });
  }

  // Process posts/earnings to infer fan activity
  if (importData.posts) {
    importData.posts.forEach((post: any) => {
      // This is aggregate data, not fan-specific
      // Could be enhanced with more detailed data
    });
  }

  return Array.from(fanMap.values()).map(fan => ({
    ...fan,
    transactionCount: fan.transactions?.length || 0,
    lastActive: fan.lastTransaction || fan.subscribedDate
  }));
}

function calculateDaysSince(dateStr: string | Date | null): number {
  if (!dateStr) return 999;
  
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
