import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Stripe initialization to avoid build-time errors
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

// This endpoint is triggered monthly to add commission charges
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.EVENTBRIDGE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, monthlyEarnings, subscriptionTier } = await request.json();

    // Calculate commission
    const commissionResponse = await fetch('/api/billing/calculate-commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyRevenue: monthlyEarnings,
        subscriptionTier,
        accountAge: 30, // TODO: Get from database
      }),
    });

    const { commission, breakdown } = await commissionResponse.json();

    if (commission > 0) {
      // Get user's Stripe customer ID (from database)
      const customerId = await getStripeCustomerId(userId);
      
      // Create invoice item for next billing cycle
      await getStripe().invoiceItems.create({
        customer: customerId,
        amount: Math.round(commission * 100), // Convert to cents
        currency: 'usd',
        description: `Platform commission - ${breakdown.notes.join(', ')}`,
        metadata: {
          userId,
          monthlyEarnings: monthlyEarnings.toString(),
          tier: subscriptionTier,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      commission,
      breakdown 
    });
  } catch (error) {
    console.error('Commission billing error:', error);
    return NextResponse.json({ error: 'Failed to process commission' }, { status: 500 });
  }
}

async function getStripeCustomerId(userId: string): Promise<string> {
  // TODO: Implement database lookup
  throw new Error('Not implemented');
}