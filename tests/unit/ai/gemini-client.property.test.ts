/**
 * Property-Based Tests for Gemini Client
 * 
 * Tests universal properties that should hold across all inputs
 * using fast-check for property-based testing
 */

// Set up environment BEFORE any imports
process.env.GEMINI_API_KEY = 'test-api-key';

import { describe, test, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { generateTextRaw, generateStructuredOutputRaw } from '../../../lib/ai/gemini-client';

// Test configuration: Run each property test 100 times
const testConfig = { numRuns: 100 };

// Create a mock function that will be shared
const mockGenerateContent = vi.fn();

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe('Gemini Client - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockClear();
  });

  /**
   * Feature: ai-system-gemini-integration, Property 13: SDK usage metadata extraction
   * Validates: Requirements 2.3, 8.2, 8.3
   * 
   * Property: For any successful Gemini API call, the response SHALL contain 
   * usageMetadata with promptTokenCount and candidatesTokenCount, and these 
   * values SHALL be used for billing calculations.
   */
  test('Property 13: SDK usage metadata extraction - all successful calls return usage metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random token counts
        fc.integer({ min: 1, max: 100000 }), // promptTokenCount
        fc.integer({ min: 1, max: 50000 }),  // candidatesTokenCount
        fc.string({ minLength: 1, maxLength: 100 }), // prompt text
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'), // model
        async (promptTokens, candidateTokens, promptText, model) => {
          // Setup mock response with usage metadata
          mockGenerateContent.mockResolvedValueOnce({
            text: 'Generated response',
            usageMetadata: {
              promptTokenCount: promptTokens,
              candidatesTokenCount: candidateTokens,
              totalTokenCount: promptTokens + candidateTokens,
            },
          });

          // Call the function
          const result = await generateTextRaw({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ text: promptText }],
              },
            ],
          });

          // Verify usage metadata is present and correct
          expect(result.usageMetadata).toBeDefined();
          expect(result.usageMetadata.promptTokenCount).toBe(promptTokens);
          expect(result.usageMetadata.candidatesTokenCount).toBe(candidateTokens);
          expect(result.usageMetadata.totalTokenCount).toBe(promptTokens + candidateTokens);

          // Verify the metadata can be used for billing calculations
          const inputTokens = result.usageMetadata.promptTokenCount ?? 0;
          const outputTokens = result.usageMetadata.candidatesTokenCount ?? 0;
          
          expect(inputTokens).toBeGreaterThan(0);
          expect(outputTokens).toBeGreaterThan(0);
          
          return true;
        }
      ),
      testConfig
    );
  });

  test('Property 13: SDK usage metadata extraction - metadata is extractable even with zero tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }), // Allow zero tokens
        fc.integer({ min: 0, max: 1000 }),
        async (promptTokens, candidateTokens) => {
          mockGenerateContent.mockResolvedValueOnce({
            text: '',
            usageMetadata: {
              promptTokenCount: promptTokens,
              candidatesTokenCount: candidateTokens,
              totalTokenCount: promptTokens + candidateTokens,
            },
          });

          const result = await generateTextRaw({
            model: 'gemini-2.5-pro',
            contents: [
              {
                role: 'user',
                parts: [{ text: 'test' }],
              },
            ],
          });

          // Metadata should always be present, even if tokens are zero
          expect(result.usageMetadata).toBeDefined();
          expect(typeof result.usageMetadata.promptTokenCount).toBe('number');
          expect(typeof result.usageMetadata.candidatesTokenCount).toBe('number');
          
          return true;
        }
      ),
      testConfig
    );
  });

  test('Property 13: SDK usage metadata extraction - model name is preserved in response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (model, promptTokens, candidateTokens) => {
          mockGenerateContent.mockResolvedValueOnce({
            text: 'response',
            usageMetadata: {
              promptTokenCount: promptTokens,
              candidatesTokenCount: candidateTokens,
              totalTokenCount: promptTokens + candidateTokens,
            },
          });

          const result = await generateTextRaw({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ text: 'test' }],
              },
            ],
          });

          // Model name should be preserved for billing
          expect(result.model).toBe(model);
          
          return true;
        }
      ),
      testConfig
    );
  });
});
