/**
 * Automation Analytics Service
 * Provides metrics, trends, and comparisons for automations
 * 
 * Requirements: 9.1, 9.3, 9.4
 * @module lib/automations/automation-analytics
 */

import { PrismaClient } from '@prisma/client';
import type {
  ExecutionStatus,
  TriggerType,
  ExecutionMetrics
} from './types';

// Use global prisma instance or create new one
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================
// Types
// ============================================

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface TrendDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  executions: number;
  successCount: number;
  failedCount: number;
  successRate: number;
}

export interface AutomationComparison {
  automationId: string;
  name: string;
  metrics: ExecutionMetrics;
  rank: number;
}

export interface TriggerBreakdown {
  triggerType: TriggerType;
  count: number;
  percentage: number;
  successRate: number;
}

export interface AnalyticsSummary {
  metrics: ExecutionMetrics;
  trends: TrendDataPoint[];
  triggerBreakdown: TriggerBreakdown[];
  topPerformers: AutomationComparison[];
}


// ============================================
// Analytics Service Class
// ============================================

export class AutomationAnalyticsService {
  /**
   * Get execution metrics for a specific automation
   * Requirements: 9.1
   */
  async getExecutionMetrics(automationId: string): Promise<ExecutionMetrics> {
    const executions = await prisma.automationExecution.findMany({
      where: { automationId }
    });

    return this.calculateMetrics(executions);
  }

  /**
   * Get execution metrics for all automations of a user
   * Requirements: 9.1
   */
  async getUserExecutionMetrics(userId: number): Promise<ExecutionMetrics> {
    const executions = await prisma.automationExecution.findMany({
      where: {
        automation: { userId }
      }
    });

    return this.calculateMetrics(executions);
  }

  /**
   * Get execution trends over time
   * Requirements: 9.3
   */
  async getTrends(
    userId: number,
    timeRange: TimeRange,
    automationId?: string
  ): Promise<TrendDataPoint[]> {
    const where: Record<string, unknown> = {
      executedAt: {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      }
    };

    if (automationId) {
      where.automationId = automationId;
    } else {
      where.automation = { userId };
    }

    const executions = await prisma.automationExecution.findMany({
      where,
      orderBy: { executedAt: 'asc' }
    });

    // Group by date
    const groupedByDate = new Map<string, typeof executions>();
    
    for (const execution of executions) {
      const dateKey = execution.executedAt.toISOString().split('T')[0];
      const existing = groupedByDate.get(dateKey) || [];
      existing.push(execution);
      groupedByDate.set(dateKey, existing);
    }

    // Calculate trends for each date
    const trends: TrendDataPoint[] = [];
    
    for (const [date, dayExecutions] of groupedByDate) {
      const successCount = dayExecutions.filter(e => e.status === 'success').length;
      const failedCount = dayExecutions.filter(e => e.status === 'failed').length;
      
      trends.push({
        date,
        executions: dayExecutions.length,
        successCount,
        failedCount,
        successRate: dayExecutions.length > 0 
          ? (successCount / dayExecutions.length) * 100 
          : 0
      });
    }

    return trends;
  }

  /**
   * Compare multiple automations by performance
   * Requirements: 9.4
   */
  async compareAutomations(
    userId: number,
    automationIds?: string[]
  ): Promise<AutomationComparison[]> {
    // Get automations
    const where: Record<string, unknown> = { userId };
    if (automationIds && automationIds.length > 0) {
      where.id = { in: automationIds };
    }

    const automations = await prisma.automation.findMany({
      where,
      include: {
        executions: true
      }
    });

    // Calculate metrics for each automation
    const comparisons: AutomationComparison[] = automations.map(automation => ({
      automationId: automation.id,
      name: automation.name,
      metrics: this.calculateMetrics(automation.executions)
    })).map((c, _, arr) => ({
      ...c,
      rank: 0 // Will be calculated below
    }));

    // Sort by success rate (descending) and assign ranks
    comparisons.sort((a, b) => b.metrics.successRate - a.metrics.successRate);
    comparisons.forEach((c, index) => {
      c.rank = index + 1;
    });

    return comparisons;
  }


  /**
   * Get breakdown by trigger type
   * Requirements: 9.1
   */
  async getTriggerBreakdown(
    userId: number,
    timeRange?: TimeRange
  ): Promise<TriggerBreakdown[]> {
    const where: Record<string, unknown> = {
      automation: { userId }
    };

    if (timeRange) {
      where.executedAt = {
        gte: timeRange.startDate,
        lte: timeRange.endDate
      };
    }

    const executions = await prisma.automationExecution.findMany({ where });

    // Group by trigger type
    const byTrigger = new Map<TriggerType, typeof executions>();
    
    for (const execution of executions) {
      const triggerType = execution.triggerType as TriggerType;
      const existing = byTrigger.get(triggerType) || [];
      existing.push(execution);
      byTrigger.set(triggerType, existing);
    }

    const total = executions.length;
    const breakdown: TriggerBreakdown[] = [];

    for (const [triggerType, triggerExecutions] of byTrigger) {
      const successCount = triggerExecutions.filter(e => e.status === 'success').length;
      
      breakdown.push({
        triggerType,
        count: triggerExecutions.length,
        percentage: total > 0 ? (triggerExecutions.length / total) * 100 : 0,
        successRate: triggerExecutions.length > 0 
          ? (successCount / triggerExecutions.length) * 100 
          : 0
      });
    }

    // Sort by count descending
    breakdown.sort((a, b) => b.count - a.count);

    return breakdown;
  }

  /**
   * Get full analytics summary
   * Requirements: 9.1, 9.3, 9.4
   */
  async getAnalyticsSummary(
    userId: number,
    timeRange: TimeRange
  ): Promise<AnalyticsSummary> {
    const [metrics, trends, triggerBreakdown, comparisons] = await Promise.all([
      this.getUserExecutionMetrics(userId),
      this.getTrends(userId, timeRange),
      this.getTriggerBreakdown(userId, timeRange),
      this.compareAutomations(userId)
    ]);

    // Get top 5 performers
    const topPerformers = comparisons.slice(0, 5);

    return {
      metrics,
      trends,
      triggerBreakdown,
      topPerformers
    };
  }

  /**
   * Calculate metrics from execution records
   */
   
  private calculateMetrics(executions: any[]): ExecutionMetrics {
    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successCount: 0,
        failedCount: 0,
        partialCount: 0,
        successRate: 0,
        averageStepsExecuted: 0
      };
    }

    const successCount = executions.filter(e => e.status === 'success').length;
    const failedCount = executions.filter(e => e.status === 'failed').length;
    const partialCount = executions.filter(e => e.status === 'partial').length;
    const totalSteps = executions.reduce((sum, e) => sum + e.stepsExecuted, 0);

    return {
      totalExecutions: executions.length,
      successCount,
      failedCount,
      partialCount,
      successRate: (successCount / executions.length) * 100,
      averageStepsExecuted: totalSteps / executions.length
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

let serviceInstance: AutomationAnalyticsService | null = null;

/**
 * Get the singleton AutomationAnalyticsService instance
 */
export function getAutomationAnalyticsService(): AutomationAnalyticsService {
  if (!serviceInstance) {
    serviceInstance = new AutomationAnalyticsService();
  }
  return serviceInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetAutomationAnalyticsService(): void {
  serviceInstance = null;
}

// ============================================
// Pure Functions for Testing
// ============================================

/**
 * Calculate metrics from execution data (pure function for property testing)
 */
export function calculateMetricsFromData(
  executions: Array<{ status: ExecutionStatus; stepsExecuted: number }>
): ExecutionMetrics {
  if (executions.length === 0) {
    return {
      totalExecutions: 0,
      successCount: 0,
      failedCount: 0,
      partialCount: 0,
      successRate: 0,
      averageStepsExecuted: 0
    };
  }

  const successCount = executions.filter(e => e.status === 'success').length;
  const failedCount = executions.filter(e => e.status === 'failed').length;
  const partialCount = executions.filter(e => e.status === 'partial').length;
  const totalSteps = executions.reduce((sum, e) => sum + e.stepsExecuted, 0);

  return {
    totalExecutions: executions.length,
    successCount,
    failedCount,
    partialCount,
    successRate: (successCount / executions.length) * 100,
    averageStepsExecuted: totalSteps / executions.length
  };
}

/**
 * Validate that metrics are consistent (pure function for property testing)
 */
export function validateMetricsConsistency(metrics: ExecutionMetrics): boolean {
  // Total must equal sum of status counts
  const sumOfCounts = metrics.successCount + metrics.failedCount + metrics.partialCount;
  if (metrics.totalExecutions !== sumOfCounts) {
    return false;
  }

  // Success rate must be between 0 and 100
  if (metrics.successRate < 0 || metrics.successRate > 100) {
    return false;
  }

  // If total is 0, success rate must be 0
  if (metrics.totalExecutions === 0 && metrics.successRate !== 0) {
    return false;
  }

  // Success rate must match calculation
  if (metrics.totalExecutions > 0) {
    const expectedRate = (metrics.successCount / metrics.totalExecutions) * 100;
    if (Math.abs(metrics.successRate - expectedRate) > 0.001) {
      return false;
    }
  }

  // Average steps must be non-negative
  if (metrics.averageStepsExecuted < 0) {
    return false;
  }

  // All counts must be non-negative
  if (metrics.successCount < 0 || metrics.failedCount < 0 || metrics.partialCount < 0) {
    return false;
  }

  return true;
}
