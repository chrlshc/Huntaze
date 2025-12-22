import { PrismaClient, KnowledgeKind, KnowledgeSource } from '@prisma/client';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { knowledgeRetrieval } from './retrieval';

export interface CreateKnowledgeItemData {
  kind: KnowledgeKind;
  creatorId?: number;
  niche?: string;
  platform?: string;
  language?: string;
  title?: string;
  inputText: string;
  outputText?: string;
  payload?: any;
  source?: KnowledgeSource;
  score?: number;
  revenueUsd?: number;
  conversions?: number;
  views?: number;
  retention50?: number;
}

export class KnowledgeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new knowledge item with embedding
   */
  async createKnowledgeItem(data: CreateKnowledgeItemData) {
    // Generate embedding for the input text
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: data.inputText,
    });

    const embeddingString = `[${embedding.join(',')}]`;

    return this.prisma.knowledgeBaseItem.create({
      data: {
        ...data,
        embedding: embeddingString,
        payload: data.payload || {},
      },
    });
  }

  /**
   * Add a chat closer play from a successful conversation
   */
  async addChatCloserPlay(params: {
    creatorId: number;
    fanMessage: string;
    creatorReply: string;
    outcome: {
      revenue?: number;
      conversion?: boolean;
      platform: string;
    };
    niche?: string;
  }) {
    const payload = {
      trigger: params.fanMessage,
      response: params.creatorReply,
      outcome: params.outcome,
      extractedIntent: await this.extractIntent(params.fanMessage),
      responsePattern: await this.analyzeResponsePattern(params.creatorReply),
    };

    return this.createKnowledgeItem({
      kind: 'CHAT_CLOSER_PLAY',
      creatorId: params.creatorId,
      niche: params.niche,
      platform: params.outcome.platform,
      inputText: params.fanMessage,
      outputText: params.creatorReply,
      payload,
      source: 'USER_HISTORY',
      score: params.outcome.conversion ? 1.0 : 0.5,
      revenueUsd: params.outcome.revenue,
      conversions: params.outcome.conversion ? 1 : 0,
    });
  }

  /**
   * Add a viral structure from a successful post
   */
  async addViralStructure(params: {
    creatorId?: number;
    transcript: string;
    metrics: {
      views: number;
      likes: number;
      shares: number;
      comments: number;
      retention?: number[];
    };
    metadata: {
      platform: string;
      niche: string;
      duration: number;
      hook: string;
      cta: string;
    };
  }) {
    // Extract structure from transcript
    const structure = await this.extractViralStructure(params.transcript);
    
    const payload = {
      transcript: params.transcript,
      structure,
      metrics: params.metrics,
      metadata: params.metadata,
      performance: {
        viralCoefficient: (params.metrics.shares + params.metrics.comments) / params.metrics.views,
        engagementRate: (params.metrics.likes + params.metrics.shares + params.metrics.comments) / params.metrics.views,
      },
    };

    return this.createKnowledgeItem({
      kind: 'VIRAL_STRUCTURE',
      creatorId: params.creatorId,
      niche: params.metadata.niche,
      platform: params.metadata.platform,
      title: `Viral: ${params.metadata.hook.substring(0, 50)}...`,
      inputText: params.metadata.hook,
      outputText: structure.body,
      payload,
      source: 'USER_HISTORY',
      score: payload.performance.viralCoefficient,
      views: params.metrics.views,
      retention50: params.metrics.retention?.[params.metrics.retention.length * 0.5],
    });
  }

  /**
   * Add editing ruleset based on performance data
   */
  async addEditingRuleset(params: {
    contentType: string;
    rules: {
      maxShotLength: number;
      cutSilencesThreshold: number;
      captionStyle: string;
      pacing: number;
      punchInCadence: number;
    };
    performance: {
      retention: number;
      completion: number;
      engagement: number;
    };
    platform?: string;
  }) {
    const payload = {
      editing: params.rules,
      performance: params.performance,
      optimizedFor: params.contentType,
    };

    return this.createKnowledgeItem({
      kind: 'EDITING_RULESET',
      inputText: `Editing rules for ${params.contentType}`,
      outputText: JSON.stringify(params.rules, null, 2),
      payload,
      source: 'CURATED',
      score: params.performance.retention * params.performance.completion,
      platform: params.platform,
    });
  }

  /**
   * Add analytics playbook
   */
  async addAnalyticsPlaybook(params: {
    creatorId?: number;
    situation: string;
    action: string;
    outcome: {
      revenueChange: number;
      engagementChange: number;
      retentionChange: number;
    };
    timeframe: string;
    conditions: string[];
  }) {
    const payload = {
      trigger: params.situation,
      action: params.action,
      outcome: params.outcome,
      timeframe: params.timeframe,
      conditions: params.conditions,
      playbook: {
        when: params.situation,
        then: params.action,
        expected: params.outcome,
      },
    };

    return this.createKnowledgeItem({
      kind: 'ANALYTICS_PLAYBOOK',
      creatorId: params.creatorId,
      inputText: params.situation,
      outputText: params.action,
      payload,
      source: 'USER_HISTORY',
      score: Math.abs(params.outcome.revenueChange) / 100, // Normalize score
    });
  }

  /**
   * Add trend template
   */
  async addTrendTemplate(params: {
    trendName: string;
    structure: {
      hook: string;
      body: string[];
      cta: string;
      duration: number;
    };
    examples: string[];
    niche?: string;
    platform?: string;
    source?: 'CURATED' | 'IMPORTED' | 'PARTNER_DATA';
  }) {
    const payload = {
      template: params.structure,
      examples: params.examples,
      trendName: params.trendName,
      usage: {
        recommendedVariations: 3,
        bestTimes: [],
        hashtags: [],
      },
    };

    return this.createKnowledgeItem({
      kind: 'TREND_TEMPLATE',
      niche: params.niche,
      platform: params.platform,
      title: `Trend: ${params.trendName}`,
      inputText: params.structure.hook,
      outputText: params.structure.body.join('\n'),
      payload,
      source: params.source || 'CURATED',
    });
  }

  /**
   * Extract intent from a message using AI
   */
  private async extractIntent(message: string): Promise<string> {
    // This would use an LLM to extract intent
    // For now, return a simple classification
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'pricing_inquiry';
    }
    if (lowerMessage.includes('custom') || lowerMessage.includes('special')) {
      return 'custom_request';
    }
    if (lowerMessage.includes('video') || lowerMessage.includes('content')) {
      return 'content_request';
    }
    
    return 'general_inquiry';
  }

  /**
   * Analyze response pattern
   */
  private async analyzeResponsePattern(response: string): Promise<any> {
    // Simple pattern analysis - could be enhanced with NLP
    return {
      hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(response),
      length: response.length,
      sentences: response.split(/[.!?]+/).length,
      hasQuestion: response.includes('?'),
    };
  }

  /**
   * Extract viral structure from transcript
   */
  private async extractViralStructure(transcript: string): Promise<any> {
    // This would use AI to extract hook/body/cta structure
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
    
    return {
      hook: sentences[0] || '',
      body: sentences.slice(1, -1).join('. '),
      cta: sentences[sentences.length - 1] || '',
      sentenceCount: sentences.length,
    };
  }

  /**
   * Import knowledge items from CSV/JSON
   */
  async importKnowledgeItems(
    items: CreateKnowledgeItemData[],
    source: KnowledgeSource = 'IMPORTED'
  ) {
    const results = await Promise.allSettled(
      items.map(item => this.createKnowledgeItem({ ...item, source }))
    );

    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      errors: results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason),
    };
  }
}

// Singleton instance
export const knowledgeService = new KnowledgeService(new PrismaClient());
