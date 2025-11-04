import { NextRequest, NextResponse } from 'next/server';
import { behavioralAnalyticsService } from '@/lib/smart-onboarding/services/behavioralAnalyticsService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const result = await behavioralAnalyticsService.resolveAlert(alertId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to resolve alert' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Alert resolved successfully',
      alert: result.alert
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}