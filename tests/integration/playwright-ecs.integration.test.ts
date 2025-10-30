import { browserWorkerClient } from '@/lib/workers/of-browser-worker';

describe('Playwright ECS Integration', () => {
  // Increase timeout for ECS tasks
  jest.setTimeout(60000);

  it('should send message via ECS Fargate', async () => {
    const result = await browserWorkerClient.runBrowserTask({
      action: 'SEND_MESSAGE',
      userId: 'test-user-123',
      data: {
        recipientId: 'test-fan-456',
        content: 'Hello from integrated Playwright! 🚀',
        accountType: 'established'
      }
    });

    expect(result.success).toBe(true);
    expect(result.data.messageId).toBeDefined();
    expect(result.duration).toBeLessThan(30000); // < 30 sec
  });

  it('should handle rate limiting', async () => {
    // Send 250 messages in established mode
    const promises = Array(250).fill(0).map((_, i) =>
      browserWorkerClient.runBrowserTask({
        action: 'SEND_MESSAGE',
        userId: 'test-user',
        data: {
          recipientId: `fan-${i}`,
          content: `Message ${i}`,
          accountType: 'established'
        }
      })
    );

    const results = await Promise.allSettled(promises);
    
    // First 250 should succeed
    const successes = results.filter(r => r.status === 'fulfilled');
    expect(successes.length).toBe(250);

    // 251st should fail (rate limit)
    const lastResult = await browserWorkerClient.runBrowserTask({
      action: 'SEND_MESSAGE',
      userId: 'test-user',
      data: {
        recipientId: 'fan-251',
        content: 'Should fail',
        accountType: 'established'
      }
    });

    expect(lastResult.success).toBe(false);
    expect(lastResult.error).toContain('rate limit');
  });

  it('should handle concurrent tasks', async () => {
    const tasks = [
      browserWorkerClient.runBrowserTask({
        action: 'SEND_MESSAGE',
        userId: 'user-1',
        data: {
          recipientId: 'fan-1',
          content: 'Message 1',
          accountType: 'established'
        }
      }),
      browserWorkerClient.runBrowserTask({
        action: 'SEND_MESSAGE',
        userId: 'user-2',
        data: {
          recipientId: 'fan-2',
          content: 'Message 2',
          accountType: 'established'
        }
      }),
      browserWorkerClient.runBrowserTask({
        action: 'SEND_MESSAGE',
        userId: 'user-3',
        data: {
          recipientId: 'fan-3',
          content: 'Message 3',
          accountType: 'established'
        }
      })
    ];

    const results = await Promise.all(tasks);

    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data.messageId).toBeDefined();
    });
  });

  it('should respect account type rate limits', async () => {
    const accountTypes = [
      { type: 'new', limit: 100 },
      { type: 'established', limit: 250 },
      { type: 'power', limit: 400 },
      { type: 'vip', limit: 600 }
    ];

    for (const { type, limit } of accountTypes) {
      // Send messages up to limit
      const promises = Array(limit).fill(0).map((_, i) =>
        browserWorkerClient.runBrowserTask({
          action: 'SEND_MESSAGE',
          userId: `test-user-${type}`,
          data: {
            recipientId: `fan-${i}`,
            content: `Message ${i}`,
            accountType: type as any
          }
        })
      );

      const results = await Promise.allSettled(promises);
      const successes = results.filter(r => r.status === 'fulfilled');
      
      expect(successes.length).toBe(limit);
    }
  });

  it('should handle task failures gracefully', async () => {
    const result = await browserWorkerClient.runBrowserTask({
      action: 'SEND_MESSAGE',
      userId: 'test-user',
      data: {
        recipientId: 'invalid-fan-id',
        content: 'This should fail',
        accountType: 'established'
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should track task duration', async () => {
    const result = await browserWorkerClient.runBrowserTask({
      action: 'SEND_MESSAGE',
      userId: 'test-user',
      data: {
        recipientId: 'fan-123',
        content: 'Test message',
        accountType: 'established'
      }
    });

    expect(result.duration).toBeGreaterThan(0);
    expect(result.duration).toBeLessThan(30000); // Should complete in < 30s
  });
});
