/**
 * OnlyFans Webhook Handler
 * Receives webhooks from OnlyFans and emits automation triggers
 * 
 * Requirements: 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processWebhook,
  verifyWebhookSignature,
  WebhookPayload
} from '@/lib/automations/webhook-integration';

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
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signature = request.headers.get('x-onlyfans-signature') || '';
    const webhookSecret = process.env.ONLYFANS_WEBHOOK_SECRET || '';
    
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
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

    // Extract userId from payload or headers
    const userId = Number(payload.data.creatorId || request.headers.get('x-creator-id') || 0);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing creator ID' },
        { status: 400 }
      );
    }

    // Process the webhook
    const result = await processWebhook(userId, payload);

    if (!result.processed) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to process webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.triggerEmitted 
        ? `Trigger ${result.triggerType} emitted successfully`
        : 'Webhook processed, no trigger emitted',
      triggerEmitted: result.triggerEmitted,
      triggerType: result.triggerType
    });

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
