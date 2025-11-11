import Stripe from 'stripe'

export const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || ''
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || ''
export const STRIPE_PRICE_SCALE = process.env.STRIPE_PRICE_SCALE || ''

let stripeSingleton: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (stripeSingleton) return stripeSingleton
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw Object.assign(new Error('Stripe not configured'), { code: 'E_STRIPE_MISSING_KEY' })
  }
  // Use a Stripe API version compatible with the installed SDK typings
  stripeSingleton = new Stripe(key, { apiVersion: '2023-10-16' })
  return stripeSingleton
}
