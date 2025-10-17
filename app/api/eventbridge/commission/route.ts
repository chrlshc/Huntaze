import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { makeReqLogger } from '@/lib/logger';

import { getStripe } from '@/lib/stripe';

const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const USERS_TABLE = process.env.USERS_TABLE || '';
const ddb = USERS_TABLE
  ? DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
  : null as any;

// This endpoint is triggered monthly to add commission charges
export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.EVENTBRIDGE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const { userId, monthlyEarnings, subscriptionTier } = raw;
    const evtId: string | undefined = raw?.id;
    // Use top-level logger, include evtId in props rather than recreating

    // Optional idempotency via EventBridge event id if present
    if (evtId && USERS_TABLE && ddb) {
      const dedupKey = `evt#${evtId}`;
      const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h
      try {
        await ddb.send(new PutCommand({
          TableName: USERS_TABLE,
          Item: { userId: dedupKey, ttl, kind: 'commission_evt' },
          ConditionExpression: 'attribute_not_exists(userId)',
        }));
      } catch (e: any) {
        const name = e?.name || '';
        if (name === 'ConditionalCheckFailedException') {
          log.info('event_dedup_skipped', { eventId: evtId });
          return NextResponse.json({ success: true, duplicate: true });
        }
        log.warn('commission_dedup_put_failed', { error: String(e?.name || 'error'), message: e?.message, eventId: evtId });
      }
    }

    // Calculate commission
    const commissionResponse = await fetch('/api/billing/calculate-commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.EVENTBRIDGE_API_KEY || '' },
      body: JSON.stringify({
        monthlyRevenue: monthlyEarnings,
        subscriptionTier,
        accountAge: 30, // TODO: Get from database
      }),
    });

    const { commission, breakdown } = await commissionResponse.json();

    if (commission > 0) {
      // Get user's Stripe customer ID (from database)
      const customerId = await getStripeCustomerId(userId);
      
      // Create invoice item for next billing cycle
      const stripeClient = await getStripe();
      await stripeClient.invoiceItems.create({
        customer: customerId,
        amount: Math.round(commission * 100), // Convert to cents
        currency: 'usd',
        description: `Platform commission - ${breakdown.notes.join(', ')}`,
        metadata: {
          userId,
          monthlyEarnings: monthlyEarnings.toString(),
          tier: subscriptionTier,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      commission,
      breakdown 
    });
  } catch (error: any) {
    log.error('commission_billing_failed', { error: error?.message || 'unknown_error' });
    return NextResponse.json({ error: 'Failed to process commission' }, { status: 500 });
  }
}

async function getStripeCustomerId(userId: string): Promise<string> {
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, GetCommand } = await import('@aws-sdk/lib-dynamodb');
  const REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
  const TABLE = process.env.USERS_TABLE || '';
  if (!TABLE) throw new Error('USERS_TABLE not configured');
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
  const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
  const item: any = out.Item || {};
  if (!item?.stripeCustomerId) throw new Error('Stripe customerId not found');
  return String(item.stripeCustomerId);
}
