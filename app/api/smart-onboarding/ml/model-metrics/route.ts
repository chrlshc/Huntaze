// Smart Onboarding ML Personalization - Model Metrics and Management API

import { NextRequest, NextResponse } from 'next/server';
import { MLPersonalizationEngineImpl } from '@/lib/smart-onboarding/services/mlPersonalizationEngine';
import { smartOnboardingDb } from '@/lib/smart-onboarding/config/database';

const mlEngine = new MLPersonalizationEngineImpl(smartOnboardingDb);

export async function GET(request: NextRequest) {
  try {
    // Get model performance metrics
    const metrics = await mlEngine.getModelMetrics();
    
    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error retrieving model metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve model metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, trainingData }: { 
      action: 'retrain' | 'validate';
      trainingData?: any[];
    } = await request.json();
    
    if (action === 'retrain') {
      if (!Array.isArray(trainingData)) {
        return NextResponse.json(
          { error: 'Training data array is required for retraining' },
          { status: 400 }
        );
      }
      
      // Retrain models with new data
      await mlEngine.retrainModels(trainingData);
      
      // Get updated metrics
      const metrics = await mlEngine.getModelMetrics();
      
      return NextResponse.json({
        success: true,
        action: 'retrain',
        trainingDataSize: trainingData.length,
        metrics,
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'validate') {
      // Validate current models
      const metrics = await mlEngine.getModelMetrics();
      
      const validation = {
        isHealthy: metrics.accuracy > 0.7 && metrics.f1Score > 0.7,
        recommendations: [],
        issues: []
      };
      
      if (metrics.accuracy < 0.7) {
        validation.issues.push('Low accuracy detected');
        validation.recommendations.push('Consider retraining with more data');
      }
      
      if (metrics.f1Score < 0.7) {
        validation.issues.push('Low F1 score detected');
        validation.recommendations.push('Review training data quality');
      }
      
      return NextResponse.json({
        success: true,
        action: 'validate',
        validation,
        metrics,
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "retrain" or "validate"' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error managing models:', error);
    return NextResponse.json(
      { error: 'Failed to manage models' },
      { status: 500 }
    );
  }
}