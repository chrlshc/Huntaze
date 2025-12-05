/**
 * AI Insights API
 * 
 * POST /api/ai/insights - Generate automatic insights from metrics
 * POST /api/ai/insights/report - Generate narrative report
 * 
 * Uses Mistral Large for analysis and creative writing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { 
  generateInsights, 
  generateNarrativeReport,
  type MetricsData,
} from '@/lib/ai/insights.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// POST /api/ai/insights
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, metrics, period, includeRecommendations } = body;

    // Validate metrics
    if (!metrics || !isValidMetrics(metrics)) {
      return NextResponse.json(
        { success: false, error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    const creatorId = parseInt(session.user.id);

    // Route to appropriate handler
    if (action === 'report') {
      const result = await generateNarrativeReport({
        creatorId,
        metrics,
        period: period || 'month',
        includeRecommendations: includeRecommendations !== false,
      });

      return NextResponse.json({
        success: true,
        data: result,
        duration: Date.now() - startTime,
      });
    }

    // Default: generate insights
    const result = await generateInsights({
      creatorId,
      metrics,
      period: period || 'month',
    });

    return NextResponse.json({
      success: true,
      data: result,
      duration: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('[AI Insights API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate insights',
      },
      { status: 500 }
    );
  }
}

// ============================================
// Validation
// ============================================

function isValidMetrics(metrics: any): metrics is MetricsData {
  return (
    metrics &&
    typeof metrics.revenue === 'object' &&
    typeof metrics.subscribers === 'object' &&
    typeof metrics.engagement === 'object' &&
    typeof metrics.messages === 'object' &&
    typeof metrics.content === 'object'
  );
}
