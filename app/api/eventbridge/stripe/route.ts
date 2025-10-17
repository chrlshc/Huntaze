import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getStripe } from '@/lib/stripe';
import { updateSubscription } from '@/lib/db/users-dynamo';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { makeReqLogger } from '@/lib/logger';

export const runtime = 'nodejs';

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const USERS_TABLE = process.env.USERS_TABLE || '';

const eventBridge = new EventBridgeClient({ region: REGION });
const ddb = USERS_TABLE
  ? DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
  : null;

// This endpoint receives events from AWS EventBridge
// Configure EventBridge rule to trigger this when Stripe events arrive
export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Verify API key from EventBridge
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.EVENTBRIDGE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await request.json();
    
    // EventBridge wraps the Stripe event in detail
    // The structure from EventBridge is: { detail: stripeEvent }
    const stripeEvent = event.detail;

    // Idempotency guard: dedupe EventBridge deliveries by event.id with TTL entry
    // Use top-level logger; include eventId in props instead of recreating logger
    if (USERS_TABLE && ddb && event?.id) {
      const dedupKey = `evt#${String(event.id)}`;
      const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h
      try {
        await ddb.send(
          new PutCommand({
            TableName: USERS_TABLE,
            Item: { userId: dedupKey, ttl },
            ConditionExpression: 'attribute_not_exists(userId)',
          })
        );
      } catch (err: any) {
        const code = err?.name || err?.Code || '';
        if (code === 'ConditionalCheckFailedException') {
          log.info('event_dedup_skipped', { eventId: event.id });
          return NextResponse.json({ success: true, duplicate: true });
        }
        // If Dynamo not available or other error, continue processing to avoid drop
        log.warn('event_dedup_put_failed', { error: String(err?.name || 'error'), message: err?.message, eventId: event?.id });
      }
    }
    
    log.info('eventbridge_received', {
      source: String(event.source || ''),
      eventType: stripeEvent?.type,
      eventId: stripeEvent?.id,
    });
    
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        await handleCheckoutComplete(stripeEvent, log);
        break;
      }
      
      case 'invoice.created': {
        // This is where we add commission charges
        await handleInvoiceCreated(stripeEvent, log);
        break;
      }
      
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdate(stripeEvent, log);
        break;
      }
      case 'customer.subscription.created': {
        await handleSubscriptionUpdate(stripeEvent, log);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionUpdate(stripeEvent, log);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    log.error('eventbridge_handler_failed', { error: error?.message || 'unknown_error' });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(event: any, log: ReturnType<typeof makeReqLogger>) {
  const session = event.data.object;
  const userId = session.metadata?.userId || session.client_reference_id || null;
  // Optionally derive tier and update subscription after checkout
  if (userId && session.subscription) {
    try {
      const stripeClient = await getStripe();
      const sub = await stripeClient.subscriptions.retrieve(String(session.subscription), {
        expand: ['items.data.price.product'],
      });
      const price = sub.items.data[0]?.price;
      const tier = (price?.nickname || price?.id || 'unknown').toString();
      await updateSubscription(userId, sub.status, tier, sub.id);
    } catch (e: any) {
      log.error('checkout_completion_update_failed', { error: e?.message || 'unknown_error' });
    }
  }
}

async function handleInvoiceCreated(event: any, log: ReturnType<typeof makeReqLogger>) {
  const invoice = event.data.object;
  
  // Only process if this is a subscription invoice (not one-time)
  if (!invoice.subscription) return;
  
  // Get user's monthly earnings from database
  const userId = await getUserIdFromCustomer(invoice.customer);
  const monthlyEarnings = await getMonthlyEarnings(userId);
  
  if (monthlyEarnings > 0) {
    // Calculate commission
    const response = await fetch('/api/billing/calculate-commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EVENTBRIDGE_API_KEY || '' },
      body: JSON.stringify({
        monthlyRevenue: monthlyEarnings,
        subscriptionTier: await getUserTier(userId),
        accountAge: await getAccountAge(userId),
      }),
    });
    
    const { commission } = await response.json();
    
    // Add commission to the invoice
    if (commission > 0) {
      const stripeClient = await getStripe();
      await stripeClient.invoiceItems.create({
        customer: invoice.customer,
        invoice: invoice.id,
        amount: Math.round(commission * 100), // Convert to cents
        currency: 'usd',
        description: `Platform commission (${monthlyEarnings} earnings)`,
      });
    }
  }
}

async function handleSubscriptionUpdate(event: any, log: ReturnType<typeof makeReqLogger>) {
  const subscription = event.data.object;
  let userId = subscription?.metadata?.userId || null;
  if (!userId && subscription?.customer) {
    userId = await getUserIdFromCustomer(String(subscription.customer));
    if (!userId) {
      try {
        const stripeClient = await getStripe();
        const cust = await stripeClient.customers.retrieve(String(subscription.customer));
        userId = (cust as any)?.metadata?.userId ?? null;
      } catch {}
    }
  }
  if (!userId) return;
  const price = subscription.items?.data?.[0]?.price;
  const tier = (price?.nickname || price?.id || 'unknown').toString();
  await updateSubscription(userId, subscription.status, tier, subscription.id);
}

// Helper functions (implement with your database)
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  if (!USERS_TABLE || !ddb) return null;
  try {
    const out = await ddb.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'ByStripeCustomerId',
        KeyConditionExpression: 'stripeCustomerId = :c',
        ExpressionAttributeValues: { ':c': customerId },
        ProjectionExpression: 'userId',
        Limit: 1,
      })
    );
    return (out.Items?.[0] as any)?.userId ?? null;
  } catch {
    return null;
  }
}

async function getMonthlyEarnings(userId: string): Promise<number> {
  // Minimal placeholder: read last known earnings snapshot if present
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const TABLE = process.env.USERS_TABLE || '';
    if (!TABLE) return 0;
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
    const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
    const item: any = out.Item || {};
    const earnings = item?.lastMonthlyEarnings;
    return typeof earnings === 'number' ? earnings : 0;
  } catch {
    return 0;
  }
}

async function getUserTier(userId: string): Promise<string> {
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const TABLE = process.env.USERS_TABLE || '';
    if (!TABLE) return 'starter';
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
    const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
    const item: any = out.Item || {};
    return item?.subscriptionTier || 'starter';
  } catch {
    return 'starter';
  }
}

async function getAccountAge(userId: string): Promise<number> {
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    const TABLE = process.env.USERS_TABLE || '';
    if (!TABLE) return 0;
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
    const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
    const item: any = out.Item || {};
    const createdAtIso = item?.createdAt || item?.joinedAt;
    if (!createdAtIso) return 0;
    const created = new Date(createdAtIso).getTime();
    const days = Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000));
    return isNaN(days) ? 0 : days;
  } catch {
    return 0;
  }
}

async function updateUserSubscription(userId: string, data: any): Promise<void> {
  const tier = data?.tier || null;
  const status = data?.status || 'active';
  const subscriptionId = data?.subscriptionId || null;
  await updateSubscription(userId, status, tier, subscriptionId);
}

function getTierFromPriceId(priceId: string): string {
  const tierMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
    [process.env.STRIPE_PRICE_PRO || '']: 'pro',
    [process.env.STRIPE_PRICE_SCALE || '']: 'scale',
  };
  return tierMap[priceId] || 'starter';
}
