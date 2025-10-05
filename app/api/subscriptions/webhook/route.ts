import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getSecretFromEnv } from '@/lib/aws/secrets';
import { withMonitoring } from '@/lib/observability/bootstrap';

export const runtime = 'nodejs';

const processedEvents = new Set<string>();

async function handler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const signingSecret = await getSecretFromEnv({
    directValueEnv: 'STRIPE_WEBHOOK_SECRET',
    secretNameEnv: 'STRIPE_WEBHOOK_SECRET_NAME',
  }).catch(() => undefined);
  if (!signingSecret) {
    const log = makeReqLogger({ requestId, route: pathname, method: request.method });
    log.error('stripe_webhook_misconfigured');
    const r = NextResponse.json({ error: 'Webhook not configured', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }

  const stripeClient = await getStripe();

  const sig = headers().get('stripe-signature') || '';
  const rawBody = await request.text();

  let event: Stripe.Event;
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, sig, signingSecret);
  } catch (err: any) {
    log.error('stripe_signature_verification_failed', { error: err?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Invalid signature', requestId }, { status: 400 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }

  // Idempotency in-memory (best effort)
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  processedEvents.add(event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // TODO: map customer to user, mark onboarding complete
        break;
      case 'invoice.created':
        // TODO: compute and attach commission
        break;
      case 'customer.subscription.updated':
        // TODO: update user subscription tier
        break;
      default:
        break;
    }
  } catch (e: any) {
    log.error('stripe_webhook_handler_failed', { error: e?.message || 'unknown_error' });
  }

  const r = NextResponse.json({ received: true, requestId });
  r.headers.set('X-Request-Id', requestId);
  return r;
}

export const POST = withMonitoring('webhooks.subscriptions', handler as any);
