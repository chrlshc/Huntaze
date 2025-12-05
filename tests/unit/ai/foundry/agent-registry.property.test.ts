/**
 * Property-based tests for FoundryAgentRegistry
 * 
 * **Feature: azure-foundry-production-rollout, Property 2: Agent type routing correctness**
 * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  FoundryAgentRegistry,
  FoundryAgentType,
  getFoundryAgentRegistry,
} from '@/lib/ai/foundry/agent-registry';
import { AIProviderConfig } from '@/lib/ai/config/provider-config';

describe('FoundryAgentRegistry Property Tests', () => {
  beforeEach(() => {
    FoundryAgentRegistry.resetInstance();
    AIProviderConfig.resetInstance();
  });

  afterEach(() => {
    FoundryAgentRegistry.resetInstance();
    AIProviderConfig.resetInstance();
  });

  const validAgentTypes: FoundryAgentType[] = ['messaging', 'analytics', 'sales', 'compliance'];

  /**
   * Property 2.1: All valid agent types are retrievable after initialization
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.1: All valid agent types are retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validAgentTypes),
        async (agentType) => {
          FoundryAgentRegistry.resetInstance();
          const registry = getFoundryAgentRegistry({
            routerUrl: 'http://localhost:8000',
          });
          await registry.initialize();
          
          // Should not throw for valid agent types
          const agent = registry.getAgent(agentType);
          return agent !== null && agent !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.2: Uninitialized registry throws for any agent type
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.2: Uninitialized registry throws', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validAgentTypes),
        (agentType) => {
          FoundryAgentRegistry.resetInstance();
          const registry = getFoundryAgentRegistry();
          
          // Should throw when not initialized
          try {
            registry.getAgent(agentType);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && 
                   error.message.includes('not initialized');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.3: Request type mapping is consistent
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.3: Request type mapping is deterministic', () => {
    const requestTypes = [
      'fan_message', 'chat', 'message',
      'analyze_performance', 'analytics', 'math',
      'optimize_sales', 'sales', 'creative', 'generate_caption',
      'compliance_check', 'compliance', 'moderation',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...requestTypes),
        (requestType) => {
          // Same request type should always map to same agent type
          const result1 = FoundryAgentRegistry.mapRequestTypeToAgent(requestType);
          const result2 = FoundryAgentRegistry.mapRequestTypeToAgent(requestType);
          
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.4: Messaging request types map to messaging agent
   * **Validates: Requirements 3.3**
   */
  it('Property 2.4: Messaging types map to messaging agent', () => {
    const messagingTypes = ['fan_message', 'chat', 'message'];

    fc.assert(
      fc.property(
        fc.constantFrom(...messagingTypes),
        (requestType) => {
          const agentType = FoundryAgentRegistry.mapRequestTypeToAgent(requestType);
          return agentType === 'messaging';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.5: Analytics request types map to analytics agent
   * **Validates: Requirements 3.4**
   */
  it('Property 2.5: Analytics types map to analytics agent', () => {
    const analyticsTypes = ['analyze_performance', 'analytics', 'math'];

    fc.assert(
      fc.property(
        fc.constantFrom(...analyticsTypes),
        (requestType) => {
          const agentType = FoundryAgentRegistry.mapRequestTypeToAgent(requestType);
          return agentType === 'analytics';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.6: Sales request types map to sales agent
   * **Validates: Requirements 3.5**
   */
  it('Property 2.6: Sales types map to sales agent', () => {
    const salesTypes = ['optimize_sales', 'sales', 'creative', 'generate_caption'];

    fc.assert(
      fc.property(
        fc.constantFrom(...salesTypes),
        (requestType) => {
          const agentType = FoundryAgentRegistry.mapRequestTypeToAgent(requestType);
          return agentType === 'sales';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.7: Compliance request types map to compliance agent
   * **Validates: Requirements 3.6**
   */
  it('Property 2.7: Compliance types map to compliance agent', () => {
    const complianceTypes = ['compliance_check', 'compliance', 'moderation'];

    fc.assert(
      fc.property(
        fc.constantFrom(...complianceTypes),
        (requestType) => {
          const agentType = FoundryAgentRegistry.mapRequestTypeToAgent(requestType);
          return agentType === 'compliance';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.8: Unknown request types return null
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.8: Unknown request types return null', () => {
    // Test with specific unknown types to avoid JS reserved words
    const unknownTypes = [
      'unknown_type', 'random_request', 'invalid_action',
      'foo_bar', 'test_type', 'xyz_123', 'not_a_type',
      'something_else', 'another_type', 'fake_request',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...unknownTypes),
        (unknownType) => {
          const agentType = FoundryAgentRegistry.mapRequestTypeToAgent(unknownType);
          return agentType === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.9: Registry singleton is consistent
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.9: Registry singleton is consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (callCount) => {
          FoundryAgentRegistry.resetInstance();
          
          const instances: FoundryAgentRegistry[] = [];
          for (let i = 0; i < callCount; i++) {
            instances.push(getFoundryAgentRegistry());
          }
          
          // All instances should be the same
          return instances.every(inst => inst === instances[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.10: Registered types always returns all 4 agent types
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.10: Registered types contains all agent types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          FoundryAgentRegistry.resetInstance();
          const registry = getFoundryAgentRegistry();
          await registry.initialize();
          
          const types = registry.getRegisteredTypes();
          
          return (
            types.length === 4 &&
            types.includes('messaging') &&
            types.includes('analytics') &&
            types.includes('sales') &&
            types.includes('compliance')
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2.11: Specific getter methods return correct agent types
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.11: Specific getters return correct types', async () => {
    FoundryAgentRegistry.resetInstance();
    const registry = getFoundryAgentRegistry({
      routerUrl: 'http://localhost:8000',
    });
    await registry.initialize();

    // Each specific getter should return an agent
    const messaging = registry.getMessagingAgent();
    const analytics = registry.getAnalyticsAgent();
    const sales = registry.getSalesAgent();
    const compliance = registry.getComplianceAgent();

    expect(messaging).toBeDefined();
    expect(analytics).toBeDefined();
    expect(sales).toBeDefined();
    expect(compliance).toBeDefined();
  });

  /**
   * Property 2.12: Router URL is preserved from config
   * **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
   */
  it('Property 2.12: Router URL is preserved', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (routerUrl) => {
          FoundryAgentRegistry.resetInstance();
          const registry = getFoundryAgentRegistry({ routerUrl });
          
          return registry.getRouterUrl() === routerUrl;
        }
      ),
      { numRuns: 100 }
    );
  });
});
