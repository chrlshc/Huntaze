// Smart Onboarding ML Personalization - Learning Path Prediction API

import { NextRequest, NextResponse } from 'next/server';
import { MLPersonalizationEngineImpl } from '@/lib/smart-onboarding/services/mlPersonalizationEngine';
import { smartOnboardingDb } from '@/lib/smart-onboarding/config/database';
import { OnboardingContext } from '@/lib/smart-onboarding/interfaces/services';

const mlEngine = new MLPersonalizationEngineImpl(smartOnboardingDb);

export async function POST(request: NextRequest) {
  try {
    const { userId, context }: { userId: string; context: OnboardingContext } = await request.json();
    
    // Validate required fields
    if (!userId || !context) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Predict optimal learning path
    const learningPath = await mlEngine.predictOptimalPath(userId, context);
    
    return NextResponse.json({
      success: true,
      learningPath,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error predicting learning path:', error);
    return NextResponse.json(
      { error: 'Failed to predict learning path' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');
    
    if (!pathId) {
      return NextResponse.json(
        { error: 'Path ID is required' },
        { status: 400 }
      );
    }
    
    // Get cached learning path
    const { smartOnboardingCache } = await import('@/lib/smart-onboarding/config/redis');
    const learningPath = await smartOnboardingCache.getLearningPath(pathId);
    
    if (!learningPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      learningPath,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error retrieving learning path:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve learning path' },
      { status: 500 }
    );
  }
}