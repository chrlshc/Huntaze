import { describe, it, expect } from 'vitest';

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.ELASTICACHE_REDIS_HOST;
const redisPort = process.env.ELASTICACHE_REDIS_PORT;
const hasRedisConfig = Boolean(redisUrl || redisHost);
const describeCache = hasRedisConfig ? describe : describe.skip;

describeCache('Cache performance', () => {
  it('redis configuration is present', () => {
    if (redisUrl) {
      const parsed = new URL(redisUrl);
      expect(parsed.protocol.startsWith('redis')).toBe(true);
      expect(parsed.hostname.length).toBeGreaterThan(0);
      return;
    }

    expect(redisHost).toBeTruthy();
    if (redisPort) {
      const port = Number(redisPort);
      expect(Number.isFinite(port)).toBe(true);
    }
  });
});
