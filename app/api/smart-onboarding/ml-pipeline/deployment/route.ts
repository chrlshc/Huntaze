import { NextRequest, NextResponse } from 'next/server';
import { modelDeploymentService, DeploymentStrategy } from '../../../../../lib/smart-onboarding/services/modelDeploymentService';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { modelType, modelVersion, strategy } = await request.json();
    
    // Validate required fields
    if (!modelType || !modelVersion) {
      return NextResponse.json(
        { error: 'Missing required fields: modelType, modelVersion' },
        { status: 400 }
      );
    }

    // Validate deployment strategy
    const validStrategies = ['blue_green', 'canary', 'rolling', 'immediate'];
    if (strategy && !validStrategies.includes(strategy.type)) {
      return NextResponse.json(
        { error: `Invalid deployment strategy. Must be one of: ${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

    // Set default strategy if not provided
    const deploymentStrategy: DeploymentStrategy = strategy || {
      type: 'canary',
      rolloutPercentage: 10,
      rolloutDuration: 300000, // 5 minutes
      healthCheckInterval: 30000, // 30 seconds
      rollbackThreshold: 5 // 5% error rate
    };

    // Start deployment
    const deploymentId = await modelDeploymentService.deployModel(
      modelType,
      modelVersion,
      deploymentStrategy
    );

    logger.info(`Model deployment started: ${deploymentId}`, { 
      modelType, 
      modelVersion, 
      strategy: deploymentStrategy 
    });

    return NextResponse.json({
      success: true,
      deploymentId,
      message: 'Model deployment started successfully'
    });

  } catch (error) {
    logger.error('Failed to start model deployment', { error });
    return NextResponse.json(
      { error: 'Failed to start model deployment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');
    const modelType = searchParams.get('modelType');
    const active = searchParams.get('active') === 'true';

    if (deploymentId) {
      // Get specific deployment status
      const deployment = await modelDeploymentService.getDeploymentStatus(deploymentId);
      if (!deployment) {
        return NextResponse.json(
          { error: 'Deployment not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ deployment });
    }

    if (active) {
      // Get active deployments
      const activeDeployments = await modelDeploymentService.getActiveDeployments();
      return NextResponse.json({ deployments: activeDeployments });
    }

    // Get deployment history
    const history = await modelDeploymentService.getDeploymentHistory(modelType || undefined);
    
    return NextResponse.json({ deployments: history });

  } catch (error) {
    logger.error('Failed to get deployment status', { error });
    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing deploymentId parameter' },
        { status: 400 }
      );
    }

    const rolledBack = await modelDeploymentService.rollbackDeployment(deploymentId);
    
    if (!rolledBack) {
      return NextResponse.json(
        { error: 'Deployment not found or cannot be rolled back' },
        { status: 404 }
      );
    }

    logger.info(`Deployment rolled back: ${deploymentId}`);

    return NextResponse.json({
      success: true,
      message: 'Deployment rolled back successfully'
    });

  } catch (error) {
    logger.error('Failed to rollback deployment', { error });
    return NextResponse.json(
      { error: 'Failed to rollback deployment' },
      { status: 500 }
    );
  }
}