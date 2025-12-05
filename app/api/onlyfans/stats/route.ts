import { NextResponse } from 'next/server';

/**
 * OnlyFans Stats API Route
 * Returns dashboard statistics for the OnlyFans page
 * 
 * Feature: onlyfans-shopify-design
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // TODO: Replace with actual data fetching from database/OnlyFans API
    // For now, return mock data to prevent errors
    const stats = {
      messages: {
        total: 1247,
        unread: 23,
        responseRate: 94.5,
        avgResponseTime: 12, // minutes
      },
      fans: {
        total: 856,
        active: 412,
        new: 47,
      },
      ppv: {
        totalRevenue: 4523.50,
        totalSales: 89,
        conversionRate: 12.3,
      },
      connection: {
        isConnected: false,
        lastSync: null,
        status: 'disconnected' as const,
      },
    };

    return NextResponse.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('[OnlyFans Stats API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch OnlyFans stats',
        stats: null 
      },
      { status: 500 }
    );
  }
}
