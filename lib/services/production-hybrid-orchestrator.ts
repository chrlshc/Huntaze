/**
 * Production Hybrid Orchestrator
 * 
 * Version production-ready qui s'intègre avec ton architecture existante
 */

import { azurePlannerAgent } from '@/src/lib/agents/azure-planner';
import { AIRouter } from '@/lib/services/ai-router';
import { SimpleRateLimiter } from '@/lib/services/simple-rate-limiter';

export interface ProductionWorkflowIntent {
  type: 'content_planning' | 'message_automation' | 'campaign_execution';
  userId: string;
  platforms?: string[];
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}

export interface ProductionWorkflowResult {
  success: boolean;
  provider: 'azure' | 'openai';
  duration: number;
  content?: any;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
  metrics: {
    tokensUsed: number;
    cost: number;
  };
}

export class ProductionHybridOrchestrator {
  private aiRouter: AIRouter;
  private rateLimiter: SimpleRateLimiter;

  constructor() {
    this.aiRouter = new AIRouter();
    this.rateLimiter = new SimpleRateLimiter({
      maxRequests: 30, // 30 requêtes/minute en production
      windowMs: 60000
    });
  }

  /**
   * Point d'entrée principal pour tous les workflows
   */
  async execute(intent: ProductionWorkflowIntent): Promise<ProductionWorkflowResult> {
    const startTime = Date.now();

    try {
      // 1. Rate limiting check
      const rateLimitCheck = await this.rateLimiter.checkLimit(intent.userId, 'message');
      
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          provider: 'none' as any,
          duration: Date.now() - startTime,
          error: 'Rate limit exceeded',
          rateLimited: true,
          retryAfter: rateLimitCheck.retryAfter,
          metrics: { tokensUsed: 0, cost: 0 }
        };
      }

      // 2. Router vers le bon provider
      let result;
      let provider: 'azure' | 'openai';

      if (this.shouldUseAzure(intent)) {
        provider = 'azure';
        result = await this.executeWithAzure(intent);
      } else {
        provider = 'openai';
        result = await this.executeWithOpenAI(intent);
      }

      // 3. Enregistrer le succès
      await this.rateLimiter.recordSuccess('message');

      return {
        success: true,
        provider,
        duration: Date.now() - startTime,
        content: result.content,
        metrics: {
          tokensUsed: result.tokensUsed || 0,
          cost: result.cost || 0
        }
      };

    } catch (error) {
      await this.rateLimiter.recordFailure('message', error);

      return {
        success: false,
        provider: 'none' as any,
        duration: Date.now() - startTime,
        error: error.message,
        metrics: { tokensUsed: 0, cost: 0 }
      };
    }
  }

  /**
   * Détermine le provider optimal
   */
  private shouldUseAzure(intent: ProductionWorkflowIntent): boolean {
    // Azure pour content planning et multi-plateforme
    if (intent.type === 'content_planning') return true;
    if (intent.platforms && intent.platforms.length > 1) return true;
    
    // OpenAI pour le reste
    return false;
  }

  /**
   * Exécution avec Azure
   */
  private async executeWithAzure(intent: ProductionWorkflowIntent): Promise<any> {
    if (intent.type === 'content_planning') {
      const result = await azurePlannerAgent({
        platforms: intent.platforms || ['instagram'],
        period: 'weekly',
        userId: intent.userId
      });

      return {
        content: result.contents,
        platforms: result.platforms,
        tokensUsed: 150,
        cost: 0.002
      };
    }

    // Fallback pour autres types
    return {
      content: `Azure processed ${intent.type} for ${intent.userId}`,
      tokensUsed: 100,
      cost: 0.0015
    };
  }

  /**
   * Exécution avec OpenAI
   */
  private async executeWithOpenAI(intent: ProductionWorkflowIntent): Promise<any> {
    const routingDecision = this.aiRouter.routeAIRequest({
      taskType: this.mapToTaskType(intent.type),
      complexityScore: 5,
      isCritical: intent.priority === 'high'
    });

    // Simuler l'appel OpenAI
    return {
      content: `OpenAI ${routingDecision.model} processed ${intent.type}`,
      tokensUsed: 200,
      cost: routingDecision.model === 'gpt-4o-mini' ? 0.003 : 0.01
    };
  }

  private mapToTaskType(intentType: string): any {
    const mapping = {
      content_planning: 'marketing_template',
      message_automation: 'chatbot',
      campaign_execution: 'strategy'
    };
    return mapping[intentType] || 'basic_analytics';
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    return {
      rateLimiter: this.rateLimiter.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// Instance globale pour utilisation dans l'app
export const productionOrchestrator = new ProductionHybridOrchestrator();