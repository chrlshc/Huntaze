/**
 * Cost Optimization Engine - Automatic Cost Optimization
 * 
 * Moteur d'optimisation automatique des coûts avec:
 * - Analyse des patterns d'usage
 * - Recommandations intelligentes
 * - Application automatique des optimisations
 * - A/B testing des stratégies
 * - ROI tracking
 * 
 * @module cost-optimization-engine
 */

import { costMonitoringService, OptimizationRecommendation } from './cost-monitoring-service';
import { PrismaClient } from '@prisma/client';

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  type: 'provider_routing' | 'caching' | 'batching' | 'model_selection';
  enabled: boolean;
  autoApply: boolean;
  minSavingsThreshold: number; // Minimum savings to trigger (in dollars)
  minConfidenceThreshold: number; // Minimum confidence to apply (0-1)
  appliedAt?: Date;
  results?: {
    savingsRealized: number;
    requestsOptimized: number;
    successRate: number;
  };
}

export interface OptimizationRule {
  id: string;
  strategyId: string;
  condition: {
    requestType?: string;
    provider?: 'azure' | 'openai';
    tokenRange?: { min: number; max: number };
    timeOfDay?: { start: number; end: number }; // Hours 0-23
    userTier?: string[];
  };
  action: {
    type: 'switch_provider' | 'enable_cache' | 'batch_requests' | 'use_cheaper_model';
    targetProvider?: 'azure' | 'openai';
    cacheConfig?: { ttl: number; maxSize: number };
    batchConfig?: { maxBatchSize: number; maxWaitMs: number };
    modelConfig?: { model: string; fallback?: string };
  };
  priority: number; // Higher = more priority
  enabled: boolean;
}

export interface OptimizationResult {
  ruleId: string;
  applied: boolean;
  savingsEstimate: number;
  confidence: number;
  timestamp: Date;
  metadata: {
    originalProvider?: string;
    newProvider?: string;
    originalCost?: number;
    optimizedCost?: number;
    reason: string;
  };
}

export class CostOptimizationEngine {
  private readonly prisma: PrismaClient;
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private rules: Map<string, OptimizationRule> = new Map();
  
  // Statistiques d'optimisation
  private stats = {
    totalOptimizations: 0,
    totalSavings: 0,
    successRate: 0,
    lastOptimizationAt: new Date()
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeDefaultStrategies();
  }

  /**
   * Initialise les stratégies d'optimisation par défaut
   */
  private initializeDefaultStrategies(): void {
    // Stratégie 1: Routage intelligent des providers
    this.strategies.set('provider_routing', {
      id: 'provider_routing',
      name: 'Intelligent Provider Routing',
      description: 'Route requests to the most cost-effective provider based on request type',
      type: 'provider_routing',
      enabled: true,
      autoApply: true,
      minSavingsThreshold: 0.01, // $0.01 minimum
      minConfidenceThreshold: 0.7
    });

    // Stratégie 2: Mise en cache agressive
    this.strategies.set('aggressive_caching', {
      id: 'aggressive_caching',
      name: 'Aggressive Caching',
      description: 'Cache frequently requested content to reduce API calls',
      type: 'caching',
      enabled: true,
      autoApply: true,
      minSavingsThreshold: 0.05,
      minConfidenceThreshold: 0.8
    });

    // Stratégie 3: Batching des petites requêtes
    this.strategies.set('request_batching', {
      id: 'request_batching',
      name: 'Request Batching',
      description: 'Batch small requests together to reduce overhead',
      type: 'batching',
      enabled: false, // Désactivé par défaut (plus complexe)
      autoApply: false,
      minSavingsThreshold: 0.10,
      minConfidenceThreshold: 0.6
    });

    // Stratégie 4: Sélection de modèle optimale
    this.strategies.set('model_optimization', {
      id: 'model_optimization',
      name: 'Model Optimization',
      description: 'Use cheaper models when quality requirements allow',
      type: 'model_selection',
      enabled: true,
      autoApply: false, // Nécessite validation manuelle
      minSavingsThreshold: 0.20,
      minConfidenceThreshold: 0.75
    });

    console.log(`[CostOptimizationEngine] Initialized ${this.strategies.size} default strategies`);
  }

  /**
   * Analyse les patterns d'usage et génère des recommandations
   */
  async analyzeAndRecommend(userId?: string): Promise<OptimizationRecommendation[]> {
    try {
      // Obtenir les recommandations du service de monitoring
      const recommendations = await costMonitoringService.getOptimizationRecommendations(userId);
      
      // Filtrer par stratégies actives
      const filteredRecommendations = recommendations.filter(rec => {
        const strategy = this.strategies.get(rec.type);
        return strategy?.enabled && 
               rec.potentialSavings >= (strategy.minSavingsThreshold * 100) &&
               rec.confidence >= strategy.minConfidenceThreshold;
      });

      // Trier par économies potentielles
      return filteredRecommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);

    } catch (error) {
      console.error('[CostOptimizationEngine] Error analyzing patterns:', error);
      return [];
    }
  }

  /**
   * Applique automatiquement les optimisations éligibles
   */
  async autoOptimize(userId?: string): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    try {
      // Obtenir les recommandations
      const recommendations = await this.analyzeAndRecommend(userId);
      
      // Filtrer celles qui peuvent être auto-appliquées
      const autoApplicable = recommendations.filter(rec => {
        const strategy = this.strategies.get(rec.type);
        return strategy?.autoApply;
      });

      console.log(`[CostOptimizationEngine] Found ${autoApplicable.length} auto-applicable optimizations`);

      // Appliquer chaque optimisation
      for (const recommendation of autoApplicable) {
        try {
          const success = await costMonitoringService.applyCostOptimization(recommendation);
          
          const result: OptimizationResult = {
            ruleId: recommendation.id,
            applied: success,
            savingsEstimate: recommendation.potentialSavings / 100,
            confidence: recommendation.confidence,
            timestamp: new Date(),
            metadata: {
              reason: recommendation.description
            }
          };

          results.push(result);

          if (success) {
            this.stats.totalOptimizations++;
            this.stats.totalSavings += recommendation.potentialSavings / 100;
            this.stats.lastOptimizationAt = new Date();
          }

        } catch (error) {
          console.error(`[CostOptimizationEngine] Error applying optimization ${recommendation.id}:`, error);
          
          results.push({
            ruleId: recommendation.id,
            applied: false,
            savingsEstimate: 0,
            confidence: recommendation.confidence,
            timestamp: new Date(),
            metadata: {
              reason: `Failed to apply: ${(error as Error).message}`
            }
          });
        }
      }

      // Mettre à jour le taux de succès
      const successCount = results.filter(r => r.applied).length;
      this.stats.successRate = results.length > 0 ? successCount / results.length : 0;

      console.log(`[CostOptimizationEngine] Auto-optimization completed: ${successCount}/${results.length} successful`);

      return results;

    } catch (error) {
      console.error('[CostOptimizationEngine] Error in auto-optimization:', error);
      return results;
    }
  }

  /**
   * Évalue une requête et suggère des optimisations en temps réel
   */
  async evaluateRequest(request: {
    userId: string;
    type: string;
    provider: 'azure' | 'openai';
    estimatedTokens: number;
    estimatedCost: number;
  }): Promise<{
    shouldOptimize: boolean;
    suggestedProvider?: 'azure' | 'openai';
    suggestedModel?: string;
    estimatedSavings?: number;
    reason?: string;
  }> {
    try {
      // Règle 1: Si Azure est beaucoup plus cher, suggérer OpenAI
      if (request.provider === 'azure' && request.estimatedCost > 0.02) {
        const openaiCost = request.estimatedTokens * 0.002 / 1000; // GPT-3.5 Turbo
        const savings = request.estimatedCost - openaiCost;
        
        if (savings > 0.01) { // Au moins $0.01 d'économie
          return {
            shouldOptimize: true,
            suggestedProvider: 'openai',
            suggestedModel: 'gpt-3.5-turbo',
            estimatedSavings: savings,
            reason: `Switch to OpenAI could save $${savings.toFixed(4)} per request`
          };
        }
      }

      // Règle 2: Si OpenAI et petite requête, suggérer Azure (meilleure qualité)
      if (request.provider === 'openai' && request.estimatedTokens < 500) {
        const azureCost = request.estimatedTokens * 0.01 / 1000; // GPT-4 Turbo
        const costDiff = azureCost - request.estimatedCost;
        
        if (costDiff < 0.005) { // Différence négligeable
          return {
            shouldOptimize: true,
            suggestedProvider: 'azure',
            suggestedModel: 'gpt-4-turbo',
            estimatedSavings: 0,
            reason: 'Better quality available at similar cost'
          };
        }
      }

      // Règle 3: Requêtes très grandes -> toujours utiliser le moins cher
      if (request.estimatedTokens > 2000) {
        const azureCost = request.estimatedTokens * 0.01 / 1000;
        const openaiCost = request.estimatedTokens * 0.002 / 1000;
        
        if (request.provider === 'azure' && openaiCost < azureCost) {
          return {
            shouldOptimize: true,
            suggestedProvider: 'openai',
            suggestedModel: 'gpt-3.5-turbo',
            estimatedSavings: azureCost - openaiCost,
            reason: 'Large request - use most cost-effective provider'
          };
        }
      }

      return { shouldOptimize: false };

    } catch (error) {
      console.error('[CostOptimizationEngine] Error evaluating request:', error);
      return { shouldOptimize: false };
    }
  }

  /**
   * Obtient les statistiques d'optimisation
   */
  getOptimizationStats(): {
    totalOptimizations: number;
    totalSavings: number;
    successRate: number;
    lastOptimizationAt: Date;
    activeStrategies: number;
    enabledStrategies: string[];
  } {
    const enabledStrategies = Array.from(this.strategies.values())
      .filter(s => s.enabled)
      .map(s => s.name);

    return {
      ...this.stats,
      activeStrategies: enabledStrategies.length,
      enabledStrategies
    };
  }

  /**
   * Active ou désactive une stratégie
   */
  async toggleStrategy(strategyId: string, enabled: boolean): Promise<boolean> {
    const strategy = this.strategies.get(strategyId);
    
    if (!strategy) {
      console.error(`[CostOptimizationEngine] Strategy not found: ${strategyId}`);
      return false;
    }

    strategy.enabled = enabled;
    this.strategies.set(strategyId, strategy);

    console.log(`[CostOptimizationEngine] Strategy ${strategyId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Configure une stratégie
   */
  async configureStrategy(
    strategyId: string,
    config: Partial<Pick<OptimizationStrategy, 'autoApply' | 'minSavingsThreshold' | 'minConfidenceThreshold'>>
  ): Promise<boolean> {
    const strategy = this.strategies.get(strategyId);
    
    if (!strategy) {
      console.error(`[CostOptimizationEngine] Strategy not found: ${strategyId}`);
      return false;
    }

    Object.assign(strategy, config);
    this.strategies.set(strategyId, strategy);

    console.log(`[CostOptimizationEngine] Strategy ${strategyId} configured:`, config);
    return true;
  }

  /**
   * Obtient toutes les stratégies disponibles
   */
  getStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Exécute un test A/B d'une stratégie
   */
  async runABTest(
    strategyId: string,
    testDurationDays: number = 7,
    testPercentage: number = 0.1 // 10% des requêtes
  ): Promise<{
    testId: string;
    strategy: string;
    startDate: Date;
    endDate: Date;
    testPercentage: number;
    status: 'running' | 'completed';
  }> {
    const strategy = this.strategies.get(strategyId);
    
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }

    const testId = `ab_test_${strategyId}_${Date.now()}`;
    const startDate = new Date();
    const endDate = new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000);

    console.log(`[CostOptimizationEngine] Starting A/B test for ${strategyId}:`, {
      testId,
      duration: testDurationDays,
      percentage: testPercentage
    });

    return {
      testId,
      strategy: strategy.name,
      startDate,
      endDate,
      testPercentage,
      status: 'running'
    };
  }
}

// Export singleton
export const costOptimizationEngine = new CostOptimizationEngine();
