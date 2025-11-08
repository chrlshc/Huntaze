import { NextRequest, NextResponse } from 'next/server';
import { behavioralAnalyticsService } from '@/lib/smart-onboarding/services/behavioralAnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const acknowledged = searchParams.get('acknowledged');

    // Method not implemented yet
    const alerts = [] as any[];
    // const alerts = await behavioralAnalyticsService.getAlerts({
    //   limit,
    //   severity,
    //   acknowledged: acknowledged ? acknowledged === 'true' : undefined
    // });

    return NextResponse.json({
      alerts: alerts.map(formatAlert),
      total: alerts.length
    });

  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, title, message, source, stepId, userId, autoResolve } = body;

    // Validate required fields
    if (!type || !severity || !title || !message || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Method not implemented yet
    const alert = null as any;
    // const alert = await behavioralAnalyticsService.createAlert({
    //   type,
    //   severity,
    //   title,
    //   message,
    //   source,
    //   stepId,
    //   userId,
    //   autoResolve: autoResolve || false,
    //   timestamp: new Date().toISOString(),
    //   acknowledged: false
    // });

    return NextResponse.json({
      alert: formatAlert(alert),
      message: 'Alert created successfully'
    });

  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

function formatAlert(alert: any) {
  return {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    timestamp: alert.timestamp,
    source: alert.source,
    stepId: alert.stepId,
    userId: alert.userId,
    acknowledged: alert.acknowledged || false,
    autoResolve: alert.autoResolve || false,
    resolvedAt: alert.resolvedAt,
    actions: getAlertActions(alert)
  };
}

function getAlertActions(alert: any) {
  const actions = [];

  // Add context-specific actions based on alert type and source
  switch (alert.source) {
    case 'ml_model':
      if (alert.type === 'warning' && alert.message.includes('drift')) {
        actions.push({
          id: 'retrain_model',
          label: 'Retrain Model',
          type: 'primary',
          action: 'retrain_model'
        });
      }
      break;

    case 'user_behavior':
      if (alert.severity === 'high' && alert.stepId) {
        actions.push({
          id: 'view_step_details',
          label: 'View Step Details',
          type: 'secondary',
          action: 'view_step_details'
        });
        actions.push({
          id: 'trigger_intervention',
          label: 'Trigger Intervention',
          type: 'primary',
          action: 'trigger_intervention'
        });
      }
      break;

    case 'system_performance':
      if (alert.type === 'error') {
        actions.push({
          id: 'check_logs',
          label: 'Check Logs',
          type: 'secondary',
          action: 'check_logs'
        });
        actions.push({
          id: 'restart_service',
          label: 'Restart Service',
          type: 'danger',
          action: 'restart_service'
        });
      }
      break;

    case 'data_pipeline':
      if (alert.message.includes('processing')) {
        actions.push({
          id: 'retry_processing',
          label: 'Retry Processing',
          type: 'primary',
          action: 'retry_processing'
        });
      }
      break;
  }

  return actions;
}