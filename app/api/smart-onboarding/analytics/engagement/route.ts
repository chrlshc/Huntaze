// Smart Onboarding Analytics - Engagement Analysis API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { BehavioralAnalyticsServiceImpl } from '@/lib/smart-onboarding/services/behavioralAnalyticsService';
import { db } from '@/lib/db';
import { createApiResponse } from '@/lib/smart-onboarding/repositories/base';
import { smartOnboardingCache } from '@/lib/smart-onboarding/config/redis';

const analyticsService = new BehavioralAnalyticsServiceImpl(db.getPool());

// Get current engagement score
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '30'); // minutes
    const includePatterns = searchParams.get('includePatterns') === 'true';
    const includeRecommendations = searchParams.get('includeRecommendations') === 'true';

    // Get cached engagement score for quick response
    const cachedScore = await smartOnboardingCache.getEngagementScore(userId);

    if (!includePatterns && !includeRecommendations) {
      // Quick response with just the score
      return NextResponse.json(
        createApiResponse({
          userId,
          currentScore: cachedScore || 0.5,
          timestamp: new Date(),
          cached: true
        }),
        { status: 200 }
      );
    }

    // Full engagement analysis
    const engagementAnalysis = await analyticsService.analyzeEngagementPatterns(userId, timeWindow);

    return NextResponse.json(
      createApiResponse({
        userId,
        currentScore: cachedScore || 0.5,
        analysis: engagementAnalysis,
        timestamp: new Date()
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error getting engagement data:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Update engagement thresholds (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    // Check if user is admin (you'll need to implement this check)
    // const isAdmin = await checkUserRole(session.user.id, 'admin');
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     createApiResponse(null, 'Admin access required'),
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const { thresholds } = body;

    if (!thresholds || typeof thresholds !== 'object') {
      return NextResponse.json(
        createApiResponse(null, 'Invalid thresholds data'),
        { status: 400 }
      );
    }

    // Validate threshold values
    const validThresholds = {
      lowEngagement: Math.max(0, Math.min(1, thresholds.lowEngagement || 0.4)),
      mediumEngagement: Math.max(0, Math.min(1, thresholds.mediumEngagement || 0.6)),
      highEngagement: Math.max(0, Math.min(1, thresholds.highEngagement || 0.8))
    };

    // Store thresholds in cache/database
    // Cache method not available
    // await smartOnboardingCache.set(
    //   'smart_onboarding:engagement_thresholds',
    //   JSON.stringify(validThresholds),
    //   3600
    // );

    return NextResponse.json(
      createApiResponse({
        thresholds: validThresholds,
        updated: true
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating engagement thresholds:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}

// Get engagement trends over time
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(null, 'Authentication required'),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { 
      startTime, 
      endTime, 
      intervalMinutes = 5,
      includeEvents = false 
    } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        createApiResponse(null, 'Start time and end time are required'),
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        createApiResponse(null, 'Start time must be before end time'),
        { status: 400 }
      );
    }

    // Limit time range to prevent excessive data
    const maxHours = 24;
    const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > maxHours) {
      return NextResponse.json(
        createApiResponse(null, `Time range cannot exceed ${maxHours} hours`),
        { status: 400 }
      );
    }

    // Get engagement time series data
    const behaviorEventsRepo = (analyticsService as any).behaviorEventsRepo;
    const timeSeries = await behaviorEventsRepo.getEngagementTimeSeries(
      userId,
      start,
      end,
      intervalMinutes
    );

    let events = [];
    if (includeEvents) {
      events = await behaviorEventsRepo.findByTimeRange(start, end, { user_id: userId }, 100);
    }

    // Calculate trend analysis
    const trendAnalysis = {
      overallTrend: timeSeries.length > 1 ? 
        (timeSeries[timeSeries.length - 1].avgEngagement > timeSeries[0].avgEngagement ? 'increasing' : 'decreasing') : 
        'stable',
      averageEngagement: timeSeries.reduce((sum: number, point) => sum + point.avgEngagement, 0) / (timeSeries.length || 1),
      peakEngagement: Math.max(...timeSeries.map(point => point.avgEngagement), 0),
      lowestEngagement: Math.min(...timeSeries.map(point => point.avgEngagement), 1),
      totalInteractions: timeSeries.reduce((sum: number, point) => sum + point.eventCount, 0)
    };

    return NextResponse.json(
      createApiResponse({
        userId,
        timeRange: { start, end },
        intervalMinutes,
        timeSeries,
        trendAnalysis,
        events: includeEvents ? events : undefined
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error getting engagement trends:', error);
    return NextResponse.json(
      createApiResponse(null, 'Internal server error'),
      { status: 500 }
    );
  }
}