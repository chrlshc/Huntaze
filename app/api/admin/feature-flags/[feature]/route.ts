/**
 * Feature Flag Individual Management
 * 
 * API pour gérer un feature flag spécifique
 * Actions rapides : enable, disable, rollback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationMiddleware } from '@/lib/services/integration-middleware';
import { z } from 'zod';

const QuickActionSchema = z.object({
  action: z.enum(['enable', 'disable', 'rollback', 'increase', 'decrease']),
  value: z.number().optional() // Pour increase/decrease percentage
});

/**
 * GET /api/admin/feature-flags/[feature]
 * Obtenir l'état d'un feature flag spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { feature: string } }
) {
  try {
    const { feature } = params;
    
    const middleware = await getIntegrationMiddleware();
    const featureFlags = middleware.getFeatureFlags();
    const flagConfig = featureFlags[feature];
    
    if (!flagConfig) {
      return NextResponse.json(
        { success: false, error: `Feature flag '${feature}' not found` },
        { status: 404 }
      );
    }
    
    // Obtenir les métriques pour ce flag
    const metrics = middleware.getMetrics();
    const flagMetrics = Object.entries(metrics)
      .filter(([key]) => key.includes('hybrid')) // Filtrer les métriques pertinentes
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    return NextResponse.json({
      success: true,
      data: {
        feature,
        config: flagConfig,
        metrics: flagMetrics,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`[Feature Flag API] Error getting flag '${params.feature}':`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get feature flag'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/feature-flags/[feature]
 * Mettre à jour un feature flag spécifique
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { feature: string } }
) {
  try {
    const { feature } = params;
    const body = await request.json();
    
    const middleware = await getIntegrationMiddleware();
    await middleware.updateFeatureFlag(feature, body);
    
    // Obtenir l'état mis à jour
    const updatedFlags = middleware.getFeatureFlags();
    const updatedFlag = updatedFlags[feature];
    
    console.log(`[Feature Flag API] Updated '${feature}':`, updatedFlag);
    
    return NextResponse.json({
      success: true,
      data: {
        feature,
        config: updatedFlag,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`[Feature Flag API] Error updating flag '${params.feature}':`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update feature flag'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags/[feature]/action
 * Actions rapides sur un feature flag
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { feature: string } }
) {
  try {
    const { feature } = params;
    const body = await request.json();
    const { action, value } = QuickActionSchema.parse(body);
    
    const middleware = await getIntegrationMiddleware();
    const currentFlags = middleware.getFeatureFlags();
    const currentFlag = currentFlags[feature];
    
    if (!currentFlag) {
      return NextResponse.json(
        { success: false, error: `Feature flag '${feature}' not found` },
        { status: 404 }
      );
    }
    
    let updateData: any = {};
    
    switch (action) {
      case 'enable':
        updateData = { enabled: true };
        break;
        
      case 'disable':
        updateData = { enabled: false };
        break;
        
      case 'rollback':
        // Rollback complet : désactiver et remettre à 0%
        updateData = { 
          enabled: false, 
          rolloutPercentage: 0 
        };
        console.warn(`[Feature Flag API] ROLLBACK TRIGGERED for '${feature}'`);
        break;
        
      case 'increase':
        const newPercentageUp = Math.min(100, currentFlag.rolloutPercentage + (value || 10));
        updateData = { rolloutPercentage: newPercentageUp };
        break;
        
      case 'decrease':
        const newPercentageDown = Math.max(0, currentFlag.rolloutPercentage - (value || 10));
        updateData = { rolloutPercentage: newPercentageDown };
        break;
    }
    
    await middleware.updateFeatureFlag(feature, updateData);
    
    // Obtenir l'état mis à jour
    const updatedFlags = middleware.getFeatureFlags();
    const updatedFlag = updatedFlags[feature];
    
    return NextResponse.json({
      success: true,
      data: {
        feature,
        action,
        previousConfig: currentFlag,
        newConfig: updatedFlag,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`[Feature Flag API] Error executing action on '${params.feature}':`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute action'
      },
      { status: 500 }
    );
  }
}