import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface CreatorEarnings {
  userId: string;
  monthlyRevenue: number;
  platform: 'onlyfans' | 'fansly';
  period: {
    start: Date;
    end: Date;
  };
}

interface CommissionCharge {
  userId: string;
  subscriptionId: string;
  amount: number;
  description: string;
}

export class CommissionTracker {
  /**
   * Report creator earnings to calculate commission
   */
  static async reportEarnings(earnings: CreatorEarnings) {
    // In production, this would:
    // 1. Store earnings in database
    // 2. Calculate commission based on subscription tier
    // 3. Create usage record in Stripe
    
    try {
      // Get user's Stripe subscription
      const subscriptions = await stripe.subscriptions.list({
        limit: 1,
        // In production, lookup by user's stripe customer ID
      });

      if (!subscriptions.data.length) {
        throw new Error('No active subscription found');
      }

      const subscription = subscriptions.data[0];
      
      // Calculate commission
      const response = await fetch('/api/billing/calculate-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyRevenue: earnings.monthlyRevenue,
          subscriptionTier: this.getTierFromSubscription(subscription),
          accountAge: this.getAccountAge(earnings.userId),
        }),
      });

      const commission = await response.json();
      
      // Create usage record for commission
      if (commission.commission > 0) {
        await this.createCommissionCharge({
          userId: earnings.userId,
          subscriptionId: subscription.id,
          amount: commission.commission,
          description: `Commission for ${earnings.period.start.toLocaleDateString()} - ${earnings.period.end.toLocaleDateString()}`,
        });
      }

      return commission;
    } catch (error) {
      console.error('Failed to report earnings:', error);
      throw error;
    }
  }

  /**
   * Create a commission charge using Stripe
   */
  static async createCommissionCharge(charge: CommissionCharge) {
    try {
      // Option 1: Use Invoice Items for next invoice
      const invoiceItem = await stripe.invoiceItems.create({
        customer: await this.getCustomerId(charge.userId),
        amount: Math.round(charge.amount * 100), // Convert to cents
        currency: 'usd',
        description: charge.description,
      });

      // Option 2: Create immediate charge (uncomment if preferred)
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(charge.amount * 100),
      //   currency: 'usd',
      //   customer: await this.getCustomerId(charge.userId),
      //   description: charge.description,
      //   confirm: true,
      //   off_session: true,
      // });

      return invoiceItem;
    } catch (error) {
      console.error('Failed to create commission charge:', error);
      throw error;
    }
  }

  /**
   * Get tier from subscription (would query database in production)
   */
  private static getTierFromSubscription(subscription: Stripe.Subscription): string {
    const priceId = subscription.items.data[0]?.price.id;
    
    // Map price IDs to tiers
    const tierMap: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || '']: 'starter',
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '']: 'pro',
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE || '']: 'scale',
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || '']: 'enterprise',
    };
    
    return tierMap[priceId] || 'starter';
  }

  /**
   * Get account age in days (would query database in production)
   */
  private static getAccountAge(userId: string): number {
    // TODO: Query user creation date from database
    // For now, return 0 (new account)
    return 0;
  }

  /**
   * Get Stripe customer ID for user (would query database in production)
   */
  private static async getCustomerId(userId: string): Promise<string> {
    // TODO: Query customer ID from database
    // For now, throw error
    throw new Error('Customer ID lookup not implemented');
  }
}