/**
 * Azure Cost Reporting Service
 * Implements cost aggregation, reporting, and optimization recommendations
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 34: Implement cost reporting and analytics
 * Validates: Requirements 5.3, 5.5
 */

import { AZURE_OPENAI_MODELS, type AzureDeployment } from './azure-openai.config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CostEntry {
  id: string;
  timestamp: Date;
  accountId: string;
  creatorId?: string;
  deployment: string;
  model: string;
  tier: string;
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  success: boolean;
}

export interface CostReport {
  period: CostPeriod;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  successRate: number;
  averageCostPerRequest: number;
  byCreator: CreatorCostBreakdown[];
  byModel: ModelCostBreakdown[];
  byOperation: OperationCostBreakdown[];
  byDay: DailyCostBreakdown[];
  trends: CostTrends;
}

export type CostPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface CreatorCostBreakdown {
  creatorId: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  percentageOfTotal: number;
}

export interface ModelCostBreakdown {
  model: string;
  deployment: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  averageCostPerRequest: number;
  percentageOfTotal: number;
}

export interface OperationCostBreakdown {
  operation: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  averageCostPerRequest: number;
  percentageOfTotal: number;
}

export interface DailyCostBreakdown {
  date: Date;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
}

export interface CostTrends {
  costChangePercent: number;
  tokenChangePercent: number;
  requestChangePercent: number;
  projectedMonthlyCost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CostOptimizationRecommendation {
  id: string;
  type: OptimizationType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  potentialSavingsPercent: number;
  affectedCreators?: string[];
  affectedOperations?: string[];
  currentState: string;
  recommendedAction: string;
}

export type OptimizationType =
  | 'tier_downgrade'
  | 'model_switch'
  | 'caching_opportunity'
  | 'batch_optimization'
  | 'prompt_optimization'
  | 'usage_reduction'
  | 'quota_adjustment';

export interface CostThreshold {
  type: 'daily' | 'weekly' | 'monthly';
  limit: number;
  warningPercent: number;
  criticalPercent: number;
}

export interface CostAlert {
  id: string;
  timestamp: Date;
  type: 'warning' | 'critical' | 'exceeded';
  threshold: CostThreshold;
  currentCost: number;
  percentUsed: number;
  message: string;
}

// ============================================================================
// Cost Calculation Utilities
// ============================================================================

/**
 * Calculate cost for a request based on deployment and token usage
 */
export function calculateRequestCost(
  deployment: string,
  promptTokens: number,
  completionTokens: number
): number {
  const modelInfo = AZURE_OPENAI_MODELS[deployment as AzureDeployment];
  if (!modelInfo) return 0;

  if ('costPer1kInput' in modelInfo) {
    const inputCost = (promptTokens / 1000) * modelInfo.costPer1kInput;
    const outputCost = (completionTokens / 1000) * modelInfo.costPer1kOutput;
    return inputCost + outputCost;
  }

  if ('costPer1kTokens' in modelInfo) {
    return ((promptTokens + completionTokens) / 1000) * modelInfo.costPer1kTokens;
  }

  return 0;
}

/**
 * Get model pricing info
 */
export function getModelPricing(deployment: string): { inputCost: number; outputCost: number } | null {
  const modelInfo = AZURE_OPENAI_MODELS[deployment as AzureDeployment];
  if (!modelInfo) return null;

  if ('costPer1kInput' in modelInfo) {
    return {
      inputCost: modelInfo.costPer1kInput,
      outputCost: modelInfo.costPer1kOutput,
    };
  }

  if ('costPer1kTokens' in modelInfo) {
    return {
      inputCost: modelInfo.costPer1kTokens,
      outputCost: modelInfo.costPer1kTokens,
    };
  }

  return null;
}

// ============================================================================
// Azure Cost Reporting Service
// ============================================================================

export class AzureCostReportingService {
  private costEntries: CostEntry[] = [];
  private thresholds: CostThreshold[] = [];
  private static instance: AzureCostReportingService | null = null;

  constructor() {
    // Default thresholds
    this.thresholds = [
      { type: 'daily', limit: 100, warningPercent: 80, criticalPercent: 90 },
      { type: 'weekly', limit: 500, warningPercent: 80, criticalPercent: 90 },
      { type: 'monthly', limit: 2000, warningPercent: 80, criticalPercent: 90 },
    ];
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AzureCostReportingService {
    if (!AzureCostReportingService.instance) {
      AzureCostReportingService.instance = new AzureCostReportingService();
    }
    return AzureCostReportingService.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    AzureCostReportingService.instance = null;
  }

  /**
   * Record a cost entry
   */
  recordCost(entry: Omit<CostEntry, 'id'>): CostEntry {
    const costEntry: CostEntry = {
      ...entry,
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };

    this.costEntries.push(costEntry);
    return costEntry;
  }

  /**
   * Generate cost report for a period
   * **Feature: huntaze-ai-azure-migration, Property 16: Cost report aggregation**
   * **Validates: Requirements 5.3**
   */
  generateReport(
    entries: CostEntry[],
    period: CostPeriod,
    startDate: Date,
    endDate: Date
  ): CostReport {
    // Filter entries by date range
    const filteredEntries = entries.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const totalCost = filteredEntries.reduce((sum, e) => sum + e.cost, 0);
    const totalTokens = filteredEntries.reduce((sum, e) => sum + e.totalTokens, 0);
    const totalRequests = filteredEntries.length;
    const successfulRequests = filteredEntries.filter(e => e.success).length;

    return {
      period,
      startDate,
      endDate,
      totalCost,
      totalTokens,
      totalRequests,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      byCreator: this.aggregateByCreator(filteredEntries, totalCost),
      byModel: this.aggregateByModel(filteredEntries, totalCost),
      byOperation: this.aggregateByOperation(filteredEntries, totalCost),
      byDay: this.aggregateByDay(filteredEntries),
      trends: this.calculateTrends(filteredEntries, period),
    };
  }

  /**
   * Aggregate costs by creator
   */
  private aggregateByCreator(entries: CostEntry[], totalCost: number): CreatorCostBreakdown[] {
    const byCreator = new Map<string, { cost: number; tokens: number; count: number }>();

    for (const entry of entries) {
      const creatorId = entry.creatorId || 'unknown';
      const existing = byCreator.get(creatorId) || { cost: 0, tokens: 0, count: 0 };
      byCreator.set(creatorId, {
        cost: existing.cost + entry.cost,
        tokens: existing.tokens + entry.totalTokens,
        count: existing.count + 1,
      });
    }

    return Array.from(byCreator.entries())
      .map(([creatorId, data]) => ({
        creatorId,
        totalCost: data.cost,
        totalTokens: data.tokens,
        requestCount: data.count,
        percentageOfTotal: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Aggregate costs by model
   */
  private aggregateByModel(entries: CostEntry[], totalCost: number): ModelCostBreakdown[] {
    const byModel = new Map<string, { deployment: string; cost: number; tokens: number; count: number }>();

    for (const entry of entries) {
      const existing = byModel.get(entry.model) || { deployment: entry.deployment, cost: 0, tokens: 0, count: 0 };
      byModel.set(entry.model, {
        deployment: entry.deployment,
        cost: existing.cost + entry.cost,
        tokens: existing.tokens + entry.totalTokens,
        count: existing.count + 1,
      });
    }

    return Array.from(byModel.entries())
      .map(([model, data]) => ({
        model,
        deployment: data.deployment,
        totalCost: data.cost,
        totalTokens: data.tokens,
        requestCount: data.count,
        averageCostPerRequest: data.count > 0 ? data.cost / data.count : 0,
        percentageOfTotal: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Aggregate costs by operation
   */
  private aggregateByOperation(entries: CostEntry[], totalCost: number): OperationCostBreakdown[] {
    const byOperation = new Map<string, { cost: number; tokens: number; count: number }>();

    for (const entry of entries) {
      const existing = byOperation.get(entry.operation) || { cost: 0, tokens: 0, count: 0 };
      byOperation.set(entry.operation, {
        cost: existing.cost + entry.cost,
        tokens: existing.tokens + entry.totalTokens,
        count: existing.count + 1,
      });
    }

    return Array.from(byOperation.entries())
      .map(([operation, data]) => ({
        operation,
        totalCost: data.cost,
        totalTokens: data.tokens,
        requestCount: data.count,
        averageCostPerRequest: data.count > 0 ? data.cost / data.count : 0,
        percentageOfTotal: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Aggregate costs by day
   */
  private aggregateByDay(entries: CostEntry[]): DailyCostBreakdown[] {
    const byDay = new Map<string, { cost: number; tokens: number; count: number }>();

    for (const entry of entries) {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      const existing = byDay.get(dateKey) || { cost: 0, tokens: 0, count: 0 };
      byDay.set(dateKey, {
        cost: existing.cost + entry.cost,
        tokens: existing.tokens + entry.totalTokens,
        count: existing.count + 1,
      });
    }

    return Array.from(byDay.entries())
      .map(([dateStr, data]) => ({
        date: new Date(dateStr),
        totalCost: data.cost,
        totalTokens: data.tokens,
        requestCount: data.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate cost trends
   */
  private calculateTrends(entries: CostEntry[], period: CostPeriod): CostTrends {
    if (entries.length === 0) {
      return {
        costChangePercent: 0,
        tokenChangePercent: 0,
        requestChangePercent: 0,
        projectedMonthlyCost: 0,
        trend: 'stable',
      };
    }

    // Split entries into two halves for comparison
    const sortedEntries = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const midpoint = Math.floor(sortedEntries.length / 2);
    const firstHalf = sortedEntries.slice(0, midpoint);
    const secondHalf = sortedEntries.slice(midpoint);

    const firstHalfCost = firstHalf.reduce((sum, e) => sum + e.cost, 0);
    const secondHalfCost = secondHalf.reduce((sum, e) => sum + e.cost, 0);
    const firstHalfTokens = firstHalf.reduce((sum, e) => sum + e.totalTokens, 0);
    const secondHalfTokens = secondHalf.reduce((sum, e) => sum + e.totalTokens, 0);

    const costChangePercent = firstHalfCost > 0
      ? ((secondHalfCost - firstHalfCost) / firstHalfCost) * 100
      : 0;
    const tokenChangePercent = firstHalfTokens > 0
      ? ((secondHalfTokens - firstHalfTokens) / firstHalfTokens) * 100
      : 0;
    const requestChangePercent = firstHalf.length > 0
      ? ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
      : 0;

    // Project monthly cost based on current rate
    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const daysCovered = this.getDaysCovered(entries);
    const projectedMonthlyCost = daysCovered > 0 ? (totalCost / daysCovered) * 30 : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (costChangePercent > 10) trend = 'increasing';
    else if (costChangePercent < -10) trend = 'decreasing';

    return {
      costChangePercent,
      tokenChangePercent,
      requestChangePercent,
      projectedMonthlyCost,
      trend,
    };
  }

  /**
   * Get number of days covered by entries
   */
  private getDaysCovered(entries: CostEntry[]): number {
    if (entries.length === 0) return 0;

    const dates = entries.map(e => e.timestamp.toISOString().split('T')[0]);
    const uniqueDates = new Set(dates);
    return uniqueDates.size;
  }

  /**
   * Generate cost optimization recommendations
   * **Feature: huntaze-ai-azure-migration, Property 18: Cost optimization recommendations**
   * **Validates: Requirements 5.5**
   */
  generateOptimizationRecommendations(
    entries: CostEntry[],
    report: CostReport
  ): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Check for tier downgrade opportunities
    const tierDowngradeRec = this.checkTierDowngradeOpportunity(entries, report);
    if (tierDowngradeRec) recommendations.push(tierDowngradeRec);

    // Check for model switch opportunities
    const modelSwitchRec = this.checkModelSwitchOpportunity(entries, report);
    if (modelSwitchRec) recommendations.push(modelSwitchRec);

    // Check for caching opportunities
    const cachingRec = this.checkCachingOpportunity(entries, report);
    if (cachingRec) recommendations.push(cachingRec);

    // Check for prompt optimization opportunities
    const promptRec = this.checkPromptOptimizationOpportunity(entries, report);
    if (promptRec) recommendations.push(promptRec);

    // Check for high-cost creators
    const creatorRec = this.checkHighCostCreators(report);
    if (creatorRec) recommendations.push(creatorRec);

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Check for tier downgrade opportunities
   */
  private checkTierDowngradeOpportunity(
    entries: CostEntry[],
    report: CostReport
  ): CostOptimizationRecommendation | null {
    // Find premium tier usage that could be standard
    const premiumEntries = entries.filter(e => e.tier === 'premium');
    if (premiumEntries.length === 0) return null;

    const premiumCost = premiumEntries.reduce((sum, e) => sum + e.cost, 0);
    const premiumPercent = (premiumCost / report.totalCost) * 100;

    if (premiumPercent > 50) {
      // Estimate savings from downgrading 30% of premium to standard
      const potentialSavings = premiumCost * 0.3 * 0.5; // 50% cost reduction on 30% of traffic

      return {
        id: `rec_tier_${Date.now()}`,
        type: 'tier_downgrade',
        priority: 'high',
        title: 'Consider downgrading some premium tier usage',
        description: `${premiumPercent.toFixed(1)}% of your costs come from premium tier. Consider using standard tier for less critical operations.`,
        potentialSavings,
        potentialSavingsPercent: (potentialSavings / report.totalCost) * 100,
        affectedOperations: [...new Set(premiumEntries.map(e => e.operation))],
        currentState: `Premium tier: ${premiumPercent.toFixed(1)}% of total cost`,
        recommendedAction: 'Review operations using premium tier and downgrade non-critical ones to standard tier',
      };
    }

    return null;
  }

  /**
   * Check for model switch opportunities
   */
  private checkModelSwitchOpportunity(
    entries: CostEntry[],
    report: CostReport
  ): CostOptimizationRecommendation | null {
    // Find GPT-4 usage that could potentially use GPT-3.5
    const gpt4Entries = entries.filter(e => e.model.includes('gpt-4') && !e.model.includes('vision'));
    if (gpt4Entries.length === 0) return null;

    const gpt4Cost = gpt4Entries.reduce((sum, e) => sum + e.cost, 0);
    const gpt4Percent = (gpt4Cost / report.totalCost) * 100;

    if (gpt4Percent > 60) {
      // GPT-3.5 is roughly 10-20x cheaper
      const potentialSavings = gpt4Cost * 0.2 * 0.9; // 90% savings on 20% of traffic

      return {
        id: `rec_model_${Date.now()}`,
        type: 'model_switch',
        priority: 'medium',
        title: 'Consider GPT-3.5 for simpler tasks',
        description: `${gpt4Percent.toFixed(1)}% of costs are from GPT-4. Some tasks may work well with GPT-3.5 Turbo.`,
        potentialSavings,
        potentialSavingsPercent: (potentialSavings / report.totalCost) * 100,
        affectedOperations: [...new Set(gpt4Entries.map(e => e.operation))],
        currentState: `GPT-4 usage: ${gpt4Percent.toFixed(1)}% of total cost`,
        recommendedAction: 'Evaluate which operations can use GPT-3.5 Turbo without quality loss',
      };
    }

    return null;
  }

  /**
   * Check for caching opportunities
   */
  private checkCachingOpportunity(
    entries: CostEntry[],
    report: CostReport
  ): CostOptimizationRecommendation | null {
    // Look for repeated operations that could benefit from caching
    const operationCounts = new Map<string, number>();
    for (const entry of entries) {
      operationCounts.set(entry.operation, (operationCounts.get(entry.operation) || 0) + 1);
    }

    const highFrequencyOps = Array.from(operationCounts.entries())
      .filter(([_, count]) => count > entries.length * 0.3)
      .map(([op]) => op);

    if (highFrequencyOps.length > 0) {
      const potentialSavings = report.totalCost * 0.15; // Estimate 15% savings from caching

      return {
        id: `rec_cache_${Date.now()}`,
        type: 'caching_opportunity',
        priority: 'medium',
        title: 'Implement response caching',
        description: `High-frequency operations detected. Caching could reduce costs significantly.`,
        potentialSavings,
        potentialSavingsPercent: 15,
        affectedOperations: highFrequencyOps,
        currentState: `${highFrequencyOps.length} operations account for >30% of requests each`,
        recommendedAction: 'Implement response caching for repeated queries with similar context',
      };
    }

    return null;
  }

  /**
   * Check for prompt optimization opportunities
   */
  private checkPromptOptimizationOpportunity(
    entries: CostEntry[],
    report: CostReport
  ): CostOptimizationRecommendation | null {
    // Check average prompt token count
    const avgPromptTokens = entries.reduce((sum, e) => sum + e.promptTokens, 0) / entries.length;

    if (avgPromptTokens > 2000) {
      const potentialSavings = report.totalCost * 0.2; // Estimate 20% savings from prompt optimization

      return {
        id: `rec_prompt_${Date.now()}`,
        type: 'prompt_optimization',
        priority: 'low',
        title: 'Optimize prompt lengths',
        description: `Average prompt length is ${avgPromptTokens.toFixed(0)} tokens. Consider optimizing prompts.`,
        potentialSavings,
        potentialSavingsPercent: 20,
        currentState: `Average prompt: ${avgPromptTokens.toFixed(0)} tokens`,
        recommendedAction: 'Review and optimize prompt templates to reduce token usage',
      };
    }

    return null;
  }

  /**
   * Check for high-cost creators
   */
  private checkHighCostCreators(report: CostReport): CostOptimizationRecommendation | null {
    const topCreators = report.byCreator.filter(c => c.percentageOfTotal > 20);

    if (topCreators.length > 0) {
      return {
        id: `rec_creator_${Date.now()}`,
        type: 'usage_reduction',
        priority: 'low',
        title: 'Review high-cost creator accounts',
        description: `${topCreators.length} creator(s) account for >20% of costs each.`,
        potentialSavings: 0, // Depends on action taken
        potentialSavingsPercent: 0,
        affectedCreators: topCreators.map(c => c.creatorId),
        currentState: `Top creators: ${topCreators.map(c => `${c.creatorId} (${c.percentageOfTotal.toFixed(1)}%)`).join(', ')}`,
        recommendedAction: 'Review usage patterns and consider implementing usage limits or tier adjustments',
      };
    }

    return null;
  }

  /**
   * Check cost against thresholds
   */
  checkThresholds(currentCost: number, thresholdType: 'daily' | 'weekly' | 'monthly'): CostAlert | null {
    const threshold = this.thresholds.find(t => t.type === thresholdType);
    if (!threshold) return null;

    const percentUsed = (currentCost / threshold.limit) * 100;

    if (percentUsed >= 100) {
      return {
        id: `alert_${Date.now()}`,
        timestamp: new Date(),
        type: 'exceeded',
        threshold,
        currentCost,
        percentUsed,
        message: `${thresholdType.charAt(0).toUpperCase() + thresholdType.slice(1)} cost limit exceeded: $${currentCost.toFixed(2)} / $${threshold.limit}`,
      };
    }

    if (percentUsed >= threshold.criticalPercent) {
      return {
        id: `alert_${Date.now()}`,
        timestamp: new Date(),
        type: 'critical',
        threshold,
        currentCost,
        percentUsed,
        message: `${thresholdType.charAt(0).toUpperCase() + thresholdType.slice(1)} cost at ${percentUsed.toFixed(1)}% of limit`,
      };
    }

    if (percentUsed >= threshold.warningPercent) {
      return {
        id: `alert_${Date.now()}`,
        timestamp: new Date(),
        type: 'warning',
        threshold,
        currentCost,
        percentUsed,
        message: `${thresholdType.charAt(0).toUpperCase() + thresholdType.slice(1)} cost at ${percentUsed.toFixed(1)}% of limit`,
      };
    }

    return null;
  }

  /**
   * Set cost thresholds
   */
  setThresholds(thresholds: CostThreshold[]): void {
    this.thresholds = thresholds;
  }

  /**
   * Get current thresholds
   */
  getThresholds(): CostThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Get all cost entries (for testing)
   */
  getCostEntries(): CostEntry[] {
    return [...this.costEntries];
  }

  /**
   * Clear cost entries (for testing)
   */
  clearCostEntries(): void {
    this.costEntries = [];
  }
}

// Export singleton instance
export const azureCostReportingService = AzureCostReportingService.getInstance();
