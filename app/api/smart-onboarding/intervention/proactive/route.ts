import { NextRequest, NextResponse } from 'next/server';
import { getProactiveSuggestions, recordInterventionOutcome } from '@/lib/smart-onboarding/services/interventionEngineFacade';
import { logger } from '@/lib/utils/logger';

// Facade-only route: keep dependencies minimal and type-safe

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start_monitoring':
        return NextResponse.json({
          success: true,
          message: 'Proactive monitoring started',
          userId
        });

      case 'detect_struggle':
        // Minimal heuristic placeholder; real logic can be wired later
        return NextResponse.json({
          success: true,
          data: {
            indicators: [],
            assistanceLevel: 'low',
            recommendedActions: []
          }
        });

      case 'trigger_assistance':
        const { assistanceType, context } = body;
        
        if (!assistanceType) {
          return NextResponse.json(
            { error: 'Assistance type is required' },
            { status: 400 }
          );
        }

        const { interventions, meta } = await getProactiveSuggestions({ userId, context });
        
        return NextResponse.json({
          success: true,
          data: {
            assistanceType,
            recommendedInterventions: interventions,
            meta
          }
        });

      case 'stop_monitoring':
        return NextResponse.json({
          success: true,
          message: 'Proactive monitoring stopped',
          userId
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Proactive assistance API error:', undefined, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Minimal current assistance status (facade-only, no heavy deps)
    const indicators: any[] = [];
    const assistanceLevel = 'none';

    return NextResponse.json({
      success: true,
      data: {
        userId,
        currentIndicators: indicators,
        assistanceLevel,
        monitoringActive: true // Placeholder; track in future implementation
      }
    });
  } catch (error) {
    logger.error('Proactive assistance status API error:', undefined, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, actionId, outcome } = body;

    if (!userId || !actionId || !outcome) {
      return NextResponse.json(
        { error: 'User ID, action ID, and outcome are required' },
        { status: 400 }
      );
    }

    // Track assistance effectiveness
    const response = String(outcome?.userResponse ?? outcome?.status ?? outcome?.action ?? '').toLowerCase();
    const mappedOutcome =
      response === 'completed' ? 'completed' :
      response === 'dismissed' ? 'dismissed' :
      response === 'clicked' ? 'clicked' : 'shown';

    await recordInterventionOutcome({ interventionId: actionId, outcome: mappedOutcome, userId });

    return NextResponse.json({
      success: true,
      message: 'Assistance effectiveness tracked',
      data: {
        userId,
        actionId,
        tracked: true
      }
    });
  } catch (error) {
    logger.error('Assistance effectiveness tracking API error:', undefined, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
