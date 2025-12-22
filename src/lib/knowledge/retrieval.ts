// Note: This class should only be used on the server side
// For client-side, use API endpoints instead
import { getAzureEmbedding } from '../ai/providers/azure-ai';

export interface KnowledgeItem {
  id: string;
  inputText: string;
  outputText?: string;
  payload: any;
  distance: number;
  score?: number;
  revenueUsd?: number;
  conversions?: number;
  views?: number;
}

export interface RetrievalOptions {
  kind: string;
  creatorId?: number;
  niche?: string;
  platform?: string;
  language?: string;
  limit?: number;
  threshold?: number; // maximum distance for cosine similarity
}

export class KnowledgeRetrieval {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find similar knowledge items using vector search
   */
  async findSimilar(
    query: string,
    options: RetrievalOptions
  ): Promise<KnowledgeItem[]> {
    // Generate embedding for the query using Azure AI
    const embedding = await getAzureEmbedding(query);
    const embeddingString = `[${embedding.join(',')}]`;
    const limit = options.limit || 5;
    const threshold = options.threshold || 0.5; // cosine distance threshold

    // Build WHERE conditions
    const conditions = [`status = 'ACTIVE'`, `kind = '${options.kind}'`];
    const params: any[] = [embeddingString];

    if (options.creatorId) {
      conditions.push(`("creatorId" = $${params.length + 1} OR "creatorId" IS NULL)`);
      params.push(options.creatorId);
    }

    if (options.niche) {
      conditions.push(`(niche = $${params.length + 1} OR niche IS NULL)`);
      params.push(options.niche);
    }

    if (options.platform) {
      conditions.push(`(platform = $${params.length + 1} OR platform IS NULL)`);
      params.push(options.platform);
    }

    if (options.language) {
      conditions.push(`language = $${params.length + 1}`);
      params.push(options.language);
    }

    const whereClause = conditions.join(' AND ');

    const querySql = `
      SELECT
        id,
        "inputText",
        "outputText",
        payload,
        score,
        "revenueUsd",
        conversions,
        views,
        ("embedding" <=> $1::vector) AS distance
      FROM "KnowledgeBaseItem"
      WHERE ${whereClause}
      ORDER BY "embedding" <=> $1::vector
      LIMIT ${limit};
    `;

    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        inputText: string;
        outputText: string | null;
        payload: any;
        distance: number;
        score: number | null;
        revenueUsd: number | null;
        conversions: number | null;
        views: number | null;
      }>
    >(querySql, ...params);

    // Filter by threshold and transform
    return results
      .filter(item => item.distance <= threshold)
      .map(item => ({
        id: item.id,
        inputText: item.inputText,
        outputText: item.outputText || undefined,
        payload: item.payload,
        distance: item.distance,
        score: item.score || undefined,
        revenueUsd: item.revenueUsd || undefined,
        conversions: item.conversions || undefined,
        views: item.views || undefined,
      }));
  }

  /**
   * Find chat closer plays for a specific fan message
   */
  async findChatCloserPlays(
    fanMessage: string,
    creatorId?: number,
    niche?: string
  ): Promise<KnowledgeItem[]> {
    return this.findSimilar(fanMessage, {
      kind: 'CHAT_CLOSER_PLAY',
      creatorId,
      niche,
      platform: 'onlyfans',
      limit: 5,
      threshold: 0.4,
    });
  }

  /**
   * Find viral structures for content inspiration
   */
  async findViralStructures(
    idea: string,
    niche?: string,
    platform?: string
  ): Promise<KnowledgeItem[]> {
    return this.findSimilar(idea, {
      kind: 'VIRAL_STRUCTURE',
      niche,
      platform: platform || 'tiktok',
      limit: 3,
      threshold: 0.5,
    });
  }

  /**
   * Find editing rulesets for video processing
   */
  async findEditingRulesets(
    contentType: string,
    platform?: string
  ): Promise<KnowledgeItem[]> {
    return this.findSimilar(contentType, {
      kind: 'EDITING_RULESET',
      platform: platform || 'tiktok',
      limit: 3,
      threshold: 0.6,
    });
  }

  /**
   * Find analytics playbooks based on current situation
   */
  async findAnalyticsPlaybooks(
    situation: string,
    creatorId?: number
  ): Promise<KnowledgeItem[]> {
    return this.findSimilar(situation, {
      kind: 'ANALYTICS_PLAYBOOK',
      creatorId,
      limit: 5,
      threshold: 0.5,
    });
  }

  /**
   * Find trend templates for content creation
   */
  async findTrendTemplates(
    trend: string,
    niche?: string,
    platform?: string
  ): Promise<KnowledgeItem[]> {
    return this.findSimilar(trend, {
      kind: 'TREND_TEMPLATE',
      niche,
      platform: platform || 'tiktok',
      limit: 3,
      threshold: 0.5,
    });
  }

  /**
   * Update the last used timestamp and score based on feedback
   */
  async updateUsage(
    id: string,
    feedback?: {
      success?: boolean;
      revenue?: number;
      conversions?: number;
    }
  ): Promise<void> {
    const updateData: any = {
      lastUsedAt: new Date(),
    };

    if (feedback?.success) {
      // Increment score on successful usage
      updateData.score = {
        increment: 0.1,
      };
    }

    if (feedback?.revenue) {
      updateData.revenueUsd = {
        increment: feedback.revenue,
      };
    }

    if (feedback?.conversions) {
      updateData.conversions = {
        increment: feedback.conversions,
      };
    }

    await this.prisma.knowledgeBaseItem.update({
      where: { id },
      data: updateData,
    });
  }
}

// Singleton instance
// Note: Use API endpoints for client-side access instead of importing this class directly
