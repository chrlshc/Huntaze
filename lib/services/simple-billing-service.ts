import Stripe from 'stripe';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreatePortalSessionParams {
  userId: string;
  returnUrl?: string;
}

export class SimpleBillingService {
  /**
   * Create a Stripe checkout session for a user
   */
  static async createCheckoutSession({
    userId,
    priceId,
    successUrl = `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancelUrl = `${process.env.NEXT_PUBLIC_URL}/pricing`
  }: CreateCheckoutSessionParams): Promise<string> {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create or use existing Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return session.url;
  }

  /**
   * Create a Stripe customer portal session
   */
  static async createPortalSession({
    userId,
    returnUrl = `${process.env.NEXT_PUBLIC_URL}/dashboard`
  }: CreatePortalSessionParams): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found for user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Handle Stripe webhooks
   */
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    console.log(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle successful checkout completion
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    const subscriptionId = session.subscription as string;
    
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session');
      return;
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = this.getPlanFromSubscription(subscription);

    // Update user subscription in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: plan,
        stripeCustomerId: session.customer as string,
        subscriptionRecord: {
          upsert: {
            create: {
              stripeSubscriptionId: subscriptionId,
              status: 'ACTIVE',
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              status: 'ACTIVE',
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            }
          }
        }
      }
    });

    console.log(`Subscription activated for user ${userId}: ${plan}`);
  }

  /**
   * Handle subscription updates
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    const plan = this.getPlanFromSubscription(subscription);
    const status = this.mapStripeStatus(subscription.status);

    // Update user and subscription record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription: status === 'ACTIVE' ? plan : 'FREE',
        subscriptionRecord: {
          upsert: {
            create: {
              stripeSubscriptionId: subscription.id,
              status,
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
              status,
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            }
          }
        }
      }
    });

    console.log(`Subscription updated for user ${user.id}: ${plan} (${status})`);
  }

  /**
   * Handle subscription deletion
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    // Downgrade user to free plan
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription: 'FREE',
        subscriptionRecord: {
          update: {
            status: 'CANCELED'
          }
        }
      }
    });

    console.log(`Subscription canceled for user ${user.id}`);
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    // Update subscription status to active if it was past due
    await prisma.subscriptionRecord.updateMany({
      where: { 
        userId: user.id,
        status: 'PAST_DUE'
      },
      data: {
        status: 'ACTIVE'
      }
    });

    console.log(`Payment succeeded for user ${user.id}`);
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    // Mark subscription as past due
    await prisma.subscriptionRecord.updateMany({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      data: {
        status: 'PAST_DUE'
      }
    });

    console.log(`Payment failed for user ${user.id}`);
  }

  /**
   * Get plan type from Stripe subscription
   */
  private static getPlanFromSubscription(subscription: Stripe.Subscription): 'FREE' | 'PRO' | 'ENTERPRISE' {
    const priceId = subscription.items.data[0]?.price.id;
    
    // Map Stripe price IDs to plan types
    const priceMap: Record<string, 'FREE' | 'PRO' | 'ENTERPRISE'> = {
      [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'PRO',
      [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]: 'PRO',
      [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!]: 'ENTERPRISE',
      [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!]: 'ENTERPRISE',
    };

    return priceMap[priceId || ''] || 'FREE';
  }

  /**
   * Map Stripe subscription status to our internal status
   */
  private static mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'canceled':
      case 'incomplete_expired':
        return 'CANCELED';
      case 'past_due':
        return 'PAST_DUE';
      case 'unpaid':
      case 'incomplete':
        return 'UNPAID';
      default:
        return 'CANCELED';
    }
  }

  /**
   * Get user's current subscription info
   */
  static async getUserSubscription(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptionRecord: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      subscription: user.subscription,
      subscriptionRecord: user.subscriptionRecord,
      stripeCustomerId: user.stripeCustomerId
    };
  }

  /**
   * Check if user has access to a feature
   */
  static hasFeatureAccess(
    subscription: 'FREE' | 'PRO' | 'ENTERPRISE',
    feature: string
  ): boolean {
    const featureMap = {
      FREE: ['basic_content', 'limited_ai'],
      PRO: ['basic_content', 'unlimited_ai', 'analytics', 'scheduling'],
      ENTERPRISE: ['basic_content', 'unlimited_ai', 'analytics', 'scheduling', 'api_access', 'priority_support']
    };

    return featureMap[subscription].includes(feature);
  }

  /**
   * Get usage limits for a subscription
   */
  static getUsageLimits(subscription: 'FREE' | 'PRO' | 'ENTERPRISE') {
    const limits = {
      FREE: {
        aiGenerations: 5,
        storage: 100, // MB
        apiCalls: 0
      },
      PRO: {
        aiGenerations: -1, // Unlimited
        storage: 5000, // MB
        apiCalls: 1000
      },
      ENTERPRISE: {
        aiGenerations: -1, // Unlimited
        storage: 50000, // MB
        apiCalls: 10000
      }
    };

    return limits[subscription];
  }
}