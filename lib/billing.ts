import type Stripe from 'stripe';
import { getStripe } from './stripe';
import { getUserById, setStripeCustomer } from './db/users-dynamo';

export async function getOrCreateCustomer(userId: string, email?: string): Promise<Stripe.Customer> {
  const stripe = await getStripe();
  const record = await getUserById(userId);
  if (record?.stripeCustomerId) {
    return (await stripe.customers.retrieve(record.stripeCustomerId)) as Stripe.Customer;
  }
  const customer = await stripe.customers.create({ email, metadata: { userId } });
  await setStripeCustomer(userId, customer.id);
  return customer as Stripe.Customer;
}
