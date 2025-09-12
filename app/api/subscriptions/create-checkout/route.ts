import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/auth/request';
import { rateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { windowMs: 60_000, max: 20 });
    if (!limited.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const user = await getUserFromRequest(request);
    if (!user?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = user.userId as string;
    const email = (user.email || '') as string;

    const { planId } = await request.json();

    // Map plan IDs to Stripe price IDs
    const priceIds: Record<string, string> = {
      starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || 'price_starter_monthly',
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
      scale: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE || 'price_scale_monthly',
      enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise_monthly',
    };

    const priceId = priceIds[planId] || priceIds.pro;

    // Trial period by plan: starter=14, pro=7, scale=7, enterprise=none
    const trialMap: Record<string, number | null> = {
      starter: 14,
      pro: 7,
      scale: 7,
      enterprise: null,
    };
    const trialDays = trialMap[planId] ?? 7;

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
      // Optional trial per plan
      subscription_data: trialDays != null ? { trial_period_days: trialDays } : undefined,
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
