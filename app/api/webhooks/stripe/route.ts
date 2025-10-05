import { NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/observability/bootstrap';
export const runtime = 'nodejs';

async function handler() {
  return new NextResponse('Stripe webhook moved to EventBridge', { status: 410 });
}

export const POST = withMonitoring('webhooks.stripe', handler);
export const GET = POST;
export const HEAD = POST;
