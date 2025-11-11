// Smart Onboarding Analytics - Behavioral Insights API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Using getServerSession without explicit authOptions to avoid pulling heavy types
import {
  generateBehavioralInsights,
  detectStruggleIndicators,
  getDashboardData,
  startMonitoring,
  stopMonitoring,
  analyzeEngagementPatterns,
  getEngagementScore,
} from '@/lib/smart-onboarding/services/behavioralAnalyticsFacade';
import { createApiResponse } from '@/lib/smart-onboarding/utils/apiResponse';

// Get behavioral insights for a user
export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession()) as any;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeStruggleAnalysis = searchParams.get('includeStruggle') === 'true';
    const includeDashboard = searchParams.get('includeDashboard') === 'true';

    // Generate behavioral insights
    const insights = await generateBehavioralInsights(userId);

    let struggleMetrics = null;
    if (includeStruggleAnalysis) {
      struggleMetrics = await detectStruggleIndicators(userId);
    }

    let dashboardData = null;
    if (includeDashboard) {
      dashboardData = await getDashboardData(userId);
    }

    return NextResponse.json(
      createApiResponse({
        insights,
        struggleMetrics,
        dashboardData,
        generatedAt: new Date()
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error generating behavioral insights:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Get struggle detection analysis
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession()) as any;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      realTimeAnalysis = true,
      includeRecommendations = true,
      severityThreshold = 'medium' // 'low', 'medium', 'high', 'critical'
    } = body;

    // Detect current struggle indicators
    const struggleMetrics = await detectStruggleIndicators(userId);

    // Filter by severity threshold if specified
    let filteredMetrics = struggleMetrics;
    if (severityThreshold !== 'low') {
      const severityLevels: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
      const threshold = severityLevels[severityThreshold as string] || 1;
      const currentLevel = severityLevels[struggleMetrics.severity as string] || 0;
      
      if (currentLevel < threshold) {
        filteredMetrics = {
          ...struggleMetrics,
          indicators: [],
          patterns: [],
          recommendations: []
        };
      }
    }

    // Get real-time engagement if requested
    let realTimeData = null;
    if (realTimeAnalysis) {
      const engagementScore = await getEngagementScore(userId);
      const recentAnalysis = await analyzeEngagementPatterns(userId, 10); // Last 10 minutes
      
      realTimeData = {
        currentEngagement: engagementScore || 0.5,
        recentTrend: recentAnalysis.trend,
        alertLevel: struggleMetrics.severity
      };
    }

    // Generate intervention suggestions if struggle detected
    let interventionSuggestions: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      estimatedImpact: number;
      implementationComplexity: string;
    }> = [];
    if (struggleMetrics.severity === 'high' || struggleMetrics.severity === 'critical') {
      interventionSuggestions = [
        {
          type: 'immediate_help',
          priority: 'high',
          title: 'Offer Assistance',
          description: 'User appears to be struggling. Offer contextual help or tutorial.',
          estimatedImpact: 0.7,
          implementationComplexity: 'low'
        },
        {
          type: 'content_simplification',
          priority: 'medium',
          title: 'Simplify Content',
          description: 'Break down current step into smaller, more manageable parts.',
          estimatedImpact: 0.5,
          implementationComplexity: 'medium'
        }
      ];

      if (struggleMetrics.indicators.some((i: any) => i.type === 'time_exceeded')) {
        interventionSuggestions.push({
          type: 'time_extension',
          priority: 'medium',
          title: 'Extend Time Limit',
          description: 'Remove or extend time pressure for current task.',
          estimatedImpact: 0.4,
          implementationComplexity: 'low'
        });
      }
    }

    return NextResponse.json(
      createApiResponse({
        struggleAnalysis: filteredMetrics,
        realTimeData,
        interventionSuggestions: includeRecommendations ? interventionSuggestions : undefined,
        analysisTimestamp: new Date(),
        confidence: filteredMetrics.indicators.length > 0 ? 0.8 : 0.3
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error analyzing struggle indicators:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Start/stop monitoring session
export async function PUT(request: NextRequest) {
  try {
    const session = (await getServerSession()) as any;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, sessionId } = body;

    if (!action || !sessionId) {
      return NextResponse.json(
        createApiResponse(null, 'Action and sessionId are required'),
        { status: 400 }
      );
    }

    if (action === 'start') {
      await startMonitoring(userId, sessionId);
      
      return NextResponse.json(
        createApiResponse({
          action: 'started',
          sessionId,
          userId,
          startTime: new Date()
        }),
        { status: 200 }
      );

    } else if (action === 'stop') {
      const sessionSummary = await stopMonitoring(userId, sessionId);
      
      return NextResponse.json(
        createApiResponse({
          action: 'stopped',
          sessionSummary,
          endTime: new Date()
        }),
        { status: 200 }
      );

    } else {
      return NextResponse.json(
        createApiResponse(null, 'Invalid action. Use "start" or "stop"'),
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing monitoring session:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Get dashboard data for analytics overview
export async function PATCH(request: NextRequest) {
  try {
    const session = (await getServerSession()) as any;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      includeAlerts = true,
      includeMetrics = true,
      includeTrends = true,
      timeRange = '1h' // '1h', '6h', '24h', '7d'
    } = body;

    // Get comprehensive dashboard data
    const dashboardData = await getDashboardData(userId);

    // Filter data based on request parameters
    const filteredData = {
      ...(includeMetrics && { realTimeMetrics: dashboardData.realTimeMetrics }),
      ...(includeTrends && { engagementTrends: dashboardData.engagementTrends }),
      ...(includeMetrics && { progressSummary: dashboardData.progressSummary }),
      ...(includeAlerts && { alerts: dashboardData.alerts })
    };

    // Add time range context
    const timeRangeMs: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const rangeStart = new Date(Date.now() - (timeRangeMs[timeRange as string] || timeRangeMs['1h']));
    const rangeEnd = new Date();

    return NextResponse.json(
      createApiResponse({
        dashboard: filteredData,
        timeRange: {
          range: timeRange,
          start: rangeStart,
          end: rangeEnd
        },
        generatedAt: new Date(),
        userId
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}
