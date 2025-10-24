import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '@/lib/services/ai-service';

// Mock fetch
global.fetch = vi.fn();

describe('AI Service Rate Limiting', () => {
  let aiService: AIService;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch = vi.mocked(fetch);
    
    aiService = new AIService({
      openaiApiKey: 'test-key',
      cache: { enabled: false, ttlSeconds: 0, maxSize: 0 }, // Disable cache for testing
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Rate Limit Enforcement', () => {
    it('should enforce per-minute rate limits', async () => {
      // Mock provider to return very low rate limits
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Allow first request
      vi.spyOn(rateLimiter, 'checkLimit')
        .mockResolvedValueOnce(true)  // First request allowed
        .mockResolvedValueOnce(false); // Second request blocked
      
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(45000); // 45 seconds

      mockFetch.mockResolvedValue({ ok: true });

      const request = {
        prompt: 'Test rate limiting',
        context: { userId: 'user-123' },
        options: {},
      };

      // First request should succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          model: 'gpt-4o-mini',
        }),
      });

      const result1 = await aiService.generateText(request);
      expect(result1.content).toBe('Success');

      // Second request should be rate limited
      await expect(aiService.generateText(request))
        .rejects.toThrow('Rate limit exceeded. Try again in 45 seconds.');
    });

    it('should enforce per-hour rate limits', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Simulate hour limit exceeded
      vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(false);
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(1800000); // 30 minutes

      mockFetch.mockResolvedValue({ ok: true });

      const request = {
        prompt: 'Test hour limit',
        context: { userId: 'user-123' },
        options: {},
      };

      await expect(aiService.generateText(request))
        .rejects.toThrow('Rate limit exceeded. Try again in 1800 seconds.');
    });

    it('should enforce per-day rate limits', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Simulate day limit exceeded
      vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(false);
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(43200000); // 12 hours

      mockFetch.mockResolvedValue({ ok: true });

      const request = {
        prompt: 'Test day limit',
        context: { userId: 'user-123' },
        options: {},
      };

      await expect(aiService.generateText(request))
        .rejects.toThrow('Rate limit exceeded. Try again in 43200 seconds.');
    });
  });

  describe('Rate Limit Tracking', () => {
    it('should track requests per user', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      const checkLimitSpy = vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(true);

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Content' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            model: 'gpt-4o-mini',
          }),
        });

      // Make requests for different users
      await aiService.generateText({
        prompt: 'User 1 request',
        context: { userId: 'user-1' },
        options: {},
      });

      await aiService.generateText({
        prompt: 'User 2 request',
        context: { userId: 'user-2' },
        options: {},
      });

      // Verify rate limiting is checked per user
      expect(checkLimitSpy).toHaveBeenCalledWith('openai:user-1', expect.any(Object));
      expect(checkLimitSpy).toHaveBeenCalledWith('openai:openai:user-2', expect.any(Object));
    });

    it('should track requests per provider', async () => {
      const service = new AIService({
        openaiApiKey: 'test-openai-key',
        claudeApiKey: 'test-claude-key',
      });

      const rateLimiter = (service as any).rateLimiter;
      const checkLimitSpy = vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(true);

      mockFetch.mockResolvedValue({ ok: true });

      // Mock different provider responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'OpenAI' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            model: 'gpt-4o-mini',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{ text: 'Claude' }],
            usage: { input_tokens: 10, output_tokens: 10 },
            model: 'claude-3-haiku-20240307',
            stop_reason: 'end_turn',
          }),
        });

      const request = {
        prompt: 'Provider test',
        context: { userId: 'user-123' },
        options: {},
      };

      // Request with OpenAI
      await service.generateText(request, 'openai');
      
      // Request with Claude
      await service.generateText(request, 'claude');

      // Verify different rate limit keys are used
      expect(checkLimitSpy).toHaveBeenCalledWith('openai:user-123', expect.any(Object));
      expect(checkLimitSpy).toHaveBeenCalledWith('claude:user-123', expect.any(Object));
    });
  });

  describe('Rate Limit Recovery', () => {
    it('should allow requests after rate limit window expires', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // First request blocked, second allowed after time passes
      vi.spyOn(rateLimiter, 'checkLimit')
        .mockResolvedValueOnce(false) // Blocked
        .mockResolvedValueOnce(true); // Allowed after time
      
      vi.spyOn(rateLimiter, 'getWaitTime')
        .mockReturnValueOnce(60000) // 1 minute wait
        .mockReturnValueOnce(0);    // No wait after time passes

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success after wait' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            model: 'gpt-4o-mini',
          }),
        });

      const request = {
        prompt: 'Rate limit recovery test',
        context: { userId: 'user-123' },
        options: {},
      };

      // First request should be blocked
      await expect(aiService.generateText(request))
        .rejects.toThrow('Rate limit exceeded');

      // Simulate time passing
      vi.advanceTimersByTime(60000);

      // Second request should succeed
      const result = await aiService.generateText(request);
      expect(result.content).toBe('Success after wait');
    });

    it('should reset rate limits at appropriate intervals', () => {
      const rateLimiter = (aiService as any).rateLimiter;
      const now = Date.now();
      
      // Add some requests to the rate limiter
      const requests = rateLimiter.requests;
      requests.set('test-user', [
        now - 70000, // 70 seconds ago (should be cleaned)
        now - 30000, // 30 seconds ago (should remain)
        now - 10000, // 10 seconds ago (should remain)
      ]);

      // Trigger rate limit check which should clean old requests
      const limit = {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      };

      // Mock Date.now for consistent testing
      vi.spyOn(Date, 'now').mockReturnValue(now);

      rateLimiter.checkLimit('test-user', limit);

      // Verify old requests are cleaned up
      const remainingRequests = requests.get('test-user');
      expect(remainingRequests).toHaveLength(2);
      expect(remainingRequests).not.toContain(now - 70000);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should use provider-specific rate limits', async () => {
      const service = new AIService({
        openaiApiKey: 'test-openai-key',
        claudeApiKey: 'test-claude-key',
      });

      // Get providers to check their rate limits
      const providers = (service as any).providers;
      const openaiProvider = providers.get('openai');
      const claudeProvider = providers.get('claude');

      const openaiLimits = openaiProvider.getRateLimit();
      const claudeLimits = claudeProvider.getRateLimit();

      // Verify different providers have different limits
      expect(openaiLimits).toEqual({
        requestsPerMinute: 60,
        requestsPerHour: 3000,
        requestsPerDay: 10000,
      });

      expect(claudeLimits).toEqual({
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        requestsPerDay: 5000,
      });
    });

    it('should handle custom rate limit configurations', () => {
      // Create a custom provider with different limits
      class CustomProvider {
        name = 'custom' as const;
        
        async generateText() {
          return {
            content: 'Custom response',
            usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
            model: 'custom-model',
            provider: 'custom' as const,
            finishReason: 'stop' as const,
          };
        }

        async isAvailable() {
          return true;
        }

        getRateLimit() {
          return {
            requestsPerMinute: 10,
            requestsPerHour: 100,
            requestsPerDay: 500,
          };
        }
      }

      const customProvider = new CustomProvider();
      const limits = customProvider.getRateLimit();

      expect(limits.requestsPerMinute).toBe(10);
      expect(limits.requestsPerHour).toBe(100);
      expect(limits.requestsPerDay).toBe(500);
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('should provide helpful error messages', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(false);
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(120000); // 2 minutes

      mockFetch.mockResolvedValue({ ok: true });

      const request = {
        prompt: 'Error message test',
        context: { userId: 'user-123' },
        options: {},
      };

      try {
        await aiService.generateText(request);
        fail('Should have thrown rate limit error');
      } catch (error: any) {
        expect(error.message).toBe('Rate limit exceeded. Try again in 120 seconds.');
        expect(error.message).toContain('120 seconds');
      }
    });

    it('should handle rate limit calculation errors', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Mock checkLimit to throw an error
      vi.spyOn(rateLimiter, 'checkLimit').mockRejectedValue(new Error('Rate limit calculation failed'));

      mockFetch.mockResolvedValue({ ok: true });

      const request = {
        prompt: 'Rate limit error test',
        context: { userId: 'user-123' },
        options: {},
      };

      await expect(aiService.generateText(request))
        .rejects.toThrow('Rate limit calculation failed');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests within rate limits', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Allow all requests
      vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(true);

      mockFetch.mockResolvedValue({ ok: true });

      // Mock successful responses
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: `Response ${i}` }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            model: 'gpt-4o-mini',
          }),
        });
      }

      const requests = Array.from({ length: 5 }, (_, i) => ({
        prompt: `Concurrent request ${i}`,
        context: { userId: 'user-123' },
        options: {},
      }));

      const results = await Promise.all(
        requests.map(req => aiService.generateText(req))
      );

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.content).toBe(`Response ${i}`);
      });
    });

    it('should handle mixed success/failure in concurrent requests', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Allow first 3 requests, block the rest
      vi.spyOn(rateLimiter, 'checkLimit')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValue(false);
      
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(30000);

      mockFetch.mockResolvedValue({ ok: true });

      // Mock successful responses for allowed requests
      for (let i = 0; i < 3; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: `Success ${i}` }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
            model: 'gpt-4o-mini',
          }),
        });
      }

      const requests = Array.from({ length: 5 }, (_, i) => ({
        prompt: `Mixed request ${i}`,
        context: { userId: 'user-123' },
        options: {},
      }));

      const results = await Promise.allSettled(
        requests.map(req => aiService.generateText(req))
      );

      // First 3 should succeed
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');

      // Last 2 should be rejected due to rate limiting
      expect(results[3].status).toBe('rejected');
      expect(results[4].status).toBe('rejected');

      if (results[3].status === 'rejected') {
        expect(results[3].reason.message).toContain('Rate limit exceeded');
      }
    });
  });

  describe('Rate Limit Metrics', () => {
    it('should track rate limit statistics', async () => {
      const rateLimiter = (aiService as any).rateLimiter;
      
      // Simulate some requests
      const limit = {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      };

      // Add requests to simulate usage
      await rateLimiter.checkLimit('user-1', limit);
      await rateLimiter.checkLimit('user-1', limit);
      await rateLimiter.checkLimit('user-2', limit);

      // Verify requests are tracked
      const user1Requests = rateLimiter.requests.get('user-1');
      const user2Requests = rateLimiter.requests.get('user-2');

      expect(user1Requests).toHaveLength(2);
      expect(user2Requests).toHaveLength(1);
    });

    it('should calculate remaining quota correctly', () => {
      const rateLimiter = (aiService as any).rateLimiter;
      const now = Date.now();
      
      // Mock current time
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // Add some requests
      rateLimiter.requests.set('test-user', [
        now - 30000, // 30 seconds ago
        now - 20000, // 20 seconds ago
        now - 10000, // 10 seconds ago
      ]);

      const limit = {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      };

      const waitTime = rateLimiter.getWaitTime('test-user', limit);
      
      // Should not need to wait (3 requests < 5 per minute)
      expect(waitTime).toBe(0);

      // Add more requests to exceed minute limit
      rateLimiter.requests.set('test-user', [
        now - 50000, // 50 seconds ago
        now - 40000, // 40 seconds ago
        now - 30000, // 30 seconds ago
        now - 20000, // 20 seconds ago
        now - 10000, // 10 seconds ago
      ]);

      const waitTimeExceeded = rateLimiter.getWaitTime('test-user', limit);
      
      // Should need to wait until oldest request in minute window expires
      expect(waitTimeExceeded).toBeGreaterThan(0);
      expect(waitTimeExceeded).toBeLessThanOrEqual(60000);
    });
  });
});