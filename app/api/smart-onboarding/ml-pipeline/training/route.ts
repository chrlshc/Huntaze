import { NextRequest, NextResponse } from 'next/server';
import { mlPipelineFacade } from '../../../../../lib/smart-onboarding/services/mlPipelineFacade';
import { TrainingPipelineConfig } from '../../../../../lib/smart-onboarding/services/mlTrainingPipeline';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const config: TrainingPipelineConfig = await request.json();
    
    // Validate training configuration
    if (!config.modelType || !config.trainingDataQuery) {
      return NextResponse.json(
        { error: 'Missing required fields: modelType, trainingDataQuery' },
        { status: 400 }
      );
    }

    // Validate model type
    const validModelTypes = ['persona_classification', 'success_prediction', 'engagement_scoring', 'path_optimization'];
    if (!validModelTypes.includes(config.modelType)) {
      return NextResponse.json(
        { error: `Invalid model type. Must be one of: ${validModelTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Set defaults for optional fields
    const trainingConfig: TrainingPipelineConfig = {
      ...config,
      validationSplit: config.validationSplit ?? 0.2,
      evaluationMetrics: config.evaluationMetrics ?? ['accuracy', 'precision', 'recall', 'f1Score'],
      retrainingThreshold: config.retrainingThreshold ?? 0.05,
      maxTrainingTime: config.maxTrainingTime ?? 3600000 // 1 hour
    };

    // Schedule training job
    const jobId = await mlPipelineFacade.scheduleTraining(trainingConfig);

    logger.info(`Training job scheduled: ${jobId}`, { config: trainingConfig });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Training job scheduled successfully'
    });

  } catch (error) {
    logger.error('Failed to schedule training job', { error });
    return NextResponse.json(
      { error: 'Failed to schedule training job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const modelType = searchParams.get('modelType');

    if (jobId) {
      // Get specific job status
      const job = await mlPipelineFacade.getTrainingStatus(jobId);
      if (!job) {
        return NextResponse.json(
          { error: 'Training job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ job });
    }

    // Get training history
    const history = await mlPipelineFacade.getTrainingHistory(modelType || undefined);
    const queueStatus = await mlPipelineFacade.getQueueStatus();

    return NextResponse.json({
      history,
      queueStatus
    });

  } catch (error) {
    logger.error('Failed to get training status', { error });
    return NextResponse.json(
      { error: 'Failed to get training status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    const cancelled = await mlPipelineFacade.cancelTraining(jobId);
    
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Training job not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Training job cancelled successfully'
    });

  } catch (error) {
    logger.error('Failed to cancel training job', { error });
    return NextResponse.json(
      { error: 'Failed to cancel training job' },
      { status: 500 }
    );
  }
}