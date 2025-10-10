export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { publishModuleEvent } from '@/lib/integration/module-event-bus';
import { structuredLogger } from '@/lib/monitoring/structured-logger';

const metricSummarySchema = z.object({
  avg: z.number(),
  min: z.number(),
  max: z.number(),
  count: z.number(),
});

const bodySchema = z.object({
  metrics: z.record(metricSummarySchema),
  timestamp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { metrics, timestamp } = bodySchema.parse(json);

    await publishModuleEvent({
      source: 'analytics',
      type: 'PerformanceMetrics',
      payload: {
        metrics,
        timestamp: timestamp ?? new Date().toISOString(),
      },
    });

    structuredLogger.info('analytics.performance.received', {
      metricCount: Object.keys(metrics).length,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    structuredLogger.error('analytics.performance.failed', {
      error: error?.message,
    });
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Invalid payload' },
      { status: 400 },
    );
  }
}
