import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const sig = req.headers.get('stripe-signature') || ''
    const buf = Buffer.from(await req.arrayBuffer())
    const stripeClient = await getStripe()

    let evt: Stripe.Event
    try {
      evt = stripeClient.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
    } catch {
      return new NextResponse('Invalid signature', { status: 400 })
    }

    if (evt.type === 'checkout.session.completed') {
      // TODO: map line items to credits and persist. Left as a no-op to avoid DB dependency.
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Webhook error' }, { status: 500 })
  }
}
