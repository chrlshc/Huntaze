import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { processWebhook } from '@/lib/stripe-webhook-handlers';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const MAX_WEBHOOK_AGE_SECONDS = 300; // 5 minutes tolerance

// Store processed event IDs to prevent replay attacks
const processedEvents = new Set<string>();


export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      
      // Additional timestamp validation to prevent replay attacks
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTimestamp = parseInt(signature.split(',').find(s => s.startsWith('t='))?.split('=')[1] || '0');
      
      if (currentTime - webhookTimestamp > MAX_WEBHOOK_AGE_SECONDS) {
        console.error('Webhook timestamp too old:', {
          current: currentTime,
          webhook: webhookTimestamp,
          age: currentTime - webhookTimestamp
        });
        return NextResponse.json(
          { error: 'Webhook timestamp too old' },
          { status: 400 }
        );
      }

      // Check for duplicate events
      if (processedEvents.has(event.id)) {
        console.log('Duplicate webhook event received:', event.id);
        return NextResponse.json({ received: true, duplicate: true });
      }
      
      // Add to processed events (in production, use Redis or DB)
      processedEvents.add(event.id);
      
      // Clean up old event IDs periodically (simple in-memory cleanup)
      if (processedEvents.size > 1000) {
        processedEvents.clear();
      }
      
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process the webhook event using our centralized handlers
    try {
      await processWebhook(event);
      
      return NextResponse.json({ 
        received: true,
        eventId: event.id,
        type: event.type,
      });
      
    } catch (error) {
      console.error('Error processing webhook event:', error);
      
      // Log to monitoring service (Sentry, DataDog, etc)
      if (process.env.SENTRY_DSN) {
        // Sentry.captureException(error, {
        //   tags: { webhook_event_type: event.type },
        //   extra: { event_id: event.id }
        // });
      }
      
      // Return success to prevent Stripe from retrying immediately
      // We log the error for manual investigation
      return NextResponse.json({ 
        received: true,
        error: 'Processing error logged',
        eventId: event.id,
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};