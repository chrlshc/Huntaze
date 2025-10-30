/**
 * API Endpoint - Feature Flags Management
 * 
 * Endpoint admin pour gérer les feature flags du système hybride
 * GET /api/admin/feature-flags - Obtenir tous les feature flags
 * POST /api/admin/feature-flags - Créer/mettre à jour un feature flag
 * PUT /api/admin/feature-flags/:id - Modifier un feature flag
 * 
 * @module api/admin/feature-flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntegrationMiddleware } from '@/lib/services/integration-middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const integrationMiddleware = new IntegrationMiddleware();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent gérer les feature flags
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const flagName = searchParams.get('name');
    
    // Si un flag spécifique est demandé
    if (flagName) {
      const flagConfig = await integrationMiddleware.getFeatureFlagConfig(flagName);
      
      if (!flagConfig) {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: flagConfig
      });
    }

    // Obtenir tous les feature flags
    const allFlags = await integrationMiddleware.getAllFeatureFlags();
    
    // Calculer les statistiques
    const stats = {
      total: allFlags.length,
      enabled: allFlags.filter(f => f.enabled).length,
      disabled: allFlags.filter(f => f.enabled === false).length,
      byRollout: {
        full: allFlags.filter(f => f.rolloutPercentage === 100).length,
        partial: allFlags.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length,
        none: allFlags.filter(f => f.rolloutPercentage === 0).length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        flags: allFlags,
        stats
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting feature flags:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent gérer les feature flags
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, enabled, rolloutPercentage, userWhitelist, userBlacklist, conditions } = body;
    
    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (rolloutPercentage !== undefined && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
      return NextResponse.json(
        { error: 'rolloutPercentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Créer/mettre à jour le feature flag
    const flagConfig = {
      name,
      enabled: enabled !== false, // Par défaut activé
      rolloutPercentage: rolloutPercentage || 0,
      userWhitelist: userWhitelist || [],
      userBlacklist: userBlacklist || [],
      conditions: conditions || {}
    };

    await integrationMiddleware.updateFeatureFlag(name, flagConfig);

    console.log(`[API] Feature flag ${name} updated by ${session.user.id}:`, flagConfig);

    return NextResponse.json({
      success: true,
      data: flagConfig,
      message: `Feature flag '${name}' ${enabled ? 'enabled' : 'disabled'} successfully`
    });
    
  } catch (error) {
    console.error('[API] Error updating feature flag:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent gérer les feature flags
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, rolloutPercentage } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Obtenir le flag existant
    const existingFlag = await integrationMiddleware.getFeatureFlagConfig(name);
    
    if (!existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Mettre à jour seulement les champs fournis
    const updatedFlag = {
      ...existingFlag,
      ...body,
      name // Garder le nom original
    };

    await integrationMiddleware.updateFeatureFlag(name, updatedFlag);

    console.log(`[API] Feature flag ${name} modified by ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: updatedFlag,
      message: `Feature flag '${name}' updated successfully`
    });
    
  } catch (error) {
    console.error('[API] Error modifying feature flag:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
