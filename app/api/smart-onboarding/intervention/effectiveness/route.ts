import { NextRequest, NextResponse } from 'next/server';
import {
  trackOutcome,
  generateReport,
  analyzePatterns,
  getOptimizationSuggestions,
  updateMetricsAggregation,
} from '@/lib/smart-onboarding/services/interventionEffectivenessFacade';
import { logger } from '@/lib/utils/logger';

// Facade-based minimal implementation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, interventionId, userId, outcome, timeRange, filters } = body;

    switch (action) {
      case 'track_outcome':
        if (!interventionId || !userId || !outcome) {
          return NextResponse.json(
            { error: 'Intervention ID, user ID, and outcome are required' },
            { status: 400 }
          );
        }

        await trackOutcome({ interventionId, userId, outcome });

        return NextResponse.json({
          success: true,
          message: 'Intervention outcome tracked successfully',
          data: {
            interventionId,
            userId,
            tracked: true
          }
        });

      case 'generate_report':
        if (!timeRange || !timeRange.start || !timeRange.end) {
          return NextResponse.json(
            { error: 'Time range with start and end dates is required' },
            { status: 400 }
          );
        }

        const report = await generateReport({ start: new Date(timeRange.start), end: new Date(timeRange.end) }, filters);

        return NextResponse.json({
          success: true,
          data: {
            report
          }
        });

      case 'analyze_patterns':
        const { userIdForAnalysis, timeWindow } = body;

        const analytics = await analyzePatterns(userIdForAnalysis, timeWindow);

        return NextResponse.json({
          success: true,
          data: {
            analytics
          }
        });

      case 'get_optimization_suggestions':
        const { interventionType, userSegment } = body;

        const suggestions = await getOptimizationSuggestions(interventionType, userSegment);

        return NextResponse.json({
          success: true,
          data: {
            suggestions
          }
        });

      case 'update_aggregation':
        await updateMetricsAggregation();

        return NextResponse.json({
          success: true,
          message: 'Metrics aggregation updated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Intervention effectiveness API error', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const interventionType = searchParams.get('interventionType');
    const userSegment = searchParams.get('userSegment');
    const timeWindow = searchParams.get('timeWindow');

    switch (action) {
      case 'analytics':
        const analytics = await analyzePatterns(userId || undefined, timeWindow ? parseInt(timeWindow) : undefined);

        return NextResponse.json({
          success: true,
          data: {
            analytics
          }
        });

      case 'suggestions':
        const suggestions = await getOptimizationSuggestions(interventionType || undefined, userSegment || undefined);

        return NextResponse.json({
          success: true,
          data: {
            suggestions
          }
        });

      case 'quick_report':
        // Generate a quick report for the last 24 hours
        const quickTimeRange = {
          start: new Date(Date.now() - 86400000), // 24 hours ago
          end: new Date()
        };

        const quickReport = await generateReport(quickTimeRange);

        return NextResponse.json({
          success: true,
          data: {
            report: quickReport
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Intervention effectiveness GET API error', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'force_aggregation':
        await updateMetricsAggregation();

        return NextResponse.json({
          success: true,
          message: 'Forced metrics aggregation completed'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Intervention effectiveness PUT API error', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
