/**
 * Offer Analytics Export API Route
 * 
 * GET /api/offers/analytics/export - Export analytics report
 * 
 * Requirements: 10.4
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
    const format = (searchParams.get('format') || 'json') as 'csv' | 'json' | 'pdf';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Time range (optional)
    let timeRange;
    if (startDateStr && endDateStr) {
      timeRange = {
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr)
      };
    }

    const analyticsService = getOfferAnalyticsService();
    const report = await analyticsService.exportReport(userId, format, timeRange);

    // Handle different formats
    switch (format) {
      case 'csv': {
        const csvContent = convertToCSV(report.data);
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="offer-analytics-${Date.now()}.csv"`
          }
        });
      }

      case 'json':
      default:
        return NextResponse.json(report);
    }
  } catch (error) {
    console.error('[OfferAnalyticsExport] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}

/**
 * Convert analytics data to CSV format
 */
function convertToCSV(data: Array<{
  offerId: string;
  redemptionCount: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}>): string {
  const headers = ['Offer ID', 'Redemptions', 'Total Revenue', 'Conversion Rate', 'Avg Order Value'];
  const rows = data.map(item => [
    item.offerId,
    item.redemptionCount.toString(),
    item.totalRevenue.toFixed(2),
    item.conversionRate.toFixed(2) + '%',
    item.averageOrderValue.toFixed(2)
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}
