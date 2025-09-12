import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
  if (!signingSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

  const sig = headers().get('stripe-signature') || '';
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, signingSecret);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
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
  } catch (e) {
    console.error('Webhook handling error:', e);
  }

  return NextResponse.json({ received: true });
}

