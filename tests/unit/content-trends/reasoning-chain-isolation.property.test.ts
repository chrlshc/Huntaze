/**
 * Property Test: Reasoning Chain Isolation
 * 
 * Feature: content-trends-ai-engine, Property 2
 * 
 * For any DeepSeek R1 interaction, reasoning tokens should be captured
 * and stored separately but NEVER reinjected into conversation history,
 * preventing contamination of future reasoning processes.
 * 
 * Requirements: 2.3, 2.4
 * @see .kiro/specs/content-trends-ai-engine/design.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ReasoningChainManager,
  type ConversationMessage,
} from '../../../lib/ai/content-trends';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

/**
 * Generate realistic R1 responses with <think> tags
 */
const r1ResponseWithThinkingArb = fc.record({
  thinking: fc.array(
    fc.record({
      step: fc.string({ minLength: 20, maxLength: 200 }),
      conclusion: fc.string({ minLength: 10, maxLength: 100 }),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  output: fc.string({ minLength: 50, maxLength: 500 }),
}).map(({ thinking, output }) => {
  const thinkContent = thinking
    .map((t, i) => `Step ${i + 1}: ${t.step}\nTherefore, ${t.conclusion}`)
    .join('\n\n');
  return `<think>${thinkContent}</think>\n\n${output}`;
});


/**
 * Generate R1 responses without thinking tags
 */
const r1ResponseWithoutThinkingArb = fc.string({ minLength: 50, maxLength: 500 });

/**
 * Generate conversation messages that may contain reasoning tokens
 */
const conversationMessageArb = fc.record({
  role: fc.constantFrom<'user' | 'assistant' | 'system'>('user', 'assistant', 'system'),
  content: fc.oneof(
    r1ResponseWithThinkingArb,
    r1ResponseWithoutThinkingArb
  ),
});

const conversationHistoryArb = fc.array(conversationMessageArb, { minLength: 1, maxLength: 10 });

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: content-trends-ai-engine, Property 2: Reasoning Chain Isolation', () => {
  let manager: ReasoningChainManager;

  beforeEach(() => {
    manager = new ReasoningChainManager();
  });

  describe('Reasoning tokens are extracted and stored', () => {
    it('should extract reasoning from <think> tags', () => {
      fc.assert(
        fc.property(
          r1ResponseWithThinkingArb,
          fc.uuid(),
          fc.integer({ min: 100, max: 30000 }),
          (response, taskId, latencyMs) => {
            const result = manager.extractReasoningChain(taskId, response, latencyMs);
            
            // Reasoning should be captured
            expect(result.reasoning).toBeDefined();
            expect(result.reasoning!.rawTokens.length).toBeGreaterThan(0);
            expect(result.reasoning!.steps.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store reasoning chain with unique ID', () => {
      fc.assert(
        fc.property(
          r1ResponseWithThinkingArb,
          fc.uuid(),
          (response, taskId) => {
            const result = manager.extractReasoningChain(taskId, response, 1000);
            
            // Chain should be retrievable
            const stored = manager.getReasoningChain(result.reasoning!.id);
            expect(stored).toBeDefined();
            expect(stored!.taskId).toBe(taskId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Reasoning tokens are NEVER in output', () => {
    it('should remove <think> tags from output', () => {
      fc.assert(
        fc.property(
          r1ResponseWithThinkingArb,
          fc.uuid(),
          (response, taskId) => {
            const result = manager.extractReasoningChain(taskId, response, 1000);
            
            // Output should NOT contain think tags
            expect(result.output).not.toContain('<think>');
            expect(result.output).not.toContain('</think>');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve non-reasoning content in output', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 50, maxLength: 200 }),
          // Use alphanumeric to avoid whitespace-only strings
          fc.stringMatching(/^[a-zA-Z0-9 ]{20,100}$/),
          fc.uuid(),
          (thinking, output, taskId) => {
            const response = `<think>${thinking}</think>\n\n${output}`;
            const result = manager.extractReasoningChain(taskId, response, 1000);
            
            // Output should contain the non-thinking part
            expect(result.output.trim()).toBe(output.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Conversation history is sanitized', () => {
    it('should strip reasoning from assistant messages', () => {
      fc.assert(
        fc.property(conversationHistoryArb, (messages) => {
          const sanitized = manager.prepareConversationHistory(messages);
          
          // No assistant message should contain think tags
          for (const msg of sanitized) {
            if (msg.role === 'assistant') {
              expect(msg.content).not.toContain('<think>');
              expect(msg.content).not.toContain('</think>');
              expect(msg.reasoningStripped).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve user and system messages unchanged', () => {
      fc.assert(
        fc.property(conversationHistoryArb, (messages) => {
          const sanitized = manager.prepareConversationHistory(messages);
          
          for (let i = 0; i < messages.length; i++) {
            if (messages[i].role !== 'assistant') {
              expect(sanitized[i].content).toBe(messages[i].content);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });


  describe('Minimal system prompts for R1', () => {
    it('should return null for empty context', () => {
      const prompt = manager.buildMinimalSystemPrompt();
      expect(prompt).toBeNull();
    });

    it('should return minimal prompt with context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }),
          (context) => {
            const prompt = manager.buildMinimalSystemPrompt(context);
            expect(prompt).toBe(`Context: ${context}`);
            // Should be minimal - no personality, no style instructions
            expect(prompt!.length).toBeLessThan(context.length + 20);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Think tag injection for forcing CoT', () => {
    it('should append <think> tag to prompt', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          (userPrompt) => {
            const thinkingPrompt = manager.buildThinkingPrompt(userPrompt);
            expect(thinkingPrompt).toContain(userPrompt);
            expect(thinkingPrompt).toContain('<think>');
            expect(thinkingPrompt.endsWith('<think>')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Reasoning chain metadata', () => {
    it('should calculate confidence score between 0 and 1', () => {
      fc.assert(
        fc.property(
          r1ResponseWithThinkingArb,
          fc.uuid(),
          (response, taskId) => {
            const result = manager.extractReasoningChain(taskId, response, 1000);
            
            expect(result.reasoning!.confidence).toBeGreaterThanOrEqual(0);
            expect(result.reasoning!.confidence).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track token counts', () => {
      fc.assert(
        fc.property(
          r1ResponseWithThinkingArb,
          fc.uuid(),
          (response, taskId) => {
            const result = manager.extractReasoningChain(taskId, response, 1000);
            
            expect(result.metadata.reasoningTokens).toBeGreaterThan(0);
            expect(result.metadata.outputTokens).toBeGreaterThan(0);
            expect(result.metadata.totalTokens).toBe(
              result.metadata.reasoningTokens + result.metadata.outputTokens
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Memory management', () => {
    it('should clear old chains', async () => {
      // Create some chains
      for (let i = 0; i < 5; i++) {
        manager.extractReasoningChain(
          `task_${i}`,
          `<think>Step 1: thinking</think>\n\nOutput ${i}`,
          1000
        );
      }

      // Wait a tiny bit to ensure chains have a timestamp in the past
      await new Promise(resolve => setTimeout(resolve, 10));

      // Clear with 1ms max age (all chains are "old")
      const cleared = manager.clearOldChains(1);
      expect(cleared).toBe(5);
    });
  });
});
