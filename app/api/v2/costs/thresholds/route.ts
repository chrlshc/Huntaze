/**
 * API Endpoint - Cost Alert Thresholds Management
 * 
 * Endpoints pour gérer les seuils d'alertes de coûts
 * GET /api/v2/costs/thresholds - Obtenir les seuils
 * POST /api/v2/costs/thresholds - Créer un seuil
 * PUT /api/v2/costs/thresholds/:id - Mettre à jour un seuil
 * DELETE /api/v2/costs/thresholds/:id - Supprimer un seuil
 * 
 * @module api/v2/costs/thresholds
 */

import { NextRequest, NextResponse } from 'next/server';
import { costAlertManager } from '@/lib/services/cost-alert-manager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as 'daily' | 'monthly' | 'hourly' | 'per_request' | null;
    const enabled = searchParams.get('enabled') === 'true';
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Mock data pour l'instant - dans une vraie implémentation, on récupérerait depuis DynamoDB
    const mockThresholds = [
      {
        id: 'threshold_1',
        userId: targetUserId,
        type: 'daily',
        provider: 'all',
        threshold: 50.00,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'threshold_2',
        userId: targetUserId,
        type: 'monthly',
        provider: 'all',
        threshold: 1000.00,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'sns'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'threshold_3',
        type: 'daily',
        provider: 'azure',
        threshold: 30.00,
        severity: 'info',
        enabled: false,
        notificationChannels: ['in_app'],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ].filter(threshold => {
      if (type && threshold.type !== type) return false;
      if (enabled !== undefined && threshold.enabled !== enabled) return false;
      if (!isAdmin && threshold.userId !== targetUserId) return false;
      return true;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        thresholds: mockThresholds,
        summary: {
          total: mockThresholds.length,
          enabled: mockThresholds.filter(t => t.enabled).length,
          byType: {
            daily: mockThresholds.filter(t => t.type === 'daily').length,
            monthly: mockThresholds.filter(t => t.type === 'monthly').length,
            hourly: mockThresholds.filter(t => t.type === 'hourly').length,
            per_request: mockThresholds.filter(t => t.type === 'per_request').length
          },
          bySeverity: {
            info: mockThresholds.filter(t => t.severity === 'info').length,
            warning: mockThresholds.filter(t => t.severity === 'warning').length,
            critical: mockThresholds.filter(t => t.severity === 'critical').length
          }
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        filters: { userId: targetUserId, type, enabled }
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting cost thresholds:', error);
    
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
    
    const body = await request.json();
    
    // Validation du body
    const { type, threshold, severity, notificationChannels, provider, userId } = body;
    
    if (!type || !threshold || !severity || !notificationChannels) {
      return NextResponse.json(
        { error: 'Missing required fields: type, threshold, severity, notificationChannels' },
        { status: 400 }
      );
    }
    
    if (!['daily', 'monthly', 'hourly', 'per_request'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid threshold type' },
        { status: 400 }
      );
    }
    
    if (typeof threshold !== 'number' || threshold <= 0) {
      return NextResponse.json(
        { error: 'Threshold must be a positive number' },
        { status: 400 }
      );
    }
    
    if (!['info', 'warning', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(notificationChannels) || notificationChannels.length === 0) {
      return NextResponse.json(
        { error: 'notificationChannels must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create thresholds for other users' },
        { status: 403 }
      );
    }
    
    // Créer le seuil
    const newThreshold = await costAlertManager.setAlertThreshold({
      userId: targetUserId !== session.user.id ? targetUserId : undefined,
      type,
      provider: provider || undefined,
      threshold,
      severity,
      enabled: body.enabled !== false, // Par défaut activé
      notificationChannels
    });
    
    return NextResponse.json({
      success: true,
      data: newThreshold,
      message: 'Alert threshold created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('[API] Error creating cost threshold:', error);
    
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
    
    const body = await request.json();
    const { thresholdId, enabled, threshold, notificationChannels } = body;
    
    if (!thresholdId) {
      return NextResponse.json(
        { error: 'Missing required field: thresholdId' },
        { status: 400 }
      );
    }
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to update thresholds' },
        { status: 403 }
      );
    }
    
    // Dans une vraie implémentation, on mettrait à jour en DynamoDB
    console.log(`[API] Threshold ${thresholdId} updated by ${session.user.id}`, {
      enabled,
      threshold,
      notificationChannels
    });
    
    return NextResponse.json({
      success: true,
      message: 'Threshold updated successfully'
    });
    
  } catch (error) {
    console.error('[API] Error updating threshold:', error);
    
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const thresholdId = searchParams.get('id');
    
    if (!thresholdId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to delete thresholds' },
        { status: 403 }
      );
    }
    
    // Dans une vraie implémentation, on supprimerait de DynamoDB
    console.log(`[API] Threshold ${thresholdId} deleted by ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Threshold deleted successfully'
    });
    
  } catch (error) {
    console.error('[API] Error deleting threshold:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
