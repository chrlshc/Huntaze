/**
 * API endpoint to receive metrics from client and forward to CloudWatch
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudWatchMonitoring } from '@/lib/aws/cloudwatch';

const METRIC_NAMESPACE = 'Huntaze/Performance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricName, value, unit, dimensions } = body;

    // Validate input
    if (!metricName || typeof value !== 'number' || !unit) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Send to CloudWatch
    const monitoring = getCloudWatchMonitoring();
    await monitoring.putMetric({
      namespace: METRIC_NAMESPACE,
      metricName,
      value,
      unit,
      dimensions,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process metric:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}
