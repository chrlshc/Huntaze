import { NextResponse } from 'next/server';
import { isMockApiMode } from '@/config/api-mode';

/**
 * AI Quota API Route
 * Returns AI usage quota information
 * 
 * Feature: onlyfans-shopify-design
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isMockApiMode()) {
      return NextResponse.json({
        success: true,
        quota: null,
      });
    }

    // TODO: Replace with actual quota tracking from database
    // For now, return mock data in demo mode
    const quota = {
      limit: 10.00, // $10 monthly limit
      spent: 3.45,
      remaining: 6.55,
      percentUsed: 34.5,
    };

    return NextResponse.json({ 
      success: true,
      quota 
    });
  } catch (error) {
    console.error('[AI Quota API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch AI quota',
        quota: null 
      },
      { status: 500 }
    );
  }
}
