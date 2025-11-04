// Smart Onboarding ML Personalization - Technical Proficiency Assessment API

import { NextRequest, NextResponse } from 'next/server';
import { MLPersonalizationEngineImpl } from '@/lib/smart-onboarding/services/mlPersonalizationEngine';
import { smartOnboardingDb } from '@/lib/smart-onboarding/config/database';
import { InteractionPattern } from '@/lib/smart-onboarding/types';

const mlEngine = new MLPersonalizationEngineImpl(smartOnboardingDb);

export async function POST(request: NextRequest) {
  try {
    const { interactionPatterns }: { interactionPatterns: InteractionPattern[] } = await request.json();
    
    // Validate required fields
    if (!Array.isArray(interactionPatterns)) {
      return NextResponse.json(
        { error: 'Interaction patterns array is required' },
        { status: 400 }
      );
    }
    
    // Assess technical proficiency
    const proficiencyLevel = await mlEngine.assessTechnicalProficiency(interactionPatterns);
    
    return NextResponse.json({
      success: true,
      proficiencyLevel,
      patternsAnalyzed: interactionPatterns.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error assessing technical proficiency:', error);
    return NextResponse.json(
      { error: 'Failed to assess technical proficiency' },
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
    
    // Get user's interaction patterns from behavior history
    const behaviorHistory = await mlEngine['getUserBehaviorHistory'](userId);
    
    // Extract interaction patterns
    const interactionPatterns = behaviorHistory.map(event => ({
      userId: event.userId,
      stepId: event.stepId,
      clickCount: event.interactionData.clickPatterns?.length || 0,
      errorCount: event.eventType === 'error' ? 1 : 0,
      helpRequests: event.eventType === 'help_requested' ? 1 : 0,
      usedAdvancedFeatures: event.interactionData.advancedFeatureUsed || false,
      timestamp: event.timestamp
    }));
    
    // Assess technical proficiency
    const proficiencyLevel = await mlEngine.assessTechnicalProficiency(interactionPatterns);
    
    return NextResponse.json({
      success: true,
      proficiencyLevel,
      patternsAnalyzed: interactionPatterns.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error assessing technical proficiency:', error);
    return NextResponse.json(
      { error: 'Failed to assess technical proficiency' },
      { status: 500 }
    );
  }
}