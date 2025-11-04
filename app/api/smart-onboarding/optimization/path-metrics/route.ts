// Smart Onboarding - Path Effectiveness Metrics API

import { NextRequest, NextResponse } from 'next/server';
import { DynamicPathOptimizerImpl } from '@/lib/smart-onboarding/services/dynamicPathOptimizer';
import { PersonaType, UserPersona } from '@/lib/smart-onboarding/types';

const optimizer = new DynamicPathOptimizerImpl();

export async function POST(request: NextRequest) {
  try {
    const { pathId, userId, persona, journey } = await request.json();
    
    // Validate required fields
    if (!pathId || !userId || !persona || !journey) {
      return NextResponse.json(
        { error: 'Missing required fields: pathId, userId, persona, journey' },
        { status: 400 }
      );
    }
    
    // Track path effectiveness
    await optimizer.trackPathEffectiveness(
      pathId,
      userId,
      persona as UserPersona,
      journey
    );
    
    return NextResponse.json({
      success: true,
      message: 'Path effectiveness tracked successfully',
      pathId,
      userId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error tracking path effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to track path effectiveness', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');
    const personaType = searchParams.get('personaType') as PersonaType;
    const action = searchParams.get('action');
    
    if (action === 'compare') {
      // Compare multiple paths
      const pathIds = searchParams.get('pathIds')?.split(',') || [];
      
      if (pathIds.length === 0) {
        return NextResponse.json(
          { error: 'pathIds parameter is required for comparison' },
          { status: 400 }
        );
      }
      
      // Get comparison data (this would need to be implemented in the optimizer)
      const comparison = {
        paths: pathIds,
        message: 'Path comparison not yet implemented',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        comparison,
        timestamp: new Date().toISOString()
      });
      
    } else if (pathId) {
      // Get metrics for specific path
      const metrics = await optimizer.getPathMetrics(pathId, personaType);
      
      return NextResponse.json({
        success: true,
        pathId,
        personaType: personaType || 'all',
        metrics,
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json(
        { error: 'Either pathId or action=compare with pathIds is required' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error getting path metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get path metrics' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'run_optimization') {
      // Trigger continuous optimization
      await optimizer.runContinuousOptimization();
      
      return NextResponse.json({
        success: true,
        message: 'Continuous optimization process started',
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "run_optimization"' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error running optimization:', error);
    return NextResponse.json(
      { error: 'Failed to run optimization' },
      { status: 500 }
    );
  }
}