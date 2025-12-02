/**
 * Azure Prompt Optimizer Service - Property-Based Tests
 * 
 * Tests correctness properties for prompt optimization:
 * - Property 34: Azure OpenAI prompt formatting
 * - Property 35: JSON mode for structured output
 * - Property 36: Prompt caching
 * - Property 37: Intelligent prompt truncation
 * - Property 38: Few-shot example inclusion
 * 
 * **Feature: huntaze-ai-azure-migration**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzurePromptOptimizerService,
  type PromptTemplate,
  type FewShotExample,
  type ChatMessage,
} from '../../../lib/ai/azure/azure-prompt-optimizer.service';

describe('AzurePromptOptimizerService - Property Tests', () => {
  let service: AzurePromptOptimizerService;

  beforeEach(() => {
    service = new AzurePromptOptimizerService();
  });

  /**
   * Property 34: Azure OpenAI prompt formatting
   * **Feature: huntaze-ai-azure-migration, Property 34: Azure OpenAI prompt formatting**
   * **Validates: Requirements 10.1**
   * 
   * For any prompt constructed for Azure OpenAI, it should follow Azure OpenAI-specific
   * formatting guidelines and instruction patterns.
   */
  describe('Property 34: Azure OpenAI prompt formatting', () => {
    it('should normalize all line endings to Unix format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (text) => {
            // Add various line endings
            const withMixedEndings = text.replace(/\n/g, '\r\n');
            const formatted = service.formatForAzure(withMixedEndings);
            
            // Should not contain Windows line endings
            expect(formatted).not.toContain('\r\n');
            expect(formatted).not.toContain('\r');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove excessive consecutive newlines', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.integer({ min: 3, max: 10 }),
          (text, newlineCount) => {
            const withExcessiveNewlines = text + '\n'.repeat(newlineCount) + text;
            const formatted = service.formatForAzure(withExcessiveNewlines);
            
            // Should not have more than 2 consecutive newlines
            expect(formatted).not.toMatch(/\n{3,}/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim leading and trailing whitespace', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => /^\s*$/.test(s)),
          (text, whitespace) => {
            const withWhitespace = whitespace + text.trim() + whitespace;
            const formatted = service.formatForAzure(withWhitespace);
            
            // Should not start or end with whitespace
            expect(formatted).toBe(formatted.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid non-empty output for non-empty input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          (text) => {
            const formatted = service.formatForAzure(text);
            
            // Should produce non-empty output
            expect(formatted.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 35: JSON mode for structured output
   * **Feature: huntaze-ai-azure-migration, Property 35: JSON mode for structured output**
   * **Validates: Requirements 10.2**
   * 
   * For any request requiring structured output, the system should enable
   * GPT-4's native JSON mode in the generation config.
   */
  describe('Property 35: JSON mode for structured output', () => {
    it('should always return json_object response format', () => {
      fc.assert(
        fc.property(
          fc.option(fc.object(), { nil: undefined }),
          (schema) => {
            const options = service.configureJsonMode(schema as Record<string, unknown> | undefined);
            
            // Should always have json_object format
            expect(options.responseFormat).toEqual({ type: 'json_object' });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include JSON instruction in system prompt', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (basePrompt) => {
            const result = service.buildJsonModeSystemPrompt(basePrompt);
            
            // Should contain JSON instruction
            expect(result.toLowerCase()).toContain('json');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include schema in prompt when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.record({
            type: fc.constant('object'),
            properties: fc.object(),
          }),
          (basePrompt, schema) => {
            const result = service.buildJsonModeSystemPrompt(basePrompt, schema);
            
            // Should contain schema reference
            expect(result).toContain('schema');
            expect(result).toContain('"type"');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve original prompt content in JSON mode', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 5),
          (basePrompt) => {
            const trimmed = basePrompt.trim();
            const result = service.buildJsonModeSystemPrompt(trimmed);
            
            // Original content should be preserved
            expect(result).toContain(trimmed);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 36: Prompt caching
   * **Feature: huntaze-ai-azure-migration, Property 36: Prompt caching**
   * **Validates: Requirements 10.3**
   * 
   * For any repeated context in prompts, the system should implement caching
   * to reduce token costs on subsequent requests.
   */
  describe('Property 36: Prompt caching', () => {
    it('should return same cache key for identical inputs', () => {
      const template: PromptTemplate = {
        id: 'cache-test',
        name: 'Cache Test',
        systemPrompt: 'You are helpful.',
      };
      service.registerTemplate(template);

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (prompt) => {
            const result1 = service.optimizePrompt(prompt, 'cache-test');
            const result2 = service.optimizePrompt(prompt, 'cache-test');
            
            // Same inputs should produce same cache key
            expect(result1.cacheKey).toBe(result2.cacheKey);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return different cache keys for different inputs', () => {
      const template: PromptTemplate = {
        id: 'cache-diff-test',
        name: 'Cache Diff Test',
        systemPrompt: 'You are helpful.',
      };
      service.registerTemplate(template);

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (prompt1, prompt2) => {
            fc.pre(prompt1 !== prompt2);
            
            const result1 = service.optimizePrompt(prompt1, 'cache-diff-test');
            const result2 = service.optimizePrompt(prompt2, 'cache-diff-test');
            
            // Different inputs should produce different cache keys
            expect(result1.cacheKey).not.toBe(result2.cacheKey);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increase cache size with unique prompts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 10 }
          ),
          (prompts) => {
            // Create fresh service for each test
            const testService = new AzurePromptOptimizerService();
            const template: PromptTemplate = {
              id: 'cache-size-test',
              name: 'Cache Size Test',
              systemPrompt: 'You are helpful.',
            };
            testService.registerTemplate(template);
            
            const uniquePrompts = [...new Set(prompts)];
            
            for (const prompt of uniquePrompts) {
              testService.optimizePrompt(prompt, 'cache-size-test');
            }
            
            const stats = testService.getCacheStats();
            expect(stats.size).toBe(uniquePrompts.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return cached result for repeated calls', () => {
      const template: PromptTemplate = {
        id: 'cache-hit-test',
        name: 'Cache Hit Test',
        systemPrompt: 'You are helpful.',
      };
      service.registerTemplate(template);

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (prompt) => {
            service.clearCache();
            
            const result1 = service.optimizePrompt(prompt, 'cache-hit-test');
            const result2 = service.optimizePrompt(prompt, 'cache-hit-test');
            
            // Results should be identical (from cache)
            expect(result1.messages).toEqual(result2.messages);
            expect(result1.options).toEqual(result2.options);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 37: Intelligent prompt truncation
   * **Feature: huntaze-ai-azure-migration, Property 37: Intelligent prompt truncation**
   * **Validates: Requirements 10.4**
   * 
   * For any prompt that exceeds token limits, the truncation should preserve
   * key context elements while staying within limits.
   */
  describe('Property 37: Intelligent prompt truncation', () => {
    it('should not truncate prompts within limits', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (prompt) => {
            const result = service.truncatePrompt(prompt, 1000);
            
            // Should not be truncated
            expect(result.text).toBe(prompt);
            expect(result.details.originalTokens).toBe(result.details.truncatedTokens);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should truncate prompts exceeding limits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }),
          (maxTokens) => {
            // Create a prompt that definitely exceeds the limit
            const longPrompt = 'A'.repeat(maxTokens * 10);
            const result = service.truncatePrompt(longPrompt, maxTokens);
            
            // Should be truncated to within limits (with small tolerance for rounding)
            expect(result.details.truncatedTokens).toBeLessThanOrEqual(maxTokens + 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve sections containing preserve keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.string({ minLength: 100, maxLength: 500 }),
          (keyword, filler) => {
            const prompt = `${keyword}: Important content here.\n\n${filler}\n\nMore ${keyword} content.`;
            const result = service.truncatePrompt(prompt, 50, [keyword]);
            
            // Should contain the keyword (preserved section)
            expect(result.text.toLowerCase()).toContain(keyword.toLowerCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track truncation details accurately', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 200 }),
          (maxTokens) => {
            const longPrompt = 'Word '.repeat(maxTokens * 5);
            const result = service.truncatePrompt(longPrompt, maxTokens);
            
            // Original should be greater than truncated
            expect(result.details.originalTokens).toBeGreaterThan(result.details.truncatedTokens);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid output after truncation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 1000 }).filter(s => s.trim().length > 50),
          fc.integer({ min: 20, max: 100 }),
          (prompt, maxTokens) => {
            const result = service.truncatePrompt(prompt, maxTokens);
            
            // Output should be non-empty string
            expect(typeof result.text).toBe('string');
            expect(result.text.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 38: Few-shot example inclusion
   * **Feature: huntaze-ai-azure-migration, Property 38: Few-shot example inclusion**
   * **Validates: Requirements 10.5**
   * 
   * For any prompt template requiring few-shot learning, the system should
   * include optimized examples in the prompt.
   */
  describe('Property 38: Few-shot example inclusion', () => {
    it('should add examples as user/assistant message pairs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              input: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              output: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 3 } // Max 3 to match default maxExamples
          ),
          (examples) => {
            const messages: ChatMessage[] = [
              { role: 'system', content: 'You are helpful.' },
              { role: 'user', content: 'Hello' },
            ];
            
            const result = service.addFewShotExamples(messages, examples);
            
            // Should have system + (examples * 2) + user messages
            const expectedLength = 1 + (examples.length * 2) + 1;
            expect(result.length).toBe(expectedLength);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve system message at the beginning', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(
            fc.record({
              input: fc.string({ minLength: 1, maxLength: 50 }),
              output: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (systemContent, examples) => {
            const messages: ChatMessage[] = [
              { role: 'system', content: systemContent },
              { role: 'user', content: 'Hello' },
            ];
            
            const result = service.addFewShotExamples(messages, examples);
            
            // System message should be first
            expect(result[0].role).toBe('system');
            expect(result[0].content).toBe(systemContent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve user message at the end', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(
            fc.record({
              input: fc.string({ minLength: 1, maxLength: 50 }),
              output: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (userContent, examples) => {
            const messages: ChatMessage[] = [
              { role: 'system', content: 'System prompt' },
              { role: 'user', content: userContent },
            ];
            
            const result = service.addFewShotExamples(messages, examples);
            
            // User message should be last
            expect(result[result.length - 1].role).toBe('user');
            expect(result[result.length - 1].content).toBe(userContent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect maxExamples limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          fc.array(
            fc.record({
              input: fc.string({ minLength: 1, maxLength: 50 }),
              output: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 5, maxLength: 10 }
          ),
          (maxExamples, examples) => {
            const messages: ChatMessage[] = [
              { role: 'system', content: 'System prompt' },
              { role: 'user', content: 'Hello' },
            ];
            
            const result = service.addFewShotExamples(messages, examples, maxExamples);
            
            // Should have at most maxExamples * 2 example messages
            const exampleMessages = result.filter(
              m => m.role !== 'system' && m !== result[result.length - 1]
            );
            expect(exampleMessages.length).toBeLessThanOrEqual(maxExamples * 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return original messages when no examples provided', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              role: fc.constantFrom('system', 'user', 'assistant') as fc.Arbitrary<'system' | 'user' | 'assistant'>,
              content: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (messages) => {
            const result = service.addFewShotExamples(messages as ChatMessage[], []);
            
            // Should return original messages unchanged
            expect(result).toEqual(messages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should alternate user/assistant roles for examples', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              input: fc.string({ minLength: 1, maxLength: 50 }),
              output: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (examples) => {
            const messages: ChatMessage[] = [
              { role: 'system', content: 'System prompt' },
              { role: 'user', content: 'Hello' },
            ];
            
            const result = service.addFewShotExamples(messages, examples);
            
            // Check alternating pattern in example section
            for (let i = 1; i < result.length - 1; i += 2) {
              expect(result[i].role).toBe('user');
              if (i + 1 < result.length - 1) {
                expect(result[i + 1].role).toBe('assistant');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Token estimation consistency
   */
  describe('Token estimation consistency', () => {
    it('should estimate more tokens for longer text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 101, maxLength: 500 }),
          (shortText, longText) => {
            const shortTokens = service.estimateTokens(shortText);
            const longTokens = service.estimateTokens(longText);
            
            // Longer text should have more tokens
            expect(longTokens).toBeGreaterThan(shortTokens);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 tokens for empty string', () => {
      const tokens = service.estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should be deterministic', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (text) => {
            const tokens1 = service.estimateTokens(text);
            const tokens2 = service.estimateTokens(text);
            
            // Same input should always produce same output
            expect(tokens1).toBe(tokens2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
