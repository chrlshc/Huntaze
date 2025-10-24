import { Context, EventBridgeEvent } from 'aws-lambda';

/**
 * Types pour les événements Stripe de paiement
 */
interface StripePaymentEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: {
      id: string;
      object: string;
      amount?: number;
      currency?: string;
      customer?: string;
      metadata?: Record<string, string>;
      status?: string;
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
 * Handler pour traiter les événements de paiement Stripe
 * Reçoit l'événement EventBridge contenant l'event Stripe dans `detail`
 */
export const handler = async (
  event: EventBridgeEvent<string, StripePaymentEvent>,
  context: Context
): Promise<{ statusCode: number; body: string }> => {
  console.log('🎯 Événement de paiement Stripe reçu', {
    eventType: event['detail-type'],
    stripeEventId: event.detail.id,
    requestId: context.awsRequestId
  });

  const stripeEvent = event.detail;
  const eventType = event['detail-type'];
  const paymentObject = stripeEvent.data.object;

  try {
    // Idempotence : vérifier si cet événement a déjà été traité
    const isAlreadyProcessed = await checkIfEventProcessed(stripeEvent.id);
    if (isAlreadyProcessed) {
      console.log('✅ Événement déjà traité, ignoré', { stripeEventId: stripeEvent.id });
      return { statusCode: 200, body: 'Event already processed' };
    }

    // Router selon le type d'événement
    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(paymentObject);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(paymentObject);
        break;

      case 'payment_intent.payment_failed':
      case 'charge.failed':
        await handlePaymentFailed(paymentObject);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(paymentObject);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(paymentObject);
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
 * Traite un paiement réussi
 */
async function handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
  console.log('💰 Traitement paiement réussi', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.customer
  });

  // TODO: Implémenter la logique métier
  // - Activer l'abonnement utilisateur
  // - Créditer le solde
  // - Envoyer email de confirmation
  // - Mettre à jour la base de données Huntaze

  try {
    // Exemple d'appel à l'API Huntaze
    await callHuntazeAPI('/api/billing/payment-succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customerId: paymentIntent.customer,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Erreur lors de l\'appel API Huntaze', error);
    throw error;
  }
}

/**
 * Traite une session de checkout complétée
 */
async function handleCheckoutSessionCompleted(session: any): Promise<void> {
  console.log('🛒 Session de checkout complétée', {
    sessionId: session.id,
    customer: session.customer,
    subscription: session.subscription,
    mode: session.mode
  });

  // TODO: Implémenter selon le mode (subscription, payment, setup)
  if (session.mode === 'subscription') {
    // Nouveau abonnement créé
    await callHuntazeAPI('/api/billing/subscription-created', {
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
      metadata: session.metadata
    });
  } else if (session.mode === 'payment') {
    // Paiement unique
    await callHuntazeAPI('/api/billing/one-time-payment', {
      sessionId: session.id,
      customerId: session.customer,
      paymentIntentId: session.payment_intent,
      metadata: session.metadata
    });
  }
}

/**
 * Traite un échec de paiement
 */
async function handlePaymentFailed(paymentObject: any): Promise<void> {
  console.log('❌ Échec de paiement', {
    objectId: paymentObject.id,
    customer: paymentObject.customer,
    amount: paymentObject.amount,
    failureCode: paymentObject.last_payment_error?.code,
    failureMessage: paymentObject.last_payment_error?.message
  });

  // TODO: Implémenter la logique d'échec
  // - Notifier l'utilisateur
  // - Suspendre l'abonnement si nécessaire
  // - Programmer des relances

  await callHuntazeAPI('/api/billing/payment-failed', {
    objectId: paymentObject.id,
    customerId: paymentObject.customer,
    amount: paymentObject.amount,
    failureReason: paymentObject.last_payment_error,
    metadata: paymentObject.metadata
  });
}

/**
 * Traite une annulation de paiement
 */
async function handlePaymentCanceled(paymentIntent: any): Promise<void> {
  console.log('🚫 Paiement annulé', {
    paymentIntentId: paymentIntent.id,
    customer: paymentIntent.customer,
    amount: paymentIntent.amount
  });

  await callHuntazeAPI('/api/billing/payment-canceled', {
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer,
    amount: paymentIntent.amount,
    metadata: paymentIntent.metadata
  });
}

/**
 * Traite une session de checkout expirée
 */
async function handleCheckoutSessionExpired(session: any): Promise<void> {
  console.log('⏰ Session de checkout expirée', {
    sessionId: session.id,
    customer: session.customer
  });

  await callHuntazeAPI('/api/billing/checkout-expired', {
    sessionId: session.id,
    customerId: session.customer,
    metadata: session.metadata
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