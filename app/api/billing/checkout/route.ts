import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { requireUser } from '@/lib/server-auth';
import { getStripe, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_SCALE } from '@/lib/stripe';
import { getOrCreateCustomer } from '@/lib/billing';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

async function handler(req: Request) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const plan: 'starter' | 'pro' | 'scale' =
      body?.plan === 'pro' ? 'pro' : body?.plan === 'scale' ? 'scale' : 'starter';

    const priceId = plan === 'pro' ? STRIPE_PRICE_PRO : plan === 'scale' ? STRIPE_PRICE_SCALE : STRIPE_PRICE_STARTER;
    if (!priceId) {
      const r = NextResponse.json({ error: 'Missing Stripe price id', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const customer = await getOrCreateCustomer(user.id, user.email ?? undefined);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';

    const stripeClient = await getStripe();
    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
    });

    const r = NextResponse.json({ url: session.url, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (e: any) {
    log.error('billing_checkout_failed', { error: e?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'checkout_failed', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export const POST = withMonitoring('billing.checkout', handler as any);
