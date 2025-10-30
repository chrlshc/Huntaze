/**
 * Rate Limiter Tests
 * Tests for OnlyFans rate limiting with realistic limits
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, AccountType, RateLimitConfig } from '@/lib/utils/rate-limiter';

describe('RateLimiter', () => {
  describe('Token Bucket Algorithm', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({ maxPerMinute: 10 });
    });

    it('should allow requests within rate limit', () => {
      const key = 'user-123';
      
      // Should allow first 10 requests
      for (let i = 0; i < 10; i++) {
        expect(limiter.take(key)).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const key = 'user-123';
      
      // Exhaust tokens
      for (let i = 0; i < 10; i++) {
        limiter.take(key);
      }
      
      // 11th request should be blocked
      expect(limiter.take(key)).toBe(false);
    });

    it('should refill tokens over time', async () => {
      const key = 'user-123';
      
      // Exhaust tokens
      for (let i = 0; i < 10; i++) {
        limiter.take(key);
      }
      
      expect(limiter.take(key)).toBe(false);
      
      // Wait for refill (6 seconds = 1 token at 10/min rate)
      await new Promise(resolve => setTimeout(resolve, 6100));
      
      // Should allow 1 more request
      expect(limiter.take(key)).toBe(true);
    });

    it('should handle multiple keys independently', () => {
      const key1 = 'user-123';
      const key2 = 'user-456';
      
      // Exhaust tokens for key1
      for (let i = 0; i < 10; i++) {
        limiter.take(key1);
      }
      
      // key1 should be blocked
      expect(limiter.take(key1)).toBe(false);
      
      // key2 should still work
      expect(limiter.take(key2)).toBe(true);
    });

    it('should not exceed max tokens after long idle period', async () => {
      const key = 'user-123';
      
      // Wait longer than refill time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should still only have max tokens (10)
      for (let i = 0; i < 10; i++) {
        expect(limiter.take(key)).toBe(true);
      }
      
      expect(limiter.take(key)).toBe(false);
    });
  });

  describe('Static Configuration Methods', () => {
    describe('getConfig', () => {
      it('should return config for new account', () => {
        const config = RateLimiter.getConfig('new');
        
        expect(config).toEqual({
          messagesPerDay: 100,
          messagesPerMinute: 5,
          messagesPerHour: 30,
          batchSize: 10,
          delayBetweenMessages: [3, 6],
          delayBetweenBatches: [60, 120]
        });
      });

      it('should return config for established account', () => {
        const config = RateLimiter.getConfig('established');
        
        expect(config).toEqual({
          messagesPerDay: 250,
          messagesPerMinute: 10,
          messagesPerHour: 80,
          batchSize: 20,
          delayBetweenMessages: [2, 4],
          delayBetweenBatches: [30, 60]
        });
      });

      it('should return config for power account', () => {
        const config = RateLimiter.getConfig('power');
        
        expect(config).toEqual({
          messagesPerDay: 400,
          messagesPerMinute: 15,
          messagesPerHour: 120,
          batchSize: 30,
          delayBetweenMessages: [1.5, 3],
          delayBetweenBatches: [20, 40]
        });
      });

      it('should return config for vip account', () => {
        const config = RateLimiter.getConfig('vip');
        
        expect(config).toEqual({
          messagesPerDay: 600,
          messagesPerMinute: 20,
          messagesPerHour: 150,
          batchSize: 50,
          delayBetweenMessages: [1, 2],
          delayBetweenBatches: [15, 30]
        });
      });

      it('should have increasing limits from new to vip', () => {
        const types: AccountType[] = ['new', 'established', 'power', 'vip'];
        const configs = types.map(t => RateLimiter.getConfig(t));
        
        // Verify messagesPerDay increases
        for (let i = 1; i < configs.length; i++) {
          expect(configs[i].messagesPerDay).toBeGreaterThan(configs[i - 1].messagesPerDay);
        }
        
        // Verify messagesPerMinute increases
        for (let i = 1; i < configs.length; i++) {
          expect(configs[i].messagesPerMinute).toBeGreaterThan(configs[i - 1].messagesPerMinute);
        }
        
        // Verify batchSize increases
        for (let i = 1; i < configs.length; i++) {
          expect(configs[i].batchSize).toBeGreaterThan(configs[i - 1].batchSize);
        }
      });
    });

    describe('getRandomDelay', () => {
      it('should return delay within range for new account', () => {
        const delays = Array.from({ length: 100 }, () => 
          RateLimiter.getRandomDelay('new')
        );
        
        delays.forEach(delay => {
          expect(delay).toBeGreaterThanOrEqual(3000); // 3 seconds
          expect(delay).toBeLessThanOrEqual(6000);    // 6 seconds
        });
      });

      it('should return delay within range for established account', () => {
        const delays = Array.from({ length: 100 }, () => 
          RateLimiter.getRandomDelay('established')
        );
        
        delays.forEach(delay => {
          expect(delay).toBeGreaterThanOrEqual(2000); // 2 seconds
          expect(delay).toBeLessThanOrEqual(4000);    // 4 seconds
        });
      });

      it('should return delay within range for power account', () => {
        const delays = Array.from({ length: 100 }, () => 
          RateLimiter.getRandomDelay('power')
        );
        
        delays.forEach(delay => {
          expect(delay).toBeGreaterThanOrEqual(1500); // 1.5 seconds
          expect(delay).toBeLessThanOrEqual(3000);    // 3 seconds
        });
      });

      it('should return delay within range for vip account', () => {
        const delays = Array.from({ length: 100 }, () => 
          RateLimiter.getRandomDelay('vip')
        );
        
        delays.forEach(delay => {
          expect(delay).toBeGreaterThanOrEqual(1000); // 1 second
          expect(delay).toBeLessThanOrEqual(2000);    // 2 seconds
        });
      });

      it('should return different delays (randomness check)', () => {
        const delays = Array.from({ length: 10 }, () => 
          RateLimiter.getRandomDelay('established')
        );
        
        // Check that not all delays are identical
        const uniqueDelays = new Set(delays);
        expect(uniqueDelays.size).toBeGreaterThan(1);
      });

      it('should have shorter delays for higher tier accounts', () => {
        const newDelay = RateLimiter.getRandomDelay('new');
        const vipDelay = RateLimiter.getRandomDelay('vip');
        
        // VIP max delay should be less than new min delay
        const newConfig = RateLimiter.getConfig('new');
        const vipConfig = RateLimiter.getConfig('vip');
        
        expect(vipConfig.delayBetweenMessages[1]).toBeLessThan(
          newConfig.delayBetweenMessages[0]
        );
      });
    });

    describe('getDailyLimit', () => {
      it('should return 100 for new accounts (<30 days)', () => {
        expect(RateLimiter.getDailyLimit(0)).toBe(100);
        expect(RateLimiter.getDailyLimit(15)).toBe(100);
        expect(RateLimiter.getDailyLimit(29)).toBe(100);
      });

      it('should return 200 for 1-3 month accounts', () => {
        expect(RateLimiter.getDailyLimit(30)).toBe(200);
        expect(RateLimiter.getDailyLimit(60)).toBe(200);
        expect(RateLimiter.getDailyLimit(89)).toBe(200);
      });

      it('should return 300 for 3-6 month accounts', () => {
        expect(RateLimiter.getDailyLimit(90)).toBe(300);
        expect(RateLimiter.getDailyLimit(120)).toBe(300);
        expect(RateLimiter.getDailyLimit(179)).toBe(300);
      });

      it('should return 500 for accounts >6 months', () => {
        expect(RateLimiter.getDailyLimit(180)).toBe(500);
        expect(RateLimiter.getDailyLimit(365)).toBe(500);
        expect(RateLimiter.getDailyLimit(1000)).toBe(500);
      });

      it('should handle edge cases', () => {
        expect(RateLimiter.getDailyLimit(0)).toBe(100);
        expect(RateLimiter.getDailyLimit(30)).toBe(200);
        expect(RateLimiter.getDailyLimit(90)).toBe(300);
        expect(RateLimiter.getDailyLimit(180)).toBe(500);
      });

      it('should increase limits progressively', () => {
        const ages = [0, 30, 90, 180];
        const limits = ages.map(age => RateLimiter.getDailyLimit(age));
        
        for (let i = 1; i < limits.length; i++) {
          expect(limits[i]).toBeGreaterThan(limits[i - 1]);
        }
      });
    });
  });

  describe('Realistic Limits Validation', () => {
    it('should have safe daily limits for all account types', () => {
      const types: AccountType[] = ['new', 'established', 'power', 'vip'];
      
      types.forEach(type => {
        const config = RateLimiter.getConfig(type);
        
        // Daily limit should be reasonable (not >1000)
        expect(config.messagesPerDay).toBeLessThanOrEqual(1000);
        expect(config.messagesPerDay).toBeGreaterThan(0);
      });
    });

    it('should have consistent rate limits (minute < hour < day)', () => {
      const types: AccountType[] = ['new', 'established', 'power', 'vip'];
      
      types.forEach(type => {
        const config = RateLimiter.getConfig(type);
        
        // Per-minute * 60 should be >= per-hour
        expect(config.messagesPerMinute * 60).toBeGreaterThanOrEqual(config.messagesPerHour);
        
        // Per-hour * 24 should be >= per-day
        expect(config.messagesPerHour * 24).toBeGreaterThanOrEqual(config.messagesPerDay);
      });
    });

    it('should have reasonable batch sizes', () => {
      const types: AccountType[] = ['new', 'established', 'power', 'vip'];
      
      types.forEach(type => {
        const config = RateLimiter.getConfig(type);
        
        // Batch size should be <= per-hour limit
        expect(config.batchSize).toBeLessThanOrEqual(config.messagesPerHour);
        
        // Batch size should be reasonable (not >100)
        expect(config.batchSize).toBeLessThanOrEqual(100);
      });
    });

    it('should have reasonable delays', () => {
      const types: AccountType[] = ['new', 'established', 'power', 'vip'];
      
      types.forEach(type => {
        const config = RateLimiter.getConfig(type);
        const [min, max] = config.delayBetweenMessages;
        
        // Min should be less than max
        expect(min).toBeLessThan(max);
        
        // Delays should be reasonable (not >10 seconds)
        expect(max).toBeLessThanOrEqual(10);
        
        // Min delay should be at least 1 second
        expect(min).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle campaign sending for new account', () => {
      const config = RateLimiter.getConfig('new');
      const limiter = new RateLimiter({ maxPerMinute: config.messagesPerMinute });
      
      let sent = 0;
      let blocked = 0;
      
      // Try to send batch
      for (let i = 0; i < config.batchSize; i++) {
        if (limiter.take('campaign-1')) {
          sent++;
        } else {
          blocked++;
        }
      }
      
      // Should send up to per-minute limit
      expect(sent).toBe(config.messagesPerMinute);
      expect(blocked).toBe(config.batchSize - config.messagesPerMinute);
    });

    it('should handle campaign sending for vip account', () => {
      const config = RateLimiter.getConfig('vip');
      const limiter = new RateLimiter({ maxPerMinute: config.messagesPerMinute });
      
      let sent = 0;
      
      // Try to send batch
      for (let i = 0; i < config.batchSize; i++) {
        if (limiter.take('campaign-1')) {
          sent++;
        }
      }
      
      // Should send up to per-minute limit
      expect(sent).toBe(Math.min(config.batchSize, config.messagesPerMinute));
    });

    it('should calculate appropriate delay for account age', () => {
      const accountAge = 45; // 1.5 months
      const dailyLimit = RateLimiter.getDailyLimit(accountAge);
      
      expect(dailyLimit).toBe(200); // Should be in 1-3 month tier
      
      // Verify this matches established account config
      const config = RateLimiter.getConfig('established');
      expect(dailyLimit).toBeLessThanOrEqual(config.messagesPerDay);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero account age', () => {
      expect(RateLimiter.getDailyLimit(0)).toBe(100);
    });

    it('should handle very old accounts', () => {
      expect(RateLimiter.getDailyLimit(10000)).toBe(500);
    });

    it('should handle negative account age gracefully', () => {
      // Should treat as new account
      expect(RateLimiter.getDailyLimit(-1)).toBe(100);
    });

    it('should handle rapid successive calls', () => {
      const limiter = new RateLimiter({ maxPerMinute: 10 });
      const key = 'rapid-test';
      
      const results = Array.from({ length: 20 }, () => limiter.take(key));
      
      const allowed = results.filter(r => r).length;
      const blocked = results.filter(r => !r).length;
      
      expect(allowed).toBe(10);
      expect(blocked).toBe(10);
    });
  });

  describe('Performance', () => {
    it('should handle many keys efficiently', () => {
      const limiter = new RateLimiter({ maxPerMinute: 10 });
      const startTime = Date.now();
      
      // Create 1000 different keys
      for (let i = 0; i < 1000; i++) {
        limiter.take(`user-${i}`);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (<100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle high frequency calls', () => {
      const limiter = new RateLimiter({ maxPerMinute: 100 });
      const key = 'high-freq';
      const startTime = Date.now();
      
      // Make 100 calls rapidly
      for (let i = 0; i < 100; i++) {
        limiter.take(key);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly (<10ms)
      expect(duration).toBeLessThan(10);
    });
  });
});
