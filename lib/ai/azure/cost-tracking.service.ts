import { db } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

type QuotaCheckResult = {
  allowed: boolean;
  reason?: string;
};

type UsageLogPayload = {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
  model: string;
  estimatedCost: number;
};

type UsageLogMeta = {
  accountId?: string;
  creatorId?: string;
  operation?: string;
  correlationId?: string;
  timestamp?: Date;
  agentId?: string;
};

export interface CostTrackingService {
  checkQuota(accountId: string): Promise<QuotaCheckResult>;
  logUsage(usage: UsageLogPayload, meta?: UsageLogMeta): Promise<void>;
}

const log = createLogger('cost-tracking');

class PrismaCostTrackingService implements CostTrackingService {
  async checkQuota(_accountId: string): Promise<QuotaCheckResult> {
    return { allowed: true };
  }

  async logUsage(usage: UsageLogPayload, meta: UsageLogMeta = {}): Promise<void> {
    const creatorIdNum = Number(meta.creatorId);
    if (!Number.isFinite(creatorIdNum)) {
      return;
    }

    try {
      await db.usageLog.create({
        data: {
          creatorId: creatorIdNum,
          feature: meta.operation ?? 'azure_foundry',
          agentId: meta.agentId,
          model: usage.model,
          tokensInput: usage.promptTokens,
          tokensOutput: usage.completionTokens,
          costUsd: usage.estimatedCost,
        },
      });
    } catch (error) {
      log.warn('[CostTracking] Failed to persist usage log', {
        error: error instanceof Error ? error.message : String(error),
        creatorId: meta.creatorId,
        operation: meta.operation,
        correlationId: meta.correlationId,
      });
    }
  }
}

let serviceInstance: CostTrackingService | null = null;

export function getCostTrackingService(): CostTrackingService {
  if (!serviceInstance) {
    serviceInstance = new PrismaCostTrackingService();
  }
  return serviceInstance;
}

