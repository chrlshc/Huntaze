import { NextResponse } from 'next/server';
import { alertService } from '@/lib/services/alertService';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/workers/alert-checker
 * Manually trigger alert checking
 */
export async function POST() {
  try {
    logger.info('Alert checker worker triggered');

    // Check all alert conditions
    const newAlerts = alertService.checkAlerts();

    if (newAlerts.length > 0) {
      logger.warn('New alerts triggered', {
        count: newAlerts.length,
        alerts: newAlerts.map(a => a.name),
      });
    }

    const activeCount = alertService.getActiveAlertsCount();

    return NextResponse.json({
      success: true,
      newAlerts: newAlerts.length,
      activeAlerts: activeCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Alert checker worker failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Alert checker failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workers/alert-checker
 * Get alert checker status
 */
export async function GET() {
  try {
    const activeCount = alertService.getActiveAlertsCount();
    const alerts = alertService.getAlerts(false);

    return NextResponse.json({
      status: 'running',
      activeAlerts: activeCount,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
