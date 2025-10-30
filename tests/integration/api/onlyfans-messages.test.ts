/**
 * OnlyFans Messages API - Integration Tests
 * 
 * Tests for /api/onlyfans/messages/* endpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST as sendMessagePOST, GET as sendMessageGET } from '@/app/api/onlyfans/messages/send/route';
import { GET as statusGET } from '@/app/api/onlyfans/messages/status/route';
import { NextRequest } from 'next/server';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock AWS SDK
vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  SendMessageCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  PutMetricDataCommand: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('POST /api/onlyfans/messages/send', () => {
  beforeAll(() => {
    // Set environment variables
    process.env.RATE_LIMITER_ENABLED = 'true';
    process.env.SQS_RATE_LIMITER_QUEUE = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue';
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user_123',
        content: 'Hello!',
      }),
    });

    const response = await sendMessagePOST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/unauthorized/i);
  });

  it('should return 400 when payload is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_456', email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: '', // Invalid: empty
        content: 'Hello!',
      }),
    });

    const response = await sendMessagePOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/validation failed/i);
  });

  it('should return 202 when message is queued successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_456', email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user_123',
        content: 'Hello!',
        priority: 'high',
      }),
    });

    const response = await sendMessagePOST(request);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.success).toBe(true);
    expect(data.messageId).toBeDefined();
    expect(data.queuedAt).toBeDefined();
    expect(data.estimatedDelivery).toBeDefined();
  });

  it('should accept message with media URLs', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_456', email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user_123',
        content: 'Check this out!',
        mediaUrls: ['https://example.com/image.jpg'],
      }),
    });

    const response = await sendMessagePOST(request);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.success).toBe(true);
  });

  it('should return 503 when rate limiter is disabled', async () => {
    const originalEnv = process.env.RATE_LIMITER_ENABLED;
    process.env.RATE_LIMITER_ENABLED = 'false';

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_456', email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user_123',
        content: 'Hello!',
      }),
    });

    const response = await sendMessagePOST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/unavailable/i);

    process.env.RATE_LIMITER_ENABLED = originalEnv;
  });
});

describe('GET /api/onlyfans/messages/send', () => {
  it('should return rate limiter status', async () => {
    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/send', {
      method: 'GET',
    });

    const response = await sendMessageGET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.configured).toBeDefined();
    expect(data.enabled).toBeDefined();
    expect(data.active).toBeDefined();
    expect(data.queueUrl).toBeDefined();
  });
});

describe('GET /api/onlyfans/messages/status', () => {
  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/status', {
      method: 'GET',
    });

    const response = await statusGET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return queue status when authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_456', email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/onlyfans/messages/status', {
      method: 'GET',
    });

    const response = await statusGET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.configuration).toBeDefined();
    expect(data.queue).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });
});
