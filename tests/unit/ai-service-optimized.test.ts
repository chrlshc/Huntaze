import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AIService,
  OpenAIProvider,
  ClaudeProvider,
  AIServiceError,
  AIErrorType,
  ConsoleLogger,
  type AIRequest,
  type AIResponse,
} from '@/lib/services/ai-service';

/**
 * Tests pour les optimisations du service AI
 * Valide la gestion d'erreurs, retry logic, types, et logging
 */

describe('AI Service - Optimized Integration', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Handling', () => {
    it('should throw AIServiceError with proper type for 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const provider = new OpenAIProvider('test-key');

      await expect(
        provider.generateText({
          prompt: 'test',
          context: { userId: 'user-1' },
        })
      ).rejects.toThrow(AIServiceError);

      try {
        await provider.generateText({
          prompt: 'test',
          context: { userId: 'user-1' },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).type).toBe(AIErrorType.AUTHENTICATION);
        expect((error as AIServiceError).retryable).toBe(false);
      }
    });

    it('should throw AIServiceError with retry info for 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: 'Rate limit exceeded', retry_after: 60 },
        }),
      });

      const provider = new OpenAIProvider('test-key');

      try {
        await provider.generateText({
          prompt: 'test',
          context: { userId: 'user-1' },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).type).toBe(AIErrorType.RATE_LIMIT);
        expect((error as AIServiceError).retryable).toBe(true);
        expect((error as AIServiceError).retryAfter).toBe(60000);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const provider = new OpenAIProvider('test-key');

      try {
        await provider.generateText({
          prompt: 'test',
          context: { userId: 'user-1' },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).type).toBe(AIErrorType.NETWORK_ERROR);
        expect((error as AIServiceError).retryable).toBe(true);
      }
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const provider = new OpenAIProvider('test-key');

      try {
        await provider.generateText({
          prompt: 'test',
          context: { userId: 'user-1' },
          options: { timeout: 50 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).type).toBe(AIErrorType.TIMEOUT);
        expect((error as AIServiceError).retryable).toBe(true);
      }
    });

    it('should serialize AIServiceError to JSON', () => {
      const error = new AIServiceError(
        'Test error',
        AIErrorType.RATE_LIMIT,
        'openai',
        429,
        true,
        60000
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'AIServiceError',
        message: 'Test error',
        type: AIErrorType.RATE_LIMIT,
        provider: 'openai',
        statusCode: 429,
        retryable: true,
        retryAfter: 60000,
      });
    });
  });

  describe('Retry Strategy', () => {
    it('should retry on retryable errors with exponential backoff', async () => {
      let attempts = 0;

      mockFetch.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          return {
            ok: false,
            status: 503,
            json: async () => ({ error: { message: 'Service unavailable' } }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            model: 'gpt-4o-mini',
          }),
        };
      });

      const service = new AIService({
        openaiApiKey: 'test-key',
        retry: {
          maxAttempts: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          retryableErrors: [AIErrorType.SERVER_ERROR],
        },
      });

      const response = await service.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
      });

      expect(response.content).toBe('Success');
      expect(attempts).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      let attempts = 0;

      mockFetch.mockImplementation(async () => {
        attempts++;
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Unauthorized' } }),
        };
      });

      const service = new AIService({
        openaiApiKey: 'test-key',
        retry: {
          maxAttempts: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          retryableErrors: [AIErrorType.SERVER_ERROR],
        },
      });

      await expect(
        service.generateText({
          prompt: 'test',
          context: { userId: 'user-1' },
        })
      ).rejects.toThrow(AIServiceError);

      expect(attempts).toBe(1); // No retries
    });

    it('should respect retry-after header', async () => {
      const startTime = Date.now();

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            error: { message: 'Rate limit', retry_after: 0.2 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            model: 'gpt-4o-mini',
          }),
        });

      const service = new AIService({
        openaiApiKey: 'test-key',
        retry: {
          maxAttempts: 2,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          retryableErrors: [AIErrorType.RATE_LIMIT],
        },
      });

      await service.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(200); // Waited for retry-after
    });
  });

  describe('TypeScript Types', () => {
    it('should validate request schema', () => {
      const validRequest: AIRequest = {
        prompt: 'test prompt',
        context: {
          userId: 'user-1',
          contentType: 'message',
        },
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          model: 'gpt-4',
          timeout: 30000,
        },
      };

      expect(validRequest).toBeDefined();
    });

    it('should validate response schema', () => {
      const validResponse: AIResponse = {
        content: 'Generated content',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: 'gpt-4o-mini',
        provider: 'openai',
        finishReason: 'stop',
        cached: false,
        latencyMs: 1500,
      };

      expect(validResponse).toBeDefined();
    });
  });

  describe('Token Management', () => {
    it('should track token usage in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
          model: 'gpt-4o-mini',
        }),
      });

      const provider = new OpenAIProvider('test-key');
      const response = await provider.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
      });

      expect(response.usage).toEqual({
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40,
      });
    });

    it('should respect maxTokens option', async () => {
      let requestBody: any;

      mockFetch.mockImplementationOnce(async (url, options) => {
        requestBody = JSON.parse(options?.body as string);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            model: 'gpt-4o-mini',
          }),
        };
      });

      const provider = new OpenAIProvider('test-key');
      await provider.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
        options: { maxTokens: 500 },
      });

      expect(requestBody.max_tokens).toBe(500);
    });
  });

  describe('Caching', () => {
    it('should cache responses and return cached data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Cached' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'gpt-4o-mini',
        }),
      });

      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: true, ttlSeconds: 300, maxSize: 100 },
      });

      const request: AIRequest = {
        prompt: 'test',
        context: { userId: 'user-1' },
      };

      // First call - should hit API
      const response1 = await service.generateText(request);
      expect(response1.cached).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const response2 = await service.generateText(request);
      expect(response2.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should not cache when disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Not cached' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'gpt-4o-mini',
        }),
      });

      const service = new AIService({
        openaiApiKey: 'test-key',
        cache: { enabled: false, ttlSeconds: 300, maxSize: 100 },
      });

      const request: AIRequest = {
        prompt: 'test',
        context: { userId: 'user-1' },
      };

      await service.generateText(request);
      await service.generateText(request);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Both calls hit API
    });
  });

  describe('Logging', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const logger = new ConsoleLogger('TestContext');

      logger.debug('Test message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestContext] Test message',
        { key: 'value' }
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should log errors with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = new ConsoleLogger('TestContext');

      logger.error('Error occurred', { errorCode: 500 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestContext] Error occurred',
        { errorCode: 500 }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Azure OpenAI Support', () => {
    it('should use Azure-specific URL format', async () => {
      let requestUrl: string = '';

      mockFetch.mockImplementationOnce(async (url) => {
        requestUrl = url as string;
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Azure' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            model: 'gpt-4o-mini',
          }),
        };
      });

      const provider = new OpenAIProvider(
        'test-key',
        'https://my-resource.openai.azure.com',
        { isAzure: true, apiVersion: '2024-02-15-preview' }
      );

      await provider.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
        options: { model: 'gpt-4o-mini' },
      });

      expect(requestUrl).toContain('openai/deployments/gpt-4o-mini/chat/completions');
      expect(requestUrl).toContain('api-version=2024-02-15-preview');
    });

    it('should use Azure-specific authentication header', async () => {
      let requestHeaders: Record<string, string> = {};

      mockFetch.mockImplementationOnce(async (url, options) => {
        requestHeaders = options?.headers as Record<string, string>;
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Azure' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            model: 'gpt-4o-mini',
          }),
        };
      });

      const provider = new OpenAIProvider(
        'test-key',
        'https://my-resource.openai.azure.com',
        { isAzure: true }
      );

      await provider.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
      });

      expect(requestHeaders['api-key']).toBe('test-key');
      expect(requestHeaders['Authorization']).toBeUndefined();
    });
  });

  describe('Provider Fallback', () => {
    it('should fallback to secondary provider on primary failure', async () => {
      let openaiCalls = 0;
      let claudeCalls = 0;

      mockFetch.mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('openai')) {
          openaiCalls++;
          return {
            ok: false,
            status: 503,
            json: async () => ({ error: { message: 'Service unavailable' } }),
          };
        }
        if (typeof url === 'string' && url.includes('anthropic')) {
          claudeCalls++;
          return {
            ok: true,
            json: async () => ({
              content: [{ text: 'Fallback success' }],
              usage: { input_tokens: 10, output_tokens: 20 },
              model: 'claude-3-haiku-20240307',
              stop_reason: 'end_turn',
            }),
          };
        }
        return { ok: false, status: 500, json: async () => ({}) };
      });

      const service = new AIService({
        openaiApiKey: 'openai-key',
        claudeApiKey: 'claude-key',
        defaultProvider: 'openai',
        retry: {
          maxAttempts: 1,
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffMultiplier: 2,
          retryableErrors: [],
        },
      });

      const response = await service.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
      });

      expect(response.content).toBe('Fallback success');
      expect(response.provider).toBe('claude');
      expect(openaiCalls).toBe(1);
      expect(claudeCalls).toBe(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should track latency in response', async () => {
      mockFetch.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Test' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            model: 'gpt-4o-mini',
          }),
        };
      });

      const provider = new OpenAIProvider('test-key');
      const response = await provider.generateText({
        prompt: 'test',
        context: { userId: 'user-1' },
      });

      expect(response.latencyMs).toBeGreaterThanOrEqual(100);
    });
  });
});
