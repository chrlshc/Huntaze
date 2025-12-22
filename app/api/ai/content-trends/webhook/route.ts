import { NextRequest, NextResponse } from 'next/server';
import { createWebhookController } from '@/lib/ai/content-trends/webhook/webhook-controller';
import { createLogger } from '@/lib/api/logger';

const APIFY_WEBHOOK_SECRET = process.env.APIFY_WEBHOOK_SECRET;
const logger = createLogger('webhook:apify');

let cachedController: ReturnType<typeof createWebhookController> | null = null;
let cachedSecret: string | undefined;

function getWebhookController() {
  const secret = APIFY_WEBHOOK_SECRET;
  if (!secret) return null;

  if (!cachedController || cachedSecret !== secret) {
    cachedSecret = secret;
    cachedController = createWebhookController({
      security: {
        secretKey: secret,
        algorithm: 'sha256',
        maxAgeSeconds: 300,
        validateTimestamp: true,
      },
      rateLimit: {
        maxRequests: 100,
        windowSeconds: 60,
      },
      idempotency: {
        ttlSeconds: 86400, // 24 hours
        keyPrefix: 'apify-webhook',
      },
      payloadValidation: {
        maxPayloadSize: 10 * 1024 * 1024, // 10MB
        requiredFields: ['eventType', 'eventData'],
      },
      enableLogging: process.env.NODE_ENV !== 'production',
    });
  }

  return cachedController;
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && !APIFY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Apify webhook not configured' }, { status: 503 });
    }

    const webhookController = getWebhookController();
    if (!webhookController) {
      return NextResponse.json({ error: 'Apify webhook not configured' }, { status: 503 });
    }

    const rawBody = Buffer.from(await request.arrayBuffer());
    
    const headers = {
      signature: request.headers.get('x-apify-signature') || undefined,
      timestamp: request.headers.get('x-apify-timestamp') || undefined,
      contentType: request.headers.get('content-type') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      clientId: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    if (!headers.signature || !headers.timestamp) {
      return NextResponse.json(
        { error: 'Missing signature or timestamp' },
        { status: 401 }
      );
    }

    const result = await webhookController.processWebhook(rawBody, headers);

    if (!result.success) {
      const status = result.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
      return NextResponse.json(
        { error: result.error?.message, code: result.error?.code },
        { status }
      );
    }

    if (result.eventId) {
      setImmediate(async () => {
        try {
          await processScrapedData(rawBody);
        } catch (error) {
          logger.error('Data processing error', error instanceof Error ? error : undefined);
        }
      });
    }

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      jobId: result.jobId,
    });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processScrapedData(rawBody: Buffer) {
  try {
    const payload = JSON.parse(rawBody.toString());
    
    if (payload.eventType === 'ACTOR.RUN.SUCCEEDED' && payload.resource?.defaultDatasetId) {
      const { createApifyClient } = await import('@/lib/ai/content-trends/apify/apify-client');
      const apifyClient = createApifyClient();
      
      const items = await apifyClient.getDatasetItems(payload.resource.defaultDatasetId);
      
      // Store in database or process with AI
      logger.debug('Received dataset items', {
        datasetId: payload.resource.defaultDatasetId,
        items: Array.isArray(items) ? items.length : undefined,
      });
      
      // TODO: Store items in database
      // TODO: Trigger AI analysis pipeline
    }
  } catch (error) {
    logger.error('Data processing error', error instanceof Error ? error : undefined);
  }
}
