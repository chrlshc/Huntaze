import { NextRequest, NextResponse } from 'next/server';
import { mlPipelineFacade } from '../../../../../lib/smart-onboarding/services/mlPipelineFacade';
import { logger } from '../../../../../lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('modelType');

    if (!modelType) {
      return NextResponse.json(
        { error: 'Missing modelType parameter' },
        { status: 400 }
      );
    }

    const endpoints = await mlPipelineFacade.getModelEndpoints(modelType);
    
    return NextResponse.json({ endpoints });

  } catch (error) {
    logger.error('Failed to get model endpoints', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Failed to get model endpoints' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { modelType, trafficSplits } = await request.json();
    
    if (!modelType || !trafficSplits) {
      return NextResponse.json(
        { error: 'Missing required fields: modelType, trafficSplits' },
        { status: 400 }
      );
    }

    // Validate traffic splits sum to 100%
    const totalPercentage = Object.values(trafficSplits).reduce((sum: number, percentage: any) => sum + percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Traffic splits must sum to 100%' },
        { status: 400 }
      );
    }

    await mlPipelineFacade.updateTrafficSplit(modelType, trafficSplits);

    logger.info(`Traffic split updated for ${modelType}`, { trafficSplits });

    return NextResponse.json({
      success: true,
      message: 'Traffic split updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update traffic split', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Failed to update traffic split' },
      { status: 500 }
    );
  }
}