// Smart Onboarding Orchestrator - Real-time Adaptation API

import { NextRequest, NextResponse } from 'next/server';
import { SmartOnboardingOrchestratorImpl } from '@/lib/smart-onboarding/services/smartOnboardingOrchestrator';
import { InterventionTrigger, BehaviorEvent } from '@/lib/smart-onboarding/types';

const orchestrator = new SmartOnboardingOrchestratorImpl();

export async function POST(request: NextRequest) {
  try {
    const { journeyId, trigger, behaviorData } = await request.json();
    
    // Validate required fields
    if (!journeyId || !trigger) {
      return NextResponse.json(
        { error: 'Missing journeyId or trigger' },
        { status: 400 }
      );
    }
    
    // Validate trigger format
    if (!trigger.type || !trigger.threshold) {
      return NextResponse.json(
        { error: 'Invalid trigger format. Must include type and threshold' },
        { status: 400 }
      );
    }
    
    // Apply real-time adaptation
    const adaptedJourney = await orchestrator.adaptJourneyInRealTime(
      journeyId,
      trigger as InterventionTrigger,
      behaviorData as BehaviorEvent[] || []
    );
    
    return NextResponse.json({
      success: true,
      journey: adaptedJourney,
      adaptation: {
        trigger: trigger.type,
        appliedAt: new Date().toISOString(),
        reason: trigger.reason || 'Real-time intervention triggered'
      },
      message: 'Journey adapted successfully'
    });
    
  } catch (error) {
    console.error('Error adapting journey:', error);
    return NextResponse.json(
      { error: 'Failed to adapt journey', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('journeyId');
    
    if (!journeyId) {
      return NextResponse.json(
        { error: 'journeyId is required' },
        { status: 400 }
      );
    }
    
    // Get journey with adaptation history
    const journey = await orchestrator.getJourneyStatus(journeyId);
    
    // Extract adaptation history directly from journey
    const adaptationHistory = journey.adaptationHistory || [];
    const interventionHistory = journey.interventions || [];
    
    return NextResponse.json({
      success: true,
      journeyId,
      adaptationHistory,
      interventionHistory,
      totalAdaptations: adaptationHistory.length,
      totalInterventions: interventionHistory.length,
      lastAdaptation: adaptationHistory[adaptationHistory.length - 1] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting adaptation history:', error);
    return NextResponse.json(
      { error: 'Failed to get adaptation history' },
      { status: 500 }
    );
  }
}