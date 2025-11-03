/**
 * TikTok Webhook Endpoint
 * 
 * POST /api/webhooks/tiktok
 * Receives webhook events from TikTok
 * 
 * Events:
 * - video.publish.complete
 * - video.publish.failed
 * - video.inbox.received
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookProcessor } from '@/lib/services/webhookProcessor';

const TIKTOK_WEBHOOK_SECRET = process.env.TIKTOK_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-tiktok-signature');

    // Verify signature if secret is configured
    if (TIKTOK_WEBHOOK_SECRET && signature) {
      const isValid = webhookProcessor.verifySignature(
        'tiktok',
        rawBody,
        signature,
        TIKTOK_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error('TikTok webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else if (TIKTOK_WEBHOOK_SECRET && !signature) {
      console.warn('TikTok webhook received without signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);

    // Extract event information
    const eventType = payload.event_type || payload.type;
    const externalId = payload.event_id || `${eventType}_${Date.now()}`;

    if (!eventType) {
      console.error('TikTok webhook missing event_type');
      return NextResponse.json(
        { error: 'Missing event_type' },
        { status: 400 }
      );
    }

    // Respond immediately with 200 (TikTok requirement)
    // Process event asynchronously
    const response = NextResponse.json({
      success: true,
      message: 'Webhook received',
    });

    // Queue event for async processing (non-blocking)
    setImmediate(async () => {
      try {
        await webhookProcessor.processEvent({
          provider: 'tiktok',
          eventType,
          externalId,
          payload,
          signature: signature || undefined,
        });
        console.log(`TikTok webhook processed: ${eventType} (${externalId})`);
      } catch (error) {
        console.error('TikTok webhook processing error:', error);
        // Error is logged but doesn't affect response
        // Event will be retried by background worker
      }
    });

    return response;
  } catch (error) {
    console.error('TikTok webhook error:', error);

    // Still return 200 to prevent TikTok from retrying immediately
    // Event will be retried by our background worker
    return NextResponse.json({
      success: true,
      message: 'Webhook received (processing failed, will retry)',
    });
  }
}

/**
 * Handle TikTok webhook verification challenge
 * TikTok may send a verification request when setting up webhooks
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Return challenge for verification
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return NextResponse.json(
    { error: 'Missing challenge parameter' },
    { status: 400 }
  );
}
