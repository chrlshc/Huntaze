import { NextRequest, NextResponse } from 'next/server';
import { SuccessPredictionServiceImpl } from '@/lib/smart-onboarding/services/successPredictionService';
import { logger } from '@/lib/utils/logger';

// Initialize service
const successPredictionService = new SuccessPredictionServiceImpl();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, userProfile, behaviorData, currentProgress, outcomeData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'predict_success':
        if (!userProfile || !behaviorData || !currentProgress) {
          return NextResponse.json(
            { error: 'User profile, behavior data, and current progress are required' },
            { status: 400 }
          );
        }

        const prediction = await successPredictionService.predictOnboardingSuccess(
          userId,
          userProfile,
          behaviorData,
          currentProgress
        );

        return NextResponse.json({
          success: true,
          data: {
            prediction
          }
        });

      case 'assess_risk':
        const { predictionResult, contextualFactors } = body;
        
        if (!predictionResult) {
          return NextResponse.json(
            { error: 'Prediction result is required for risk assessment' },
            { status: 400 }
          );
        }

        const riskAssessment = await successPredictionService.assessRisk(
          userId,
          predictionResult,
          contextualFactors || {}
        );

        return NextResponse.json({
          success: true,
          data: {
            riskAssessment
          }
        });

      case 'update_profile':
        if (!outcomeData) {
          return NextResponse.json(
            { error: 'Outcome data is required for profile update' },
            { status: 400 }
          );
        }

        const updatedProfile = await successPredictionService.updateUserSuccessProfile(
          userId,
          outcomeData
        );

        return NextResponse.json({
          success: true,
          data: {
            updatedProfile
          }
        });

      case 'retrain_model':
        const { modelId, trainingData, validationData } = body;
        
        if (!modelId || !trainingData || !validationData) {
          return NextResponse.json(
            { error: 'Model ID, training data, and validation data are required' },
            { status: 400 }
          );
        }

        const retrainedModel = await successPredictionService.retrainModel(
          modelId,
          trainingData,
          validationData
        );

        return NextResponse.json({
          success: true,
          data: {
            retrainedModel
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Success prediction API error', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const modelId = searchParams.get('modelId');

    switch (action) {
      case 'model_metrics':
        if (!modelId) {
          return NextResponse.json(
            { error: 'Model ID is required' },
            { status: 400 }
          );
        }

        const metrics = await successPredictionService.getModelMetrics(modelId);

        return NextResponse.json({
          success: true,
          data: {
            metrics
          }
        });

      case 'user_profile':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // This would typically fetch from the service
        // For now, return a placeholder response
        return NextResponse.json({
          success: true,
          data: {
            message: 'User profile retrieval not yet implemented'
          }
        });

      case 'prediction_history':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // This would fetch prediction history for the user
        return NextResponse.json({
          success: true,
          data: {
            message: 'Prediction history retrieval not yet implemented'
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Success prediction GET API error', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}