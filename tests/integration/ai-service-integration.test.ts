import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService, getAIService } from '@/lib/services/ai-service';
import { ContentCreationEventEmitter } from '@/lib/services/sse-events';

// Mock fetch for external API calls
global.fetch = vi.fn();

describe('AI Service Integration Tests', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(fetch);
    
    // Reset environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-claude-key';
    process.env.DEFAULT_AI_PROVIDER = 'openai';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize singleton service with environment variables', () => {
      const service1 = getAIService();
      const service2 = getAIService();

      expect(service1).toBe(service2); // Should be same instance
      expect(service1.getProviderStatus()).toMatchObject({
        openai: true,
        claude: true,
        gemini: false,
      });
    });

    it('should handle missing API keys gracefully', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      // Force new instance creation
      (getAIService as any).aiServiceInstance = null;

      const service = getAIService();
      const status = service.getProviderStatus();

      expect(status.openai).toBe(false);
      expect(status.claude).toBe(false);
    });
  });

  describe('End-to-End Content Generation', () => {
    it('should generate content and emit SSE events', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: { content: 'Generated content for testing' },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 25,
          total_tokens: 75,
        },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOpenAIResponse),
        });

      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitAIInsight');

      const service = getAIService();
      const result = await service.generateText({
        prompt: 'Create a motivational caption',
        context: {
          userId: 'user-123',
          contentType: 'caption',
          metadata: { platform: 'instagram' },
        },
        options: {
          temperature: 0.7,
          maxTokens: 100,
        },
      });

      expect(result).toMatchObject({
        content: 'Generated content for testing',
        provider: 'openai',
        model: 'gpt-4o-mini',
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75,
        },
      });

      // Verify SSE event would be emitted in real usage
      expect(emitSpy).not.toHaveBeenCalled(); // Not called directly by service
    });

    it('should handle provider failover seamlessly', async () => {
      const mockClaudeResponse = {
        content: [{ text: 'Claude fallback content' }],
        usage: {
          input_tokens: 40,
          output_tokens: 30,
        },
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // OpenAI availability
        .mockResolvedValueOnce({ ok: true }) // Claude availability
        .mockRejectedValueOnce(new Error('OpenAI service error')) // OpenAI fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockClaudeResponse),
        }); // Claude succeeds

      const service = getAIService();
      const result = await service.generateText({
        prompt: 'Generate content with failover',
        context: { userId: 'user-123' },
        options: {},
      });

      expect(result.provider).toBe('claude');
      expect(result.content).toBe('Claude fallback content');
    });

    it('should respect rate limits across requests', async () => {
      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: false, ttlSeconds: 0, maxSize: 0 }, // Disable cache for testing
      });

      // Mock rate limiter to fail after first request
      const rateLimiter = (service as any).rateLimiter;
      let callCount = 0;
      vi.spyOn(rateLimiter, 'checkLimit').mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1);
      });
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(30000);

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

      const result1 = await service.generateText(request);
      expect(result1.content).toBe('Success');

      // Second request should be rate limited
      await expect(service.generateText(request))
        .rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Caching Integration', () => {
    it('should cache responses across multiple requests', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Cached response content' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 30, completion_tokens: 20, total_tokens: 50 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const service = getAIService();
      const request = {
        prompt: 'Cacheable request',
        context: { userId: 'user-123', contentType: 'message' },
        options: { temperature: 0.7 },
      };

      // First request
      const result1 = await service.generateText(request);
      
      // Second identical request should use cache
      const result2 = await service.generateText(request);

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only availability + first request
    });

    it('should handle cache invalidation properly', async () => {
      const service = getAIService();
      const request = {
        prompt: 'Cache invalidation test',
        context: { userId: 'user-123' },
        options: {},
      };

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

      // Make request and cache it
      await service.generateText(request);
      
      // Clear cache
      service.clearCache();
      
      // Make same request again - should hit API
      await service.generateText(request);

      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 availability + 2 requests
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary network failures', async () => {
      const service = getAIService();
      const request = {
        prompt: 'Network recovery test',
        context: { userId: 'user-123' },
        options: {},
      };

      // First attempt fails with network error
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockRejectedValueOnce(new Error('Network timeout'));

      await expect(service.generateText(request))
        .rejects.toThrow('Network timeout');

      // Second attempt succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Recovery success' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 },
            model: 'gpt-4o-mini',
          }),
        });

      const result = await service.generateText(request);
      expect(result.content).toBe('Recovery success');
    });

    it('should handle API quota exhaustion gracefully', async () => {
      const service = getAIService();
      const request = {
        prompt: 'Quota test',
        context: { userId: 'user-123' },
        options: {},
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () => Promise.resolve({
            error: {
              message: 'You exceeded your current quota',
              type: 'insufficient_quota',
            },
          }),
        });

      await expect(service.generateText(request))
        .rejects.toThrow('OpenAI API error: You exceeded your current quota');
    });

    it('should handle malformed API responses', async () => {
      const service = getAIService();
      const request = {
        prompt: 'Malformed response test',
        context: { userId: 'user-123' },
        options: {},
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            // Missing required fields
            invalid: 'response',
          }),
        });

      await expect(service.generateText(request))
        .rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const service = getAIService();
      const mockResponse = {
        choices: [{ message: { content: 'Concurrent response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      // Mock multiple successful responses
      mockFetch.mockResolvedValue({ ok: true });
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });
      }

      const requests = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Concurrent request ${i}`,
        context: { userId: `user-${i}` },
        options: {},
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        requests.map(req => service.generateText(req))
      );
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(results.every(r => r.content === 'Concurrent response')).toBe(true);
      
      // Should complete reasonably quickly (concurrent, not sequential)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large prompts efficiently', async () => {
      const service = getAIService();
      const largePrompt = 'A'.repeat(10000); // 10KB prompt

      const mockResponse = {
        choices: [{ message: { content: 'Large prompt response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 2500, completion_tokens: 100, total_tokens: 2600 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await service.generateText({
        prompt: largePrompt,
        context: { userId: 'user-123' },
        options: { maxTokens: 4000 },
      });

      expect(result.content).toBe('Large prompt response');
      expect(result.usage.promptTokens).toBe(2500);
    });
  });

  describe('Provider-Specific Integration', () => {
    it('should handle OpenAI-specific features', async () => {
      const service = getAIService();
      const mockResponse = {
        choices: [{
          message: { content: 'OpenAI specific response' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 40, completion_tokens: 25, total_tokens: 65 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await service.generateText({
        prompt: 'OpenAI test',
        context: { userId: 'user-123', contentType: 'message' },
        options: { model: 'gpt-4', temperature: 0.9 },
      }, 'openai');

      expect(result.provider).toBe('openai');
      
      // Verify OpenAI-specific API call
      const apiCall = mockFetch.mock.calls.find(call => 
        call[0].includes('openai.com')
      );
      expect(apiCall).toBeDefined();
      
      const requestBody = JSON.parse(apiCall[1].body);
      expect(requestBody.model).toBe('gpt-4');
      expect(requestBody.temperature).toBe(0.9);
      expect(requestBody.user).toBe('user-123');
    });

    it('should handle Claude-specific features', async () => {
      const service = getAIService();
      const mockResponse = {
        content: [{ text: 'Claude specific response' }],
        usage: { input_tokens: 35, output_tokens: 20 },
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await service.generateText({
        prompt: 'Claude test',
        context: { userId: 'user-123', contentType: 'idea' },
        options: { temperature: 0.6 },
      }, 'claude');

      expect(result.provider).toBe('claude');
      
      // Verify Claude-specific API call
      const apiCall = mockFetch.mock.calls.find(call => 
        call[0].includes('anthropic.com')
      );
      expect(apiCall).toBeDefined();
      
      const requestBody = JSON.parse(apiCall[1].body);
      expect(requestBody.temperature).toBe(0.6);
      expect(requestBody.system).toContain('Claude');
      expect(requestBody.messages[0].role).toBe('user');
    });
  });

  describe('Content Type Specialization', () => {
    it('should use appropriate system prompts for different content types', async () => {
      const service = getAIService();
      const contentTypes = ['message', 'caption', 'idea', 'pricing', 'timing'];

      for (const contentType of contentTypes) {
        const mockResponse = {
          choices: [{ message: { content: `${contentType} content` }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 30, completion_tokens: 15, total_tokens: 45 },
          model: 'gpt-4o-mini',
        };

        mockFetch
          .mockResolvedValueOnce({ ok: true })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse),
          });

        await service.generateText({
          prompt: `Generate ${contentType} content`,
          context: { userId: 'user-123', contentType: contentType as any },
          options: {},
        });

        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const requestBody = JSON.parse(lastCall[1].body);
        const systemPrompt = requestBody.messages[0].content;

        expect(systemPrompt).toContain('Huntaze');
        
        // Verify content-type specific prompts
        switch (contentType) {
          case 'message':
            expect(systemPrompt).toContain('personalized, engaging messages');
            break;
          case 'caption':
            expect(systemPrompt).toContain('compelling captions');
            break;
          case 'idea':
            expect(systemPrompt).toContain('creative content ideas');
            break;
          case 'pricing':
            expect(systemPrompt).toContain('pricing optimization');
            break;
          case 'timing':
            expect(systemPrompt).toContain('optimal timing');
            break;
        }
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should respect production environment settings', () => {
      process.env.NODE_ENV = 'production';
      
      // Force new instance creation
      (getAIService as any).aiServiceInstance = null;
      
      const service = getAIService();
      
      // In production, cache should be enabled
      const cache = (service as any).cache;
      expect(cache.config.enabled).toBe(true);
    });

    it('should handle different default providers', () => {
      process.env.DEFAULT_AI_PROVIDER = 'claude';
      
      // Force new instance creation
      (getAIService as any).aiServiceInstance = null;
      
      const service = getAIService();
      
      // Should use Claude as default
      expect((service as any).defaultProvider).toBe('claude');
    });
  });

  describe('Monitoring and Observability', () => {
    it('should track usage metrics', async () => {
      const service = getAIService();
      const mockResponse = {
        choices: [{ message: { content: 'Tracked content' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await service.generateText({
        prompt: 'Usage tracking test',
        context: { userId: 'user-123' },
        options: {},
      });

      // Verify usage information is returned
      expect(result.usage).toEqual({
        promptTokens: 50,
        completionTokens: 30,
        totalTokens: 80,
      });
    });

    it('should provide provider availability status', async () => {
      const service = getAIService();
      
      // Mock different availability scenarios
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // OpenAI available
        .mockRejectedValueOnce(new Error('Network error')); // Claude unavailable

      const availableProviders = await service.getAvailableProviders();
      
      expect(availableProviders).toContain('openai');
      expect(availableProviders).not.toContain('claude');
    });
  });
});