/**
 * API endpoint to receive batch metrics from client and forward to CloudWatch
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudWatchMonitoring } from '@/lib/aws/cloudwatch';

const METRIC_NAMESPACE = 'Huntaze/Performance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics } = body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // Send all metrics to CloudWatch
    const monitoring = getCloudWatchMonitoring();
    const promises = metrics.map((metric) =>
      monitoring.putMetric({
        namespace: METRIC_NAMESPACE,
        metricName: metric.metricName,
        value: metric.value,
        unit: metric.unit,
        dimensions: metric.dimensions,
      })
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true, count: metrics.length });
  } catch (error) {
    console.error('Failed to process metrics batch:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics batch' },
      { status: 500 }
    );
  }
}
