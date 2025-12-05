/**
 * Property Test: Tier-Based Model Selection
 * 
 * **Feature: huntaze-ai-azure-migration, Property 1: Tier-based model selection**
 * 
 * *For any* request classified with a specific tier (premium/standard/economy), 
 * the router should invoke the corresponding Azure OpenAI deployment with 
 * appropriate parameters matching that tier's configuration.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { ModelTier, UserPlan } from '../../../lib/ai/azure/azure-openai-router';

// Mock the Azure OpenAI Service
vi.mock('../../../lib/ai/azure/azure-openai.service');

describe('Property 1: Tier-Based Model Selection', () => {
  let AzureOpenAIRouter: any;
  let AZURE_OPENAI_CONFIG: any;
  let mockChat: any;
  let mockSetDeployment: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Setup mock responses
    mockChat = vi.fn().mockResolvedValue({
      text: 'Mock response',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      finishReason: 'stop',
      model: 'gpt-4-turbo-prod',
    });
    
    mockSetDeployment = vi.fn();
    
    // Mock the service
    const { AzureOpenAIService } = await import('../../../lib/ai/azure/azure-openai.service');
    vi.mocked(AzureOpenAIService).mockImplementation(() => ({
      setDeployment: mockSetDeployment,
      chat: mockChat,
      chatStream: vi.fn(),
      generateText: vi.fn(),
      generateTextStream: vi.fn(),
      generateFromMultimodal: vi.fn(),
      countTokens: vi.fn(),
      getAvailableDeployments: vi.fn(),
      getCurrentDeployment: vi.fn(),
    } as any));
    
    // Import after mocking
    const routerModule = await import('../../../lib/ai/azure/azure-openai-router');
    const configModule = await import('../../../lib/ai/azure/azure-openai.config');
    
    AzureOpenAIRouter = routerModule.AzureOpenAIRouter;
    AZURE_OPENAI_CONFIG = configModule.AZURE_OPENAI_CONFIG;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should route premium tier to GPT-4 Turbo deployment', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          const response = await router.generateText(prompt, {
            tier: 'premium' as ModelTier,
          });

          expect(response.tier).toBe('premium');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.premium);
        }
      ),
      { numRuns: 10 } // Reduced for faster testing
    );
  });

  it('should route standard tier to GPT-4 deployment', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          const response = await router.generateText(prompt, {
            tier: 'standard' as ModelTier,
          });

          expect(response.tier).toBe('standard');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.standard);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should route economy tier to GPT-3.5 Turbo deployment', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          const response = await router.generateText(prompt, {
            tier: 'economy' as ModelTier,
          });

          expect(response.tier).toBe('economy');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.economy);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should enforce plan restrictions on tier selection', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom<UserPlan>('starter', 'pro', 'scale', 'enterprise'),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        async (prompt, plan, requestedTier) => {
          const response = await router.generateText(prompt, {
            tier: requestedTier,
            plan,
          });

          const allowedTiers = router.getAvailableTiers(plan);
          expect(allowedTiers).toContain(response.tier);

          if (plan === 'starter') {
            expect(response.tier).toBe('economy');
          }

          if (plan === 'pro' && requestedTier === 'premium') {
            expect(response.tier).not.toBe('premium');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should downgrade tier when plan does not allow requested tier', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          const response = await router.generateText(prompt, {
            tier: 'premium' as ModelTier,
            plan: 'starter' as UserPlan,
          });

          expect(response.tier).toBe('economy');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.economy);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should calculate cost based on deployment and usage', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom<ModelTier>('premium', 'standard', 'economy'),
        async (prompt, tier) => {
          const response = await router.generateText(prompt, { tier });

          expect(response.cost).toBeGreaterThanOrEqual(0);
          expect(typeof response.cost).toBe('number');

          if (response.usage.totalTokens > 0) {
            expect(response.cost).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should default to economy tier when no tier specified', async () => {
    const router = new AzureOpenAIRouter();
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (prompt) => {
          const response = await router.generateText(prompt, {});

          expect(response.tier).toBe('economy');
          expect(response.deployment).toBe(AZURE_OPENAI_CONFIG.deployments.economy);
        }
      ),
      { numRuns: 10 }
    );
  });
});
