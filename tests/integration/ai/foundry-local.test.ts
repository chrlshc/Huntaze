/**
 * End-to-end local integration tests for Foundry Agents
 * 
 * **Feature: azure-foundry-production-rollout**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 * 
 * These tests verify the complete flow:
 *   TypeScript Agent → RouterClient → Python Router → Azure AI Foundry
 * 
 * Prerequisites:
 *   1. Start the router: ./scripts/start-local-router.sh
 *   2. Configure Azure credentials in .env.local
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import Foundry agents and RouterClient
// Note: These imports assume the agents are properly exported
const ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:8000';

interface RouterRequest {
  prompt: string;
  client_tier: 'standard' | 'vip';
  type_hint?: 'math' | 'coding' | 'creative' | 'chat';
  language_hint?: 'fr' | 'en' | 'other';
}

interface RouterResponse {
  model: string;
  deployment: string;
  region: string;
  routing: {
    type: string;
    complexity: string;
    language: string;
    client_tier: string;
    type_hint_applied?: boolean;
    language_hint_applied?: boolean;
  };
  output: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Simple RouterClient for testing
 */
class TestRouterClient {
  constructor(private baseUrl: string = ROUTER_URL) {}

  async route(request: RouterRequest): Promise<RouterResponse> {
    const response = await fetch(`${this.baseUrl}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`Router error ${response.status}: ${error.detail}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Check if router and Azure are configured
 */
async function checkEnvironment(): Promise<{ routerOk: boolean; azureOk: boolean }> {
  const client = new TestRouterClient();
  const routerOk = await client.healthCheck();
  
  if (!routerOk) {
    return { routerOk: false, azureOk: false };
  }

  // Try a simple request to check Azure
  try {
    await client.route({
      prompt: 'test',
      client_tier: 'standard',
      type_hint: 'chat',
    });
    return { routerOk: true, azureOk: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    // Azure not configured if we get a 500 about Azure
    if (message.includes('Azure') || message.includes('500')) {
      return { routerOk: true, azureOk: false };
    }
    return { routerOk: true, azureOk: true };
  }
}

describe('Foundry Agents Local Integration', () => {
  let client: TestRouterClient;
  let env: { routerOk: boolean; azureOk: boolean };

  beforeAll(async () => {
    client = new TestRouterClient();
    env = await checkEnvironment();

    if (!env.routerOk) {
      console.warn(
        '\n⚠️  AI Router is not running. Skipping integration tests.\n' +
        '   Start with: ./scripts/start-local-router.sh\n'
      );
    } else if (!env.azureOk) {
      console.warn(
        '\n⚠️  Azure AI is not configured. Some tests will be skipped.\n' +
        '   Configure AZURE_AI_CHAT_ENDPOINT and AZURE_AI_CHAT_KEY in .env.local\n'
      );
    }
  });

  describe('MessagingFoundryAgent Flow', () => {
    it('should route chat requests with type_hint=chat', async () => {
      if (!env.routerOk) return;

      const request: RouterRequest = {
        prompt: 'Generate a friendly response to a fan who said "I love your content!"',
        client_tier: 'standard',
        type_hint: 'chat',
      };

      if (env.azureOk) {
        const response = await client.route(request);
        
        expect(response.model).toBeTruthy();
        expect(response.output).toBeTruthy();
        expect(response.routing.type).toBe('chat');
        expect(response.routing.type_hint_applied).toBe(true);
      } else {
        // Just verify the request format is accepted
        await expect(client.route(request)).rejects.toThrow(/Azure/);
      }
    });

    it('should detect French language and apply hint', async () => {
      if (!env.routerOk) return;

      const request: RouterRequest = {
        prompt: 'Réponds à ce fan qui dit "J\'adore ton contenu!"',
        client_tier: 'standard',
        type_hint: 'chat',
        language_hint: 'fr',
      };

      if (env.azureOk) {
        const response = await client.route(request);
        
        expect(response.routing.language).toBe('fr');
        expect(response.routing.language_hint_applied).toBe(true);
        // Should route to Mistral for French
        expect(response.model).toContain('Mistral');
      }
    });

    it('should include usage statistics in response', async () => {
      if (!env.routerOk || !env.azureOk) return;

      const response = await client.route({
        prompt: 'Say hello',
        client_tier: 'standard',
        type_hint: 'chat',
      });

      expect(response.usage).toBeDefined();
      if (response.usage) {
        expect(response.usage.prompt_tokens).toBeGreaterThan(0);
        expect(response.usage.completion_tokens).toBeGreaterThan(0);
        expect(response.usage.total_tokens).toBe(
          response.usage.prompt_tokens + response.usage.completion_tokens
        );
      }
    });
  });

  describe('AnalyticsFoundryAgent Flow', () => {
    it('should route math/reasoning requests with type_hint=math', async () => {
      if (!env.routerOk) return;

      const request: RouterRequest = {
        prompt: `Analyze this performance data and provide insights:
          - Revenue last month: $5,000
          - Revenue this month: $7,500
          - Subscribers: 150 → 200
          - Average tip: $15 → $20
          
          Provide predictions and recommendations.`,
        client_tier: 'vip',
        type_hint: 'math',
      };

      if (env.azureOk) {
        const response = await client.route(request);
        
        expect(response.model).toBeTruthy();
        expect(response.output).toBeTruthy();
        expect(response.routing.type).toBe('math');
        expect(response.routing.client_tier).toBe('vip');
        // Should route to DeepSeek-R1 for math
        expect(response.model).toContain('DeepSeek');
      }
    });

    it('should handle VIP tier routing', async () => {
      if (!env.routerOk || !env.azureOk) return;

      const response = await client.route({
        prompt: 'Calculate growth rate from 100 to 150',
        client_tier: 'vip',
        type_hint: 'math',
      });

      expect(response.routing.client_tier).toBe('vip');
    });
  });

  describe('SalesFoundryAgent Flow', () => {
    it('should route creative requests with type_hint=creative', async () => {
      if (!env.routerOk) return;

      const request: RouterRequest = {
        prompt: `Create a persuasive upsell message for a fan who:
          - Has been subscribed for 3 months
          - Tips occasionally ($10-20)
          - Engages with fitness content
          
          Suggest a PPV price and message.`,
        client_tier: 'standard',
        type_hint: 'creative',
      };

      if (env.azureOk) {
        const response = await client.route(request);
        
        expect(response.model).toBeTruthy();
        expect(response.output).toBeTruthy();
        expect(response.routing.type).toBe('creative');
        // Should route to Llama for creative
        expect(response.model).toContain('Llama');
      }
    });
  });

  describe('ComplianceFoundryAgent Flow', () => {
    it('should route compliance checks with type_hint=chat', async () => {
      if (!env.routerOk) return;

      const request: RouterRequest = {
        prompt: `Check if this message is compliant with OnlyFans policies:
          "Hey! Check out my exclusive content, you won't regret it! 🔥"
          
          Platform: OnlyFans
          Content type: promotional message`,
        client_tier: 'standard',
        type_hint: 'chat',
      };

      if (env.azureOk) {
        const response = await client.route(request);
        
        expect(response.model).toBeTruthy();
        expect(response.output).toBeTruthy();
        expect(response.routing.type).toBe('chat');
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for empty prompts', async () => {
      if (!env.routerOk) return;

      await expect(
        client.route({
          prompt: '',
          client_tier: 'standard',
        })
      ).rejects.toThrow(/400/);
    });

    it('should return 400 for whitespace-only prompts', async () => {
      if (!env.routerOk) return;

      await expect(
        client.route({
          prompt: '   \n\t  ',
          client_tier: 'standard',
        })
      ).rejects.toThrow(/400/);
    });

    it('should handle invalid type_hint gracefully', async () => {
      if (!env.routerOk) return;

      // Invalid type_hint should be rejected by Pydantic validation
      const response = await fetch(`${ROUTER_URL}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'test',
          client_tier: 'standard',
          type_hint: 'invalid_type',
        }),
      });

      // Should return 422 (validation error) for invalid enum value
      expect(response.status).toBe(422);
    });
  });

  describe('Response Format Validation', () => {
    it('should return complete response structure', async () => {
      if (!env.routerOk || !env.azureOk) return;

      const response = await client.route({
        prompt: 'Hello world',
        client_tier: 'standard',
        type_hint: 'chat',
      });

      // Validate response structure
      expect(response).toHaveProperty('model');
      expect(response).toHaveProperty('deployment');
      expect(response).toHaveProperty('region');
      expect(response).toHaveProperty('routing');
      expect(response).toHaveProperty('output');

      // Validate routing structure
      expect(response.routing).toHaveProperty('type');
      expect(response.routing).toHaveProperty('complexity');
      expect(response.routing).toHaveProperty('language');
      expect(response.routing).toHaveProperty('client_tier');

      // Validate types
      expect(typeof response.model).toBe('string');
      expect(typeof response.deployment).toBe('string');
      expect(typeof response.region).toBe('string');
      expect(typeof response.output).toBe('string');
    });

    it('should return eastus2 region', async () => {
      if (!env.routerOk || !env.azureOk) return;

      const response = await client.route({
        prompt: 'test',
        client_tier: 'standard',
        type_hint: 'chat',
      });

      expect(response.region).toBe('eastus2');
    });
  });
});

describe('Environment Status', () => {
  it('should report environment status', async () => {
    const env = await checkEnvironment();
    
    console.log('\n📊 Integration Test Environment Status:');
    console.log(`   Router:  ${env.routerOk ? '✓ Running' : '✗ Not running'}`);
    console.log(`   Azure:   ${env.azureOk ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   URL:     ${ROUTER_URL}\n`);
    
    if (!env.routerOk) {
      console.log('   To start: ./scripts/start-local-router.sh\n');
    }
    
    expect(true).toBe(true);
  });
});
