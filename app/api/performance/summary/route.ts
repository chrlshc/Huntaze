/**
 * API endpoint to get performance summary
 * Enhanced with CloudWatch dashboard integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceDiagnostics } from '@/lib/performance/diagnostics';
import { getDashboardService } from '@/lib/monitoring/dashboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get local diagnostics
    const diagnostics = getPerformanceDiagnostics();
    const localSummary = diagnostics.getPerformanceSummary();

    // Try to get CloudWatch data (fallback to local if unavailable)
    let cloudwatchData = null;
    try {
      const dashboardService = getDashboardService();
      cloudwatchData = await dashboardService.getDashboardData();
    } catch (error) {
      console.warn('CloudWatch data unavailable, using local metrics:', error);
    }

    // Merge local and CloudWatch data
    const summary = {
      // Use CloudWatch metrics if available, otherwise use local
      lcp: cloudwatchData?.metrics.lcp || localSummary.webVitals?.lcp || 0,
      fid: cloudwatchData?.metrics.fid || localSummary.webVitals?.fid || 0,
      cls: cloudwatchData?.metrics.cls || localSummary.webVitals?.cls || 0,
      ttfb: cloudwatchData?.metrics.ttfb || localSummary.webVitals?.ttfb || 0,
      fcp: cloudwatchData?.metrics.fcp || localSummary.webVitals?.fcp,
      tti: cloudwatchData?.metrics.tti || localSummary.webVitals?.tti,
      
      // Include alerts and historical data if available
      alerts: cloudwatchData?.alerts || [],
      historical: cloudwatchData?.historical || [],
      grade: cloudwatchData?.grade || 'N/A',
      
      // Include local diagnostics
      bottlenecks: localSummary.bottlenecks || [],
      slowRequests: localSummary.slowRequests || [],
      
      // Metadata
      source: cloudwatchData ? 'cloudwatch' : 'local',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Failed to get performance summary:', error);
    return NextResponse.json({ 
      error: 'Failed to get performance summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
