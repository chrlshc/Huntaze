/**
 * Property-Based Tests - Azure ComplianceAgent
 * 
 * Feature: huntaze-ai-azure-migration, Task 13.1
 * Property 4: Agent model assignment (ComplianceAI)
 * Validates: Requirements 2.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock dependencies BEFORE imports
vi.mock('../../../lib/ai/azure/azure-openai-router', () => ({
  azureOpenAIRouter: {
    chat: vi.fn(),
    generateText: vi.fn(),
  },
}));

vi.mock('../../../lib/ai/azure/cost-tracking.service', () => ({
  getCostTrackingService: vi.fn(),
}));

vi.mock('../../../lib/ai/knowledge-network', () => ({
  AIKnowledgeNetwork: vi.fn().mockImplementation(() => ({
    queryInsights: vi.fn(),
    broadcastInsight: vi.fn(),
  })),
}));

import { AzureComplianceAgent } from '../../../lib/ai/agents/compliance.azure';
import { AIKnowledgeNetwork } from '../../../lib/ai/knowledge-network';
import { azureOpenAIRouter } from '../../../lib/ai/azure/azure-openai-router';
import { getCostTrackingService } from '../../../lib/ai/azure/cost-tracking.service';

describe('AzureComplianceAgent - Property-Based Tests', () => {
  let agent: AzureComplianceAgent;
  let mockNetwork: any;
  let mockCostTracker: any;

  beforeEach(() => {
    mockNetwork = {
      queryInsights: vi.fn().mockResolvedValue([]),
      broadcastInsight: vi.fn().mockResolvedValue(undefined),
    };
    mockCostTracker = {
      logUsage: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(getCostTrackingService).mockReturnValue(mockCostTracker);
    
    // Create agent AFTER mocking getCostTrackingService
    agent = new AzureComplianceAgent();
  });

  /**
   * Property 4: Agent Model Assignment (ComplianceAI)
   * 
   * For any compliance check request, the ComplianceAI agent should use
   * GPT-3.5 Turbo (economy tier) as specified in Requirement 2.4
   */
  describe('Property 4: Agent Model Assignment', () => {
    it('should always use economy tier (GPT-3.5 Turbo) for all compliance checks', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          // Generate random content
          fc.string({ minLength: 10, maxLength: 500 }),
          // Generate random content types
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          // Generate random creator IDs
          fc.integer({ min: 1, max: 100000 }),
          // Generate random platforms
          fc.option(fc.constantFrom('onlyfans', 'instagram', 'twitter', 'tiktok'), { nil: undefined }),
          
          async (content, contentType, creatorId, platform) => {
            // Mock Azure OpenAI response
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: true,
                violations: [],
                confidence: 0.90,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            // Execute compliance check
            await agent.checkCompliance(
              creatorId,
              content,
              contentType as any,
              platform ? { platform: platform as any } : undefined
            );

            // Verify economy tier was used
            const routerCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[
              vi.mocked(azureOpenAIRouter.chat).mock.calls.length - 1
            ];
            const options = routerCall[1];

            expect(options.tier).toBe('economy');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use GPT-3.5 Turbo model for all compliance operations', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          
          async (content, contentType, creatorId) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: true,
                violations: [],
                confidence: 0.90,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            const result = await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            // Verify model used is GPT-3.5 Turbo
            expect(result.usage.model).toBe('gpt-35-turbo');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent temperature (0.3) for all compliance checks', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          
          async (content, contentType, creatorId) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: true,
                violations: [],
                confidence: 0.90,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            const routerCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[
              vi.mocked(azureOpenAIRouter.chat).mock.calls.length - 1
            ];
            const options = routerCall[1];

            // Low temperature for consistent compliance checks
            expect(options.temperature).toBe(0.3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always request JSON structured output', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          
          async (content, contentType, creatorId) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: true,
                violations: [],
                confidence: 0.90,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            const routerCall = vi.mocked(azureOpenAIRouter.chat).mock.calls[
              vi.mocked(azureOpenAIRouter.chat).mock.calls.length - 1
            ];
            const options = routerCall[1];

            expect(options.responseFormat).toEqual({ type: 'json_object' });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log costs with economy tier for all operations', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.constantFrom('starter', 'pro', 'scale', 'enterprise'),
          
          async (content, contentType, creatorId, accountId, plan) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: true,
                violations: [],
                confidence: 0.90,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            await agent.checkCompliance(
              creatorId,
              content,
              contentType as any,
              undefined,
              accountId,
              plan as any
            );

            const costCall = mockCostTracker.logUsage.mock.calls[
              mockCostTracker.logUsage.mock.calls.length - 1
            ];
            const logEntry = costCall[0];

            expect(logEntry.tier).toBe('economy');
            expect(logEntry.deployment).toBe('gpt-35-turbo');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Properties for Compliance Checking
   */
  describe('Compliance Response Structure', () => {
    it('should always return valid compliance check structure', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          fc.boolean(),
          fc.float({ min: 0, max: 1 }),
          
          async (content, contentType, creatorId, isCompliant, confidence) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: isCompliant,
                violations: isCompliant ? [] : [
                  {
                    type: 'test_violation',
                    severity: 'medium',
                    description: 'Test violation',
                  },
                ],
                compliant_alternative: isCompliant ? undefined : 'Alternative text',
                confidence,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            const result = await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            // Verify structure
            expect(result).toHaveProperty('isCompliant');
            expect(result).toHaveProperty('violations');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('usage');
            
            expect(Array.isArray(result.violations)).toBe(true);
            expect(typeof result.confidence).toBe('number');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide compliant alternatives when violations exist', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          fc.array(
            fc.record({
              type: fc.constantFrom('spam', 'hate_speech', 'harassment', 'explicit_content'),
              severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
              description: fc.string({ minLength: 10, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          
          async (content, contentType, creatorId, violations) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: false,
                violations,
                compliant_alternative: 'Compliant version of the content',
                confidence: 0.85,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            const result = await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            if (!result.isCompliant && result.violations.length > 0) {
              expect(result.compliantAlternative).toBeDefined();
              expect(typeof result.compliantAlternative).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Cost Calculation Properties
   */
  describe('Cost Calculation Consistency', () => {
    it('should calculate costs consistently using GPT-3.5 Turbo pricing', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 50, max: 1000 }),
          fc.integer({ min: 20, max: 500 }),
          
          async (content, contentType, creatorId, promptTokens, completionTokens) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: true,
                violations: [],
                confidence: 0.90,
              }),
              usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            const result = await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            // GPT-3.5 Turbo pricing: $0.0015/1K input, $0.002/1K output
            const expectedCost = 
              (promptTokens / 1000) * 0.0015 + 
              (completionTokens / 1000) * 0.002;

            expect(result.usage.estimatedCost).toBeCloseTo(expectedCost, 6);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Knowledge Network Broadcasting Properties
   */
  describe('Knowledge Network Broadcasting', () => {
    it('should broadcast insights only for high-confidence violations', async () => {
      await agent.initialize(mockNetwork);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.constantFrom('message', 'post', 'caption', 'bio', 'comment'),
          fc.integer({ min: 1, max: 100000 }),
          fc.float({ min: 0, max: 1 }),
          fc.boolean(),
          
          async (content, contentType, creatorId, confidence, hasViolations) => {
            vi.mocked(azureOpenAIRouter.chat).mockResolvedValue({
              text: JSON.stringify({
                is_compliant: !hasViolations,
                violations: hasViolations ? [
                  {
                    type: 'test_violation',
                    severity: 'medium',
                    description: 'Test violation',
                  },
                ] : [],
                confidence,
              }),
              usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200,
              },
              model: 'gpt-35-turbo',
              finishReason: 'stop',
            });

            vi.mocked(mockNetwork.broadcastInsight).mockClear();

            await agent.checkCompliance(
              creatorId,
              content,
              contentType as any
            );

            // Should broadcast only if has violations AND confidence > 0.8
            const shouldBroadcast = hasViolations && confidence > 0.8;
            
            if (shouldBroadcast) {
              expect(mockNetwork.broadcastInsight).toHaveBeenCalled();
            } else {
              expect(mockNetwork.broadcastInsight).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
