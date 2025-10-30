export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    assets: number;
    campaigns: number;
    apiCalls: number;
  };
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutSessionData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface PortalSessionData {
  customerId: string;
  returnUrl: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

// Mock Stripe objects
const mockStripeCustomer = {
  id: 'cus_mock123',
  email: 'test@example.com',
  name: 'Test User',
  created: Math.floor(Date.now() / 1000),
};

const mockStripeSubscription = {
  id: 'sub_mock123',
  customer: 'cus_mock123',
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  items: {
    data: [
      {
        price: {
          id: 'price_pro_monthly',
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month' }
        }
      }
    ]
  }
};

// Mock data
const subscriptionPlans: Map<string, SubscriptionPlan> = new Map([
  ['free', {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: ['Basic content creation', '5 assets', '1 campaign'],
    limits: { assets: 5, campaigns: 1, apiCalls: 100 }
  }],
  ['pro', {
    id: 'pro',
    name: 'Pro',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: ['Advanced AI tools', '100 assets', '10 campaigns', 'Priority support'],
    limits: { assets: 100, campaigns: 10, apiCalls: 1000 }
  }],
  ['enterprise', {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'usd',
    interval: 'month',
    features: ['Unlimited assets', 'Unlimited campaigns', 'Custom integrations', '24/7 support'],
    limits: { assets: -1, campaigns: -1, apiCalls: -1 }
  }]
]);

const userSubscriptions: Map<string, UserSubscription> = new Map();
const priceIdToPlanMap: Map<string, string> = new Map([
  ['price_free', 'free'],
  ['price_pro_monthly', 'pro'],
  ['price_pro_yearly', 'pro'],
  ['price_enterprise_monthly', 'enterprise'],
  ['price_enterprise_yearly', 'enterprise']
]);

// Initialize test data
userSubscriptions.set('user-1', {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'free',
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date()
});

export class SimpleBillingService {
  // Create Stripe checkout session
  async createCheckoutSession(data: CheckoutSessionData): Promise<{ url: string; sessionId: string }> {
    // Simulate Stripe checkout session creation
    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock successful response
    return {
      url: `https://checkout.stripe.com/pay/${sessionId}`,
      sessionId
    };
  }

  // Create Stripe customer portal session
  async createPortalSession(data: PortalSessionData): Promise<{ url: string }> {
    // Simulate Stripe portal session creation
    return {
      url: `https://billing.stripe.com/session/${data.customerId}`
    };
  }

  // Handle Stripe webhooks
  async handleWebhook(event: WebhookEvent): Promise<{ processed: boolean; message?: string }> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          return this.handleSubscriptionCreated(event.data);
        
        case 'customer.subscription.updated':
          return this.handleSubscriptionUpdated(event.data);
        
        case 'customer.subscription.deleted':
          return this.handleSubscriptionDeleted(event.data);
        
        case 'invoice.payment_succeeded':
          return this.handlePaymentSucceeded(event.data);
        
        case 'invoice.payment_failed':
          return this.handlePaymentFailed(event.data);
        
        case 'customer.created':
          return this.handleCustomerCreated(event.data);
        
        case 'customer.updated':
          return this.handleCustomerUpdated(event.data);
        
        case 'customer.deleted':
          return this.handleCustomerDeleted(event.data);
        
        default:
          return { processed: false, message: `Unhandled event type: ${event.type}` };
      }
    } catch (error) {
      return { 
        processed: false, 
        message: error instanceof Error ? error.message : 'Webhook processing failed' 
      };
    }
  }

  // Get user subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const subscription = userSubscriptions.get(userId);
    return subscription ? { ...subscription } : null;
  }

  // Check if user has access to a feature
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || subscription.status !== 'active') {
      return false;
    }
    
    const plan = subscriptionPlans.get(subscription.planId);
    if (!plan) return false;
    
    // Check feature access based on plan
    switch (feature) {
      case 'ai_tools':
        return ['pro', 'enterprise'].includes(plan.id);
      case 'unlimited_assets':
        return plan.id === 'enterprise';
      case 'priority_support':
        return ['pro', 'enterprise'].includes(plan.id);
      case 'custom_integrations':
        return plan.id === 'enterprise';
      default:
        return true; // Basic features available to all
    }
  }

  // Get usage limits for user
  async getUsageLimits(userId: string): Promise<SubscriptionPlan['limits'] | null> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return null;
    
    const plan = subscriptionPlans.get(subscription.planId);
    return plan ? { ...plan.limits } : null;
  }

  // Map Stripe price ID to plan
  mapPriceIdToPlan(priceId: string): string | null {
    return priceIdToPlanMap.get(priceId) || null;
  }

  // Map Stripe subscription status
  mapStripeStatus(stripeStatus: string): UserSubscription['status'] {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'past_due':
        return 'past_due';
      case 'unpaid':
        return 'unpaid';
      default:
        return 'canceled';
    }
  }

  // Private webhook handlers
  private async handleSubscriptionCreated(subscriptionData: any): Promise<{ processed: boolean; message?: string }> {
    const planId = this.mapPriceIdToPlan(subscriptionData.items.data[0].price.id);
    if (!planId) {
      return { processed: false, message: 'Unknown price ID' };
    }

    // Create or update user subscription
    const subscription: UserSubscription = {
      id: `sub_${Date.now()}`,
      userId: subscriptionData.customer, // Assuming customer ID maps to user ID
      planId,
      status: this.mapStripeStatus(subscriptionData.status),
      currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      stripeSubscriptionId: subscriptionData.id,
      stripeCustomerId: subscriptionData.customer,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userSubscriptions.set(subscription.userId, subscription);
    return { processed: true };
  }

  private async handleSubscriptionUpdated(subscriptionData: any): Promise<{ processed: boolean; message?: string }> {
    const existingSubscription = userSubscriptions.get(subscriptionData.customer);
    if (!existingSubscription) {
      return { processed: false, message: 'Subscription not found' };
    }

    const planId = this.mapPriceIdToPlan(subscriptionData.items.data[0].price.id);
    if (!planId) {
      return { processed: false, message: 'Unknown price ID' };
    }

    const updatedSubscription: UserSubscription = {
      ...existingSubscription,
      planId,
      status: this.mapStripeStatus(subscriptionData.status),
      currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      updatedAt: new Date()
    };

    userSubscriptions.set(updatedSubscription.userId, updatedSubscription);
    return { processed: true };
  }

  private async handleSubscriptionDeleted(subscriptionData: any): Promise<{ processed: boolean; message?: string }> {
    const existingSubscription = userSubscriptions.get(subscriptionData.customer);
    if (!existingSubscription) {
      return { processed: false, message: 'Subscription not found' };
    }

    const updatedSubscription: UserSubscription = {
      ...existingSubscription,
      status: 'canceled',
      updatedAt: new Date()
    };

    userSubscriptions.set(updatedSubscription.userId, updatedSubscription);
    return { processed: true };
  }

  private async handlePaymentSucceeded(invoiceData: any): Promise<{ processed: boolean; message?: string }> {
    // Update subscription status if needed
    const subscription = userSubscriptions.get(invoiceData.customer);
    if (subscription && subscription.status !== 'active') {
      subscription.status = 'active';
      subscription.updatedAt = new Date();
      userSubscriptions.set(subscription.userId, subscription);
    }
    
    return { processed: true };
  }

  private async handlePaymentFailed(invoiceData: any): Promise<{ processed: boolean; message?: string }> {
    // Update subscription status to past_due
    const subscription = userSubscriptions.get(invoiceData.customer);
    if (subscription) {
      subscription.status = 'past_due';
      subscription.updatedAt = new Date();
      userSubscriptions.set(subscription.userId, subscription);
    }
    
    return { processed: true };
  }

  private async handleCustomerCreated(customerData: any): Promise<{ processed: boolean; message?: string }> {
    // Handle customer creation if needed
    return { processed: true };
  }

  private async handleCustomerUpdated(customerData: any): Promise<{ processed: boolean; message?: string }> {
    // Handle customer updates if needed
    return { processed: true };
  }

  private async handleCustomerDeleted(customerData: any): Promise<{ processed: boolean; message?: string }> {
    // Handle customer deletion if needed
    return { processed: true };
  }

  // Get all available plans
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return Array.from(subscriptionPlans.values());
  }

  // Get plan by ID
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const plan = subscriptionPlans.get(planId);
    return plan ? { ...plan } : null;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check
      return subscriptionPlans.size > 0;
    } catch (error) {
      return false;
    }
  }

  // Get service metrics
  async getMetrics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    planBreakdown: Record<string, number>;
    revenue: number;
  }> {
    const subscriptions = Array.from(userSubscriptions.values());
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    const planBreakdown = subscriptions.reduce((acc, sub) => {
      acc[sub.planId] = (acc[sub.planId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const revenue = activeSubscriptions.reduce((total, sub) => {
      const plan = subscriptionPlans.get(sub.planId);
      return total + (plan ? plan.price : 0);
    }, 0);
    
    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      planBreakdown,
      revenue
    };
  }
}

// Export singleton instance
export const simpleBillingService = new SimpleBillingService();
export default simpleBillingService;