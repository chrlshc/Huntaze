/**
 * ComplianceAgent - Azure AI Foundry Integration
 * 
 * Handles content compliance checking and policy enforcement using Azure AI Foundry
 * via the Python AI Router service.
 * 
 * Feature: azure-foundry-agents-integration, Task 8
 * Requirements: 1.1, 2.4, 3.1-3.3, 5.1, 5.2, 5.4, 6.4, 6.9, 7.1-7.3, 9.4
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { 
  getRouterClient, 
  RouterClient, 
  RouterResponse,
} from '../foundry/router-client';
import { 
  planToTier, 
  agentTypeHint, 
  detectFrenchLanguage,
  type UserPlan,
  type ClientTier,
  type TypeHint 
} from '../foundry/mapping';
import { calculateCostSimple } from '../foundry/cost-calculator';
import { getCostTrackingService } from '../azure/cost-tracking.service';

// =============================================================================
// Types
// =============================================================================

export interface ComplianceRequest {
  creatorId: number;
  content: string;
  contentType: 'message' | 'post' | 'caption' | 'bio' | 'comment';
  context?: {
    platform?: 'onlyfans' | 'instagram' | 'twitter' | 'tiktok';
    targetAudience?: string;
    previousViolations?: Array<{
      type: string;
      description: string;
    }>;
  };
  accountId?: string;
  plan?: UserPlan;
}

export interface ComplianceViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
}

export interface ComplianceResponseData {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  compliantAlternative?: string;
  confidence: number;
}

export interface ComplianceUsage {
  model: string;
  deployment: string;
  region: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Cost calculation is now centralized in lib/ai/foundry/cost-calculator.ts


// =============================================================================
// Platform Rules
// =============================================================================

/**
 * Platform-specific compliance rules
 * Requirement 6.4, 6.9: Include platform-specific rules
 */
const PLATFORM_RULES: Record<string, string> = {
  onlyfans: `OnlyFans Rules:
- Adult content allowed but must comply with terms of service
- No content involving minors
- No non-consensual content
- No extreme or illegal content
- Clear content warnings required`,
  
  instagram: `Instagram Rules:
- No nudity or sexual content
- No hate speech or bullying
- No violence or dangerous content
- Respect intellectual property
- Follow community guidelines`,
  
  twitter: `Twitter/X Rules:
- No hateful conduct
- No violent content
- No adult content without warnings
- No spam or manipulation
- Respect copyright`,
  
  tiktok: `TikTok Rules:
- No nudity or sexual content
- No dangerous acts or challenges
- No hate speech or harassment
- Age-appropriate content only
- Follow community guidelines`,
};

// =============================================================================
// ComplianceAgent Implementation
// =============================================================================

export class FoundryComplianceAgent implements AITeamMember {
  id = 'compliance-agent-foundry';
  name = 'Compliance Agent (Foundry)';
  role = 'content_compliance';
  model = 'Llama-3.3-70B'; // Default model, actual model comes from router response
  typeHint: TypeHint = 'chat'; // Requirement 2.4: chat for policy checking
  
  private network: AIKnowledgeNetwork | null = null;
  private costTracker = getCostTrackingService();
  private routerClient: RouterClient;

  constructor(routerClient?: RouterClient) {
    this.routerClient = routerClient || getRouterClient();
  }

  /**
   * Initialize agent with Knowledge Network access
   * Requirement 2.4: Access Knowledge Network for compliance patterns
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a content compliance check request
   * Requirement 5.1: Maintain same input/output interface
   */
  async processRequest(request: ComplianceRequest): Promise<AIResponse> {
    try {
      const response = await this.checkCompliance(request);
      
      return {
        success: true,
        data: response.data,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check content for compliance violations
   * 
   * Requirements:
   * - 1.1: Call Python AI Router /route endpoint
   * - 2.4: Hint router with type "chat" for policy checking
   * - 3.1-3.3: Map user plan to client_tier
   */
  async checkCompliance(request: ComplianceRequest): Promise<{
    data: ComplianceResponseData;
    usage: ComplianceUsage;
  }> {
    const { creatorId, content, contentType, context, accountId, plan } = request;

    // Check quota before making request
    if (accountId) {
      const quotaCheck = await this.costTracker.checkQuota(accountId);
      if (!quotaCheck.allowed) {
        throw new Error('Quota exceeded for this account');
      }
    }

    // Get compliance insights from Knowledge Network
    const complianceInsights = await this.getComplianceInsights(creatorId);
    
    // Build the prompt with system instructions and context
    const prompt = this.buildPrompt(content, contentType, context, complianceInsights);
    
    // Requirement 3.1-3.3: Map user plan to client tier
    const clientTier: ClientTier = planToTier(plan);
    
    // Requirement 2.5: Detect French language for Mistral routing
    const languageHint = detectFrenchLanguage(prompt);

    // Requirement 1.1: Call Python AI Router
    const routerResponse = await this.routerClient.route({
      prompt,
      client_tier: clientTier,
      type_hint: this.typeHint,
      language_hint: languageHint,
    });

    // Parse response and extract structured data
    const responseData = this.parseResponse(routerResponse.output);
    
    // Requirement 7.1-7.3: Calculate cost and log usage
    const usage = this.extractUsage(routerResponse);
    
    if (accountId) {
      await this.logUsage(accountId, creatorId, routerResponse, usage, responseData);
    }

    // Broadcast high-confidence compliance patterns to Knowledge Network
    if (responseData.violations.length > 0 && responseData.confidence > 0.8) {
      await this.broadcastComplianceInsight(
        creatorId,
        responseData.violations,
        contentType,
        context?.platform,
        routerResponse
      );
    }

    return {
      data: responseData,
      usage,
    };
  }


  /**
   * Build the prompt with system instructions and context
   * Requirement 6.4, 6.9, 9.4: Optimized English prompt with JSON format and platform rules
   */
  private buildPrompt(
    content: string,
    contentType: string,
    context?: ComplianceRequest['context'],
    insights?: Insight[]
  ): string {
    // System prompt optimized for Llama-3.3-70B
    let prompt = `You are a content compliance specialist for creator platforms.

Your role:
1. Identify policy violations in user-generated content
2. Assess severity of violations (low, medium, high, critical)
3. Suggest compliant alternatives when violations are found
4. Consider platform-specific rules and community guidelines
5. Be thorough but fair, consider context and intent

`;

    // Add platform-specific rules
    if (context?.platform && PLATFORM_RULES[context.platform]) {
      prompt += `${PLATFORM_RULES[context.platform]}\n\n`;
    }

    // Add previous violations context
    if (context?.previousViolations && context.previousViolations.length > 0) {
      prompt += `Previous violations by this creator:\n`;
      context.previousViolations.slice(0, 3).forEach((v, i) => {
        prompt += `${i + 1}. ${v.type}: ${v.description}\n`;
      });
      prompt += '\n';
    }

    // Add insights from Knowledge Network
    if (insights && insights.length > 0) {
      prompt += `Known compliance patterns:\n`;
      insights.slice(0, 3).forEach((insight, i) => {
        prompt += `${i + 1}. ${insight.data?.pattern || insight.type}\n`;
      });
      prompt += '\n';
    }

    // Add content to analyze
    prompt += `Content type: ${contentType}
${context?.platform ? `Platform: ${context.platform}` : ''}
${context?.targetAudience ? `Target audience: ${context.targetAudience}` : ''}

Content to analyze:
"${content}"

Check for violations in these categories:
- Explicit sexual content (platform-specific rules)
- Harassment or bullying language
- Hate speech or discrimination
- Spam or misleading claims
- Copyright infringement
- Privacy violations
- Illegal activities

You MUST respond with valid JSON:
{
  "is_compliant": true,
  "violations": [
    {
      "type": "category name",
      "severity": "low|medium|high|critical",
      "description": "explanation of the violation",
      "location": "specific text if applicable"
    }
  ],
  "compliant_alternative": "suggested rewrite if violations found or null",
  "confidence": 0.95
}`;

    return prompt;
  }

  /**
   * Get compliance insights from Knowledge Network
   */
  private async getComplianceInsights(creatorId: number): Promise<Insight[]> {
    if (!this.network) {
      return [];
    }

    try {
      return await this.network.getRelevantInsights(creatorId, 'compliance_pattern', 5);
    } catch {
      return [];
    }
  }

  /**
   * Parse the AI response
   * Requirement 6.9: Parse JSON output with required fields
   */
  private parseResponse(text: string): ComplianceResponseData {
    try {
      const parsed = JSON.parse(text);
      return {
        isCompliant: parsed.is_compliant ?? true,
        violations: (parsed.violations || []).map((v: any) => ({
          type: v.type || 'unknown',
          severity: v.severity || 'low',
          description: v.description || '',
          location: v.location,
        })),
        compliantAlternative: parsed.compliant_alternative || undefined,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch {
      // Fallback if JSON parsing fails - assume compliant
      return {
        isCompliant: true,
        violations: [],
        confidence: 0.3,
      };
    }
  }

  /**
   * Extract usage statistics from router response
   * Requirement 5.2, 7.1-7.3: Convert usage to existing format with cost
   * Uses centralized cost calculator from lib/ai/foundry/cost-calculator.ts
   */
  private extractUsage(response: RouterResponse): ComplianceUsage {
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const costUsd = calculateCostSimple(response.model, inputTokens, outputTokens);

    return {
      model: response.model,
      deployment: response.deployment,
      region: response.region,
      inputTokens,
      outputTokens,
      costUsd,
    };
  }

  /**
   * Log usage to cost tracking service
   * Requirement 7.1, 7.3: Log with model, deployment, region
   */
  private async logUsage(
    accountId: string,
    creatorId: number,
    response: RouterResponse,
    usage: ComplianceUsage,
    result: ComplianceResponseData
  ): Promise<void> {
    await this.costTracker.logUsage(
      {
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        totalTokens: usage.inputTokens + usage.outputTokens,
        model: 'gpt-4' as const, // Use gpt-4 as placeholder for logging compatibility
        estimatedCost: usage.costUsd,
      },
      {
        accountId,
        creatorId: creatorId.toString(),
        operation: 'compliance_check',
        correlationId: `compliance-${Date.now()}`,
        timestamp: new Date(),
        violationsFound: result.violations.length,
      } as any
    );
  }


  /**
   * Broadcast compliance insight to Knowledge Network
   * Requirement 5.4: Include actual model from router response in metadata
   */
  private async broadcastComplianceInsight(
    creatorId: number,
    violations: ComplianceViolation[],
    contentType: string,
    platform?: string,
    routerResponse?: RouterResponse
  ): Promise<void> {
    if (!this.network) return;

    const insight: Insight = {
      source: this.id,
      type: 'compliance_pattern',
      confidence: 0.85,
      data: {
        violations: violations.map(v => ({
          type: v.type,
          severity: v.severity,
        })),
        contentType,
        platform,
        timestamp: new Date().toISOString(),
        // Requirement 5.4: Include actual model info from router
        model: routerResponse?.model,
        deployment: routerResponse?.deployment,
        region: routerResponse?.region,
        provider: 'azure-foundry',
      },
      timestamp: new Date(),
    };

    await this.network.broadcastInsight(creatorId, insight);
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): string[] {
    return [
      'content_compliance_check',
      'policy_violation_detection',
      'compliant_alternative_generation',
      'platform_specific_rules',
      'severity_assessment',
    ];
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new FoundryComplianceAgent instance
 */
export function createFoundryComplianceAgent(routerClient?: RouterClient): FoundryComplianceAgent {
  return new FoundryComplianceAgent(routerClient);
}
