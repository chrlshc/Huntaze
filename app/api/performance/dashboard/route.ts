import { NextRequest, NextResponse } from 'next/server';
import { getDashboardService } from '@/lib/monitoring/dashboard-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/dashboard
 * 
 * Fetch complete performance dashboard data including:
 * - Current metrics (LCP, FID, CLS, TTFB)
 * - Active alerts
 * - Historical trends
 * - Performance grade
 */
export async function GET(request: NextRequest) {
  try {
    const dashboardService = getDashboardService();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    
    // Fetch dashboard data
    const dashboardData = await dashboardService.getDashboardData();
    
    // If custom hours requested, fetch historical data again
    if (hours !== 24) {
      dashboardData.historical = await dashboardService.getHistoricalData(hours);
    }

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/dashboard/refresh
 * 
 * Trigger a manual refresh of dashboard metrics
 */
export async function POST(request: NextRequest) {
  try {
    const dashboardService = getDashboardService();
    const dashboardData = await dashboardService.getDashboardData();

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
        refreshedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
