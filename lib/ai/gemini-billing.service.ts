/**
 * Gemini Billing Service - Cost tracking and usage logging
 * 
 * Handles cost calculation and usage logging for all Gemini API calls
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { generateTextRaw, generateStructuredOutputRaw, GeminiUsageMetadata } from './gemini-client';
import { db as prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';

export type GeminiPricing = {
  inputPricePerMTokens: number;
  outputPricePerMTokens: number;
};

/**
 * Model pricing table (Requirement 3.3)
 * Prices are per million tokens in USD
 */
export const MODEL_PRICING: Record<string, GeminiPricing> = {
  'gemini-2.0-flash-exp': {
    inputPricePerMTokens: 0,
    outputPricePerMTokens: 0,
  },
  'gemini-2.5-pro': {
    inputPricePerMTokens: 1.25,
    outputPricePerMTokens: 10,
  },
  'gemini-2.5-flash': {
    inputPricePerMTokens: 0.3,
    outputPricePerMTokens: 2.5,
  },
  'gemini-2.5-flash-lite': {
    inputPricePerMTokens: 0.1,
    outputPricePerMTokens: 0.4,
  },
  default: {
    inputPricePerMTokens: 0.5,
    outputPricePerMTokens: 2,
  },
};

function getPricing(model: string): GeminiPricing {
  return MODEL_PRICING[model] ?? MODEL_PRICING.default;
}

/**
 * Calculate cost in USD based on token usage
 * Requirement 3.1: Calculate cost based on tokens input/output
 * Requirement 3.3: Use correct pricing per model
 */
export function computeCostUSD(model: string, usage: GeminiUsageMetadata) {
  const pricing = getPricing(model);
  const inputTokens = usage.promptTokenCount ?? 0;
  const outputTokens = usage.candidatesTokenCount ?? 0;

  const inputCost =
    (inputTokens / 1_000_000) * pricing.inputPricePerMTokens;
  const outputCost =
    (outputTokens / 1_000_000) * pricing.outputPricePerMTokens;

  return {
    inputTokens,
    outputTokens,
    costUsd: inputCost + outputCost,
  };
}

export type GeminiCallMetadata = {
  creatorId: number;
  feature: string;
  agentId?: string;
};

export async function generateTextWithBilling(params: {
  prompt: string;
  metadata: GeminiCallMetadata;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  const { prompt, metadata, model, temperature, maxOutputTokens } = params;

  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: prompt }],
    },
  ];

  const { model: usedModel, text, usageMetadata } = await generateTextRaw({
    model,
    contents,
    config: {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxOutputTokens ?? 1024,
    },
  });

  const { inputTokens, outputTokens, costUsd } = computeCostUSD(
    usedModel,
    usageMetadata,
  );

  // Log to database (Requirement 3.2)
  await prisma.usageLog.create({
    data: {
      creatorId: metadata.creatorId,
      feature: metadata.feature,
      agentId: metadata.agentId,
      model: usedModel,
      tokensInput: inputTokens,
      tokensOutput: outputTokens,
      costUsd,
    },
  });

  return {
    text,
    usage: {
      model: usedModel,
      inputTokens,
      outputTokens,
      costUsd,
    },
  };
}

/**
 * Generate structured output with billing
 * 
 * Requirements:
 * - 10.1: Support structured outputs
 * - 10.2: Support JSON schema validation
 * - 3.2: Log usage to database
 */
export async function generateStructuredOutput<T>(
  prompt: string,
  schema: any,
  metadata: GeminiCallMetadata,
  config?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }
) {
  const { model, text, usageMetadata, parsed } = await generateStructuredOutputRaw<T>({
    model: config?.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-pro',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    schema,
    config: {
      temperature: config?.temperature,
      maxOutputTokens: config?.maxOutputTokens,
    },
  });

  const { inputTokens, outputTokens, costUsd } = computeCostUSD(
    model,
    usageMetadata,
  );

  // Log to database (Requirement 3.2)
  await prisma.usageLog.create({
    data: {
      creatorId: metadata.creatorId,
      feature: metadata.feature,
      agentId: metadata.agentId,
      model,
      tokensInput: inputTokens,
      tokensOutput: outputTokens,
      costUsd,
    },
  });

  return {
    data: parsed,
    usage: {
      model,
      inputTokens,
      outputTokens,
      costUsd,
    },
  };
}

/**
 * Aggregate monthly charges for a creator
 * Requirement 3.4: Aggregate costs monthly per creator
 * Requirement 3.5: Return detailed statistics by feature and agent
 */
export async function aggregateMonthlyCharges(
  creatorId: number,
  month: Date
): Promise<{
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCostUsd: number;
}> {
  // Get start and end of month
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);

  // Aggregate usage logs for the month
  const result = await prisma.usageLog.aggregate({
    where: {
      creatorId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      tokensInput: true,
      tokensOutput: true,
      costUsd: true,
    },
  });

  return {
    totalTokensInput: result._sum.tokensInput ?? 0,
    totalTokensOutput: result._sum.tokensOutput ?? 0,
    totalCostUsd: Number(result._sum.costUsd ?? 0),
  };
}

/**
 * Create or update monthly charge record
 * Requirement 3.4: Store monthly aggregations
 */
export async function upsertMonthlyCharge(
  creatorId: number,
  month: Date,
  planPrice: number
): Promise<void> {
  const aggregated = await aggregateMonthlyCharges(creatorId, month);
  
  // Normalize month to start of month for consistency
  const normalizedMonth = new Date(month.getFullYear(), month.getMonth(), 1);

  await prisma.monthlyCharge.upsert({
    where: {
      creatorId_month: {
        creatorId,
        month: normalizedMonth,
      },
    },
    create: {
      creatorId,
      month: normalizedMonth,
      totalTokensInput: aggregated.totalTokensInput,
      totalTokensOutput: aggregated.totalTokensOutput,
      totalCostUsd: new Decimal(aggregated.totalCostUsd),
      planPrice: new Decimal(planPrice),
    },
    update: {
      totalTokensInput: aggregated.totalTokensInput,
      totalTokensOutput: aggregated.totalTokensOutput,
      totalCostUsd: new Decimal(aggregated.totalCostUsd),
      planPrice: new Decimal(planPrice),
    },
  });
}

/**
 * Get usage statistics for a creator
 * Requirement 3.5: Return detailed statistics by feature and agent
 */
export async function getCreatorUsageStats(
  creatorId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCost: number;
  byFeature: Record<string, { cost: number; tokens: number }>;
  byAgent: Record<string, { cost: number; tokens: number }>;
}> {
  const where: any = { creatorId };
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const logs = await prisma.usageLog.findMany({ where });

  const byFeature: Record<string, { cost: number; tokens: number }> = {};
  const byAgent: Record<string, { cost: number; tokens: number }> = {};
  let totalCost = 0;

  for (const log of logs) {
    const cost = Number(log.costUsd);
    const tokens = log.tokensInput + log.tokensOutput;
    
    totalCost += cost;

    // Aggregate by feature
    if (!byFeature[log.feature]) {
      byFeature[log.feature] = { cost: 0, tokens: 0 };
    }
    byFeature[log.feature].cost += cost;
    byFeature[log.feature].tokens += tokens;

    // Aggregate by agent
    if (log.agentId) {
      if (!byAgent[log.agentId]) {
        byAgent[log.agentId] = { cost: 0, tokens: 0 };
      }
      byAgent[log.agentId].cost += cost;
      byAgent[log.agentId].tokens += tokens;
    }
  }

  return {
    totalCost,
    byFeature,
    byAgent,
  };
}
