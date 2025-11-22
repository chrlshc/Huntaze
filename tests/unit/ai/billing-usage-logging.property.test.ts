/**
 * Property-Based Tests for Usage Logging Completeness
 * 
 * Feature: ai-system-gemini-integration, Property 1: Usage logging completeness
 * Validates: Requirements 3.2, 3.4, 1.4, 2.4, 5.1, 5.4
 * 
 * Tests that all successful AI requests create complete usage logs
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { generateTextWithBilling } from '../../../lib/ai/gemini-billing.service';

// Track database calls for verification
const mockUsageLogs: any[] = [];

// Mock the Gemini client to avoid actual API calls
vi.mock('../../../lib/ai/gemini-client', () => ({
  generateTextRaw: vi.fn(async (params: any) => {
    // Ensure we always return a valid response structure
    return {
      model: params.model ?? 'gemini-2.5-pro',
      text: 'Mock response text',
      candidates: [{
        content: {
          parts: [{ text: 'Mock response text' }],
          role: 'model'
        },
        finishReason: 'STOP',
        index: 0
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
    };
  }),
  generateStructuredOutputRaw: vi.fn(async (params: any) => {
    return {
      model: params.model ?? 'gemini-2.5-pro',
      text: '{"result": "mock"}',
      parsed: { result: 'mock' },
      candidates: [{
        content: {
          parts: [{ text: '{"result": "mock"}' }],
          role: 'model'
        },
        finishReason: 'STOP',
        index: 0
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
    };
  }),
}));

// Mock the database to track calls
vi.mock('../../../lib/prisma', () => ({
  db: {
    usageLog: {
      create: vi.fn(async ({ data }: any) => {
        const log = {
          id: `log-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
        };
        mockUsageLogs.push(log);
        return log;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return mockUsageLogs.filter(log => {
          if (where?.creatorId) {
            return log.creatorId === where.creatorId;
          }
          return true;
        });
      }),
    },
  },
}));

describe('Property 1: Usage logging completeness', () => {
  beforeEach(() => {
    // Clear mock logs before each test
    mockUsageLogs.length = 0;
    vi.clearAllMocks();
  });

  test('creates usage log for any successful AI request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // creatorId
        fc.constantFrom('messaging', 'content', 'analytics', 'sales'), // feature
        fc.option(fc.constantFrom('messaging-agent', 'content-agent', 'analytics-agent', 'sales-agent'), { nil: undefined }), // agentId
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'), // model
        fc.string({ minLength: 10, maxLength: 100 }), // prompt
        async (creatorId, feature, agentId, model, prompt) => {
          // Clear logs for this test
          mockUsageLogs.length = 0;

          // Make AI request
          const result = await generateTextWithBilling({
            prompt,
            metadata: {
              creatorId,
              feature,
              agentId,
            },
            model,
          });

          // Verify response structure
          expect(result.text).toBeDefined();
          expect(result.usage).toBeDefined();
          expect(result.usage.model).toBe(model);

          // Verify usage log was created
          const logs = mockUsageLogs.filter(log => log.creatorId === creatorId);

          expect(logs.length).toBeGreaterThan(0);

          const log = logs[0];
          
          // Verify all required fields are present (Requirement 3.2)
          expect(log.creatorId).toBe(creatorId);
          expect(log.feature).toBe(feature);
          expect(log.agentId).toBe(agentId);
          expect(log.model).toBe(model);
          expect(log.tokensInput).toBeGreaterThanOrEqual(0);
          expect(log.tokensOutput).toBeGreaterThanOrEqual(0);
          expect(Number(log.costUsd)).toBeGreaterThanOrEqual(0);
          expect(log.createdAt).toBeInstanceOf(Date);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('usage log contains accurate token counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.constantFrom('messaging', 'content'),
        async (creatorId, feature) => {
          mockUsageLogs.length = 0;

          await generateTextWithBilling({
            prompt: 'Test prompt',
            metadata: {
              creatorId,
              feature,
            },
            model: 'gemini-2.5-pro',
          });

          const logs = mockUsageLogs.filter(log => log.creatorId === creatorId);

          expect(logs.length).toBeGreaterThan(0);

          const log = logs[0];
          
          // Verify token counts match what was returned
          expect(log.tokensInput).toBe(100); // From mock
          expect(log.tokensOutput).toBe(50); // From mock

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('usage log cost matches calculated cost', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash'),
        async (creatorId, model) => {
          mockUsageLogs.length = 0;

          const result = await generateTextWithBilling({
            prompt: 'Test prompt',
            metadata: {
              creatorId,
              feature: 'test',
            },
            model,
          });

          const logs = mockUsageLogs.filter(log => log.creatorId === creatorId);

          expect(logs.length).toBeGreaterThan(0);

          const log = logs[0];
          
          // Cost in log should match cost in response
          expect(Math.abs(Number(log.costUsd) - result.usage.costUsd)).toBeLessThan(0.000001);

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  test('multiple requests create multiple logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 2, max: 5 }), // number of requests
        async (creatorId, numRequests) => {
          mockUsageLogs.length = 0;

          // Make multiple requests
          for (let i = 0; i < numRequests; i++) {
            await generateTextWithBilling({
              prompt: `Test prompt ${i}`,
              metadata: {
                creatorId,
                feature: 'test',
              },
            });
          }

          const logs = mockUsageLogs.filter(log => log.creatorId === creatorId);

          // Should have one log per request
          expect(logs.length).toBe(numRequests);

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  test('logs are timestamped correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        async (creatorId) => {
          mockUsageLogs.length = 0;
          
          const beforeRequest = new Date();

          await generateTextWithBilling({
            prompt: 'Test prompt',
            metadata: {
              creatorId,
              feature: 'test',
            },
          });

          const afterRequest = new Date();

          const logs = mockUsageLogs.filter(log => log.creatorId === creatorId);

          expect(logs.length).toBeGreaterThan(0);

          const log = logs[0];
          
          // Timestamp should be between before and after
          expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
          expect(log.createdAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime());

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
