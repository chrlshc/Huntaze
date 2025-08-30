import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const email = payload.email as string;

    const { planId } = await request.json();

    // Map plan IDs to Stripe price IDs
    const priceIds: Record<string, string> = {
      starter: 'price_starter_monthly', // Free tier
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
      scale: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE || 'price_scale_monthly',
      enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise_monthly',
    };

    const priceId = priceIds[planId] || priceIds.pro;

    // Create Stripe checkout session (idempotent)
    const idempotencyKey = `checkout_${userId}_${planId}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}&step=complete`,
      cancel_url: `${appUrl}/onboarding/setup?step=payment`,
      metadata: {
        userId,
      },
      // Enable 14-day free trial (aligned with site copy)
      subscription_data: {
        trial_period_days: 14,
      },
    }, { idempotencyKey });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
