/**
 * Property-Based Tests for Gemini Structured Output
 * 
 * Tests structured output with JSON schema validation
 * using fast-check for property-based testing
 */

// Set up environment BEFORE any imports
process.env.GEMINI_API_KEY = 'test-api-key';

import { describe, test, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { generateStructuredOutputRaw } from '../../../lib/ai/gemini-client';

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

describe('Gemini Structured Output - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockClear();
  });

  /**
   * Feature: ai-system-gemini-integration, Property 14: Structured output schema validation
   * Validates: Requirements 10.2, 8.4
   * 
   * Property: For any request specifying a JSON schema, the Gemini API call 
   * SHALL include response_mime_type: 'application/json' and response_json_schema 
   * in the config.
   */
  test('Property 14: Structured output schema validation - config includes mime type and schema', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random JSON schemas
        fc.record({
          type: fc.constant('object'),
          properties: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.record({
              type: fc.constantFrom('string', 'number', 'boolean'),
            })
          ),
          required: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
        }),
        fc.string({ minLength: 1, maxLength: 100 }), // prompt
        async (schema, prompt) => {
          // Create a valid JSON response that matches the schema
          const mockResponse: any = {};
          for (const [key, value] of Object.entries(schema.properties)) {
            const propType = (value as any).type;
            if (propType === 'string') mockResponse[key] = 'test';
            else if (propType === 'number') mockResponse[key] = 42;
            else if (propType === 'boolean') mockResponse[key] = true;
          }

          mockGenerateContent.mockImplementationOnce((params: any) => {
            // Verify that the config includes the required fields
            expect(params.config).toBeDefined();
            expect(params.config.response_mime_type).toBe('application/json');
            expect(params.config.response_json_schema).toEqual(schema);

            return Promise.resolve({
              text: JSON.stringify(mockResponse),
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 20,
                totalTokenCount: 30,
              },
            });
          });

          const result = await generateStructuredOutputRaw({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            schema,
          });

          // Verify the response is parsed correctly
          expect(result.parsed).toBeDefined();
          expect(typeof result.parsed).toBe('object');
          
          return true;
        }
      ),
      testConfig
    );
  });

  test('Property 14: Structured output schema validation - valid JSON is parsed successfully', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid JSON objects
        fc.record({
          name: fc.string(),
          age: fc.integer({ min: 0, max: 120 }),
          active: fc.boolean(),
        }),
        async (jsonData) => {
          const schema = {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              active: { type: 'boolean' },
            },
          };

          mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify(jsonData),
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 20,
              totalTokenCount: 30,
            },
          });

          const result = await generateStructuredOutputRaw({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'test' }],
              },
            ],
            schema,
          });

          // Verify parsed data matches input
          expect(result.parsed).toEqual(jsonData);
          expect(result.parsed.name).toBe(jsonData.name);
          expect(result.parsed.age).toBe(jsonData.age);
          expect(result.parsed.active).toBe(jsonData.active);
          
          return true;
        }
      ),
      testConfig
    );
  });

  test('Property 14: Structured output schema validation - invalid JSON throws explicit error', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid JSON strings
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
          try {
            JSON.parse(s);
            return false; // Valid JSON, skip
          } catch {
            return true; // Invalid JSON, use it
          }
        }),
        async (invalidJson) => {
          const schema = {
            type: 'object',
            properties: {
              test: { type: 'string' },
            },
          };

          mockGenerateContent.mockResolvedValueOnce({
            text: invalidJson,
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 20,
              totalTokenCount: 30,
            },
          });

          // Should throw an explicit error
          await expect(
            generateStructuredOutputRaw({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: 'test' }],
                },
              ],
              schema,
            })
          ).rejects.toThrow(/Failed to parse structured/);
          
          return true;
        }
      ),
      testConfig
    );
  });

  test('Property 14: Structured output schema validation - usage metadata is preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.record({
          value: fc.string(),
        }),
        async (promptTokens, candidateTokens, jsonData) => {
          const schema = {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          };

          mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify(jsonData),
            usageMetadata: {
              promptTokenCount: promptTokens,
              candidatesTokenCount: candidateTokens,
              totalTokenCount: promptTokens + candidateTokens,
            },
          });

          const result = await generateStructuredOutputRaw({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'test' }],
              },
            ],
            schema,
          });

          // Usage metadata should be preserved even with structured output
          expect(result.usageMetadata.promptTokenCount).toBe(promptTokens);
          expect(result.usageMetadata.candidatesTokenCount).toBe(candidateTokens);
          
          return true;
        }
      ),
      testConfig
    );
  });

  test('Property 14: Structured output schema validation - different schema types are supported', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { type: 'object', properties: { str: { type: 'string' } } },
          { type: 'object', properties: { num: { type: 'number' } } },
          { type: 'object', properties: { bool: { type: 'boolean' } } },
          { type: 'object', properties: { arr: { type: 'array', items: { type: 'string' } } } }
        ),
        async (schema) => {
          // Generate appropriate mock data based on schema
          let mockData: any = {};
          const firstProp = Object.keys(schema.properties)[0];
          const propType = (schema.properties as any)[firstProp].type;
          
          if (propType === 'string') mockData[firstProp] = 'test';
          else if (propType === 'number') mockData[firstProp] = 42;
          else if (propType === 'boolean') mockData[firstProp] = true;
          else if (propType === 'array') mockData[firstProp] = ['a', 'b'];

          mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify(mockData),
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 20,
              totalTokenCount: 30,
            },
          });

          const result = await generateStructuredOutputRaw({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'test' }],
              },
            ],
            schema,
          });

          // Should successfully parse regardless of schema type
          expect(result.parsed).toBeDefined();
          expect(result.parsed[firstProp]).toBeDefined();
          
          return true;
        }
      ),
      testConfig
    );
  });
});
