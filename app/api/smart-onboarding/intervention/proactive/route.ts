import { NextRequest, NextResponse } from 'next/server';
import { InterventionEngineImpl } from '@/lib/smart-onboarding/services/interventionEngine';
import { ProactiveAssistanceServiceImpl } from '@/lib/smart-onboarding/services/proactiveAssistanceService';
import { BehavioralAnalyticsServiceImpl } from '@/lib/smart-onboarding/services/behavioralAnalyticsService';
import { logger } from '@/lib/utils/logger';

// Initialize services
const behavioralAnalytics = new BehavioralAnalyticsServiceImpl();
const interventionEngine = new InterventionEngineImpl(behavioralAnalytics, null as any);
const proactiveAssistance = new ProactiveAssistanceServiceImpl(behavioralAnalytics, interventionEngine);

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
        await interventionEngine.monitorUserProgress(userId);
        return NextResponse.json({ 
          success: true, 
          message: 'Proactive monitoring started',
          userId 
        });

      case 'detect_struggle':
        const indicators = await proactiveAssistance.detectStruggleIndicators(userId);
        const assistanceLevel = await proactiveAssistance.calculateAssistanceLevel(userId, indicators);
        const actions = await proactiveAssistance.generateProactiveActions(userId, assistanceLevel, indicators);
        
        return NextResponse.json({
          success: true,
          data: {
            indicators,
            assistanceLevel,
            recommendedActions: actions
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

        const helpContent = await interventionEngine.provideContextualHelp(userId, context);
        
        return NextResponse.json({
          success: true,
          data: {
            helpContent,
            assistanceType
          }
        });

      case 'stop_monitoring':
        await interventionEngine.stopMonitoring(userId);
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
    logger.error('Proactive assistance API error:', error);
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

    // Get current assistance status
    const indicators = await proactiveAssistance.detectStruggleIndicators(userId);
    const assistanceLevel = await proactiveAssistance.calculateAssistanceLevel(userId, indicators);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        currentIndicators: indicators,
        assistanceLevel,
        monitoringActive: true // This would be tracked in a real implementation
      }
    });
  } catch (error) {
    logger.error('Proactive assistance status API error:', error);
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
    const action = { id: actionId, type: outcome.actionType }; // This would be retrieved from storage
    await proactiveAssistance.trackAssistanceEffectiveness(userId, action as any, outcome);

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
    logger.error('Assistance effectiveness tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}