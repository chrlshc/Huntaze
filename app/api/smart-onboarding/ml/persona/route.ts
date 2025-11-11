// Smart Onboarding ML Personalization - User Persona Analysis API

import { NextRequest, NextResponse } from 'next/server';
import { analyzeUserProfile } from '@/lib/smart-onboarding/services/mlPersonalizationFacade';
type UserProfile = Record<string, unknown> & { id?: string; technicalProficiency?: string };

export async function POST(request: NextRequest) {
  try {
    const profileData: UserProfile = await request.json();
    
    // Validate required fields
    if (!profileData.id || !profileData.technicalProficiency) {
      return NextResponse.json(
        { error: 'Missing required profile data' },
        { status: 400 }
      );
    }
    
    // Analyze user profile and generate persona
    const persona = await analyzeUserProfile(profileData);
    
    return NextResponse.json({
      success: true,
      persona,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing user profile:', error);
    return NextResponse.json(
      { error: 'Failed to analyze user profile' },
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
    
    // Placeholder: no cache lookup in façade mode
    const persona = null;
    
    return NextResponse.json({
      success: true,
      persona,
      cached: !!persona,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error retrieving user persona:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user persona' },
      { status: 500 }
    );
  }
}
