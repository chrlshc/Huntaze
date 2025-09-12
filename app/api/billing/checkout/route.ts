import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

const PRICES = {
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  scaleMonthly: process.env.STRIPE_PRICE_SCALE_MONTHLY,
  enterpriseYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY, // $4,788/yr
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { plan } = body as { plan: 'pro' | 'scale' | 'enterprise'; enterpriseAnnual?: boolean }

    const customer = process.env.DEMO_STRIPE_CUSTOMER_ID
    if (!customer) return NextResponse.json({ error: 'Missing demo customer' }, { status: 400 })

    let priceId: string | undefined
    if (plan === 'pro') priceId = PRICES.proMonthly || undefined
    else if (plan === 'scale') priceId = PRICES.scaleMonthly || undefined
    else priceId = PRICES.enterpriseYearly || undefined

    if (!priceId) return NextResponse.json({ error: 'Missing Stripe price id' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/pricing-v2`,
      subscription_data: {
        metadata: plan === 'enterprise' ? { annual_commitment: 'true' } : undefined,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Checkout failed' }, { status: 500 })
  }
}

