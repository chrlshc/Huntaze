/**
 * AI Knowledge Network - Shared Learning System
 * 
 * Enables cross-agent learning through insight storage and retrieval
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { db as prisma } from '../prisma';

/**
 * Insight stored in the Knowledge Network
 * Requirement 7.1: Store insights with source, type, confidence, data, timestamp
 */
export type Insight = {
  id?: string;
  source: string; // Agent ID that created the insight
  type: string; // Type of insight (e.g., 'fan_preference', 'content_strategy', 'sales_tactic')
  confidence: number; // Confidence score 0-1
  data: any; // Insight-specific data
  timestamp: Date; // When the insight was created
};

/**
 * Insight with decay applied
 */
export type InsightWithDecay = Insight & {
  decayedConfidence: number;
  relevanceScore?: number;
};

/**
 * AI Knowledge Network
 * 
 * Provides shared memory for AI agents to learn from each other
 */
export class AIKnowledgeNetwork {
  /**
   * Store an insight in the network
   * Requirement 7.1: Store insight with source, type, confidence, data, timestamp
   * 
   * @param creatorId - Creator the insight is associated with
   * @param insight - Insight to store
   */
  async storeInsight(creatorId: number, insight: Insight): Promise<void> {
    await prisma.aIInsight.create({
      data: {
        creatorId,
        source: insight.source,
        type: insight.type,
        confidence: insight.confidence,
        data: insight.data,
        createdAt: insight.timestamp,
      },
    });
  }

  /**
   * Broadcast an insight to the network (alias for storeInsight)
   * Requirement 7.1: Create broadcastInsight function for cross-agent sharing
   * 
   * @param creatorId - Creator the insight is associated with
   * @param insight - Insight to broadcast
   */
  async broadcastInsight(creatorId: number, insight: Insight): Promise<void> {
    await this.storeInsight(creatorId, insight);
  }

  /**
   * Get relevant insights for a creator and type
   * Requirement 7.2: Return insights pertinent by creatorId and type
   * Requirement 7.3: Prioritize by score of confidence
   * Requirement 7.4: Apply confidence decay over time (20% reduction per 30 days)
   * 
   * @param creatorId - Creator to get insights for
   * @param type - Type of insights to retrieve
   * @param limit - Maximum number of insights to return (default: 10)
   * @returns Array of insights with decay applied, sorted by relevance
   */
  async getRelevantInsights(
    creatorId: number,
    type: string,
    limit: number = 10
  ): Promise<InsightWithDecay[]> {
    // Fetch insights from database
    const insights = await prisma.aIInsight.findMany({
      where: {
        creatorId,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2, // Fetch more than needed to account for filtering after decay
    });

    // Apply confidence decay and calculate relevance
    const now = new Date();
    const insightsWithDecay: InsightWithDecay[] = insights.map((dbInsight) => {
      const ageInDays = (now.getTime() - dbInsight.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const decayedConfidence = this.applyConfidenceDecay(dbInsight.confidence, ageInDays);

      return {
        id: dbInsight.id,
        source: dbInsight.source,
        type: dbInsight.type,
        confidence: dbInsight.confidence,
        data: dbInsight.data,
        timestamp: dbInsight.createdAt,
        decayedConfidence,
        relevanceScore: decayedConfidence, // For now, relevance = decayed confidence
      };
    });

    // Sort by relevance score (confidence × relevance)
    // Requirement 7.5: Implement insight ranking by confidence × relevance
    insightsWithDecay.sort((a, b) => {
      const scoreA = (a.relevanceScore ?? 0);
      const scoreB = (b.relevanceScore ?? 0);
      return scoreB - scoreA;
    });

    // Return top N insights
    return insightsWithDecay.slice(0, limit);
  }

  /**
   * Apply confidence decay over time
   * Requirement 7.4: Add confidence decay over time (20% reduction per 30 days)
   * 
   * Formula: decayedConfidence = originalConfidence × (0.8 ^ (ageInDays / 30))
   * 
   * @param originalConfidence - Original confidence score (0-1)
   * @param ageInDays - Age of the insight in days
   * @returns Decayed confidence score
   */
  private applyConfidenceDecay(originalConfidence: number, ageInDays: number): number {
    // 20% reduction per 30 days means multiply by 0.8 for each 30-day period
    const thirtyDayPeriods = ageInDays / 30;
    const decayFactor = Math.pow(0.8, thirtyDayPeriods);
    return originalConfidence * decayFactor;
  }

  /**
   * Get all insights for a creator (across all types)
   * 
   * @param creatorId - Creator to get insights for
   * @param limit - Maximum number of insights to return
   * @returns Array of insights with decay applied
   */
  async getAllInsights(creatorId: number, limit: number = 50): Promise<InsightWithDecay[]> {
    const insights = await prisma.aIInsight.findMany({
      where: {
        creatorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const now = new Date();
    return insights.map((dbInsight) => {
      const ageInDays = (now.getTime() - dbInsight.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const decayedConfidence = this.applyConfidenceDecay(dbInsight.confidence, ageInDays);

      return {
        id: dbInsight.id,
        source: dbInsight.source,
        type: dbInsight.type,
        confidence: dbInsight.confidence,
        data: dbInsight.data,
        timestamp: dbInsight.createdAt,
        decayedConfidence,
        relevanceScore: decayedConfidence,
      };
    });
  }

  /**
   * Delete old insights to manage storage
   * 
   * @param creatorId - Creator to clean up insights for
   * @param olderThanDays - Delete insights older than this many days
   */
  async cleanupOldInsights(creatorId: number, olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.aIInsight.deleteMany({
      where: {
        creatorId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Get insight statistics for a creator
   * 
   * @param creatorId - Creator to get stats for
   * @returns Statistics about stored insights
   */
  async getInsightStats(creatorId: number): Promise<{
    totalInsights: number;
    insightsByType: Record<string, number>;
    insightsBySource: Record<string, number>;
    averageConfidence: number;
  }> {
    const insights = await prisma.aIInsight.findMany({
      where: {
        creatorId,
      },
      select: {
        type: true,
        source: true,
        confidence: true,
      },
    });

    const insightsByType: Record<string, number> = {};
    const insightsBySource: Record<string, number> = {};
    let totalConfidence = 0;

    for (const insight of insights) {
      insightsByType[insight.type] = (insightsByType[insight.type] ?? 0) + 1;
      insightsBySource[insight.source] = (insightsBySource[insight.source] ?? 0) + 1;
      totalConfidence += insight.confidence;
    }

    return {
      totalInsights: insights.length,
      insightsByType,
      insightsBySource,
      averageConfidence: insights.length > 0 ? totalConfidence / insights.length : 0,
    };
  }
}
