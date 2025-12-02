/**
 * Azure AI Knowledge Network (stubbed)
 *
 * This Azure-specific implementation is disabled. It is kept only
 * so tests and imports compile. All Azure operations are no-ops
 * and data is persisted via PostgreSQL only.
 */

import type { EventGridPublisherClient } from '@azure/eventgrid';
import type { SearchClient } from '@azure/search-documents';
import { db as prisma } from '../../prisma';

/**
 * Insight stored in the Knowledge Network
 */
export type Insight = {
  id?: string;
  source: string; // Agent ID that created the insight
  type: string; // Type of insight (e.g., 'fan_preference', 'content_strategy', 'sales_tactic')
  confidence: number; // Confidence score 0-1
  data: any; // Insight-specific data
  timestamp: Date; // When the insight was created
  creatorId?: number; // Creator the insight is associated with
};

/**
 * Insight with decay applied
 */
export type InsightWithDecay = Insight & {
  decayedConfidence: number;
  relevanceScore?: number;
};

/**
 * Event Grid event for insight broadcasting
 */
interface InsightBroadcastEvent {
  id: string;
  eventType: 'Huntaze.AI.InsightBroadcast';
  subject: string;
  dataVersion: '1.0';
  data: {
    creatorId: number;
    insight: Insight;
  };
}

/**
 * Insight document for Azure Cognitive Search
 */
interface InsightDocument {
  id: string;
  creatorId: number;
  source: string;
  type: string;
  confidence: number;
  data: string; // JSON stringified
  timestamp: string; // ISO string
  embedding?: number[]; // Optional vector for semantic search
}

/**
 * Subscription handler for insight events
 */
export type InsightSubscriptionHandler = (creatorId: number, insight: Insight) => Promise<void>;

/**
 * Azure AI Knowledge Network
 * 
 * Provides event-driven shared memory for AI agents using Azure Event Grid
 */
export class AzureAIKnowledgeNetwork {
  private eventGridClient: EventGridPublisherClient | null = null;
  private searchClient: SearchClient<InsightDocument> | null = null;
  private subscriptionHandlers: Map<string, InsightSubscriptionHandler[]> = new Map();
  private topicEndpoint: string | null = null;

  constructor() {
    // Stub: Azure clients are not initialized
    this.eventGridClient = null;
    this.searchClient = null;
    this.topicEndpoint = null;
  }

  /**
   * Broadcast an insight to all agents via Azure Event Grid
   * Requirement 2.5: Knowledge Network SHALL broadcast insights to all agents via event system
   * Property 10: For any insight shared by an agent, all other agents should receive it
   * 
   * @param creatorId - Creator the insight is associated with
   * @param insight - Insight to broadcast
   */
  async broadcastInsight(creatorId: number, insight: Insight): Promise<void> {
    // Generate unique ID for the insight
    const insightId = insight.id || this.generateInsightId();
    const insightWithId: Insight = {
      ...insight,
      id: insightId,
      creatorId,
    };

    // Store insight in Azure Cognitive Search for retrieval (if configured)
    if (this.searchClient) {
      await this.storeInsightInSearch(creatorId, insightWithId);
    } else {
      console.warn('[AzureAIKnowledgeNetwork] Search client disabled - storing insight in database only');
    }

    // Also store in PostgreSQL for backup and analytics
    await this.storeInsightInDatabase(creatorId, insightWithId);

    // Broadcast via Event Grid (if configured)
    const event: InsightBroadcastEvent = {
      id: insightId,
      eventType: 'Huntaze.AI.InsightBroadcast',
      subject: `creator/${creatorId}/insight/${insight.type}`,
      dataVersion: '1.0',
      data: {
        creatorId,
        insight: insightWithId,
      },
    };

    try {
      if (this.eventGridClient) {
        await this.eventGridClient.send([event]);
      } else {
        console.warn('[AzureAIKnowledgeNetwork] Event Grid client disabled - skipping external broadcast');
      }
      
      // Trigger local subscription handlers immediately
      await this.notifyLocalSubscribers(creatorId, insightWithId);
    } catch (error) {
      console.error('Failed to broadcast insight via Event Grid:', error);
      // Still notify local subscribers even if Event Grid fails
      await this.notifyLocalSubscribers(creatorId, insightWithId);
      throw error;
    }
  }

  /**
   * Store insight in Azure Cognitive Search
   * 
   * @param creatorId - Creator the insight is associated with
   * @param insight - Insight to store
   */
  private async storeInsightInSearch(creatorId: number, insight: Insight): Promise<void> {
    if (!this.searchClient) {
      return;
    }

    const document: InsightDocument = {
      id: insight.id!,
      creatorId,
      source: insight.source,
      type: insight.type,
      confidence: insight.confidence,
      data: JSON.stringify(insight.data),
      timestamp: insight.timestamp.toISOString(),
    };

    await this.searchClient.uploadDocuments([document]);
  }

  /**
   * Store insight in PostgreSQL database (backup)
   * 
   * @param creatorId - Creator the insight is associated with
   * @param insight - Insight to store
   */
  private async storeInsightInDatabase(creatorId: number, insight: Insight): Promise<void> {
    await prisma.aIInsight.create({
      data: {
        id: insight.id,
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
   * Subscribe to insight broadcasts for a specific agent
   * 
   * @param agentId - Agent ID to subscribe
   * @param handler - Handler function to call when insights are broadcast
   */
  subscribe(agentId: string, handler: InsightSubscriptionHandler): void {
    if (!this.subscriptionHandlers.has(agentId)) {
      this.subscriptionHandlers.set(agentId, []);
    }
    this.subscriptionHandlers.get(agentId)!.push(handler);
  }

  /**
   * Unsubscribe an agent from insight broadcasts
   * 
   * @param agentId - Agent ID to unsubscribe
   */
  unsubscribe(agentId: string): void {
    this.subscriptionHandlers.delete(agentId);
  }

  /**
   * Notify local subscription handlers
   * 
   * @param creatorId - Creator the insight is associated with
   * @param insight - Insight to notify about
   */
  private async notifyLocalSubscribers(creatorId: number, insight: Insight): Promise<void> {
    const notificationPromises: Promise<void>[] = [];

    for (const [agentId, handlers] of this.subscriptionHandlers.entries()) {
      // Don't notify the source agent
      if (agentId === insight.source) {
        continue;
      }

      for (const handler of handlers) {
        notificationPromises.push(
          handler(creatorId, insight).catch(error => {
            console.error(`Failed to notify agent ${agentId}:`, error);
          })
        );
      }
    }

    await Promise.all(notificationPromises);
  }

  /**
   * Query insights from Azure Cognitive Search
   * 
   * @param creatorId - Creator to get insights for
   * @param type - Type of insights to retrieve
   * @param limit - Maximum number of insights to return
   * @returns Array of insights with decay applied
   */
  async getRelevantInsights(
    creatorId: number,
    type: string,
    limit: number = 10
  ): Promise<InsightWithDecay[]> {
    // If Azure Search is not configured, fall back to database-only retrieval
    if (!this.searchClient) {
      const dbInsights = await prisma.aIInsight.findMany({
        where: {
          creatorId,
          type,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit * 2,
      });

      const now = new Date();
      const insights: InsightWithDecay[] = dbInsights.map((insight) => {
        const ageInDays = (now.getTime() - insight.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const decayedConfidence = this.applyConfidenceDecay(insight.confidence, ageInDays);

        return {
          id: insight.id,
          source: insight.source,
          type: insight.type,
          confidence: insight.confidence,
          data: insight.data,
          timestamp: insight.createdAt,
          decayedConfidence,
          relevanceScore: decayedConfidence,
        };
      });

      insights.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
      return insights.slice(0, limit);
    }

    // Search in Azure Cognitive Search
    const searchResults = await this.searchClient.search('*', {
      filter: `creatorId eq ${creatorId} and type eq '${type}'`,
      orderBy: ['timestamp desc'],
      top: limit * 2, // Fetch more to account for decay filtering
      select: ['id', 'source', 'type', 'confidence', 'data', 'timestamp'],
    });

    const insights: InsightWithDecay[] = [];
    const now = new Date();

    for await (const result of searchResults.results) {
      const doc = result.document;
      const timestamp = new Date(doc.timestamp);
      const ageInDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const decayedConfidence = this.applyConfidenceDecay(doc.confidence, ageInDays);

      insights.push({
        id: doc.id,
        source: doc.source,
        type: doc.type,
        confidence: doc.confidence,
        data: JSON.parse(doc.data),
        timestamp,
        decayedConfidence,
        relevanceScore: decayedConfidence,
      });
    }

    // Sort by relevance score
    insights.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    return insights.slice(0, limit);
  }

  /**
   * Apply confidence decay over time
   * Formula: decayedConfidence = originalConfidence × (0.8 ^ (ageInDays / 30))
   * 
   * @param originalConfidence - Original confidence score (0-1)
   * @param ageInDays - Age of the insight in days
   * @returns Decayed confidence score
   */
  private applyConfidenceDecay(originalConfidence: number, ageInDays: number): number {
    const thirtyDayPeriods = ageInDays / 30;
    const decayFactor = Math.pow(0.8, thirtyDayPeriods);
    return originalConfidence * decayFactor;
  }

  /**
   * Generate unique insight ID
   * 
   * @returns Unique insight ID
   */
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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
    // Use database for stats (more efficient than search)
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

  /**
   * Clean up old insights from both search and database
   * 
   * @param creatorId - Creator to clean up insights for
   * @param olderThanDays - Delete insights older than this many days
   * @returns Number of insights deleted
   */
  async cleanupOldInsights(creatorId: number, olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Delete from database
    const result = await prisma.aIInsight.deleteMany({
      where: {
        creatorId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Delete from Azure Cognitive Search (if configured)
    if (this.searchClient) {
      // Note: In production, you'd want to batch this
      const searchResults = await this.searchClient.search('*', {
        filter: `creatorId eq ${creatorId} and timestamp lt ${cutoffDate.toISOString()}`,
        select: ['id'],
      });

      const idsToDelete: string[] = [];
      for await (const result of searchResults.results) {
        idsToDelete.push(result.document.id);
      }

      if (idsToDelete.length > 0) {
        await this.searchClient.deleteDocuments('id', idsToDelete);
      }
    } else {
      console.warn('[AzureAIKnowledgeNetwork] Search client disabled - skipping Azure Search cleanup');
    }

    return result.count;
  }
}
