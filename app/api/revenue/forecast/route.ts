import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { RevenueForecastResponse } from '@/lib/services/revenue/types';

/**
 * GET /api/revenue/forecast
 * 
 * Get revenue forecast for a creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const months = parseInt(searchParams.get('months') || '12');

    if (!creatorId) {
      return Response.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (isNaN(months) || months < 1 || months > 24) {
      return Response.json(
        { error: 'months must be between 1 and 24' },
        { status: 400 }
      );
    }

    // Verify creator owns this data
    if (session.user.id !== creatorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const correlationId = request.headers.get('X-Correlation-ID');
    console.log('[API] Revenue forecast request:', {
      creatorId,
      months,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual backend service call
    // const forecast = await backendForecastService.getForecast(creatorId, months);

    // Mock data
    const historical = Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() - (6 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
      revenue: 10000 + i * 1500 + Math.random() * 1000,
      growth: 10 + i * 2,
    }));

    const forecast = Array.from({ length: months }, (_, i) => ({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
      predicted: 15000 + i * 1200,
      confidence: {
        min: 13000 + i * 1000,
        max: 17000 + i * 1400,
      },
    }));

    const response: RevenueForecastResponse = {
      historical,
      forecast,
      currentMonth: {
        projected: 15234,
        actual: 12340,
        completion: 81,
        onTrack: false,
      },
      nextMonth: {
        projected: 18500,
        actual: 0,
        completion: 0,
        onTrack: true,
      },
      recommendations: [
        {
          action: 'Add 12 new subscribers',
          impact: 1200,
          effort: 'medium',
          description: 'Focus on Instagram promotion to attract new subscribers',
        },
        {
          action: 'Increase PPV content',
          impact: 800,
          effort: 'low',
          description: 'Post 2-3 exclusive PPV items per week',
        },
      ],
      metadata: {
        modelAccuracy: 0.87,
        lastUpdated: new Date().toISOString(),
      },
    };

    console.log('[API] Revenue forecast sent:', {
      creatorId,
      historicalPoints: response.historical.length,
      forecastPoints: response.forecast.length,
      modelAccuracy: response.metadata.modelAccuracy,
    });

    return Response.json(response);
  } catch (error) {
    console.error('[API] Forecast error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
