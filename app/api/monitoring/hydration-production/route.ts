/**
 * API endpoint pour le monitoring de production d'hydratation
 */

import { NextRequest, NextResponse } from 'next/server';
import { hydrationProductionMonitor } from '@/lib/monitoring/hydrationProductionMonitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: hydrationProductionMonitor.generateHealthReport()
        });

      case 'metrics':
        return NextResponse.json({
          success: true,
          data: hydrationProductionMonitor.getMetrics()
        });

      case 'alerts':
        return NextResponse.json({
          success: true,
          data: hydrationProductionMonitor.getActiveAlerts()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Action non supportée'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API monitoring hydratation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'resolve-alert':
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({
            success: false,
            error: 'ID d\'alerte requis'
          }, { status: 400 });
        }

        const resolved = hydrationProductionMonitor.resolveAlert(alertId);
        return NextResponse.json({
          success: true,
          data: { resolved }
        });

      case 'start-monitoring':
        hydrationProductionMonitor.start();
        return NextResponse.json({
          success: true,
          message: 'Monitoring démarré'
        });

      case 'stop-monitoring':
        hydrationProductionMonitor.stop();
        return NextResponse.json({
          success: true,
          message: 'Monitoring arrêté'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Action non supportée'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API monitoring hydratation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}