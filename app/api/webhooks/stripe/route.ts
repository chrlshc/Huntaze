import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

async function handler() {
  return new NextResponse('Stripe webhook moved to EventBridge', { status: 410 });
}

export const POST = handler as any;
export const GET = POST;
export const HEAD = POST;
