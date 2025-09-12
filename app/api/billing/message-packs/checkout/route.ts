import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

const PRICES = {
  pack25k: process.env.STRIPE_PRICE_MSGPACK_25K,
  pack100k: process.env.STRIPE_PRICE_MSGPACK_100K,
  pack500k: process.env.STRIPE_PRICE_MSGPACK_500K,
}

export async function POST(req: Request) {
  try {
    const { pack } = (await req.json()) as { pack: '25k' | '100k' | '500k' }
    const priceId = pack === '25k' ? PRICES.pack25k : pack === '100k' ? PRICES.pack100k : PRICES.pack500k
    if (!priceId) return NextResponse.json({ error: 'Missing Stripe price id' }, { status: 400 })
    const customer = process.env.DEMO_STRIPE_CUSTOMER_ID
    if (!customer) return NextResponse.json({ error: 'Missing demo customer' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/billing/packs/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com'}/billing/packs`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Checkout failed' }, { status: 500 })
  }
}

