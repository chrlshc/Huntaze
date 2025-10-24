import { vi, beforeEach, afterEach } from 'vitest';
import { mockProviderResponses, mockAIResponses } from '../fixtures/ai-service-fixtures';

// Global test setup for AI Service tests
export function setupAIServiceTests() {
  let mockFetch: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Setup fake timers
    vi.useFakeTimers();
    
    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Setup default environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-claude-key';
    process.env.DEFAULT_AI_PROVIDER = 'openai';
    process.env.NODE_ENV = 'test';
    
    // Reset AI service singleton
    const aiServiceModule = require('@/lib/services/ai-service');
    if (aiServiceModule.aiServiceInstance) {
      aiServiceModule.aiServiceInstance = null;
    }
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
    
    // Restore all mocks
    vi.restoreAllMocks();
    
    // Clean up environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.DEFAULT_AI_PROVIDER;
  });

  return { mockFetch };
}

// Mock successful API responses
export function mockSuccessfulAPIResponses(mockFetch: any) {
  // Mock OpenAI availability check
  mockFetch.mockResolvedValueOnce({ ok: true });
  
  // Mock successful OpenAI response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockProviderResponses.openai.success),
  });
}

// Mock failed API responses
export function mockFailedAPIResponses(mockFetch: any, errorType: 'network' | 'auth' | 'rate_limit' | 'quota' = 'network') {
  // Mock availability check
  mockFetch.mockResolvedValueOnce({ ok: true });
  
  // Mock failed response based on error type
  switch (errorType) {
    case 'network':
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      break;
    case 'auth':
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve(mockProviderResponses.openai.authError),
      });
      break;
    case 'rate_limit':
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve(mockProviderResponses.openai.rateLimitError),
      });
      break;
    case 'quota':
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve(mockProviderResponses.openai.quotaError),
      });
      break;
  }
}

// Mock provider fallback scenario
export function mockProviderFallback(mockFetch: any) {
  // Mock OpenAI availability
  mockFetch.mockResolvedValueOnce({ ok: true });
  
  // Mock Claude availability
  mockFetch.mockResolvedValueOnce({ ok: true });
  
  // Mock OpenAI failure
  mockFetch.mockRejectedValueOnce(new Error('OpenAI service error'));
  
  // Mock successful Claude response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockProviderResponses.claude.success),
  });
}

// Mock rate limiting scenario
export function mockRateLimitingScenario(mockFetch: any, allowedRequests: number = 1) {
  // Mock availability checks
  for (let i = 0; i < allowedRequests + 2; i++) {
    mockFetch.mockResolvedValueOnce({ ok: true });
  }
  
  // Mock successful responses for allowed requests
  for (let i = 0; i < allowedRequests; i++) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProviderResponses.openai.success),
    });
  }
  
  // Mock rate limit error for subsequent requests
  mockFetch.mockResolvedValue({
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    json: () => Promise.resolve(mockProviderResponses.openai.rateLimitError),
  });
}

// Mock caching scenario
export function mockCachingScenario(mockFetch: any) {
  // Mock availability check
  mockFetch.mockResolvedValueOnce({ ok: true });
  
  // Mock single successful response (should be cached)
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockProviderResponses.openai.success),
  });
}

// Mock concurrent requests scenario
export function mockConcurrentRequests(mockFetch: any, requestCount: number) {
  // Mock availability checks
  for (let i = 0; i < requestCount; i++) {
    mockFetch.mockResolvedValueOnce({ ok: true });
  }
  
  // Mock successful responses
  for (let i = 0; i < requestCount; i++) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockProviderResponses.openai.success,
        choices: [{
          message: { content: `Response ${i}` },
          finish_reason: 'stop',
        }],
      }),
    });
  }
}

// Mock malformed response
export function mockMalformedResponse(mockFetch: any) {
  // Mock availability check
  mockFetch.mockResolvedValueOnce({ ok: true });
  
  // Mock malformed response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockProviderResponses.openai.malformed),
  });
}

// Mock provider unavailability
export function mockProviderUnavailable(mockFetch: any) {
  // Mock failed availability check
  mockFetch.mockRejectedValue(new Error('Provider unavailable'));
}

// Mock different content types
export function mockContentTypeResponses(mockFetch: any) {
  const contentTypes = ['message', 'caption', 'idea', 'pricing', 'timing'];
  
  contentTypes.forEach((contentType, index) => {
    // Mock availability check
    mockFetch.mockResolvedValueOnce({ ok: true });
    
    // Mock response for each content type
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ...mockProviderResponses.openai.success,
        choices: [{
          message: { content: `Generated ${contentType} content` },
          finish_reason: 'stop',
        }],
      }),
    });
  });
}

// Utility to create test AI service with custom config
export function createTestAIService(config: any = {}) {
  const { AIService } = require('@/lib/services/ai-service');
  
  return new AIService({
    openaiApiKey: 'test-openai-key',
    claudeApiKey: 'test-claude-key',
    defaultProvider: 'openai',
    cache: {
      enabled: true,
      ttlSeconds: 300,
      maxSize: 100,
    },
    ...config,
  });
}

// Utility to wait for async operations
export async function waitForAsyncOperations() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// Utility to advance timers and wait
export async function advanceTimersAndWait(ms: number) {
  vi.advanceTimersByTime(ms);
  await waitForAsyncOperations();
}

// Mock authentication for API tests
export function mockAuthentication() {
  return {
    user: {
      id: 'test-user-123',
      email: 'test@huntaze.com',
      name: 'Test User',
    },
  };
}

// Mock unauthenticated state
export function mockUnauthenticated() {
  return { user: null };
}

// Utility to create mock request with defaults
export function createMockRequest(url: string, options: any = {}) {
  const { NextRequest } = require('next/server');
  
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
}

// Utility to parse response JSON
export async function parseResponseJSON(response: Response) {
  return await response.json();
}

// Utility to assert successful API response
export function assertSuccessfulResponse(data: any) {
  expect(data.success).toBe(true);
  expect(data.data).toBeDefined();
  expect(data.timestamp).toBeDefined();
  expect(data.requestId).toBeDefined();
}

// Utility to assert error response
export function assertErrorResponse(data: any, expectedCode: string, expectedStatus: number) {
  expect(data.success).toBe(false);
  expect(data.error).toBeDefined();
  expect(data.error.code).toBe(expectedCode);
}

// Performance testing utilities
export function measurePerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve) => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    resolve({ result, duration });
  });
}

// Memory usage testing utilities
export function measureMemoryUsage<T>(fn: () => T): { result: T; memoryUsed: number } {
  const initialMemory = process.memoryUsage().heapUsed;
  const result = fn();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryUsed = finalMemory - initialMemory;
  
  return { result, memoryUsed };
}

// Cleanup utilities
export function forceGarbageCollection() {
  if (global.gc) {
    global.gc();
  }
}

// Test data generators
export function generateLargePrompt(sizeKB: number): string {
  const targetLength = sizeKB * 1024;
  return 'A'.repeat(targetLength);
}

export function generateManyRequests(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    prompt: `Test request ${i}`,
    context: { userId: `user-${i}` },
    options: {},
  }));
}

// Mock SSE events for integration tests
export function mockSSEEvents() {
  const mockEmitter = {
    emitAIInsight: vi.fn(),
    emitAIRecommendation: vi.fn(),
  };
  
  vi.doMock('@/lib/services/sse-events', () => ({
    ContentCreationEventEmitter: mockEmitter,
  }));
  
  return mockEmitter;
}

// Validation utilities
export function validateAIResponse(response: any) {
  expect(response).toHaveProperty('content');
  expect(response).toHaveProperty('usage');
  expect(response).toHaveProperty('model');
  expect(response).toHaveProperty('provider');
  expect(response).toHaveProperty('finishReason');
  
  expect(typeof response.content).toBe('string');
  expect(response.content.length).toBeGreaterThan(0);
  
  expect(response.usage).toHaveProperty('promptTokens');
  expect(response.usage).toHaveProperty('completionTokens');
  expect(response.usage).toHaveProperty('totalTokens');
  
  expect(response.usage.promptTokens).toBeGreaterThan(0);
  expect(response.usage.completionTokens).toBeGreaterThan(0);
  expect(response.usage.totalTokens).toBe(
    response.usage.promptTokens + response.usage.completionTokens
  );
}

export function validateAPIResponse(data: any) {
  expect(data).toHaveProperty('success');
  expect(data).toHaveProperty('timestamp');
  expect(data).toHaveProperty('requestId');
  
  if (data.success) {
    expect(data).toHaveProperty('data');
  } else {
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
  }
}