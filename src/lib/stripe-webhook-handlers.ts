import Stripe from 'stripe';

// Webhook handler types
type WebhookHandler = (event: Stripe.Event) => Promise<void>;

interface WebhookHandlers {
  [key: string]: WebhookHandler;
}

// Failed payment retry configuration
const PAYMENT_RETRY_CONFIG = {
  maxAttempts: 4,
  notificationSchedule: {
    1: 'initial_failure',
    2: 'second_attempt',
    3: 'final_warning',
    4: 'subscription_suspended'
  }
};

// Email notification types
export async function sendPaymentNotification(
  customerId: string, 
  type: 'initial_failure' | 'second_attempt' | 'final_warning' | 'subscription_suspended',
  details?: any
) {
  console.log(`Sending ${type} notification to customer ${customerId}`, details);
  
  // TODO: Implement actual email sending
  // const customer = await getCustomerById(customerId);
  // const template = getEmailTemplate(type);
  // await sendEmail(customer.email, template, details);
}

// Webhook handlers
export const webhookHandlers: WebhookHandlers = {
  'checkout.session.completed': async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (!session.client_reference_id) {
      throw new Error('Missing client_reference_id in checkout session');
    }
    
    const userId = session.client_reference_id;
    const metadata = {
      userId,
      customerId: session.customer as string,
      subscriptionId: session.subscription as string,
      plan: session.metadata?.plan || 'unknown',
      billingInterval: session.metadata?.billingInterval || 'monthly',
    };
    
    console.log('Processing new subscription:', metadata);
    
    // TODO: Create user subscription record
    // await createSubscription(metadata);
    
    // TODO: Send welcome email with onboarding tips
    // await sendWelcomeEmail(userId, metadata.plan);
    
    // TODO: Track conversion in analytics
    // await trackEvent('subscription_created', metadata);
  },

  'customer.subscription.updated': async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    const previousAttributes = event.data.previous_attributes as any;
    
    // Check what changed
    const changes = {
      statusChanged: previousAttributes?.status !== undefined,
      planChanged: previousAttributes?.items !== undefined,
      cancelationChanged: previousAttributes?.cancel_at_period_end !== undefined,
    };
    
    console.log('Subscription updated:', {
      subscriptionId: subscription.id,
      changes,
      newStatus: subscription.status,
    });
    
    // Handle plan upgrades/downgrades
    if (changes.planChanged) {
      const newPlan = subscription.items.data[0]?.price.metadata?.plan || 'unknown';
      const oldPlan = previousAttributes?.items?.data[0]?.price.metadata?.plan;
      
      console.log(`Plan changed from ${oldPlan} to ${newPlan}`);
      
      // TODO: Update user permissions based on new plan
      // await updateUserPlan(subscription.metadata.userId, newPlan);
    }
    
    // Handle reactivation
    if (changes.cancelationChanged && !subscription.cancel_at_period_end) {
      console.log('Subscription reactivated');
      // TODO: Send reactivation confirmation
      // await sendReactivationEmail(subscription.metadata.userId);
    }
  },

  'invoice.payment_failed': async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    const attemptCount = invoice.attempt_count || 1;
    const notificationType = (PAYMENT_RETRY_CONFIG.notificationSchedule as any)[attemptCount];
    
    if (notificationType) {
      await sendPaymentNotification(
        invoice.customer as string,
        notificationType as any,
        {
          amount: invoice.amount_due,
          currency: invoice.currency,
          attemptCount,
          nextRetry: invoice.next_payment_attempt 
            ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
            : null,
        }
      );
    }
    
    // Update subscription status based on attempts
    if (attemptCount >= PAYMENT_RETRY_CONFIG.maxAttempts) {
      console.log('Max payment attempts reached, suspending subscription');
      // TODO: Suspend user access
      // await suspendUserAccess(invoice.subscription as string);
    }
  },

  'customer.subscription.deleted': async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log('Subscription cancelled:', {
      subscriptionId: subscription.id,
      reason: subscription.cancellation_details?.reason || 'customer_request',
    });
    
    // TODO: Handle cancellation
    // await handleCancellation(subscription.id, subscription.metadata.userId);
    
    // TODO: Send cancellation survey
    // if (subscription.cancellation_details?.reason === 'cancellation_requested') {
    //   await sendCancellationSurvey(subscription.metadata.userId);
    // }
  },

  'payment_method.attached': async (event) => {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    
    // Update default payment method if it's the first one
    console.log('Payment method attached:', {
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
      customerId: paymentMethod.customer,
    });
    
    // TODO: Set as default if customer has no default
    // const customer = await stripe.customers.retrieve(paymentMethod.customer as string);
    // if (!customer.invoice_settings.default_payment_method) {
    //   await stripe.customers.update(paymentMethod.customer as string, {
    //     invoice_settings: { default_payment_method: paymentMethod.id }
    //   });
    // }
  },
};

// Process webhook with proper error handling
export async function processWebhook(event: Stripe.Event): Promise<void> {
  const handler = webhookHandlers[event.type];
  
  if (!handler) {
    console.log(`No handler for event type: ${event.type}`);
    return;
  }
  
  try {
    await handler(event);
    console.log(`Successfully processed ${event.type}`);
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
    // Re-throw to let webhook endpoint handle retry logic
    throw error;
  }
}