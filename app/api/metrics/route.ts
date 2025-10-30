// Prometheus metrics endpoint

import { NextResponse } from 'next/server';
import { getMetricsText } from '@/lib/monitoring/onlyfans-metrics';

export async function GET() {
  const body = await getMetricsText();
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; version=0.0.4' }
  });
}
