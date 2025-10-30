/**
 * API Endpoint - Cost Alerts Management
 * 
 * Endpoints pour gérer les alertes de coûts AI
 * GET /api/v2/costs/alerts - Obtenir les alertes
 * POST /api/v2/costs/alerts - Créer une alerte personnalisée
 * PUT /api/v2/costs/alerts/:id/acknowledge - Marquer comme lue
 * 
 * @module api/v2/costs/alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { costMonitoringService } from '@/lib/services/cost-monitoring-service';
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
    const severity = searchParams.get('severity') as 'info' | 'warning' | 'critical' | null;
    const acknowledged = searchParams.get('acknowledged') === 'true';
    
    // Vérification des permissions
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Pour l'instant, on génère des alertes de test
    // Dans une vraie implémentation, on récupérerait depuis DynamoDB
    const mockAlerts = [
      {
        id: 'alert_1',
        userId: targetUserId,
        type: 'daily_threshold',
        severity: 'warning',
        threshold: 5.00,
        currentValue: 6.50,
        message: 'Daily cost threshold exceeded: $6.50',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
        acknowledged: false
      },
      {
        id: 'alert_2',
        type: 'spike_detection',
        severity: 'critical',
        threshold: 15.00,
        currentValue: 25.00,
        message: 'Cost spike detected: 3x above average',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30min ago
        acknowledged: false
      }
    ].filter(alert => {
      if (severity && alert.severity !== severity) return false;
      if (acknowledged !== undefined && alert.acknowledged !== acknowledged) return false;
      return true;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        alerts: mockAlerts,
        summary: {
          total: mockAlerts.length,
          unacknowledged: mockAlerts.filter(a => !a.acknowledged).length,
          bySeverity: {
            info: mockAlerts.filter(a => a.severity === 'info').length,
            warning: mockAlerts.filter(a => a.severity === 'warning').length,
            critical: mockAlerts.filter(a => a.severity === 'critical').length
          }
        }
      },
      metadata: {
        requestedBy: session.user.id,
        requestedAt: new Date().toISOString(),
        filters: { userId: targetUserId, severity, acknowledged }
      }
    });
    
  } catch (error) {
    console.error('[API] Error getting cost alerts:', error);
    
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
    
    // Seuls les admins peuvent créer des alertes personnalisées
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validation du body
    const { type, threshold, userId, message } = body;
    
    if (!type || !threshold || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, threshold, message' },
        { status: 400 }
      );
    }
    
    if (!['daily_threshold', 'monthly_threshold', 'spike_detection', 'budget_exceeded'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }
    
    if (typeof threshold !== 'number' || threshold <= 0) {
      return NextResponse.json(
        { error: 'Threshold must be a positive number' },
        { status: 400 }
      );
    }
    
    // Créer l'alerte personnalisée
    const customAlert = {
      id: `custom_${Date.now()}`,
      userId: userId || undefined,
      type,
      severity: threshold > 50 ? 'critical' : threshold > 20 ? 'warning' : 'info',
      threshold,
      currentValue: 0,
      message,
      timestamp: new Date(),
      acknowledged: false,
      custom: true,
      createdBy: session.user.id
    };
    
    // Dans une vraie implémentation, on sauvegarderait en base
    console.log('[API] Custom alert created:', customAlert);
    
    return NextResponse.json({
      success: true,
      data: customAlert,
      message: 'Custom alert created successfully'
    });
    
  } catch (error) {
    console.error('[API] Error creating custom alert:', error);
    
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
    const { alertId, acknowledged } = body;
    
    if (!alertId || typeof acknowledged !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, acknowledged' },
        { status: 400 }
      );
    }
    
    // Dans une vraie implémentation, on mettrait à jour en DynamoDB
    console.log(`[API] Alert ${alertId} acknowledged: ${acknowledged} by ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: `Alert ${acknowledged ? 'acknowledged' : 'unacknowledged'} successfully`
    });
    
  } catch (error) {
    console.error('[API] Error updating alert:', error);
    
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