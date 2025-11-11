import { NextRequest, NextResponse } from 'next/server';
import { mlPipelineFacade } from '../../../../../lib/smart-onboarding/services/mlPipelineFacade';
import { PredictionRequest } from '../../../../../lib/smart-onboarding/types';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const predictionRequest: PredictionRequest = await request.json();
    
    // Validate request
    if (!predictionRequest.modelType || !predictionRequest.features) {
      return NextResponse.json(
        { error: 'Missing required fields: modelType, features' },
        { status: 400 }
      );
    }

    // Validate model type
    const validModelTypes = ['persona_classification', 'success_prediction', 'engagement_scoring', 'path_optimization'];
    if (!validModelTypes.includes(predictionRequest.modelType)) {
      return NextResponse.json(
        { error: `Invalid model type. Must be one of: ${validModelTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Make prediction
    const result = await mlPipelineFacade.predict(predictionRequest);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    logger.error('Prediction request failed', { error });
    
    if (error instanceof Error && error.message.includes('No healthy endpoint')) {
      return NextResponse.json(
        { error: 'Model service temporarily unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Prediction failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('modelType');
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Get model statistics
      const stats = await mlPipelineFacade.getModelStats(modelType || undefined);
      return NextResponse.json({ stats });
    }

    if (action === 'warmup') {
      // Warmup models
      const modelTypes = modelType ? [modelType] : ['persona_classification', 'success_prediction', 'engagement_scoring', 'path_optimization'];
      await mlPipelineFacade.warmupModels(modelTypes);
      
      return NextResponse.json({
        success: true,
        message: `Models warmed up: ${modelTypes.join(', ')}`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=stats or ?action=warmup' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Model management request failed', { error });
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}