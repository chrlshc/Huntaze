// Smart Onboarding - A/B Testing and Path Optimization API

import { NextRequest, NextResponse } from 'next/server';
import { DynamicPathOptimizerImpl } from '@/lib/smart-onboarding/services/dynamicPathOptimizer';
import { PathVariation, PersonaType, UserPersona } from '@/lib/smart-onboarding/types';

const optimizer = new DynamicPathOptimizerImpl();

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    
    switch (action) {
      case 'create_experiment':
        const { name, variations, targetPersonas } = data;
        
        if (!name || !variations || !targetPersonas) {
          return NextResponse.json(
            { error: 'Missing required fields: name, variations, targetPersonas' },
            { status: 400 }
          );
        }
        
        const experiment = await optimizer.createABTest(
          name,
          variations as PathVariation[],
          targetPersonas as PersonaType[]
        );
        
        return NextResponse.json({
          success: true,
          experiment,
          message: 'A/B test experiment created successfully'
        });
        
      case 'assign_user':
        const { experimentId, userId, persona } = data;
        
        if (!experimentId || !userId || !persona) {
          return NextResponse.json(
            { error: 'Missing required fields: experimentId, userId, persona' },
            { status: 400 }
          );
        }
        
        const variationId = await optimizer.assignUserToVariation(
          experimentId,
          userId,
          persona as UserPersona
        );
        
        return NextResponse.json({
          success: true,
          assignment: {
            experimentId,
            userId,
            variationId,
            assignedAt: new Date().toISOString()
          },
          message: 'User assigned to variation successfully'
        });
        
      case 'record_result':
        const { experimentId: expId, userId: uId, variationId, journey } = data;
        
        if (!expId || !uId || !variationId || !journey) {
          return NextResponse.json(
            { error: 'Missing required fields: experimentId, userId, variationId, journey' },
            { status: 400 }
          );
        }
        
        await optimizer.recordTestResult(expId, uId, variationId, journey);
        
        return NextResponse.json({
          success: true,
          message: 'Test result recorded successfully'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "create_experiment", "assign_user", or "record_result"' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in A/B testing:', error);
    return NextResponse.json(
      { error: 'Failed to process A/B test request', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const action = searchParams.get('action');
    
    if (action === 'optimize_persona') {
      const personaType = searchParams.get('personaType') as PersonaType;
      
      if (!personaType) {
        return NextResponse.json(
          { error: 'personaType is required for optimization' },
          { status: 400 }
        );
      }
      
      const optimizationResult = await optimizer.optimizePath(personaType);
      
      return NextResponse.json({
        success: true,
        optimization: optimizationResult,
        timestamp: new Date().toISOString()
      });
      
    } else if (experimentId) {
      // Get experiment results
      const experiment = await optimizer.getExperimentResults(experimentId);
      
      return NextResponse.json({
        success: true,
        experiment,
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json(
        { error: 'Either experimentId or action=optimize_persona with personaType is required' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error getting A/B test data:', error);
    return NextResponse.json(
      { error: 'Failed to get A/B test data' },
      { status: 500 }
    );
  }
}