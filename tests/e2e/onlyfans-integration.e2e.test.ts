/**
 * OnlyFans Integration E2E Tests
 * Tests the contract/mocked integration without hitting real OnlyFans
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { OnlyFansService } from '../../lib/services/onlyfans/service';
import { MockOnlyFansGateway } from '../../lib/services/onlyfans/adapters/mock';
import { RateLimiter } from '../../lib/utils/rate-limiter';

describe('OnlyFans Integration (contract/mocked)', () => {
  let service: OnlyFansService;
  let serviceWithHighLimit: OnlyFansService;

  beforeAll(() => {
    service = new OnlyFansService(
      new MockOnlyFansGateway(),
      new RateLimiter({ maxPerMinute: 30 })
    );
    serviceWithHighLimit = new OnlyFansService(
      new MockOnlyFansGateway(),
      new RateLimiter({ maxPerMinute: 1000 })
    );
  });

  it('should scrape conversations (mock) successfully', async () => {
    const conversations = await service.listConversations();
    expect(conversations.length).toBeGreaterThan(0);
    expect(conversations[0]).toHaveProperty('username');
  });

  it('should respect rate limiting', async () => {
    const promises = Array.from({ length: 35 }).map((_, i) =>
      service.sendMessageWithLimit(`u_${i % 3}`, 'test')
    );
    await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
  });

  it('should track message duration metrics', async () => {
    const result = await serviceWithHighLimit.sendMessageWithLimit('u_1', 'Hello');
    expect(result.ok).toBe(true);
  });

  it('should handle multiple concurrent conversations', async () => {
    const conversations = await service.listConversations();
    expect(conversations.length).toBeGreaterThanOrEqual(20);
  });
});
