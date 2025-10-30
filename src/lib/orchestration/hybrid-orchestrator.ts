/**
 * Hybrid Orchestrator - Azure + OpenAI + AWS Integration
 * 
 * Coordonne intelligemment entre:
 * - Azure OpenAI (content planning, multi-platform)
 * - OpenAI direct (chat, validation, compliance)
 * - AWS Fargate (browser automation)
 * - OnlyFans Gateway (messaging)
 * 
 * @module hybrid-orchestrator
 */

import { azurePlannerAgent, PlannedContent } from '@/src/lib/agents/azure-planner';
import { AIRouter } from '@/lib/services/ai-router';
import { OnlyFansGateway } from '@/lib/services/onlyfans/gateway';
import { MultiLayerRateLimiter } from '@/lib/services/multi-layer-rate-limiter';

export interface WorkflowIntent {
  type: 'content_planning' | 'message_automation' | 'campaign_execution' | 'content_validation';
  userId: string;
  platforms?: string[];
  contentType?: string;
  data?: any;
  sendToOnlyFans?: boolean;
  recipientId?: string;
  requiresMultiPlatform?: boolean;
  forceProvider?: 'azure' | 'openai';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowResult {
  success: boolean;
  contentGenerated?: any;
  messageSent?: any;
  duration: number;
  provider: 'azure' | 'openai' | 'hybrid';
  error?: string;
  retryAfter?: number;
  metrics?: {
    aiTokensUsed: number;
    aiCost: number;
    rateLimitHits: number;
  };
}

export class HybridOrchestrator {
  constructor(
    private aiRouter: AIRouter,
    private ofGateway: OnlyFansGateway,
    private rateLimiter?: MultiLayerRateLimiter
  ) {}

  /**
   * Exécute un workflow en routant intelligemment entre Azure et OpenAI
   */
  async executeWorkflow(userId: string, intent: WorkflowIntent): Promise<WorkflowResult> {
    const startTime = Date.now();
    let provider: 'azure' | 'openai' | 'hybrid' = 'hybrid';

    try {
      // 1. Router vers le bon provider AI
      let contentResult;
      
      if (this.shouldUseAzure(intent)) {
        provider = 'azure';
        contentResult = await this.executeWithAzure(userId, intent);
      } else {
        provider = 'openai';
        contentResult = await this.executeWithOpenAI(userId, intent);
      }

      // 2. Si besoin d'envoyer sur OnlyFans
      let messageSent;
      if (intent.sendToOnlyFans && intent.recipientId) {
        messageSent = await this.sendToOnlyFans(
          userId,
          intent.recipientId,
          contentResult.content || contentResult.text
        );
      }

      return {
        success: true,
        contentGenerated: contentResult,
        messageSent,
        duration: Date.now() - startTime,
        provider,
        metrics: {
          aiTokensUsed: contentResult.tokensUsed || 0,
          aiCost: contentResult.cost || 0,
          rateLimitHits: 0
        }
      };

    } catch (error) {
      console.error('Workflow failed:', error);

      // Fallback strategy: si Azure fail → essayer OpenAI
      if (provider === 'azure' && !intent.forceProvider) {
        console.log('Azure failed, falling back to OpenAI...');
        
        try {
          const fallbackResult = await this.executeWithOpenAI(userId, {
            ...intent,
            forceProvider: 'openai'
          });

          return {
            success: true,
            contentGenerated: fallbackResult,
            duration: Date.now() - startTime,
            provider: 'openai',
            metrics: {
              aiTokensUsed: fallbackResult.tokensUsed || 0,
              aiCost: fallbackResult.cost || 0,
              rateLimitHits: 0
            }
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: `Both providers failed: ${error.message} | ${fallbackError.message}`,
            duration: Date.now() - startTime,
            provider: 'hybrid'
          };
        }
      }

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        provider,
        retryAfter: error.retryAfter
      };
    }
  }

  /**
   * Détermine si on doit utiliser Azure ou OpenAI
   */
  private shouldUseAzure(intent: WorkflowIntent): boolean {
    // Force provider si spécifié
    if (intent.forceProvider === 'azure') return true;
    if (intent.forceProvider === 'openai') return false;

    // Règles de routage intelligent
    const azureOptimalTasks = [
      'content_planning',
      'campaign_execution'
    ];

    const requiresMultiPlatform = intent.requiresMultiPlatform || 
      (intent.platforms && intent.platforms.length > 1);

    // Azure est meilleur pour:
    // - Content planning multi-plateforme
    // - Campagnes complexes
    // - Quand on a plusieurs plateformes
    return azureOptimalTasks.includes(intent.type) || requiresMultiPlatform;
  }

  /**
   * Exécute avec Azure OpenAI
   */
  private async executeWithAzure(userId: string, intent: WorkflowIntent): Promise<any> {
    console.log(`[HybridOrchestrator] Using Azure for ${intent.type}`);

    if (intent.type === 'content_planning') {
      // Utiliser ton Azure Planner existant
      const planResult = await azurePlannerAgent({
        platforms: intent.platforms || ['instagram'],
        period: 'weekly', // ou basé sur intent
        userId
      });

      return {
        content: planResult.contents,
        platforms: planResult.platforms,
        tokensUsed: 150, // Estimation
        cost: 0.002,
        provider: 'azure'
      };
    }

    // Pour autres types, utiliser Azure OpenAI direct
    const { callAzureOpenAI } = await import('@/src/lib/ai/providers/azure');
    
    const result = await callAzureOpenAI({
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(intent.type)
        },
        {
          role: 'user',
          content: this.formatUserPrompt(intent)
        }
      ],
      temperature: 0.7,
      maxTokens: 500
    });

    return {
      content: result.content,
      tokensUsed: result.usage.total,
      cost: this.calculateAzureCost(result.usage.total),
      provider: 'azure'
    };
  }

  /**
   * Exécute avec OpenAI direct
   */
  private async executeWithOpenAI(userId: string, intent: WorkflowIntent): Promise<any> {
    console.log(`[HybridOrchestrator] Using OpenAI for ${intent.type}`);

    const routingDecision = this.aiRouter.routeAIRequest({
      taskType: this.mapIntentToTaskType(intent.type),
      complexityScore: this.calculateComplexity(intent),
      isCritical: intent.priority === 'critical',
      requiresReasoning: intent.type === 'content_validation'
    });

    // Simuler l'appel OpenAI (tu peux intégrer ton vrai client ici)
    const result = await this.callOpenAI(routingDecision.model, intent);

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      provider: 'openai',
      model: routingDecision.model
    };
  }

  /**
   * Envoie un message via OnlyFans avec rate limiting
   */
  private async sendToOnlyFans(
    userId: string,
    recipientId: string,
    content: string
  ): Promise<any> {
    // Vérifier rate limits si disponible
    if (this.rateLimiter) {
      const rateLimitCheck = await this.rateLimiter.checkLimit(userId, 'message');
      
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded: ${rateLimitCheck.layer}`);
      }

      // Si throttled, attendre
      if (rateLimitCheck.throttled && rateLimitCheck.delayMs) {
        await this.sleep(rateLimitCheck.delayMs);
      }
    }

    // Envoyer via gateway
    const result = await this.ofGateway.sendMessage(recipientId, content, {
      userId,
      timestamp: new Date().toISOString()
    });

    // Enregistrer le succès/échec pour rate limiting
    if (this.rateLimiter) {
      if (result.success) {
        await this.rateLimiter.recordSuccess('message');
      } else {
        await this.rateLimiter.recordFailure('message', result.error);
      }
    }

    return result;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private getSystemPrompt(type: string): string {
    const prompts = {
      content_planning: 'You are a content planning expert. Create engaging content ideas.',
      message_automation: 'You are a messaging expert. Create personalized messages.',
      content_validation: 'You are a content moderator. Validate content for compliance.',
      campaign_execution: 'You are a campaign manager. Execute marketing campaigns.'
    };

    return prompts[type] || 'You are a helpful AI assistant.';
  }

  private formatUserPrompt(intent: WorkflowIntent): string {
    return `Task: ${intent.type}
User ID: ${intent.userId}
Platforms: ${intent.platforms?.join(', ') || 'general'}
Content Type: ${intent.contentType || 'general'}
Data: ${JSON.stringify(intent.data || {})}`;
  }

  private mapIntentToTaskType(intentType: string): any {
    const mapping = {
      content_planning: 'marketing_template',
      message_automation: 'chatbot',
      content_validation: 'compliance',
      campaign_execution: 'strategy'
    };

    return mapping[intentType] || 'basic_analytics';
  }

  private calculateComplexity(intent: WorkflowIntent): number {
    let complexity = 3; // Base

    if (intent.requiresMultiPlatform) complexity += 2;
    if (intent.platforms && intent.platforms.length > 2) complexity += 1;
    if (intent.priority === 'critical') complexity += 2;
    if (intent.data && Object.keys(intent.data).length > 5) complexity += 1;

    return Math.min(complexity, 10);
  }

  private calculateAzureCost(tokens: number): number {
    // Prix approximatif Azure OpenAI (plus bas qu'OpenAI direct)
    const pricePerToken = 0.000015; // $0.015 per 1K tokens
    return tokens * pricePerToken;
  }

  private async callOpenAI(model: string, intent: WorkflowIntent): Promise<any> {
    // Simuler l'appel OpenAI - tu peux intégrer ton vrai client ici
    const estimatedTokens = 200 + (intent.data ? JSON.stringify(intent.data).length / 4 : 0);
    
    return {
      content: `Generated content for ${intent.type} using ${model}`,
      tokensUsed: estimatedTokens,
      cost: model === 'gpt-4o-mini' ? estimatedTokens * 0.00015 : estimatedTokens * 0.03
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory pour créer l'orchestrateur avec les bonnes dépendances
 */
export class HybridOrchestratorFactory {
  static create(
    aiRouter: AIRouter,
    ofGateway: OnlyFansGateway,
    rateLimiter?: MultiLayerRateLimiter
  ): HybridOrchestrator {
    return new HybridOrchestrator(aiRouter, ofGateway, rateLimiter);
  }

  static createWithDefaults(): HybridOrchestrator {
    // Créer avec des instances par défaut
    const aiRouter = new AIRouter();
    const ofGateway = new OnlyFansGateway();
    
    return new HybridOrchestrator(aiRouter, ofGateway);
  }
}

/**
 * Utilitaires pour monitoring et debugging
 */
export class OrchestratorMetrics {
  private static metrics = new Map<string, number>();

  static recordExecution(provider: string, duration: number, success: boolean): void {
    const key = `${provider}_${success ? 'success' : 'failure'}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    this.metrics.set(`${provider}_avg_duration`, duration);
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static resetMetrics(): void {
    this.metrics.clear();
  }
}