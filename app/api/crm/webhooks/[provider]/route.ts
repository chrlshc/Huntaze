import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { computeWebhookExternalId, webhookProcessor } from '@/lib/services/webhookProcessor';

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

// Generic webhook entrypoint for CRM providers (placeholder)
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const secret = process.env.CRM_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' && !secret) {
      return NextResponse.json({ error: 'CRM webhook not configured' }, { status: 503 });
    }

    const { provider: providerParam } = await params;
    const provider = (providerParam || 'unknown').toLowerCase();
    const rawBody = await request.text();

    if (secret) {
      const signatureHeader =
        request.headers.get('x-crm-signature') ||
        request.headers.get('x-crm-signature-256');
      const headerSecret = request.headers.get('x-crm-webhook-secret');
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
      const provided = headerSecret ?? bearer;

      if (!signatureHeader) {
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        if (!provided || !timingSafeEqualStrings(provided, secret)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        const isValid = webhookProcessor.verifySignature('crm', rawBody, signatureHeader, secret);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }
      }
    }

    let payload: Record<string, unknown> = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    const eventType =
      String(payload?.eventType || payload?.event || payload?.type || payload?.action || 'unknown');
    const scopedEventType = provider ? `${provider}:${eventType}` : eventType;

    const externalId = computeWebhookExternalId({
      provider: 'crm',
      eventType: scopedEventType,
      rawBody,
      payload,
    });

    const response = NextResponse.json({ ok: true });

    setImmediate(async () => {
      try {
        await webhookProcessor.processEvent({
          provider: 'crm',
          eventType: scopedEventType,
          externalId,
          payload,
          signature: request.headers.get('x-crm-signature') || undefined,
        });
      } catch (error) {
        console.error('CRM webhook processing error:', error);
      }
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
