/**
 * Deployment Status API
 * Provides comprehensive deployment system monitoring and control
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const includeMetrics = searchParams.get('metrics') === 'true';
    const serviceName = searchParams.get('service');

    // Import deployment controllers
    const [
      { canaryController },
      { blueGreenController },
      { errorBudgetGate }
    ] = await Promise.all([
      import('@/lib/deployments/canaryController'),
      import('@/lib/deployments/blueGreenController'),
      import('@/lib/deployments/errorBudgetGate')
    ]);

    // Gather deployment system status
    const canaryDeployments = serviceName 
      ? canaryController.getAllDeployments().filter(d => d.config.serviceName === serviceName)
      : canaryController.getAllDeployments();
    
    const blueGreenDeployments = serviceName
      ? blueGreenController.getAllDeployments().filter(d => d.config.serviceName === serviceName)
      : blueGreenController.getAllDeployments();
    
    const errorBudgetStatuses = serviceName
      ? [errorBudgetGate.getErrorBudgetStatus(serviceName)].filter(Boolean)
      : errorBudgetGate.getAllErrorBudgetStatuses();

    const response: any = {
      timestamp: Date.now(),
      status: 'operational',
      deployments: {
        canary: {
          total: canaryDeployments.length,
          active: canaryController.getActiveDeployments().length,
          deployments: includeHistory ? canaryDeployments : canaryController.getActiveDeployments(),
          summary: {
            preparing: canaryDeployments.filter(d => d.stage === 'PREPARING').length,
            inProgress: canaryDeployments.filter(d => ['STAGE_5', 'STAGE_25', 'STAGE_50', 'STAGE_100'].includes(d.stage)).length,
            completed: canaryDeployments.filter(d => d.stage === 'COMPLETED').length,
            failed: canaryDeployments.filter(d => d.stage === 'FAILED').length,
            rolledBack: canaryDeployments.filter(d => d.stage === 'ROLLED_BACK').length
          }
        },
        blueGreen: {
          total: blueGreenDeployments.length,
          active: blueGreenController.getActiveDeployments().length,
          deployments: includeHistory ? blueGreenDeployments : blueGreenController.getActiveDeployments(),
          summary: {
            preparing: blueGreenDeployments.filter(d => d.stage === 'PREPARING').length,
            deploying: blueGreenDeployments.filter(d => d.stage === 'DEPLOYING_GREEN').length,
            validating: blueGreenDeployments.filter(d => d.stage === 'VALIDATING_GREEN').length,
            switching: blueGreenDeployments.filter(d => d.stage === 'SWITCHING_TRAFFIC').length,
            monitoring: blueGreenDeployments.filter(d => d.stage === 'MONITORING').length,
            completed: blueGreenDeployments.filter(d => d.stage === 'COMPLETED').length,
            failed: blueGreenDeployments.filter(d => d.stage === 'FAILED').length,
            rolledBack: blueGreenDeployments.filter(d => d.stage === 'ROLLED_BACK').length
          }
        },
        errorBudget: {
          services: errorBudgetStatuses.length,
          statuses: errorBudgetStatuses,
          summary: {
            healthy: errorBudgetStatuses.filter(s => s?.status === 'HEALTHY').length,
            warning: errorBudgetStatuses.filter(s => s?.status === 'WARNING').length,
            critical: errorBudgetStatuses.filter(s => s?.status === 'CRITICAL').length,
            frozen: errorBudgetStatuses.filter(s => s?.status === 'FROZEN').length
          }
        }
      }
    };

    // Add detailed metrics if requested
    if (includeMetrics) {
      response.metrics = {
        canary: {
          averageDeploymentTime: calculateAverageDeploymentTime(canaryDeployments),
          successRate: calculateSuccessRate(canaryDeployments),
          rollbackRate: calculateRollbackRate(canaryDeployments),
          averageRollbackTime: calculateAverageRollbackTime(canaryDeployments)
        },
        blueGreen: {
          averageDeploymentTime: calculateAverageDeploymentTime(blueGreenDeployments),
          successRate: calculateSuccessRate(blueGreenDeployments),
          rollbackRate: calculateRollbackRate(blueGreenDeployments),
          averageSwitchTime: calculateAverageSwitchTime(blueGreenDeployments)
        },
        errorBudget: {
          averageBudgetRemaining: errorBudgetStatuses.reduce((sum, s) => sum + (s?.errorBudget || 0), 0) / Math.max(1, errorBudgetStatuses.length),
          servicesAtRisk: errorBudgetStatuses.filter(s => s && s.errorBudget < 0.25).length,
          deploymentsBlocked: errorBudgetStatuses.filter(s => s && !s.deploymentAllowed).length
        }
      };
    }

    // Determine overall system status
    const hasFailedDeployments = [...canaryDeployments, ...blueGreenDeployments]
      .some(d => d.stage === 'FAILED' && (Date.now() - d.startTime) < 3600000); // Failed in last hour
    
    const hasFrozenServices = errorBudgetStatuses.some(s => s?.status === 'FROZEN');
    const hasCriticalServices = errorBudgetStatuses.some(s => s?.status === 'CRITICAL');

    if (hasFailedDeployments || hasFrozenServices) {
      response.status = 'critical';
    } else if (hasCriticalServices) {
      response.status = 'degraded';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Deployment status API error:', error);
    
    return NextResponse.json(
      {
        timestamp: Date.now(),
        status: 'error',
        error: 'Failed to retrieve deployment system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, deploymentId, serviceName, deploymentType, reason } = body;

    switch (action) {
      case 'start_canary':
        const { canaryController, defaultCanaryConfig } = await import('@/lib/deployments/canaryController');
        const canaryConfig = { ...defaultCanaryConfig, ...body.config };
        const canaryId = await canaryController.startCanaryDeployment(canaryConfig);
        
        return NextResponse.json({
          success: true,
          action: 'start_canary',
          deploymentId: canaryId,
          config: canaryConfig
        });

      case 'start_blue_green':
        const { blueGreenController, defaultBlueGreenConfig } = await import('@/lib/deployments/blueGreenController');
        const blueGreenConfig = { ...defaultBlueGreenConfig, ...body.config };
        const blueGreenId = await blueGreenController.startBlueGreenDeployment(blueGreenConfig);
        
        return NextResponse.json({
          success: true,
          action: 'start_blue_green',
          deploymentId: blueGreenId,
          config: blueGreenConfig
        });

      case 'check_error_budget':
        const { errorBudgetGate } = await import('@/lib/deployments/errorBudgetGate');
        if (!serviceName) {
          return NextResponse.json({ error: 'Service name required' }, { status: 400 });
        }
        
        const gateResult = await errorBudgetGate.checkDeploymentGate(serviceName, deploymentType);
        
        return NextResponse.json({
          success: true,
          action: 'check_error_budget',
          serviceName,
          result: gateResult
        });

      case 'rollback_canary':
        const { canaryController: canaryCtrl } = await import('@/lib/deployments/canaryController');
        if (!deploymentId) {
          return NextResponse.json({ error: 'Deployment ID required' }, { status: 400 });
        }
        
        await canaryCtrl.manualRollback(deploymentId, reason || 'Manual rollback');
        
        return NextResponse.json({
          success: true,
          action: 'rollback_canary',
          deploymentId,
          reason
        });

      case 'rollback_blue_green':
        const { blueGreenController: blueGreenCtrl } = await import('@/lib/deployments/blueGreenController');
        if (!deploymentId) {
          return NextResponse.json({ error: 'Deployment ID required' }, { status: 400 });
        }
        
        await blueGreenCtrl.manualRollback(deploymentId, reason || 'Manual rollback');
        
        return NextResponse.json({
          success: true,
          action: 'rollback_blue_green',
          deploymentId,
          reason
        });

      case 'promote_canary':
        const { canaryController: canaryPromoteCtrl } = await import('@/lib/deployments/canaryController');
        if (!deploymentId) {
          return NextResponse.json({ error: 'Deployment ID required' }, { status: 400 });
        }
        
        await canaryPromoteCtrl.manualPromote(deploymentId);
        
        return NextResponse.json({
          success: true,
          action: 'promote_canary',
          deploymentId
        });

      case 'switch_blue_green':
        const { blueGreenController: blueGreenSwitchCtrl } = await import('@/lib/deployments/blueGreenController');
        if (!deploymentId) {
          return NextResponse.json({ error: 'Deployment ID required' }, { status: 400 });
        }
        
        await blueGreenSwitchCtrl.manualSwitch(deploymentId);
        
        return NextResponse.json({
          success: true,
          action: 'switch_blue_green',
          deploymentId
        });

      case 'force_unfreeze_service':
        const { errorBudgetGate: budgetGate } = await import('@/lib/deployments/errorBudgetGate');
        if (!serviceName) {
          return NextResponse.json({ error: 'Service name required' }, { status: 400 });
        }
        
        await budgetGate.forceUnfreeze(serviceName, reason || 'Manual unfreeze');
        
        return NextResponse.json({
          success: true,
          action: 'force_unfreeze_service',
          serviceName,
          reason
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Deployment action API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute deployment action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions for metrics calculation
function calculateAverageDeploymentTime(deployments: any[]): number {
  const completedDeployments = deployments.filter(d => d.completedAt);
  if (completedDeployments.length === 0) return 0;
  
  const totalTime = completedDeployments.reduce((sum, d) => sum + (d.completedAt - d.startTime), 0);
  return totalTime / completedDeployments.length;
}

function calculateSuccessRate(deployments: any[]): number {
  const finishedDeployments = deployments.filter(d => 
    ['COMPLETED', 'FAILED', 'ROLLED_BACK'].includes(d.stage)
  );
  
  if (finishedDeployments.length === 0) return 100;
  
  const successfulDeployments = finishedDeployments.filter(d => d.stage === 'COMPLETED');
  return (successfulDeployments.length / finishedDeployments.length) * 100;
}

function calculateRollbackRate(deployments: any[]): number {
  const finishedDeployments = deployments.filter(d => 
    ['COMPLETED', 'FAILED', 'ROLLED_BACK'].includes(d.stage)
  );
  
  if (finishedDeployments.length === 0) return 0;
  
  const rolledBackDeployments = finishedDeployments.filter(d => 
    ['FAILED', 'ROLLED_BACK'].includes(d.stage)
  );
  return (rolledBackDeployments.length / finishedDeployments.length) * 100;
}

function calculateAverageRollbackTime(deployments: any[]): number {
  const rolledBackDeployments = deployments.filter(d => 
    ['ROLLED_BACK'].includes(d.stage) && d.completedAt
  );
  
  if (rolledBackDeployments.length === 0) return 0;
  
  // Estimate rollback time as time from last stage start to completion
  const totalRollbackTime = rolledBackDeployments.reduce((sum, d) => {
    const rollbackTime = d.completedAt - d.currentStageStartTime;
    return sum + rollbackTime;
  }, 0);
  
  return totalRollbackTime / rolledBackDeployments.length;
}

function calculateAverageSwitchTime(deployments: any[]): number {
  const switchedDeployments = deployments.filter(d => d.switchTime);
  if (switchedDeployments.length === 0) return 0;
  
  // For blue-green, switch time is typically very fast (< 1 second)
  // This would be measured from actual switch operations
  return 500; // Simulated 500ms average switch time
}