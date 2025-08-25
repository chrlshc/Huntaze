import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    })
  : null;

const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
  },
  growth: {
    monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID!,
  },
  scale: {
    monthly: process.env.STRIPE_SCALE_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_SCALE_YEARLY_PRICE_ID!,
  },
};

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }
  
  try {
    const { plan, billingInterval, userId, promoCode } = await request.json();

    if (!plan || !billingInterval || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the appropriate price ID
    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]?.[billingInterval as 'monthly' | 'yearly'];
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan or billing interval' },
        { status: 400 }
      );
    }

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=3`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
        billingInterval,
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId,
          plan,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    };

    // If a promo code was provided, try to apply it
    if (promoCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode,
          limit: 1,
        });

        if (promotionCodes.data.length > 0 && promotionCodes.data[0].active) {
          sessionConfig.discounts = [
            {
              promotion_code: promotionCodes.data[0].id,
            },
          ];
        }
      } catch (error) {
        // Ignore promo code errors, proceed without discount
        console.error('Promo code error:', error);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}