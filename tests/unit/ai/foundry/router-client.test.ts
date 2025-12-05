/**
 * Unit Tests: RouterClient Error Handling
 * 
 * Tests error handling for the RouterClient including:
 * - HTTP 400 → ValidationError
 * - HTTP 500 → ServiceError
 * - Timeout → TimeoutError
 * - Connection failure → ConnectionError
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RouterClient,
  RouterError,
  RouterErrorCode,
  createRouterClient,
  getRouterClient,
} from '../../../../lib/ai/foundry/router-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RouterClient Error Handling', () => {
  let client: RouterClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RouterClient('http://test-router.local');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('HTTP 400 - Validation Error', () => {
    it('should throw ValidationError with detail message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid prompt format' }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        message: expect.stringContaining('Invalid prompt format'),
      });
    });

    it('should handle 400 with message field', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Missing required field' }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        message: expect.stringContaining('Missing required field'),
      });
    });

    it('should handle 400 with plain text response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Not JSON'); },
        text: async () => 'Bad Request',
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.VALIDATION_ERROR,
        statusCode: 400,
      });
    });
  });

  describe('HTTP 500 - Service Error', () => {
    it('should throw ServiceError with retry suggestion', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.SERVICE_ERROR,
        statusCode: 500,
        message: expect.stringContaining('please retry'),
      });
    });

    it('should handle 502 Bad Gateway', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ detail: 'Bad Gateway' }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.SERVICE_ERROR,
        statusCode: 502,
      });
    });

    it('should handle 503 Service Unavailable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service temporarily unavailable' }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.SERVICE_ERROR,
        statusCode: 503,
      });
    });
  });

  describe('Timeout Error', () => {
    it('should throw TimeoutError when request times out', async () => {
      // Mock AbortError
      mockFetch.mockRejectedValue(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.TIMEOUT_ERROR,
        message: expect.stringContaining('timed out'),
      });
    });

    it('should include timeout value in error message', async () => {
      mockFetch.mockRejectedValue(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      try {
        await client.route({ prompt: 'test', client_tier: 'standard' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RouterError);
        expect((error as RouterError).message).toContain('60s');
      }
    });
  });

  describe('Connection Error', () => {
    it('should throw ConnectionError when network fails', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.CONNECTION_ERROR,
        message: expect.stringContaining('Cannot reach router'),
      });
    });

    it('should include endpoint URL in error', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));

      try {
        await client.route({ prompt: 'test', client_tier: 'standard' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RouterError);
        expect((error as RouterError).endpoint).toContain('test-router.local');
      }
    });

    it('should handle DNS resolution failure', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.CONNECTION_ERROR,
      });
    });
  });

  describe('Parse Error', () => {
    it('should throw ParseError for invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => null,
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.PARSE_ERROR,
      });
    });

    it('should throw ParseError when model field is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          output: 'Response without model',
        }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.PARSE_ERROR,
        message: expect.stringContaining('model'),
      });
    });

    it('should throw ParseError when output field is missing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'Llama-3.3-70B',
        }),
      });

      await expect(
        client.route({ prompt: 'test', client_tier: 'standard' })
      ).rejects.toMatchObject({
        code: RouterErrorCode.PARSE_ERROR,
        message: expect.stringContaining('output'),
      });
    });
  });
});

describe('RouterClient Successful Responses', () => {
  let client: RouterClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RouterClient('http://test-router.local');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should parse complete response correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'Llama-3.3-70B',
        deployment: 'llama33-70b-us',
        region: 'eastus2',
        routing: {
          type: 'chat',
          complexity: 'medium',
          language: 'en',
          client_tier: 'standard',
        },
        output: 'Hello! How can I help you?',
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,
          total_tokens: 40,
        },
      }),
    });

    const response = await client.route({
      prompt: 'Hello',
      client_tier: 'standard',
    });

    expect(response.model).toBe('Llama-3.3-70B');
    expect(response.deployment).toBe('llama33-70b-us');
    expect(response.region).toBe('eastus2');
    expect(response.output).toBe('Hello! How can I help you?');
    expect(response.usage?.prompt_tokens).toBe(15);
    expect(response.usage?.completion_tokens).toBe(25);
    expect(response.routing.type).toBe('chat');
  });

  it('should handle response without optional fields', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'DeepSeek-R1',
        output: 'Analysis complete',
      }),
    });

    const response = await client.route({
      prompt: 'Analyze this',
      client_tier: 'vip',
    });

    expect(response.model).toBe('DeepSeek-R1');
    expect(response.output).toBe('Analysis complete');
    expect(response.deployment).toBe('unknown');
    expect(response.region).toBe('unknown');
    expect(response.usage).toBeUndefined();
  });
});

describe('RouterClient Health Check', () => {
  let client: RouterClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RouterClient('http://test-router.local');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return health status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'healthy',
        region: 'eastus2',
      }),
    });

    const health = await client.healthCheck();

    expect(health.status).toBe('healthy');
    expect(health.region).toBe('eastus2');
  });

  it('should throw on health check failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(client.healthCheck()).rejects.toMatchObject({
      code: RouterErrorCode.SERVICE_ERROR,
    });
  });
});

describe('RouterClient Factory Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create client with custom URL', () => {
    const client = createRouterClient('http://custom-router.local');
    expect(client).toBeInstanceOf(RouterClient);
  });

  it('should return singleton instance', () => {
    const client1 = getRouterClient();
    const client2 = getRouterClient();
    expect(client1).toBe(client2);
  });
});
