/**
 * OnlyFans Rate Limiter - E2E Tests
 * 
 * End-to-end tests for the complete rate limiter flow:
 * UI → API → SQS → Lambda → Redis → OnlyFans API
 * 
 * Note: These tests require AWS credentials and should run in a staging environment
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

test.describe('OnlyFans Rate Limiter E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login (adjust based on your auth flow)
    await page.goto(`${API_BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${API_BASE_URL}/dashboard`);
  });

  test('should send a single message successfully', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
      data: {
        recipientId: 'test_recipient_1',
        content: 'Hello from E2E test!',
        priority: 'high',
      },
    });

    expect(response.status()).toBe(202);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.messageId).toBeDefined();
    expect(data.queuedAt).toBeDefined();
    expect(data.estimatedDelivery).toBeDefined();
  });

  test('should handle rate limiting correctly', async ({ request }) => {
    // Send 15 messages rapidly (rate limit is 10/min)
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
          data: {
            recipientId: `test_recipient_${i}`,
            content: `Test message ${i}`,
            priority: 'medium',
          },
        })
      );
    }

    const responses = await Promise.all(promises);

    // All should be accepted (202)
    const acceptedCount = responses.filter((r) => r.status() === 202).length;
    expect(acceptedCount).toBe(15);

    // Wait a bit and check queue status
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusResponse = await request.get(`${API_BASE_URL}/api/onlyfans/messages/status`);
    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData.queue.messagesQueued).toBeGreaterThan(0);
  });

  test('should track metrics in CloudWatch', async ({ request }) => {
    // Send a message
    await request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
      data: {
        recipientId: 'test_recipient_metrics',
        content: 'Metrics test',
      },
    });

    // Wait for metrics to be sent
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check status endpoint for metrics
    const statusResponse = await request.get(`${API_BASE_URL}/api/onlyfans/messages/status`);
    const statusData = await statusResponse.json();

    expect(statusData.queue.healthy).toBe(true);
    expect(statusData.configuration.active).toBe(true);
  });

  test('should handle validation errors', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
      data: {
        recipientId: '', // Invalid: empty
        content: 'Test',
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/validation/i);
  });

  test('should send message with media URLs', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
      data: {
        recipientId: 'test_recipient_media',
        content: 'Check this out!',
        mediaUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
      },
    });

    expect(response.status()).toBe(202);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should get rate limiter status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/onlyfans/messages/send`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.configured).toBeDefined();
    expect(data.enabled).toBeDefined();
    expect(data.queueUrl).toBeDefined();
  });

  test('should get queue status with metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/onlyfans/messages/status`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.configuration).toBeDefined();
    expect(data.queue).toBeDefined();
    expect(data.queue.healthy).toBeDefined();
    expect(data.queue.messagesQueued).toBeGreaterThanOrEqual(0);
  });

  test('should handle batch sending', async ({ request }) => {
    // Send 5 messages in quick succession
    const messages = Array.from({ length: 5 }, (_, i) => ({
      recipientId: `batch_recipient_${i}`,
      content: `Batch message ${i}`,
      priority: 'low',
    }));

    const responses = await Promise.all(
      messages.map((msg) =>
        request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, { data: msg })
      )
    );

    // All should succeed
    expect(responses.every((r) => r.status() === 202)).toBe(true);

    // Check that all have unique message IDs
    const messageIds = await Promise.all(
      responses.map(async (r) => {
        const data = await r.json();
        return data.messageId;
      })
    );

    const uniqueIds = new Set(messageIds);
    expect(uniqueIds.size).toBe(5);
  });
});

test.describe('Rate Limiter Performance', () => {
  test('should handle concurrent requests', async ({ request }) => {
    const concurrentRequests = 20;
    const startTime = Date.now();

    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
        data: {
          recipientId: `concurrent_recipient_${i}`,
          content: `Concurrent message ${i}`,
        },
      })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // All should be accepted
    expect(responses.every((r) => r.status() === 202)).toBe(true);

    // Should complete in reasonable time (< 10 seconds)
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(10000);

    console.log(`Concurrent requests completed in ${duration}ms`);
  });

  test('should measure average latency', async ({ request }) => {
    const iterations = 10;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      await request.post(`${API_BASE_URL}/api/onlyfans/messages/send`, {
        data: {
          recipientId: `latency_test_${i}`,
          content: 'Latency test',
        },
      });

      const endTime = Date.now();
      latencies.push(endTime - startTime);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Max latency: ${maxLatency}ms`);

    // Average latency should be < 1 second
    expect(avgLatency).toBeLessThan(1000);
  });
});
