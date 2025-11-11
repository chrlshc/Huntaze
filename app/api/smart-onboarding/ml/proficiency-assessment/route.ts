// Smart Onboarding ML Personalization - Technical Proficiency Assessment API

import { NextRequest, NextResponse } from 'next/server';
import { assessTechnicalProficiency } from '@/lib/smart-onboarding/services/mlPersonalizationFacade';

export async function POST(request: NextRequest) {
  try {
    const { interactionPatterns }: { interactionPatterns: any[] } = await request.json();
    
    // Validate required fields
    if (!Array.isArray(interactionPatterns)) {
      return NextResponse.json(
        { error: 'Interaction patterns array is required' },
        { status: 400 }
      );
    }
    
    // Assess technical proficiency
    const proficiencyLevel = await assessTechnicalProficiency(interactionPatterns);
    
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
    const behaviorHistory: any[] = [];
    
    // Extract interaction patterns conforming to InteractionPattern type
    const interactionPatterns: any[] = behaviorHistory.map((event: any) => ({
      type: 'engagement_pattern' as const,
      frequency: event.interactionData?.clickPatterns?.length || 0,
      confidence: 0.8,
      indicators: [
        `clicks: ${event.interactionData?.clickPatterns?.length || 0}`,
        `errors: ${(event.eventType as string) === 'error' ? 1 : 0}`,
        `help_requests: ${(event.eventType as string) === 'help_requested' ? 1 : 0}`,
        `advanced_features: ${event.interactionData?.advancedFeatureUsed || false}`
      ],
      timeWindow: {
        start: new Date(event.timestamp),
        end: new Date(event.timestamp)
      },
      significance: ((event.eventType as string) === 'error' || (event.eventType as string) === 'help_requested') ? 'high' as const : 'medium' as const
    }));
    
    // Assess technical proficiency
    const proficiencyLevel = await assessTechnicalProficiency(interactionPatterns);
    
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
