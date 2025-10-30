import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService, OpenAIProvider, ClaudeProvider, AIRequest, AIResponse } from '@/lib/services/ai-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('AI Service', () => {
  let aiService: AIService;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(fetch);
    
    // Initialize AI service with test configuration
    aiService = new AIService({
      openaiApiKey: 'test-openai-key',
      claudeApiKey: 'test-claude-key',
      defaultProvider: 'openai',
      cache: {
        enabled: true,
        ttlSeconds: 300,
        maxSize: 100,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Management', () => {
    it('should initialize with configured providers', () => {
      const status = aiService.getProviderStatus();
      
      expect(status.openai).toBe(true);
      expect(status.claude).toBe(true);
      expect(status.gemini).toBe(false);
    });

    it('should check provider availability', async () => {
      // Mock successful availability check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const availableProviders = await aiService.getAvailableProviders();
      
      expect(availableProviders).toContain('openai');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: { 'Authorization': 'Bearer test-openai-key' },
        })
      );
    });

    it('should handle provider unavailability', async () => {
      // Mock failed availability check
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const availableProviders = await aiService.getAvailableProviders();
      
      expect(availableProviders).toEqual([]);
    });
  });

  describe('Text Generation', () => {
    const mockRequest: AIRequest = {
      prompt: 'Generate a creative caption for a photo',
      context: {
        userId: 'user-123',
        contentType: 'caption',
        metadata: { platform: 'instagram' },
      },
      options: {
        temperature: 0.7,
        maxTokens: 150,
      },
    };

    it('should generate text using OpenAI provider', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Generated caption content' },
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
          json: () => Promise.resolve(mockResponse),
        });

      const result = await aiService.generateText(mockRequest);

      expect(result).toMatchObject({
        content: 'Generated caption content',
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75,
        },
        model: 'gpt-4o-mini',
        provider: 'openai',
        finishReason: 'stop',
      });
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-openai-key',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Generate a creative caption'),
        })
      );
    });

    it.skip('should generate text using Claude provider when specified', async () => {
      const mockResponse = {
        content: [{ text: 'Claude generated content' }],
        usage: {
          input_tokens: 40,
          output_tokens: 30,
        },
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await aiService.generateText(mockRequest, 'claude');

      expect(result).toMatchObject({
        content: 'Claude generated content',
        usage: {
          promptTokens: 40,
          completionTokens: 30,
          totalTokens: 70,
        },
        model: 'claude-3-haiku-20240307',
        provider: 'claude',
        finishReason: 'stop',
      });
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'x-api-key': 'test-claude-key',
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
        })
      );
    });

    it('should validate request data', async () => {
      const invalidRequest = {
        prompt: '', // Invalid: empty prompt
        context: {
          userId: 'user-123',
        },
      };

      await expect(aiService.generateText(invalidRequest as any))
        .rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
        },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve(errorResponse),
        });

      await expect(aiService.generateText(mockRequest))
        .rejects.toThrow('Invalid API key');
    });

    it.skip('should fallback to alternative provider on failure', async () => {
      const claudeResponse = {
        content: [{ text: 'Fallback content from Claude' }],
        usage: { input_tokens: 40, output_tokens: 30 },
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // OpenAI availability check
        .mockResolvedValueOnce({ ok: true }) // Claude availability check
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ error: { message: 'OpenAI API error' } }),
        }) // OpenAI API call fails
        .mockResolvedValueOnce({ ok: true }) // Claude availability check for fallback
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(claudeResponse),
        }); // Claude API call succeeds

      const result = await aiService.generateText(mockRequest);

      expect(result.provider).toBe('claude');
      expect(result.content).toBe('Fallback content from Claude');
    });
  });

  describe('Caching', () => {
    const mockRequest: AIRequest = {
      prompt: 'Test prompt for caching',
      context: {
        userId: 'user-123',
        contentType: 'message',
      },
      options: {
        temperature: 0.7,
        maxTokens: 100,
      },
    };

    it('should cache responses', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Cached content' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Availability check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      // First request
      const result1 = await aiService.generateText(mockRequest);
      
      // Second identical request should use cache
      const result2 = await aiService.generateText(mockRequest);

      // Results should have same content (but may have different metadata like cached flag)
      expect(result1.content).toEqual(result2.content);
      expect(result1.model).toEqual(result2.model);
      expect(result1.provider).toEqual(result2.provider);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only availability + first request
    });

    it('should respect cache TTL', async () => {
      // Create service with very short cache TTL
      const shortCacheService = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 0.001, maxSize: 100 },
      });

      const mockResponse = {
        choices: [{ message: { content: 'Content' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      await shortCacheService.generateText(mockRequest);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await shortCacheService.generateText(mockRequest);

      // Should make two API calls due to cache expiration
      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 availability + 2 requests
    });

    it('should clear cache when requested', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Content' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      await aiService.generateText(mockRequest);
      
      aiService.clearCache();
      
      await aiService.generateText(mockRequest);

      // Should make two API calls due to cache clear
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Rate Limiting', () => {
    const mockRequest: AIRequest = {
      prompt: 'Rate limit test',
      context: { userId: 'user-123' },
      options: {},
    };

    it('should enforce rate limits', async () => {
      // Mock a provider with very low rate limits for testing
      const rateLimitedService = new AIService({
        openaiApiKey: 'test-key',
      });

      // Mock the rate limiter to always return false
      const rateLimiter = (rateLimitedService as any).rateLimiter;
      vi.spyOn(rateLimiter, 'checkLimit').mockResolvedValue(false);
      vi.spyOn(rateLimiter, 'getWaitTime').mockReturnValue(60000);

      mockFetch.mockResolvedValue({ ok: true });

      await expect(rateLimitedService.generateText(mockRequest))
        .rejects.toThrow('Rate limit exceeded. Try again in 60 seconds.');
    });

    it('should allow requests within rate limits', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Content' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
        model: 'gpt-4o-mini',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await aiService.generateText(mockRequest);

      expect(result.content).toBe('Content');
    });
  });

  describe('Error Handling', () => {
    const mockRequest: AIRequest = {
      prompt: 'Error test',
      context: { userId: 'user-123' },
      options: {},
    };

    it('should handle network errors', async () => {
      // Create a service with only OpenAI (no fallback)
      const openaiOnlyService = new AIService({
        openaiApiKey: 'test-key',
        defaultProvider: 'openai',
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true }) // OpenAI availability check
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Network error',
          json: () => Promise.resolve({ error: { message: 'Network error' } }),
        }); // OpenAI API call fails

      await expect(openaiOnlyService.generateText(mockRequest))
        .rejects.toThrow('Network error');
    });

    it('should handle no available providers', async () => {
      const noProviderService = new AIService({});

      await expect(noProviderService.generateText(mockRequest))
        .rejects.toThrow('No AI providers available');
    });

    it('should handle malformed API responses', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ invalid: 'response' }),
        });

      await expect(aiService.generateText(mockRequest))
        .rejects.toThrow();
    });
  });
});

describe('OpenAI Provider', () => {
  let provider: OpenAIProvider;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(fetch);
    provider = new OpenAIProvider('test-api-key');
  });

  describe('Text Generation', () => {
    it('should generate text with correct API call', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Generated text' },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 30,
          completion_tokens: 20,
          total_tokens: 50,
        },
        model: 'gpt-4o-mini',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request: AIRequest = {
        prompt: 'Test prompt',
        context: {
          userId: 'user-123',
          contentType: 'message',
        },
        options: {
          temperature: 0.8,
          maxTokens: 200,
          model: 'gpt-4',
        },
      };

      const result = await provider.generateText(request);

      expect(result).toMatchObject({
        content: 'Generated text',
        usage: {
          promptTokens: 30,
          completionTokens: 20,
          totalTokens: 50,
        },
        model: 'gpt-4o-mini',
        provider: 'openai',
        finishReason: 'stop',
      });
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);

      // Verify the fetch call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        })
      );

      // Parse and verify the body separately
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('personalized, engaging messages'),
          },
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
        user: 'user-123',
      });
    });

    it.skip('should handle fetch call verification correctly with parsed body', async () => {
      // Regression test for fetch call verification pattern
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Test response',
              },
              finish_reason: 'stop',
            },
          ],
        }),
      });

      global.fetch = mockFetch;

      await aiService.generatePersonalizedMessage({
        userId: 'user-123',
        fanName: 'Test Fan',
        context: 'greeting',
        prompt: 'Test prompt',
      });

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Verify the call structure
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      });

      // Verify body can be parsed and contains expected structure
      expect(() => JSON.parse(options.body)).not.toThrow();
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody).toHaveProperty('model');
      expect(parsedBody).toHaveProperty('messages');
      expect(parsedBody).toHaveProperty('temperature');
      expect(parsedBody).toHaveProperty('max_tokens');
      expect(parsedBody).toHaveProperty('user');
      expect(Array.isArray(parsedBody.messages)).toBe(true);
    });

    it('should use appropriate system prompts for different content types', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Content' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        model: 'gpt-4o-mini',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const contentTypes = ['message', 'caption', 'idea', 'pricing', 'timing'];

      for (const contentType of contentTypes) {
        await provider.generateText({
          prompt: 'Test',
          context: { userId: 'user-123', contentType: contentType as any },
          options: {},
        });

        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const body = JSON.parse(lastCall[1].body);
        const systemMessage = body.messages[0].content;

        expect(systemMessage).toContain('Huntaze');
        
        switch (contentType) {
          case 'message':
            expect(systemMessage).toContain('personalized, engaging messages');
            break;
          case 'caption':
            expect(systemMessage).toContain('compelling captions');
            break;
          case 'idea':
            expect(systemMessage).toContain('creative content ideas');
            break;
          case 'pricing':
            expect(systemMessage).toContain('pricing optimization');
            break;
          case 'timing':
            expect(systemMessage).toContain('optimal timing');
            break;
        }
      }
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve(errorResponse),
      });

      const request: AIRequest = {
        prompt: 'Test',
        context: { userId: 'user-123' },
        options: {},
      };

      await expect(provider.generateText(request))
        .rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Availability Check', () => {
    it('should return true when API is available', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        { headers: { 'Authorization': 'Bearer test-api-key' } }
      );
    });

    it('should return false when API is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(false);
    });
  });

  describe('Rate Limits', () => {
    it('should return correct rate limit configuration', () => {
      const rateLimit = provider.getRateLimit();

      expect(rateLimit).toEqual({
        requestsPerMinute: 60,
        requestsPerHour: 3000,
        requestsPerDay: 10000,
      });
    });
  });
});

describe.skip('Claude Provider', () => {
  let provider: ClaudeProvider;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(fetch);
    provider = new ClaudeProvider('test-api-key');
  });

  describe('Text Generation', () => {
    it('should generate text with correct API call', async () => {
      const mockResponse = {
        content: [{ text: 'Claude generated text' }],
        usage: {
          input_tokens: 25,
          output_tokens: 35,
        },
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request: AIRequest = {
        prompt: 'Test prompt',
        context: {
          userId: 'user-123',
          contentType: 'caption',
        },
        options: {
          temperature: 0.6,
          maxTokens: 150,
        },
      };

      const result = await provider.generateText(request);

      expect(result).toMatchObject({
        content: 'Claude generated text',
        usage: {
          promptTokens: 25,
          completionTokens: 35,
          totalTokens: 60,
        },
        model: 'claude-3-haiku-20240307',
        provider: 'claude',
        finishReason: 'stop',
      });
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);

      // Verify the fetch call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
        })
      );

      // Parse and verify the body separately
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0.6,
        system: expect.stringContaining('Claude, an AI assistant'),
        messages: [
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
      });
    });

    it('should handle different finish reasons', async () => {
      const testCases = [
        { stop_reason: 'end_turn', expected: 'stop' },
        { stop_reason: 'max_tokens', expected: 'length' },
        { stop_reason: 'stop_sequence', expected: 'content_filter' },
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          content: [{ text: 'Text' }],
          usage: { input_tokens: 10, output_tokens: 10 },
          model: 'claude-3-haiku-20240307',
          stop_reason: testCase.stop_reason,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await provider.generateText({
          prompt: 'Test',
          context: { userId: 'user-123' },
          options: {},
        });

        expect(result.finishReason).toBe(testCase.expected);
      }
    });
  });

  describe('Availability Check', () => {
    it('should return true when API is available', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(true);
    });

    it('should return true on 400 error (expected for minimal request)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400 });

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(true);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await provider.isAvailable();

      expect(isAvailable).toBe(false);
    });
  });
});

describe('Rate Limiter', () => {
  let rateLimiter: any;

  beforeEach(() => {
    // Access the private RateLimiter class through the service
    const service = new AIService({ openaiApiKey: 'test' });
    rateLimiter = (service as any).rateLimiter;
  });

  it('should allow requests within limits', async () => {
    const limit = {
      requestsPerMinute: 5,
      requestsPerHour: 100,
      requestsPerDay: 1000,
    };

    const canProceed = await rateLimiter.checkLimit('test-key', limit);
    expect(canProceed).toBe(true);
  });

  it('should block requests exceeding minute limit', async () => {
    const limit = {
      requestsPerMinute: 2,
      requestsPerHour: 100,
      requestsPerDay: 1000,
    };

    // Make requests up to the limit
    await rateLimiter.checkLimit('test-key', limit);
    await rateLimiter.checkLimit('test-key', limit);
    
    // This should be blocked
    const canProceed = await rateLimiter.checkLimit('test-key', limit);
    expect(canProceed).toBe(false);
  });

  it('should calculate correct wait time', () => {
    const limit = {
      requestsPerMinute: 1,
      requestsPerHour: 100,
      requestsPerDay: 1000,
    };

    // Make a request to establish timing
    rateLimiter.checkLimit('test-key', limit);
    
    const waitTime = rateLimiter.getWaitTime('test-key', limit);
    expect(waitTime).toBeGreaterThan(0);
    expect(waitTime).toBeLessThanOrEqual(60000); // Should be within a minute
  });
});

describe('Response Cache', () => {
  let cache: any;

  beforeEach(() => {
    // Access the private ResponseCache class through the service
    const service = new AIService({
      openaiApiKey: 'test',
      cache: { enabled: true, ttlSeconds: 300, maxSize: 10 },
    });
    cache = (service as any).cache;
  });

  it('should cache and retrieve responses', () => {
    const request: AIRequest = {
      prompt: 'Test prompt',
      context: { userId: 'user-123', contentType: 'message' },
      options: { temperature: 0.7 },
    };

    const response: AIResponse = {
      content: 'Cached content',
      usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
      model: 'test-model',
      provider: 'openai',
      finishReason: 'stop',
    };

    // Should return null initially
    expect(cache.get(request)).toBeNull();

    // Cache the response
    cache.set(request, response);

    // Should return cached response
    expect(cache.get(request)).toEqual(response);
  });

  it('should respect TTL', async () => {
    const shortTTLCache = new (cache.constructor)({
      enabled: true,
      ttlSeconds: 0.001, // Very short TTL
      maxSize: 10,
    });

    const request: AIRequest = {
      prompt: 'Test',
      context: { userId: 'user-123' },
      options: {},
    };

    const response: AIResponse = {
      content: 'Content',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: 'test',
      provider: 'openai',
      finishReason: 'stop',
    };

    shortTTLCache.set(request, response);
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(shortTTLCache.get(request)).toBeNull();
  });

  it('should respect max size limit', () => {
    const smallCache = new (cache.constructor)({
      enabled: true,
      ttlSeconds: 300,
      maxSize: 2,
    });

    const response: AIResponse = {
      content: 'Content',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: 'test',
      provider: 'openai',
      finishReason: 'stop',
    };

    // Fill cache to capacity
    smallCache.set({ prompt: '1', context: { userId: 'user' }, options: {} }, response);
    smallCache.set({ prompt: '2', context: { userId: 'user' }, options: {} }, response);
    
    // Adding third item should evict first
    smallCache.set({ prompt: '3', context: { userId: 'user' }, options: {} }, response);
    
    expect(smallCache.get({ prompt: '1', context: { userId: 'user' }, options: {} })).toBeNull();
    expect(smallCache.get({ prompt: '3', context: { userId: 'user' }, options: {} })).toEqual(response);
  });

  it('should clear cache', () => {
    const request: AIRequest = {
      prompt: 'Test',
      context: { userId: 'user-123' },
      options: {},
    };

    const response: AIResponse = {
      content: 'Content',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      model: 'test',
      provider: 'openai',
      finishReason: 'stop',
    };

    cache.set(request, response);
    expect(cache.get(request)).toEqual(response);
    
    cache.clear();
    expect(cache.get(request)).toBeNull();
  });
});