import { Context, EventBridgeEvent } from 'aws-lambda';

/**
 * Types pour les événements Stripe de billing/abonnements
 */
interface StripeBillingEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: {
      id: string;
      object: string;
      customer?: string;
      subscription?: string;
      status?: string;
      metadata?: Record<string, string>;
      // Propriétés spécifiques selon le type d'événement
      [key: string]: any;
    };
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

/**
 * Handler pour traiter les événements de billing/abonnements Stripe
 */
export const handler = async (
  event: EventBridgeEvent<string, StripeBillingEvent>,
  context: Context
): Promise<{ statusCode: number; body: string }> => {
  console.log('📊 Événement de billing Stripe reçu', {
    eventType: event['detail-type'],
    stripeEventId: event.detail.id,
    requestId: context.awsRequestId
  });

  const stripeEvent = event.detail;
  const eventType = event['detail-type'];
  const billingObject = stripeEvent.data.object;

  try {
    // Idempotence : vérifier si cet événement a déjà été traité
    const isAlreadyProcessed = await checkIfEventProcessed(stripeEvent.id);
    if (isAlreadyProcessed) {
      console.log('✅ Événement déjà traité, ignoré', { stripeEventId: stripeEvent.id });
      return { statusCode: 200, body: 'Event already processed' };
    }

    // Router selon le type d'événement
    switch (eventType) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(billingObject);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(billingObject);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(billingObject);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(billingObject);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(billingObject);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(billingObject);
        break;

      case 'invoice.payment_action_required':
        await handleInvoicePaymentActionRequired(billingObject);
        break;

      case 'customer.created':
        await handleCustomerCreated(billingObject);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(billingObject);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(billingObject);
        break;

      default:
        console.log('⚠️ Type d\'événement non géré', { eventType });
        break;
    }

    // Marquer l'événement comme traité
    await markEventAsProcessed(stripeEvent.id, eventType);

    console.log('✅ Événement traité avec succès', {
      stripeEventId: stripeEvent.id,
      eventType
    });

    return { statusCode: 200, body: 'Event processed successfully' };

  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'événement', {
      stripeEventId: stripeEvent.id,
      eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Re-lancer l'erreur pour déclencher les retries EventBridge
    throw error;
  }
};

/**
 * Traite la création d'un abonnement
 */
async function handleSubscriptionCreated(subscription: any): Promise<void> {
  console.log('🆕 Nouvel abonnement créé', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    plan: subscription.items?.data[0]?.price?.id
  });

  await callHuntazeAPI('/api/billing/subscription-created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    priceId: subscription.items?.data[0]?.price?.id,
    metadata: subscription.metadata
  });
}

/**
 * Traite la mise à jour d'un abonnement
 */
async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  console.log('🔄 Abonnement mis à jour', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });

  await callHuntazeAPI('/api/billing/subscription-updated', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    priceId: subscription.items?.data[0]?.price?.id,
    metadata: subscription.metadata
  });
}

/**
 * Traite la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  console.log('🗑️ Abonnement supprimé', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    canceledAt: subscription.canceled_at
  });

  await callHuntazeAPI('/api/billing/subscription-deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    canceledAt: subscription.canceled_at,
    metadata: subscription.metadata
  });
}

/**
 * Traite la fin prochaine d'un essai gratuit
 */
async function handleTrialWillEnd(subscription: any): Promise<void> {
  console.log('⏰ Fin d\'essai gratuit prochaine', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    trialEnd: subscription.trial_end
  });

  await callHuntazeAPI('/api/billing/trial-will-end', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    trialEnd: subscription.trial_end,
    metadata: subscription.metadata
  });
}

/**
 * Traite une facture payée
 */
async function handleInvoicePaid(invoice: any): Promise<void> {
  console.log('💳 Facture payée', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid,
    currency: invoice.currency
  });

  await callHuntazeAPI('/api/billing/invoice-paid', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    metadata: invoice.metadata
  });
}

/**
 * Traite un échec de paiement de facture
 */
async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  console.log('❌ Échec de paiement de facture', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amountDue: invoice.amount_due,
    attemptCount: invoice.attempt_count
  });

  await callHuntazeAPI('/api/billing/invoice-payment-failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amountDue: invoice.amount_due,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt,
    metadata: invoice.metadata
  });
}

/**
 * Traite une facture nécessitant une action de paiement
 */
async function handleInvoicePaymentActionRequired(invoice: any): Promise<void> {
  console.log('🔐 Action de paiement requise', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    hostedInvoiceUrl: invoice.hosted_invoice_url
  });

  await callHuntazeAPI('/api/billing/invoice-payment-action-required', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    metadata: invoice.metadata
  });
}

/**
 * Traite la création d'un client
 */
async function handleCustomerCreated(customer: any): Promise<void> {
  console.log('👤 Nouveau client créé', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name
  });

  await callHuntazeAPI('/api/billing/customer-created', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    metadata: customer.metadata
  });
}

/**
 * Traite la mise à jour d'un client
 */
async function handleCustomerUpdated(customer: any): Promise<void> {
  console.log('🔄 Client mis à jour', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name
  });

  await callHuntazeAPI('/api/billing/customer-updated', {
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    metadata: customer.metadata
  });
}

/**
 * Traite la suppression d'un client
 */
async function handleCustomerDeleted(customer: any): Promise<void> {
  console.log('🗑️ Client supprimé', {
    customerId: customer.id
  });

  await callHuntazeAPI('/api/billing/customer-deleted', {
    customerId: customer.id,
    metadata: customer.metadata
  });
}

/**
 * Vérifie si un événement a déjà été traité (idempotence)
 */
async function checkIfEventProcessed(stripeEventId: string): Promise<boolean> {
  // TODO: Implémenter avec DynamoDB ou base de données
  // Pour l'instant, on assume que tous les événements sont nouveaux
  return false;
}

/**
 * Marque un événement comme traité
 */
async function markEventAsProcessed(stripeEventId: string, eventType: string): Promise<void> {
  // TODO: Implémenter avec DynamoDB ou base de données
  console.log('📝 Marquage événement comme traité', { stripeEventId, eventType });
}

/**
 * Appelle l'API Huntaze
 */
async function callHuntazeAPI(endpoint: string, data: any): Promise<any> {
  const huntazeApiUrl = process.env.HUNTAZE_API_URL;
  
  if (!huntazeApiUrl) {
    console.warn('⚠️ HUNTAZE_API_URL non configurée, simulation d\'appel API');
    return;
  }

  try {
    const response = await fetch(`${huntazeApiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUNTAZE_API_KEY || ''}`,
        'User-Agent': 'Huntaze-StripeEventBridge/1.0'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'appel API Huntaze', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}