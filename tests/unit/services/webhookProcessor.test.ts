import { describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

vi.mock('@/lib/api/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const dbQuery = vi.fn();
vi.mock('@/lib/db', () => ({
  db: {
    query: (...args: any[]) => dbQuery(...args),
  },
}));

vi.mock('@/lib/automations/webhook-integration', () => ({
  processWebhook: vi.fn(async () => ({ processed: true, triggerEmitted: false })),
}));

import { WebhookProcessor, computeWebhookExternalId } from '@/lib/services/webhookProcessor';

describe('WebhookProcessor', () => {
  describe('verifySignature', () => {
    it('verifies TikTok HMAC signatures', () => {
      const processor = new WebhookProcessor();
      const secret = 'test-secret';
      const payload = JSON.stringify({ event_type: 'video.publish.complete' });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(processor.verifySignature('tiktok', payload, signature, secret)).toBe(true);
      expect(processor.verifySignature('tiktok', payload, 'bad', secret)).toBe(false);
    });

    it('verifies Instagram HMAC signatures (sha256= prefix)', () => {
      const processor = new WebhookProcessor();
      const secret = 'test-secret';
      const payload = JSON.stringify({ object: 'instagram' });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(processor.verifySignature('instagram', payload, `sha256=${signature}`, secret)).toBe(true);
      expect(processor.verifySignature('instagram', payload, signature, secret)).toBe(false);
    });

    it('verifies OnlyFans HMAC signatures (hex or sha256=)', () => {
      const processor = new WebhookProcessor();
      const secret = 'test-secret';
      const payload = JSON.stringify({ event: 'message.received', data: { creatorId: '1', messageId: 'm1' } });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(processor.verifySignature('onlyfans', payload, signature, secret)).toBe(true);
      expect(processor.verifySignature('onlyfans', payload, `sha256=${signature}`, secret)).toBe(true);
      expect(processor.verifySignature('onlyfans', payload, 'bad', secret)).toBe(false);
    });

    it('verifies CRM HMAC signatures (hex or sha256=)', () => {
      const processor = new WebhookProcessor();
      const secret = 'test-secret';
      const payload = JSON.stringify({ eventType: 'lead.created', id: 'crm_1' });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(processor.verifySignature('crm', payload, signature, secret)).toBe(true);
      expect(processor.verifySignature('crm', payload, `sha256=${signature}`, secret)).toBe(true);
      expect(processor.verifySignature('crm', payload, 'bad', secret)).toBe(false);
    });
  });

  describe('computeWebhookExternalId', () => {
    it('returns stable IDs for supported providers', () => {
      const rawBody = JSON.stringify({ hello: 'world' });

      const tiktokId = computeWebhookExternalId({
        provider: 'tiktok',
        eventType: 'video.publish.complete',
        rawBody,
        payload: { event_id: 'evt_123' },
      });
      expect(tiktokId).toBe('tiktok:video.publish.complete:evt_123');

      const instagramId = computeWebhookExternalId({
        provider: 'instagram',
        eventType: 'comments',
        rawBody,
        payload: {
          entry: { id: 'ig_entry' },
          change: { value: { comment_id: 'c_123' } },
        },
      });
      expect(instagramId).toBe('instagram:comments:ig_entry:c_123');

      const onlyfansId = computeWebhookExternalId({
        provider: 'onlyfans',
        eventType: 'message.received',
        rawBody,
        payload: { data: { creatorId: '42', messageId: 'm_1' } },
      });
      expect(onlyfansId).toBe('onlyfans:message.received:42:m_1');

      const crmId = computeWebhookExternalId({
        provider: 'crm',
        eventType: 'hubspot:lead.created',
        rawBody,
        payload: { id: 'crm_123', eventType: 'lead.created' },
      });
      expect(crmId).toBe('crm:hubspot:lead.created:crm_123');

      const fallbackA = computeWebhookExternalId({
        provider: 'tiktok',
        eventType: 'unknown',
        rawBody,
        payload: {},
      });
      const fallbackB = computeWebhookExternalId({
        provider: 'tiktok',
        eventType: 'unknown',
        rawBody,
        payload: {},
      });
      expect(fallbackA).toBe(fallbackB);
    });
  });

  describe('processEvent idempotence', () => {
    it('skips processing when event already processed', async () => {
      dbQuery.mockResolvedValueOnce({
        rows: [{ id: 123, processed_at: new Date().toISOString() }],
      });

      const processor = new WebhookProcessor();
      const result = await processor.processEvent({
        provider: 'tiktok',
        eventType: 'video.publish.complete',
        externalId: 'tiktok:video.publish.complete:evt_123',
        payload: { event_id: 'evt_123' },
      });

      expect(result.duplicate).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.eventId).toBe(123);
      expect(dbQuery).toHaveBeenCalledTimes(1);
    });
  });
});
