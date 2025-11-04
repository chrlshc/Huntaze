// Smart Onboarding Orchestrator - Journey Management API

import { NextRequest, NextResponse } from 'next/server';
import { SmartOnboardingOrchestratorImpl } from '@/lib/smart-onboarding/services/smartOnboardingOrchestrator';
import { UserProfile, StepResult, BehaviorEvent } from '@/lib/smart-onboarding/types';

const orchestrator = new SmartOnboardingOrchestratorImpl();

export async function POST(request: NextRequest) {
  try {
    const { action, userId, profileData, stepResult, behaviorData } = await request.json();
    
    switch (action) {
      case 'start':
        if (!userId || !profileData) {
          return NextResponse.json(
            { error: 'Missing userId or profileData for journey start' },
            { status: 400 }
          );
        }
        
        const journey = await orchestrator.startOnboardingJourney(userId, profileData as UserProfile);
        
        return NextResponse.json({
          success: true,
          journey,
          message: 'Onboarding journey started successfully'
        });
        
      case 'complete_step':
        if (!userId || !stepResult) {
          return NextResponse.json(
            { error: 'Missing userId or stepResult for step completion' },
            { status: 400 }
          );
        }
        
        // Get journey ID from step result or find active journey
        const journeyId = stepResult.journeyId || await findActiveJourney(userId);
        if (!journeyId) {
          return NextResponse.json(
            { error: 'No active journey found for user' },
            { status: 404 }
          );
        }
        
        const updatedJourney = await orchestrator.processStepCompletion(
          journeyId,
          stepResult as StepResult,
          behaviorData as BehaviorEvent[] || []
        );
        
        return NextResponse.json({
          success: true,
          journey: updatedJourney,
          message: 'Step completed and journey updated'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "start" or "complete_step"' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in journey management:', error);
    return NextResponse.json(
      { error: 'Failed to manage journey', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('journeyId');
    const userId = searchParams.get('userId');
    
    if (journeyId) {
      // Get specific journey
      const journey = await orchestrator.getJourneyStatus(journeyId);
      
      return NextResponse.json({
        success: true,
        journey,
        timestamp: new Date().toISOString()
      });
      
    } else if (userId) {
      // Find active journey for user
      const activeJourneyId = await findActiveJourney(userId);
      
      if (!activeJourneyId) {
        return NextResponse.json({
          success: true,
          journey: null,
          message: 'No active journey found for user'
        });
      }
      
      const journey = await orchestrator.getJourneyStatus(activeJourneyId);
      
      return NextResponse.json({
        success: true,
        journey,
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json(
        { error: 'Either journeyId or userId is required' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error getting journey status:', error);
    return NextResponse.json(
      { error: 'Failed to get journey status' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { journeyId, action } = await request.json();
    
    if (!journeyId || !action) {
      return NextResponse.json(
        { error: 'Missing journeyId or action' },
        { status: 400 }
      );
    }
    
    let updatedJourney;
    
    switch (action) {
      case 'pause':
        updatedJourney = await orchestrator.pauseJourney(journeyId);
        break;
        
      case 'resume':
        updatedJourney = await orchestrator.resumeJourney(journeyId);
        break;
        
      case 'complete':
        updatedJourney = await orchestrator.completeJourney(journeyId);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "pause", "resume", or "complete"' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      journey: updatedJourney,
      message: `Journey ${action}d successfully`
    });
    
  } catch (error) {
    console.error('Error updating journey:', error);
    return NextResponse.json(
      { error: 'Failed to update journey' },
      { status: 500 }
    );
  }
}

// Helper function to find active journey for a user
async function findActiveJourney(userId: string): Promise<string | null> {
  try {
    const { smartOnboardingDb } = await import('@/lib/smart-onboarding/config/database');
    
    const query = `
      SELECT id FROM smart_onboarding_journeys 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY metadata->>'startedAt' DESC
      LIMIT 1
    `;
    
    const result = await smartOnboardingDb.query(query, [userId]);
    return result.rows.length > 0 ? result.rows[0].id : null;
    
  } catch (error) {
    console.error('Error finding active journey:', error);
    return null;
  }
}