import { NextResponse } from 'next/server';
import { alertService } from '@/lib/services/alertService';

/**
 * GET /api/monitoring/alerts
 * Returns current alerts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get('includeResolved') === 'true';

    // Check for new alerts
    alertService.checkAlerts();

    const alerts = alertService.getAlerts(includeResolved);
    const activeCount = alertService.getActiveAlertsCount();

    return NextResponse.json({
      alerts,
      activeCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/alerts/resolve
 * Resolve an alert
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const resolved = alertService.resolveAlert(alertId);

    if (!resolved) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}
