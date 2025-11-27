/**
 * Metrics Batch Endpoint
 * Receives batched metrics from client-side monitoring
 * Only processes in development mode
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface BatchRequest {
  metrics: MetricData[];
}

export async function POST(request: NextRequest) {
  // Only accept metrics in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Metrics collection disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body: BatchRequest = await request.json();

    if (!body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json(
        { error: 'Invalid request: metrics array required' },
        { status: 400 }
      );
    }

    // Validate batch size
    if (body.metrics.length > 100) {
      return NextResponse.json(
        { error: 'Batch too large: maximum 100 metrics per batch' },
        { status: 400 }
      );
    }

    // Process metrics (in development, just log them)
    console.log('[Monitoring] Received batch:', {
      count: body.metrics.length,
      metrics: body.metrics.map((m) => ({
        name: m.name,
        value: m.value.toFixed(2),
        tags: m.tags,
      })),
    });

    // Calculate statistics
    const stats = calculateStats(body.metrics);

    return NextResponse.json({
      success: true,
      processed: body.metrics.length,
      stats,
    });
  } catch (error) {
    console.error('[Monitoring] Error processing batch:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics batch' },
      { status: 500 }
    );
  }
}

function calculateStats(metrics: MetricData[]) {
  const byName = new Map<string, number[]>();

  for (const metric of metrics) {
    if (!byName.has(metric.name)) {
      byName.set(metric.name, []);
    }
    byName.get(metric.name)!.push(metric.value);
  }

  const stats: Record<string, any> = {};

  for (const [name, values] of byName.entries()) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    stats[name] = {
      count: values.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p50: p50.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
    };
  }

  return stats;
}
