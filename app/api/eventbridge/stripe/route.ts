import { NextRequest, NextResponse } from 'next/server';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridgeClient({ 
  region: process.env.AWS_REGION || 'us-west-1' 
});

// This endpoint receives events from AWS EventBridge
// Configure EventBridge rule to trigger this when Stripe events arrive
export async function POST(request: NextRequest) {
  try {
    // Verify API key from EventBridge
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.EVENTBRIDGE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await request.json();
    
    // EventBridge wraps the Stripe event in detail
    // The structure from EventBridge is: { detail: stripeEvent }
    const stripeEvent = event.detail;
    
    console.log('Received EventBridge event:', {
      eventType: stripeEvent?.type,
      eventId: stripeEvent?.id,
      source: event.source
    });
    
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        await handleCheckoutComplete(stripeEvent);
        break;
      }
      
      case 'invoice.created': {
        // This is where we add commission charges
        await handleInvoiceCreated(stripeEvent);
        break;
      }
      
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdate(stripeEvent);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('EventBridge handler error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(event: any) {
  const session = event.data.object;
  const userId = session.metadata?.userId;
  
  if (userId) {
    // Mark onboarding complete
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/onboarding-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        completed: true,
        steps: { profile: true, aiConfig: true, payment: true }
      }),
    });
  }
}

async function handleInvoiceCreated(event: any) {
  const invoice = event.data.object;
  
  // Only process if this is a subscription invoice (not one-time)
  if (!invoice.subscription) return;
  
  // Get user's monthly earnings from database
  const userId = await getUserIdFromCustomer(invoice.customer);
  const monthlyEarnings = await getMonthlyEarnings(userId);
  
  if (monthlyEarnings > 0) {
    // Calculate commission
    const response = await fetch('/api/billing/calculate-commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyRevenue: monthlyEarnings,
        subscriptionTier: await getUserTier(userId),
        accountAge: await getAccountAge(userId),
      }),
    });
    
    const { commission } = await response.json();
    
    // Add commission to the invoice
    if (commission > 0) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.invoiceItems.create({
        customer: invoice.customer,
        invoice: invoice.id,
        amount: Math.round(commission * 100), // Convert to cents
        currency: 'usd',
        description: `Platform commission (${monthlyEarnings} earnings)`,
      });
    }
  }
}

async function handleSubscriptionUpdate(event: any) {
  // Update user's subscription tier in database
  const subscription = event.data.object;
  const userId = await getUserIdFromCustomer(subscription.customer);
  
  await updateUserSubscription(userId, {
    subscriptionId: subscription.id,
    status: subscription.status,
    tier: getTierFromPriceId(subscription.items.data[0]?.price.id),
  });
}

// Helper functions (implement with your database)
async function getUserIdFromCustomer(customerId: string): Promise<string> {
  // TODO: Lookup user ID by Stripe customer ID
  return '';
}

async function getMonthlyEarnings(userId: string): Promise<number> {
  // TODO: Get user's OnlyFans earnings for the month
  return 0;
}

async function getUserTier(userId: string): Promise<string> {
  // TODO: Get user's subscription tier
  return 'starter';
}

async function getAccountAge(userId: string): Promise<number> {
  // TODO: Calculate account age in days
  return 0;
}

async function updateUserSubscription(userId: string, data: any): Promise<void> {
  // TODO: Update subscription in database
}

function getTierFromPriceId(priceId: string): string {
  const tierMap: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || '']: 'starter',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '']: 'pro',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE || '']: 'scale',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || '']: 'enterprise',
  };
  return tierMap[priceId] || 'starter';
}