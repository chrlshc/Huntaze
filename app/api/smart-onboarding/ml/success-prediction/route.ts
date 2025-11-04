// Smart Onboarding ML Personalization - Success Prediction API

import { NextRequest, NextResponse } from 'next/server';
import { MLPersonalizationEngineImpl } from '@/lib/smart-onboarding/services/mlPersonalizationEngine';
import { smartOnboardingDb } from '@/lib/smart-onboarding/config/database';

const mlEngine = new MLPersonalizationEngineImpl(smartOnboardingDb);

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
    
    // Predict success probability
    const successPrediction = await mlEngine.predictSuccessProbability(userId);
    
    return NextResponse.json({
      success: true,
      prediction: successPrediction,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error predicting success probability:', error);
    return NextResponse.json(
      { error: 'Failed to predict success probability' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, behaviorData }: { 
      userId: string; 
      behaviorData: any[];
    } = await request.json();
    
    // Validate required fields
    if (!userId || !Array.isArray(behaviorData)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Update user model with new behavior data
    await mlEngine.updateUserModel(userId, behaviorData);
    
    // Get updated success prediction
    const successPrediction = await mlEngine.predictSuccessProbability(userId);
    
    return NextResponse.json({
      success: true,
      prediction: successPrediction,
      behaviorEventsProcessed: behaviorData.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating user model and predicting success:', error);
    return NextResponse.json(
      { error: 'Failed to update user model and predict success' },
      { status: 500 }
    );
  }
}