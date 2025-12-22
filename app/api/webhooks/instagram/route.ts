/**
 * Instagram Webhook Endpoint
 * 
 * POST /api/webhooks/instagram
 * Receives webhook events from Instagram/Meta Graph API
 * 
 * Events:
 * - media (new posts)
 * - comments (new comments)
 * - mentions (mentions in stories/posts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeWebhookExternalId, webhookProcessor } from '@/lib/services/webhookProcessor';

const INSTAGRAM_WEBHOOK_SECRET = process.env.INSTAGRAM_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && !INSTAGRAM_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Instagram webhook not configured' },
        { status: 503 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify signature if secret is configured
    if (INSTAGRAM_WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const isValid = webhookProcessor.verifySignature(
        'instagram',
        rawBody,
        signature,
        INSTAGRAM_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error('Instagram webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Meta sends array of entries
    if (!payload.entry || !Array.isArray(payload.entry)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Respond immediately with 200 (Meta requirement)
    const response = NextResponse.json({ success: true });

    // Process events asynchronously
    setImmediate(async () => {
      for (const entry of payload.entry) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          const eventType = change.field; // 'media', 'comments', 'mentions'
          const externalId = computeWebhookExternalId({
            provider: 'instagram',
            eventType,
            rawBody,
            payload: { entry, change },
          });

          try {
            await webhookProcessor.processEvent({
              provider: 'instagram',
              eventType,
              externalId,
              payload: { entry, change },
              signature: signature || undefined,
            });
            if (process.env.NODE_ENV !== 'production') {
              console.log(`Instagram webhook processed: ${eventType} (${externalId})`);
            }
          } catch (error) {
            console.error('Instagram webhook processing error:', error);
          }
        }
      }
    });

    return response;
  } catch (error) {
    console.error('Instagram webhook error:', error);
    return NextResponse.json({ error: 'Invalid webhook request' }, { status: 400 });
  }
}

/**
 * Handle Meta webhook verification challenge
 * Meta sends GET request with hub.challenge parameter
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify token (should match your configured verify token)
  const VERIFY_TOKEN =
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
    (process.env.NODE_ENV === 'production' ? '' : 'huntaze_instagram_webhook');

  if (process.env.NODE_ENV === 'production' && !process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ error: 'Instagram webhook not configured' }, { status: 503 });
  }

  if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Instagram webhook verified');
    }
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.error('Instagram webhook verification failed');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
