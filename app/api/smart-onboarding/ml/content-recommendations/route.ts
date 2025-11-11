// Smart Onboarding ML Personalization - Content Recommendations API

import { NextRequest, NextResponse } from 'next/server';
import { generateContentRecommendations } from '@/lib/smart-onboarding/services/mlPersonalizationFacade';

export async function POST(request: NextRequest) {
  try {
    const { userId, contentType, stepId }: { 
      userId: string; 
      contentType: string;
      stepId?: string;
    } = await request.json();
    
    // Validate required fields
    if (!userId || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Generate content recommendations
    const recommendations = await generateContentRecommendations(userId, contentType);
    
    return NextResponse.json({
      success: true,
      recommendations,
      stepId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating content recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate content recommendations' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contentType = searchParams.get('contentType') || 'all';
    const stepId = searchParams.get('stepId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Generate content recommendations
    const recommendations = await generateContentRecommendations(userId, contentType);
    
    return NextResponse.json({
      success: true,
      recommendations,
      stepId,
      contentType,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating content recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate content recommendations' },
      { status: 500 }
    );
  }
}
