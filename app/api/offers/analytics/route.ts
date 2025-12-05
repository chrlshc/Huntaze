/**
 * Offer Analytics API Route
 * 
 * GET /api/offers/analytics - Get analytics summary
 * 
 * Requirements: 10.1, 10.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { getOfferAnalyticsService } from '@/lib/offers/offer-analytics.service';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const session = authResult;

    const userId = parseInt(session.user.id, 10);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const offerId = searchParams.get('offerId');
    const type = searchParams.get('type') || 'metrics'; // metrics, compare, trends
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Default time range: last 30 days
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr 
      ? new Date(startDateStr) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const timeRange = { startDate, endDate };
    const analyticsService = getOfferAnalyticsService();

    switch (type) {
      case 'metrics': {
        const metrics = offerId
          ? await analyticsService.getRedemptionMetrics(offerId)
          : await analyticsService.getUserRedemptionMetrics(userId);
        
        return NextResponse.json({ metrics });
      }

      case 'compare': {
        const offerIds = searchParams.get('offerIds')?.split(',');
        const comparison = await analyticsService.compareOffers(
          userId,
          offerIds
        );
        
        return NextResponse.json(comparison);
      }

      case 'trends': {
        const trends = await analyticsService.getRedemptionTrends(
          userId,
          timeRange,
          offerId || undefined
        );
        
        return NextResponse.json({ trends });
      }

      case 'history': {
        if (!offerId) {
          return NextResponse.json(
            { error: 'offerId required for history' },
            { status: 400 }
          );
        }
        
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const history = await analyticsService.getRedemptionHistory(offerId, limit);
        
        return NextResponse.json({ history });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[OfferAnalytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
