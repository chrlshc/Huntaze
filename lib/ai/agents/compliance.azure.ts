/**
 * ComplianceAgent - Azure OpenAI Migration
 * 
 * Handles content compliance checking and policy enforcement using Azure OpenAI Service
 * 
 * Feature: huntaze-ai-azure-migration, Task 13
 * Requirements: 2.4
 * Validates: Property 4 (Agent model assignment - ComplianceAI)
 */

import { AITeamMember, AIResponse } from './types';
import { AIKnowledgeNetwork, Insight } from '../knowledge-network';
import { azureOpenAIRouter, type RouterOptions } from '../azure/azure-openai-router';
import { getCostTrackingService } from '../azure/cost-tracking.service';
import type { ChatMessage } from '../azure/azure-openai.types';

export class AzureComplianceAgent implements AITeamMember {
  id = 'compliance-agent-azure';
  name = 'Compliance Agent (Azure)';
  role = 'content_compliance';
  model = 'gpt-35-turbo'; // Use GPT-3.5 Turbo economy tier for compliance
  
  private network: AIKnowledgeNetwork | null = null;
  private costTracker = getCostTrackingService();

  /**
   * Initialize agent with Knowledge Network access
   * Requirement 2.4: Access Knowledge Network for compliance patterns
   */
  async initialize(network: AIKnowledgeNetwork): Promise<void> {
    this.network = network;
  }

  /**
   * Process a content compliance check request
   * Requirement 2.4: Check content against platform policies
   */
  async processRequest(request: {
    creatorId: number;
    content: string;
    contentType: 'message' | 'post' | 'caption' | 'bio' | 'comment';
    context?: {
      platform?: 'onlyfans' | 'instagram' | 'twitter' | 'tiktok';
      targetAudience?: string;
      previousViolations?: any[];
    };
    accountId?: string;
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise';
  }): Promise<AIResponse> {
    try {
      const complianceCheck = await this.checkCompliance(
        request.creatorId,
        request.content,
        request.contentType,
        request.context,
        request.accountId,
        request.plan
      );
      
      return {
        success: true,
        data: complianceCheck,
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
   * - 2.4: Use GPT-3.5 Turbo with content filtering configured
   * - Detect policy violations
   * - Provide compliant alternatives
   */
  async checkCompliance(
    creatorId: number,
    content: string,
    contentType: 'message' | 'post' | 'caption' | 'bio' | 'comment',
    context?: {
      platform?: 'onlyfans' | 'instagram' | 'twitter' | 'tiktok';
      targetAudience?: string;
      previousViolations?: any[];
    },
    accountId?: string,
    plan?: 'starter' | 'pro' | 'scale' | 'enterprise'
  ): Promise<{
    isCompliant: boolean;
    violations: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      location?: string;
    }>;
    compliantAlternative?: string;
    confidence: number;
    usage: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      estimatedCost: number;
    };
  }> {
    const startTime = Date.now();
    
    // Retrieve compliance insights from Knowledge Network
    const complianceInsights = this.network 
      ? await this.network.queryInsights({
          agentId: this.id,
          topic: 'compliance_patterns',
          limit: 5,
        })
      : [];

    // Build compliance check prompt
    const prompt = this.buildCompliancePrompt(
      content,
      contentType,
      context,
      complianceInsights
    );

    // Call Azure OpenAI with economy tier (GPT-3.5 Turbo)
    const routerOptions: RouterOptions = {
      tier: 'economy', // Requirement 2.4: Use economy tier
      temperature: 0.3, // Low temperature for consistent compliance checks
      maxTokens: 500,
      responseFormat: { type: 'json_object' }, // Structured output
      accountId,
      plan,
      metadata: {
        agentId: this.id,
        operation: 'compliance_check',
        contentType,
      },
    };

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(context?.platform),
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await azureOpenAIRouter.chat(messages, routerOptions);
    
    // Parse response
    const result = JSON.parse(response.text);
    
    const latency = Date.now() - startTime;

    // Track costs
    await this.costTracker.logUsage({
      accountId: accountId || `creator-${creatorId}`,
      plan: plan || 'starter',
      deployment: response.model,
      tier: 'economy',
      operation: 'compliance_check',
      tokensInput: response.usage.promptTokens,
      tokensOutput: response.usage.completionTokens,
      estimatedCost: this.calculateCost(response.usage),
      latency,
      success: true,
      metadata: {
        agentId: this.id,
        contentType,
        violationsFound: result.violations?.length || 0,
      },
    });

    // Broadcast high-confidence compliance patterns to Knowledge Network
    if (result.violations && result.violations.length > 0 && result.confidence > 0.8) {
      await this.broadcastComplianceInsight(
        result.violations,
        contentType,
        context?.platform
      );
    }

    return {
      isCompliant: result.is_compliant,
      violations: result.violations || [],
      compliantAlternative: result.compliant_alternative,
      confidence: result.confidence,
      usage: {
        model: response.model,
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
        estimatedCost: this.calculateCost(response.usage),
      },
    };
  }

  /**
   * Build compliance check prompt with context
   */
  private buildCompliancePrompt(
    content: string,
    contentType: string,
    context?: {
      platform?: string;
      targetAudience?: string;
      previousViolations?: any[];
    },
    insights?: Insight[]
  ): string {
    let prompt = `Analyze the following ${contentType} for compliance violations:\n\n`;
    prompt += `Content: "${content}"\n\n`;

    if (context?.platform) {
      prompt += `Platform: ${context.platform}\n`;
    }

    if (context?.targetAudience) {
      prompt += `Target Audience: ${context.targetAudience}\n`;
    }

    if (context?.previousViolations && context.previousViolations.length > 0) {
      prompt += `\nPrevious Violations:\n`;
      context.previousViolations.slice(0, 3).forEach((v, i) => {
        prompt += `${i + 1}. ${v.type}: ${v.description}\n`;
      });
    }

    if (insights && insights.length > 0) {
      prompt += `\nKnown Compliance Patterns:\n`;
      insights.slice(0, 3).forEach((insight, i) => {
        prompt += `${i + 1}. ${insight.content}\n`;
      });
    }

    prompt += `\nCheck for violations in these categories:
- Explicit sexual content (platform-specific rules)
- Harassment or bullying language
- Hate speech or discrimination
- Spam or misleading claims
- Copyright infringement
- Privacy violations
- Illegal activities

Respond in JSON format:
{
  "is_compliant": boolean,
  "violations": [
    {
      "type": "category",
      "severity": "low|medium|high|critical",
      "description": "explanation",
      "location": "specific text if applicable"
    }
  ],
  "compliant_alternative": "suggested rewrite if violations found",
  "confidence": 0.0-1.0
}`;

    return prompt;
  }

  /**
   * Get system prompt for compliance checking
   */
  private getSystemPrompt(platform?: string): string {
    const platformRules = platform ? this.getPlatformRules(platform) : '';
    
    return `You are a content compliance specialist for creator platforms. Your role is to:
1. Identify policy violations in user-generated content
2. Assess severity of violations
3. Suggest compliant alternatives when violations are found
4. Consider platform-specific rules and community guidelines

${platformRules}

Be thorough but fair. Consider context and intent. Provide constructive feedback.`;
  }

  /**
   * Get platform-specific compliance rules
   */
  private getPlatformRules(platform: string): string {
    const rules: Record<string, string> = {
      onlyfans: `OnlyFans Rules:
- Adult content is allowed but must comply with terms of service
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

    return rules[platform] || '';
  }

  /**
   * Broadcast compliance insight to Knowledge Network
   */
  private async broadcastComplianceInsight(
    violations: any[],
    contentType: string,
    platform?: string
  ): Promise<void> {
    if (!this.network) return;

    const insight: Insight = {
      id: `compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: this.id,
      topic: 'compliance_patterns',
      content: `Detected ${violations.length} violation(s) in ${contentType}${platform ? ` on ${platform}` : ''}: ${violations.map(v => v.type).join(', ')}`,
      confidence: 0.85,
      timestamp: new Date(),
      metadata: {
        violations: violations.map(v => ({
          type: v.type,
          severity: v.severity,
        })),
        contentType,
        platform,
      },
    };

    await this.network.broadcastInsight(insight);
  }

  /**
   * Calculate estimated cost for Azure OpenAI usage
   * GPT-3.5 Turbo pricing: $0.0015/1K input tokens, $0.002/1K output tokens
   */
  private calculateCost(usage: { promptTokens: number; completionTokens: number }): number {
    const inputCost = (usage.promptTokens / 1000) * 0.0015;
    const outputCost = (usage.completionTokens / 1000) * 0.002;
    return inputCost + outputCost;
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

// Export singleton instance
export const azureComplianceAgent = new AzureComplianceAgent();
