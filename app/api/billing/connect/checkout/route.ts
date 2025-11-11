import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { getStripe, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_SCALE } from '@/lib/stripe';
import { makeReqLogger } from '@/lib/logger';

const bodySchema = z.object({
  accountId: z.string().regex(/^acct_\w+$/), // Stripe connected account id
  plan: z.enum(['starter', 'pro', 'scale']),
  userId: z.string().min(1),
});

function getPriceId(plan: 'starter' | 'pro' | 'scale'): string {
  switch (plan) {
    case 'starter':
      return STRIPE_PRICE_STARTER;
    case 'pro':
      return STRIPE_PRICE_PRO;
    case 'scale':
      return STRIPE_PRICE_SCALE;
  }
}

function getFeePercent(plan: 'starter' | 'pro' | 'scale'): number {
  // Optionally configurable via env; defaults are examples
  const envMap: Record<typeof plan, string | undefined> = {
    starter: process.env.STRIPE_FEE_PCT_STARTER,
    pro: process.env.STRIPE_FEE_PCT_PRO,
    scale: process.env.STRIPE_FEE_PCT_SCALE,
  };
  const defMap: Record<typeof plan, number> = { starter: 10, pro: 15, scale: 20 };
  const v = envMap[plan];
  const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : defMap[plan];
}

export const runtime = 'nodejs';

async function handler(req: Request) {
  try {
    const json = await req.json();
    const { accountId, plan, userId } = bodySchema.parse(json);

    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json({ error: 'Missing Stripe price id for plan' }, { status: 400 });
    }

    const feePercent = getFeePercent(plan);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';

    // Checkout for subscription with Connect: settlement = connected account
    const idempotencyKey = crypto.randomUUID();
    const log = makeReqLogger({ requestId: idempotencyKey, userId });
    const stripeClient = await getStripe();
    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing`,
      subscription_data: {
        transfer_data: { destination: accountId },
        application_fee_percent: feePercent,
        metadata: userId ? { userId } : undefined,
      },
      payment_intent_data: {
        on_behalf_of: accountId,
      },
      client_reference_id: userId || undefined,
    }, { idempotencyKey });

    // Log structured event for observability
    log.info('connect_checkout_created', {
      accountId,
      plan,
      feePercent,
      idempotencyKey,
    });

    return NextResponse.json({ url: session.url, idempotencyKey }, { status: 200 });
  } catch (e: any) {
    const message = e?.message || 'connect_checkout_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = handler as any;
