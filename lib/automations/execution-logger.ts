/**
 * Execution Logger for Automations
 * Logs automation executions to the database for analytics
 * 
 * Requirements: 9.2
 * @module lib/automations/execution-logger
 */

import { PrismaClient } from '@prisma/client';
import type {
  ExecutionResult,
  ExecutionStatus,
  TriggerType
} from './types';

// Use global prisma instance or create new one
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================
// Types
// ============================================

export interface ExecutionLogEntry {
  id: string;
  automationId: string;
  triggerType: TriggerType;
  triggerData: Record<string, unknown>;
  status: ExecutionStatus;
  stepsExecuted: number;
  error: string | null;
  executedAt: Date;
  durationMs: number;
}

export interface ExecutionLogFilter {
  automationId?: string;
  userId?: number;
  status?: ExecutionStatus;
  triggerType?: TriggerType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ExecutionStats {
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  successRate: number;
  averageStepsExecuted: number;
  averageDurationMs: number;
}

// ============================================
// Execution Logger Class
// ============================================

export class ExecutionLogger {
  /**
   * Log an execution result to the database
   */
  async logExecution(
    result: ExecutionResult,
    durationMs: number = 0
  ): Promise<ExecutionLogEntry> {
    const execution = await prisma.automationExecution.create({
      data: {
        automationId: result.automationId,
        triggerType: result.triggerType,
        triggerData: result.triggerData as object,
        status: result.status,
        stepsExecuted: result.stepsExecuted,
        error: result.error || null,
        executedAt: result.executedAt,
        durationMs
      }
    });

    return this.mapToLogEntry(execution);
  }

  /**
   * Get execution logs with filtering
   */
  async getExecutions(filter: ExecutionLogFilter = {}): Promise<ExecutionLogEntry[]> {
    const where: Record<string, unknown> = {};

    if (filter.automationId) {
      where.automationId = filter.automationId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.triggerType) {
      where.triggerType = filter.triggerType;
    }

    if (filter.startDate || filter.endDate) {
      where.executedAt = {};
      if (filter.startDate) {
        (where.executedAt as Record<string, Date>).gte = filter.startDate;
      }
      if (filter.endDate) {
        (where.executedAt as Record<string, Date>).lte = filter.endDate;
      }
    }

    // If userId is provided, we need to join with automations
    if (filter.userId) {
      where.automation = { userId: filter.userId };
    }

    const executions = await prisma.automationExecution.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: filter.limit || 100,
      skip: filter.offset || 0
    });

    return executions.map(e => this.mapToLogEntry(e));
  }

  /**
   * Get execution by ID
   */
  async getExecution(id: string): Promise<ExecutionLogEntry | null> {
    const execution = await prisma.automationExecution.findUnique({
      where: { id }
    });

    if (!execution) {
      return null;
    }

    return this.mapToLogEntry(execution);
  }

  /**
   * Get execution statistics for an automation
   */
  async getStats(automationId: string): Promise<ExecutionStats> {
    const executions = await prisma.automationExecution.findMany({
      where: { automationId }
    });

    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successCount: 0,
        failedCount: 0,
        partialCount: 0,
        successRate: 0,
        averageStepsExecuted: 0,
        averageDurationMs: 0
      };
    }

    const successCount = executions.filter(e => e.status === 'success').length;
    const failedCount = executions.filter(e => e.status === 'failed').length;
    const partialCount = executions.filter(e => e.status === 'partial').length;
    const totalSteps = executions.reduce((sum, e) => sum + e.stepsExecuted, 0);
    const totalDuration = executions.reduce((sum, e) => sum + e.durationMs, 0);

    return {
      totalExecutions: executions.length,
      successCount,
      failedCount,
      partialCount,
      successRate: (successCount / executions.length) * 100,
      averageStepsExecuted: totalSteps / executions.length,
      averageDurationMs: totalDuration / executions.length
    };
  }

  /**
   * Get aggregated stats for a user's automations
   */
  async getUserStats(userId: number): Promise<ExecutionStats> {
    const executions = await prisma.automationExecution.findMany({
      where: {
        automation: { userId }
      }
    });

    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successCount: 0,
        failedCount: 0,
        partialCount: 0,
        successRate: 0,
        averageStepsExecuted: 0,
        averageDurationMs: 0
      };
    }

    const successCount = executions.filter(e => e.status === 'success').length;
    const failedCount = executions.filter(e => e.status === 'failed').length;
    const partialCount = executions.filter(e => e.status === 'partial').length;
    const totalSteps = executions.reduce((sum, e) => sum + e.stepsExecuted, 0);
    const totalDuration = executions.reduce((sum, e) => sum + e.durationMs, 0);

    return {
      totalExecutions: executions.length,
      successCount,
      failedCount,
      partialCount,
      successRate: (successCount / executions.length) * 100,
      averageStepsExecuted: totalSteps / executions.length,
      averageDurationMs: totalDuration / executions.length
    };
  }

  /**
   * Get recent executions for an automation
   */
  async getRecentExecutions(
    automationId: string,
    limit: number = 10
  ): Promise<ExecutionLogEntry[]> {
    return this.getExecutions({ automationId, limit });
  }

  /**
   * Delete old executions (for cleanup)
   */
  async deleteOldExecutions(olderThan: Date): Promise<number> {
    const result = await prisma.automationExecution.deleteMany({
      where: {
        executedAt: { lt: olderThan }
      }
    });

    return result.count;
  }

  /**
   * Map Prisma model to ExecutionLogEntry
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToLogEntry(execution: any): ExecutionLogEntry {
    return {
      id: execution.id,
      automationId: execution.automationId,
      triggerType: execution.triggerType as TriggerType,
      triggerData: execution.triggerData as Record<string, unknown>,
      status: execution.status as ExecutionStatus,
      stepsExecuted: execution.stepsExecuted,
      error: execution.error,
      executedAt: execution.executedAt,
      durationMs: execution.durationMs
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

let loggerInstance: ExecutionLogger | null = null;

/**
 * Get the singleton ExecutionLogger instance
 */
export function getExecutionLogger(): ExecutionLogger {
  if (!loggerInstance) {
    loggerInstance = new ExecutionLogger();
  }
  return loggerInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetExecutionLogger(): void {
  loggerInstance = null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create an execution callback for the AutomationEngine
 * that logs executions to the database
 */
export function createExecutionLoggerCallback(
  logger: ExecutionLogger = getExecutionLogger()
): (result: ExecutionResult) => void {
  const startTimes = new Map<string, number>();

  return (result: ExecutionResult) => {
    const startTime = startTimes.get(result.automationId) || Date.now();
    const durationMs = Date.now() - startTime;
    
    // Log asynchronously without blocking
    logger.logExecution(result, durationMs).catch(error => {
      console.error('[ExecutionLogger] Failed to log execution:', error);
    });
  };
}

/**
 * Create a start tracking callback
 */
export function createStartTrackingCallback(): (automationId: string) => void {
  const startTimes = new Map<string, number>();
  
  return (automationId: string) => {
    startTimes.set(automationId, Date.now());
  };
}
