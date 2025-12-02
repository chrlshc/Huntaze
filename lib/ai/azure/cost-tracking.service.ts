/**
 * Azure OpenAI Cost Tracking Service
 * 
 * Tracks token usage and costs for Azure OpenAI requests.
 * Logs metrics to Application Insights and enforces quota limits.
 * 
 * Feature: huntaze-ai-azure-migration
 * Requirements: 5.1, 5.3, 5.4
 */

import { TelemetryClient } from 'applicationinsights';

// Azure OpenAI Pricing (as of Dec 2024, West Europe)
const AZURE_OPENAI_PRICING = {
  'gpt-4-turbo': {
    input: 0.01 / 1000,  // $0.01 per 1K input tokens
    output: 0.03 / 1000, // $0.03 per 1K output tokens
  },
  'gpt-4': {
    input: 0.03 / 1000,  // $0.03 per 1K input tokens
    output: 0.06 / 1000, // $0.06 per 1K output tokens
  },
  'gpt-35-turbo': {
    input: 0.0005 / 1000,  // $0.0005 per 1K input tokens
    output: 0.0015 / 1000, // $0.0015 per 1K output tokens
  },
  'text-embedding-ada-002': {
    input: 0.0001 / 1000,  // $0.0001 per 1K tokens
    output: 0,
  },
} as const;

export type AzureModel = keyof typeof AZURE_OPENAI_PRICING;

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: AzureModel;
  estimatedCost: number;
}

export interface CostTrackingMetadata {
  accountId: string;
  creatorId?: string;
  operation: string;
  correlationId: string;
  timestamp: Date;
}

export interface QuotaInfo {
  accountId: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  monthlyLimit: number;
  currentUsage: number;
  remainingQuota: number;
  resetDate: Date;
}

export interface CostAggregation {
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  breakdown: {
    byModel: Record<string, { cost: number; tokens: number; requests: number }>;
    byOperation: Record<string, { cost: number; tokens: number; requests: number }>;
    byCreator?: Record<string, { cost: number; tokens: number; requests: number }>;
  };
}

/**
 * Cost Tracking Service for Azure OpenAI
 */
export class AzureCostTrackingService {
  private telemetryClient: TelemetryClient | null = null;
  private quotaStore: Map<string, QuotaInfo> = new Map();

  constructor(telemetryClient?: TelemetryClient) {
    this.telemetryClient = telemetryClient || null;
  }

  /**
   * Calculate cost for a completed request
   */
  calculateCost(usage: {
    promptTokens: number;
    completionTokens: number;
    model: AzureModel;
  }): number {
    const pricing = AZURE_OPENAI_PRICING[usage.model];
    if (!pricing) {
      throw new Error(`Unknown model for pricing: ${usage.model}`);
    }

    const inputCost = usage.promptTokens * pricing.input;
    const outputCost = usage.completionTokens * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Log usage metrics to Application Insights
   * Requirement 5.1: Log token usage and cost
   */
  async logUsage(
    usage: UsageMetrics,
    metadata: CostTrackingMetadata
  ): Promise<void> {
    if (!this.telemetryClient) {
      console.warn('Telemetry client not configured, skipping usage logging');
      return;
    }

    // Log as custom metric
    this.telemetryClient.trackMetric({
      name: 'azure_openai_cost',
      value: usage.estimatedCost,
      properties: {
        accountId: metadata.accountId,
        creatorId: metadata.creatorId || 'system',
        operation: metadata.operation,
        model: usage.model,
        correlationId: metadata.correlationId,
        timestamp: metadata.timestamp.toISOString(),
      },
    });

    this.telemetryClient.trackMetric({
      name: 'azure_openai_tokens',
      value: usage.totalTokens,
      properties: {
        accountId: metadata.accountId,
        creatorId: metadata.creatorId || 'system',
        operation: metadata.operation,
        model: usage.model,
        promptTokens: usage.promptTokens.toString(),
        completionTokens: usage.completionTokens.toString(),
        correlationId: metadata.correlationId,
      },
    });

    // Update quota tracking
    await this.updateQuotaUsage(metadata.accountId, usage.estimatedCost);
  }

  /**
   * Check if account has remaining quota
   * Requirement 5.4: Enforce rate limits based on quota
   */
  async checkQuota(accountId: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    const quota = this.quotaStore.get(accountId);
    
    if (!quota) {
      // No quota info, allow by default (will be set on first usage)
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }

    const allowed = quota.currentUsage < quota.monthlyLimit;
    const remaining = Math.max(0, quota.monthlyLimit - quota.currentUsage);

    return {
      allowed,
      remaining,
      limit: quota.monthlyLimit,
    };
  }

  /**
   * Update quota usage for an account
   */
  private async updateQuotaUsage(
    accountId: string,
    cost: number
  ): Promise<void> {
    const quota = this.quotaStore.get(accountId);
    
    if (quota) {
      quota.currentUsage += cost;
      this.quotaStore.set(accountId, quota);
    }
  }

  /**
   * Set quota limits for an account
   */
  setQuota(quota: QuotaInfo): void {
    this.quotaStore.set(quota.accountId, quota);
  }

  /**
   * Get quota info for an account
   */
  getQuota(accountId: string): QuotaInfo | null {
    return this.quotaStore.get(accountId) || null;
  }

  /**
   * Reset quota for an account (typically monthly)
   */
  resetQuota(accountId: string): void {
    const quota = this.quotaStore.get(accountId);
    if (quota) {
      quota.currentUsage = 0;
      quota.resetDate = this.getNextResetDate();
      this.quotaStore.set(accountId, quota);
    }
  }

  /**
   * Get next quota reset date (first day of next month)
   */
  private getNextResetDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Aggregate costs for reporting
   * Requirement 5.3: Aggregate costs by creator, model, operation
   */
  async aggregateCosts(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostAggregation> {
    // In production, this would query Application Insights
    // For now, return a mock structure
    return {
      totalCost: 0,
      totalTokens: 0,
      requestCount: 0,
      breakdown: {
        byModel: {},
        byOperation: {},
        byCreator: {},
      },
    };
  }

  /**
   * Get cost optimization recommendations
   * Requirement 5.5: Provide cost optimization recommendations
   */
  async getOptimizationRecommendations(
    accountId: string
  ): Promise<string[]> {
    const recommendations: string[] = [];
    const quota = this.quotaStore.get(accountId);

    if (!quota) {
      return recommendations;
    }

    const usagePercent = (quota.currentUsage / quota.monthlyLimit) * 100;

    if (usagePercent > 80) {
      recommendations.push(
        'Consider upgrading to a higher tier plan to avoid hitting quota limits'
      );
    }

    if (usagePercent > 50) {
      recommendations.push(
        'Review usage patterns and consider using GPT-3.5 Turbo for non-critical operations'
      );
    }

    // Add more sophisticated recommendations based on usage patterns
    recommendations.push(
      'Enable prompt caching to reduce token costs for repeated contexts'
    );

    return recommendations;
  }
}

/**
 * Singleton instance
 */
let costTrackingService: AzureCostTrackingService | null = null;

export function getCostTrackingService(
  telemetryClient?: TelemetryClient
): AzureCostTrackingService {
  if (!costTrackingService) {
    costTrackingService = new AzureCostTrackingService(telemetryClient);
  }
  return costTrackingService;
}
