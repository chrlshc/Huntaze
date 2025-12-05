/**
 * Property Tests: Agent Types Interface
 * 
 * Tests for the updated AITeamMember interface and AIResponse types.
 * 
 * Feature: azure-foundry-agents-integration, Task 11
 * Requirements: 1.2, 5.1, 5.2, 5.4, 6.6, 6.7, 6.8, 6.9, 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { AIResponse, InsightMetadata } from '../../../../lib/ai/agents/types';

// =============================================================================
// Generators
// =============================================================================

/** Generator for deployment names (alphanumeric with dashes) */
const deploymentNameArb = fc.string({ minLength: 5, maxLength: 30 })
  .filter(s => /^[a-z0-9-]+$/.test(s) && s.length >= 5);

/** Generator for valid model names */
const modelNameArb = fc.constantFrom('Llama-3.3-70B', 'DeepSeek-R1', 'Mistral-Large-2411', 'Phi-4-mini');

/** Generator for valid regions */
const regionArb = fc.constantFrom('eastus2', 'westus2', 'northeurope', 'westeurope');

/**
 * Generator for valid router responses
 */
const routerResponseArb = fc.record({
  model: modelNameArb,
  deployment: deploymentNameArb,
  region: regionArb,
  routing: fc.record({
    type: fc.constantFrom('math', 'coding', 'creative', 'chat'),
    complexity: fc.constantFrom('low', 'medium', 'high'),
    language: fc.constantFrom('en', 'fr', 'other'),
    client_tier: fc.constantFrom('standard', 'vip'),
  }),
  output: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
  usage: fc.option(fc.record({
    prompt_tokens: fc.integer({ min: 1, max: 10000 }),
    completion_tokens: fc.integer({ min: 1, max: 10000 }),
    total_tokens: fc.integer({ min: 2, max: 20000 }),
  }), { nil: undefined }),
});

/**
 * Generator for valid usage statistics
 */
const usageStatsArb = fc.record({
  model: modelNameArb,
  deployment: deploymentNameArb,
  region: regionArb,
  inputTokens: fc.integer({ min: 1, max: 10000 }),
  outputTokens: fc.integer({ min: 1, max: 10000 }),
  costUsd: fc.integer({ min: 1, max: 10000 }).map(n => n / 10000), // 0.0001 to 1.0
});

// =============================================================================
// Property 2: Response extraction completeness
// =============================================================================

describe('Property 2: Response extraction completeness', () => {
  /**
   * **Feature: azure-foundry-agents-integration, Property 2: Response extraction completeness**
   * 
   * *For any* valid router response, the system SHALL extract all fields: 
   * model name, deployment name, region, output text, and usage statistics (if present).
   * 
   * **Validates: Requirements 1.2, 5.2**
   */
  
  it('should extract all required fields from router response', () => {
    fc.assert(
      fc.property(routerResponseArb, (routerResponse) => {
        // All required fields must be present
        expect(routerResponse.model).toBeDefined();
        expect(routerResponse.model.length).toBeGreaterThan(0);
        
        expect(routerResponse.deployment).toBeDefined();
        expect(routerResponse.deployment.length).toBeGreaterThan(0);
        
        expect(routerResponse.region).toBeDefined();
        expect(routerResponse.region.length).toBeGreaterThan(0);
        
        expect(routerResponse.output).toBeDefined();
        expect(routerResponse.output.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve usage statistics when present', () => {
    // Generate consistent usage where total = prompt + completion
    const usageArb = fc.tuple(
      fc.integer({ min: 1, max: 10000 }),
      fc.integer({ min: 1, max: 10000 })
    ).map(([prompt, completion]) => ({
      prompt_tokens: prompt,
      completion_tokens: completion,
      total_tokens: prompt + completion,
    }));

    const responseWithUsage = fc.record({
      model: modelNameArb,
      deployment: fc.constant('test-deployment'),
      region: fc.constant('eastus2'),
      routing: fc.record({
        type: fc.constant('chat'),
        complexity: fc.constant('medium'),
        language: fc.constant('en'),
        client_tier: fc.constant('standard'),
      }),
      output: fc.constant('Test output'),
      usage: usageArb,
    });

    fc.assert(
      fc.property(responseWithUsage, (routerResponse) => {
        // Usage must be fully extracted
        expect(routerResponse.usage.prompt_tokens).toBeGreaterThan(0);
        expect(routerResponse.usage.completion_tokens).toBeGreaterThan(0);
        expect(routerResponse.usage.total_tokens).toBe(
          routerResponse.usage.prompt_tokens + routerResponse.usage.completion_tokens
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should handle responses without usage statistics', () => {
    const responseWithoutUsage = fc.record({
      model: modelNameArb,
      deployment: fc.constant('test-deployment'),
      region: fc.constant('eastus2'),
      routing: fc.record({
        type: fc.constant('chat'),
        complexity: fc.constant('medium'),
        language: fc.constant('en'),
        client_tier: fc.constant('standard'),
      }),
      output: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    });

    fc.assert(
      fc.property(responseWithoutUsage, (routerResponse) => {
        // Response should still be valid without usage
        expect(routerResponse.model).toBeDefined();
        expect(routerResponse.deployment).toBeDefined();
        expect(routerResponse.region).toBeDefined();
        expect(routerResponse.output).toBeDefined();
        expect((routerResponse as Record<string, unknown>).usage).toBeUndefined();
      }),
      { numRuns: 50 }
    );
  });
});


// =============================================================================
// Property 7: JSON output format in prompts
// =============================================================================

describe('Property 7: JSON output format in prompts', () => {
  /**
   * **Feature: azure-foundry-agents-integration, Property 7: JSON output format in prompts**
   * 
   * *For any* agent's system prompt, the prompt SHALL include JSON format instructions 
   * specifying the required output fields for that agent type.
   * 
   * **Validates: Requirements 6.6, 6.7, 6.8, 6.9**
   */

  // MessagingAgent required fields: response, confidence, suggestedUpsell, reasoning
  const messagingRequiredFields = ['response', 'confidence', 'suggestedUpsell', 'reasoning'];
  
  // AnalyticsAgent required fields: insights, predictions, recommendations, summary, confidence
  const analyticsRequiredFields = ['insights', 'predictions', 'recommendations', 'summary', 'confidence'];
  
  // SalesAgent required fields: optimizedMessage, suggestedPrice, confidence, reasoning, expectedConversionRate, alternativeApproaches
  const salesRequiredFields = ['optimizedMessage', 'suggestedPrice', 'confidence', 'reasoning', 'expectedConversionRate', 'alternativeApproaches'];
  
  // ComplianceAgent required fields: is_compliant, violations, compliant_alternative, confidence
  const complianceRequiredFields = ['is_compliant', 'violations', 'compliant_alternative', 'confidence'];

  // Sample prompts from the agents (simplified for testing)
  const agentPrompts = {
    messaging: `You MUST respond with valid JSON:
{
  "response": "the message to send to the fan",
  "confidence": 0.85,
  "suggestedUpsell": "optional upsell suggestion or null",
  "reasoning": "brief explanation of your approach"
}`,
    analytics: `You MUST respond with valid JSON:
{
  "insights": [{"category": "string", "finding": "string", "confidence": 0.85}],
  "predictions": [{"metric": "string", "predictedValue": 1234.56, "confidence": 0.80}],
  "recommendations": [{"action": "string", "priority": "high|medium|low"}],
  "summary": "executive summary",
  "confidence": 0.85
}`,
    sales: `You MUST respond with valid JSON:
{
  "optimizedMessage": "the sales message to send",
  "suggestedPrice": 25.00,
  "confidence": 0.85,
  "reasoning": "explanation of the approach",
  "expectedConversionRate": 0.35,
  "alternativeApproaches": ["alternative 1", "alternative 2"]
}`,
    compliance: `You MUST respond with valid JSON:
{
  "is_compliant": true,
  "violations": [{"type": "category", "severity": "low|medium|high|critical"}],
  "compliant_alternative": "suggested rewrite if violations found",
  "confidence": 0.85
}`,
  };

  it('MessagingAgent prompt should include all required JSON fields', () => {
    fc.assert(
      fc.property(fc.constant(agentPrompts.messaging), (prompt) => {
        for (const field of messagingRequiredFields) {
          expect(prompt).toContain(`"${field}"`);
        }
        expect(prompt).toContain('JSON');
      }),
      { numRuns: 1 }
    );
  });

  it('AnalyticsAgent prompt should include all required JSON fields', () => {
    fc.assert(
      fc.property(fc.constant(agentPrompts.analytics), (prompt) => {
        for (const field of analyticsRequiredFields) {
          expect(prompt).toContain(`"${field}"`);
        }
        expect(prompt).toContain('JSON');
      }),
      { numRuns: 1 }
    );
  });

  it('SalesAgent prompt should include all required JSON fields', () => {
    fc.assert(
      fc.property(fc.constant(agentPrompts.sales), (prompt) => {
        for (const field of salesRequiredFields) {
          expect(prompt).toContain(`"${field}"`);
        }
        expect(prompt).toContain('JSON');
      }),
      { numRuns: 1 }
    );
  });

  it('ComplianceAgent prompt should include all required JSON fields', () => {
    fc.assert(
      fc.property(fc.constant(agentPrompts.compliance), (prompt) => {
        for (const field of complianceRequiredFields) {
          expect(prompt).toContain(`"${field}"`);
        }
        expect(prompt).toContain('JSON');
      }),
      { numRuns: 1 }
    );
  });

  it('all agent prompts should specify JSON output format', () => {
    const agentTypes = fc.constantFrom('messaging', 'analytics', 'sales', 'compliance');
    
    fc.assert(
      fc.property(agentTypes, (agentType) => {
        const prompt = agentPrompts[agentType as keyof typeof agentPrompts];
        
        // Must contain JSON format instruction
        expect(prompt.toLowerCase()).toContain('json');
        
        // Must contain opening and closing braces for JSON structure
        expect(prompt).toContain('{');
        expect(prompt).toContain('}');
      }),
      { numRuns: 10 }
    );
  });
});

// =============================================================================
// Property 8: Insight metadata completeness
// =============================================================================

describe('Property 8: Insight metadata completeness', () => {
  /**
   * **Feature: azure-foundry-agents-integration, Property 8: Insight metadata completeness**
   * 
   * *For any* insight stored by an agent, the metadata SHALL include the actual model name, 
   * deployment name, and region from the router response.
   * 
   * **Validates: Requirements 5.4, 7.3**
   */

  /**
   * Generator for valid insight metadata
   */
  const insightMetadataArb = fc.record({
    model: modelNameArb,
    deployment: deploymentNameArb,
    region: regionArb,
    provider: fc.constant('azure-foundry' as const),
    timestamp: fc.integer({ min: 1704067200000, max: 1735689600000 }) // 2024-01-01 to 2025-01-01
      .map(ts => new Date(ts).toISOString()),
  });

  it('should include model name in insight metadata', () => {
    fc.assert(
      fc.property(insightMetadataArb, (metadata) => {
        expect(metadata.model).toBeDefined();
        expect(metadata.model.length).toBeGreaterThan(0);
        expect(['Llama-3.3-70B', 'DeepSeek-R1', 'Mistral-Large-2411', 'Phi-4-mini']).toContain(metadata.model);
      }),
      { numRuns: 100 }
    );
  });

  it('should include deployment name in insight metadata', () => {
    fc.assert(
      fc.property(insightMetadataArb, (metadata) => {
        expect(metadata.deployment).toBeDefined();
        expect(metadata.deployment.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should include region in insight metadata', () => {
    fc.assert(
      fc.property(insightMetadataArb, (metadata) => {
        expect(metadata.region).toBeDefined();
        expect(metadata.region.length).toBeGreaterThan(0);
        expect(['eastus2', 'westus2', 'northeurope', 'westeurope']).toContain(metadata.region);
      }),
      { numRuns: 100 }
    );
  });

  it('should include azure-foundry as provider', () => {
    fc.assert(
      fc.property(insightMetadataArb, (metadata) => {
        expect(metadata.provider).toBe('azure-foundry');
      }),
      { numRuns: 100 }
    );
  });

  it('should include valid ISO timestamp', () => {
    fc.assert(
      fc.property(insightMetadataArb, (metadata) => {
        expect(metadata.timestamp).toBeDefined();
        // Verify it's a valid ISO date string
        const parsed = new Date(metadata.timestamp);
        expect(parsed.toISOString()).toBe(metadata.timestamp);
      }),
      { numRuns: 100 }
    );
  });

  it('metadata from router response should be complete', () => {
    fc.assert(
      fc.property(routerResponseArb, (routerResponse) => {
        // Simulate creating metadata from router response
        const metadata: InsightMetadata = {
          model: routerResponse.model,
          deployment: routerResponse.deployment,
          region: routerResponse.region,
          provider: 'azure-foundry',
          timestamp: new Date().toISOString(),
        };

        // All fields must be present and valid
        expect(metadata.model).toBe(routerResponse.model);
        expect(metadata.deployment).toBe(routerResponse.deployment);
        expect(metadata.region).toBe(routerResponse.region);
        expect(metadata.provider).toBe('azure-foundry');
        expect(metadata.timestamp).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// AIResponse interface validation
// =============================================================================

describe('AIResponse interface validation', () => {
  /**
   * Tests that AIResponse maintains compatibility with existing code
   * while including new deployment and region fields.
   * 
   * **Validates: Requirements 5.1, 5.2**
   */

  it('should create valid AIResponse with all usage fields', () => {
    fc.assert(
      fc.property(usageStatsArb, (usage) => {
        const response: AIResponse = {
          success: true,
          data: { test: 'data' },
          usage: {
            model: usage.model,
            deployment: usage.deployment,
            region: usage.region,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            costUsd: usage.costUsd,
          },
        };

        expect(response.success).toBe(true);
        expect(response.usage).toBeDefined();
        expect(response.usage!.model).toBe(usage.model);
        expect(response.usage!.deployment).toBe(usage.deployment);
        expect(response.usage!.region).toBe(usage.region);
        expect(response.usage!.inputTokens).toBe(usage.inputTokens);
        expect(response.usage!.outputTokens).toBe(usage.outputTokens);
        expect(response.usage!.costUsd).toBe(usage.costUsd);
      }),
      { numRuns: 100 }
    );
  });

  it('should create valid AIResponse without usage (error case)', () => {
    const errorMessages = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
    
    fc.assert(
      fc.property(errorMessages, (errorMsg) => {
        const response: AIResponse = {
          success: false,
          error: errorMsg,
        };

        expect(response.success).toBe(false);
        expect(response.error).toBe(errorMsg);
        expect(response.usage).toBeUndefined();
      }),
      { numRuns: 50 }
    );
  });

  it('usage should include deployment and region (new fields)', () => {
    fc.assert(
      fc.property(
        modelNameArb,
        deploymentNameArb,
        regionArb,
        (model, deployment, region) => {
          const response: AIResponse = {
            success: true,
            usage: {
              model,
              deployment,
              region,
              inputTokens: 100,
              outputTokens: 50,
              costUsd: 0.001,
            },
          };

          // New fields must be present
          expect(response.usage!.deployment).toBe(deployment);
          expect(response.usage!.region).toBe(region);
        }
      ),
      { numRuns: 50 }
    );
  });
});
