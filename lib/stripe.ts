import Stripe from 'stripe';
import { getSecretFromEnv } from './aws/secrets';

let stripeClient: Stripe | null = null;
let stripePromise: Promise<Stripe> | null = null;

async function initialiseStripe(): Promise<Stripe> {
  const apiKey = await getSecretFromEnv({
    directValueEnv: 'STRIPE_SECRET_KEY',
    secretNameEnv: 'STRIPE_SECRET_KEY_SECRET_NAME',
    defaultSecretName: 'stripe-secret-key',
  });

  return new Stripe(apiKey, { apiVersion: '2023-10-16' });
}

export async function getStripe(): Promise<Stripe> {
  if (stripeClient) {
    return stripeClient;
  }

  if (!stripePromise) {
    stripePromise = initialiseStripe()
      .then((client) => {
        stripeClient = client;
        return client;
      })
      .catch((error) => {
        stripePromise = null;
        throw error;
      });
  }

  return stripePromise;
}

export const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || '';
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || '';
export const STRIPE_PRICE_SCALE = process.env.STRIPE_PRICE_SCALE || '';
