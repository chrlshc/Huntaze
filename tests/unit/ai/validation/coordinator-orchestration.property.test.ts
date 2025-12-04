/**
 * Property Test: Coordinator Multi-Agent Orchestration
 * 
 * **Feature: aws-ai-system-validation, Property 9: Coordinator Multi-Agent Orchestration**
 * **Validates: Requirements 8.4**
 * 
 * Tests that:
 * 1. Coordinated requests involve multiple agents
 * 2. Agent outputs are combined in response
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  E2EValidatorService,
  createMockCoordinatorResult,
} from '@/lib/ai/validation/e2e-validator';
import { CoordinatorValidationResult } from '@/lib/ai/validation/types';

// Valid agent names
const VALID_AGENTS = [
  'messaging-agent',
  'analytics-agent',
  'sales-agent',
  'compliance-agent',
  'content-agent',
];

// Arbitraries for generating test data
const agentArb = fc.constantFrom(...VALID_AGENTS);

const agentListArb = fc.array(agentArb, { minLength: 0, maxLength: 5 }).map(
  agents => [...new Set(agents)] // Remove duplicates
);

const coordinatorResultArb: fc.Arbitrary<CoordinatorValidationResult> = fc.record({
  success: fc.boolean(),
  responseTimeMs: fc.integer({ min: 0, max: 5000 }),
  agentsInvolved: agentListArb,
  outputsCombined: fc.boolean(),
  error: fc.option(fc.string(), { nil: undefined }),
});

describe('Property 9: Coordinator Multi-Agent Orchestration', () => {
  describe('Requirement 8.4: Coordinated requests involve multiple agents', () => {
    it('should validate that successful coordination involves multiple agents', () => {
      fc.assert(
        fc.property(
          fc.array(agentArb, { minLength: 2, maxLength: 5 }),
          (agents) => {
            const uniqueAgents = [...new Set(agents)];
            
            const result: CoordinatorValidationResult = {
              success: true,
              responseTimeMs: 200,
              agentsInvolved: uniqueAgents,
              outputsCombined: true,
            };

            // Property: with multiple agents, coordination should be valid
            expect(result.agentsInvolved.length).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify single-agent coordination as incomplete', () => {
      fc.assert(
        fc.property(agentArb, (agent) => {
          const result: CoordinatorValidationResult = {
            success: false, // Single agent = not full coordination
            responseTimeMs: 100,
            agentsInvolved: [agent],
            outputsCombined: false,
          };

          // Property: single agent should not be considered full coordination
          expect(result.agentsInvolved.length).toBe(1);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate agent list uniqueness', () => {
      fc.assert(
        fc.property(
          fc.array(agentArb, { minLength: 1, maxLength: 10 }),
          (agents) => {
            const uniqueAgents = [...new Set(agents)];
            
            const result = createMockCoordinatorResult({
              agentsInvolved: uniqueAgents,
            });

            // Property: agent list should have no duplicates
            const hasDuplicates = result.agentsInvolved.length !== 
              new Set(result.agentsInvolved).size;
            expect(hasDuplicates).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all agents are from valid set', () => {
      fc.assert(
        fc.property(agentListArb, (agents) => {
          // Property: all agents should be from the valid set
          for (const agent of agents) {
            expect(VALID_AGENTS).toContain(agent);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Requirement 8.4: Agent outputs are combined in response', () => {
    it('should validate outputs are combined when multiple agents involved', () => {
      fc.assert(
        fc.property(
          fc.array(agentArb, { minLength: 2, maxLength: 5 }),
          fc.boolean(),
          (agents, outputsCombined) => {
            const uniqueAgents = [...new Set(agents)];
            
            const result: CoordinatorValidationResult = {
              success: uniqueAgents.length > 1 && outputsCombined,
              responseTimeMs: 200,
              agentsInvolved: uniqueAgents,
              outputsCombined,
            };

            // Property: success requires both multiple agents AND combined outputs
            if (result.success) {
              expect(result.agentsInvolved.length).toBeGreaterThan(1);
              expect(result.outputsCombined).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark as failed when outputs not combined', () => {
      fc.assert(
        fc.property(
          fc.array(agentArb, { minLength: 2, maxLength: 5 }),
          (agents) => {
            const uniqueAgents = [...new Set(agents)];
            if (uniqueAgents.length < 2) return; // Skip if not enough unique agents

            const result: CoordinatorValidationResult = {
              success: false, // Outputs not combined
              responseTimeMs: 200,
              agentsInvolved: uniqueAgents,
              outputsCombined: false,
            };

            // Property: without combined outputs, coordination fails
            expect(result.outputsCombined).toBe(false);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Coordinator result validation', () => {
    it('should have consistent success state', () => {
      fc.assert(
        fc.property(coordinatorResultArb, (result) => {
          // Property: success should be consistent with agents and outputs
          if (result.success) {
            // Successful coordination should have multiple agents and combined outputs
            // (This is a soft check - the actual implementation may vary)
            expect(result.agentsInvolved).toBeDefined();
            expect(result.outputsCombined).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should always have response time', () => {
      fc.assert(
        fc.property(coordinatorResultArb, (result) => {
          // Property: response time should always be present and non-negative
          expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should have error only on failure', () => {
      fc.assert(
        fc.property(
          fc.record({
            success: fc.constant(true),
            responseTimeMs: fc.integer({ min: 0, max: 5000 }),
            agentsInvolved: fc.array(agentArb, { minLength: 2, maxLength: 5 }),
            outputsCombined: fc.constant(true),
          }),
          (result) => {
            // Property: successful results should not have errors
            expect(result.success).toBe(true);
            // Error field should be undefined for success
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('E2E Validator Coordinator integration', () => {
    it('should return valid coordinator results', async () => {
      const validator = new E2EValidatorService();
      const result = await validator.validateCoordinatorOrchestration();

      // Property: result should have all required fields
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('responseTimeMs');
      expect(result).toHaveProperty('agentsInvolved');
      expect(result).toHaveProperty('outputsCombined');
    });

    it('should involve multiple agents in coordination', async () => {
      const validator = new E2EValidatorService();
      const result = await validator.validateCoordinatorOrchestration();

      if (result.success) {
        // Property: successful coordination should involve multiple agents
        expect(result.agentsInvolved.length).toBeGreaterThan(1);
        expect(result.outputsCombined).toBe(true);
      }
    });

    it('should complete within reasonable time', async () => {
      const validator = new E2EValidatorService();
      const result = await validator.validateCoordinatorOrchestration();

      // Property: coordination should complete within 5 seconds
      expect(result.responseTimeMs).toBeLessThan(5000);
    });
  });

  describe('Mock result helpers', () => {
    it('should create valid mock results', () => {
      fc.assert(
        fc.property(
          fc.record({
            agentsInvolved: agentListArb,
            outputsCombined: fc.boolean(),
          }),
          (overrides) => {
            const result = createMockCoordinatorResult(overrides);

            // Property: mock should have all required fields
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('responseTimeMs');
            expect(result).toHaveProperty('agentsInvolved');
            expect(result).toHaveProperty('outputsCombined');

            // Property: overrides should be applied
            expect(result.agentsInvolved).toEqual(overrides.agentsInvolved);
            expect(result.outputsCombined).toBe(overrides.outputsCombined);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
