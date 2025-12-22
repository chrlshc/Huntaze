/**
 * OnlyFans Webhook Handler
 * Receives webhooks from OnlyFans and emits automation triggers
 * 
 * Requirements: 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { type WebhookPayload } from '@/lib/automations/webhook-integration';
import { computeWebhookExternalId, webhookProcessor } from '@/lib/services/webhookProcessor';

// ============================================
// Types
// ============================================

interface WebhookResponse {
  success: boolean;
  message: string;
  triggerEmitted?: boolean;
  triggerType?: string;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<WebhookResponse>> {
  try {
    const webhookSecret = process.env.ONLYFANS_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      return NextResponse.json(
        { success: false, message: 'OnlyFans webhook not configured' },
        { status: 503 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signatureHeader = request.headers.get('x-onlyfans-signature') || undefined;

    if (webhookSecret) {
      if (!signatureHeader) {
        return NextResponse.json(
          { success: false, message: 'Missing webhook signature' },
          { status: 401 }
        );
      }

      const isValid = webhookProcessor.verifySignature(
        'onlyfans',
        rawBody,
        signatureHeader,
        webhookSecret
      );

      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Parse the payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payload.event || !payload.data) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: event, data' },
        { status: 400 }
      );
    }

    // Allow legacy header-based creator attribution.
    if (!payload.data.creatorId) {
      const headerCreatorId = request.headers.get('x-creator-id');
      if (headerCreatorId) {
        payload.data.creatorId = headerCreatorId;
      }
    }

    const userId = Number(payload.data.creatorId || 0);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Missing creator ID' },
        { status: 400 }
      );
    }

    const eventType = payload.event;
    const externalId = computeWebhookExternalId({
      provider: 'onlyfans',
      eventType,
      rawBody,
      payload,
    });

    // Respond immediately and process asynchronously (idempotent via webhook_events table).
    const response = NextResponse.json({
      success: true,
      message: 'Webhook received',
    });

    setImmediate(async () => {
      try {
        await webhookProcessor.processEvent({
          provider: 'onlyfans',
          eventType,
          externalId,
          payload,
          signature: signatureHeader,
        });
      } catch (error) {
        console.error('OnlyFans webhook processing error:', error);
      }
    });

    return response;

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler (Health Check)
// ============================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'OnlyFans Webhook Handler',
    supportedEvents: [
      'subscription.created',
      'subscription.renewed',
      'subscription.expired',
      'subscription.expiring',
      'message.received',
      'purchase.completed',
      'tip.received'
    ]
  });
}
