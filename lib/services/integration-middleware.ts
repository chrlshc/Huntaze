/**
 * Integration Middleware - Legacy to Hybrid Orchestrator Bridge
 * 
 * Middleware qui route intelligemment entre:
 * - Système legacy existant
 * - Nouveau ProductionHybridOrchestrator
 * 
 * Utilise feature flags pour rollout graduel et rollback instantané
 * 
 * @module integration-middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductionHybridOrchestrator } from './production-hybrid-orchestrator-v2';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export interface APIRequest {
  userId: string;
  type: string;
  data: Record<string, any>;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    provider: 'legacy' | 'hybrid';
    duration: number;
    version: string;
    timestamp: string;
  };
}

export interface LegacyRequest {
  // Format des anciennes API requests
  user_id?: string;
  userId?: string;
  action: string;
  payload: Record<string, any>;
  platform?: string;
  platforms?: string[];
}

export interface LegacyResponse {
  // Format des anciennes API responses
  status: 'success' | 'error';
  result?: any;
  message?: string;
  data?: any;
}

export interface FeatureFlagConfig {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  userWhitelist: string[];
  userBlacklist: string[];
  conditions: {
    userTier?: string[];
    accountAge?: number;
    region?: string[];
    platform?: string[];
  };
  rollbackTriggers: {
    errorRateThreshold: number;
    latencyThreshold: number;
    timeWindowMinutes: number;
  };
}

export class IntegrationMiddleware {
  private readonly prisma: PrismaClient;
  private readonly featureFlags: Map<string, FeatureFlagConfig> = new Map();
  private readonly metrics: Map<string, any> = new Map();

  // Feature flags par défaut
  private readonly DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
    'hybrid-orchestrator': {
      name: 'hybrid-orchestrator',
      enabled: true,
      rolloutPercentage: 10, // Commencer à 10%
      userWhitelist: ['test-user-123', 'admin-user'], // Users de test
      userBlacklist: ['problematic-user-456'],
      conditions: {
        userTier: ['pro', 'enterprise'], // Commencer par les users payants
        accountAge: 30, // Comptes > 30 jours
        platform: ['web', 'api'] // Pas mobile pour l'instant
      },
      rollbackTriggers: {
        errorRateThreshold: 5.0, // 5% d'erreurs = rollback
        latencyThreshold: 5000, // 5s de latence = rollback
        timeWindowMinutes: 5 // Fenêtre de mesure
      }
    },
    'onlyfans-sqs-queue': {
      name: 'onlyfans-sqs-queue',
      enabled: true,
      rolloutPercentage: 25, // Plus agressif pour SQS
      userWhitelist: [],
      userBlacklist: [],
      conditions: {
        platform: ['api'] // SQS seulement via API
      },
      rollbackTriggers: {
        errorRateThreshold: 2.0, // Plus strict pour OnlyFans
        latencyThreshold: 3000,
        timeWindowMinutes: 3
      }
    }
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeFeatureFlags();
  }

  /**
   * Initialise les feature flags depuis la base ou les defaults
   */
  private async initializeFeatureFlags(): Promise<void> {
    // Charger depuis la base si disponible, sinon utiliser les defaults
    for (const [name, config] of Object.entries(this.DEFAULT_FEATURE_FLAGS)) {
      this.featureFlags.set(name, config);
    }

    // Override avec les variables d'environnement pour rollback rapide
    if (process.env.HYBRID_ORCHESTRATOR_ENABLED === 'false') {
      const config = this.featureFlags.get('hybrid-orchestrator');
      if (config) {
        config.enabled = false;
        this.featureFlags.set('hybrid-orchestrator', config);
      }
    }

    if (process.env.HYBRID_ORCHESTRATOR_PERCENTAGE) {
      const percentage = parseInt(process.env.HYBRID_ORCHESTRATOR_PERCENTAGE);
      const config = this.featureFlags.get('hybrid-orchestrator');
      if (config && !isNaN(percentage)) {
        config.rolloutPercentage = Math.max(0, Math.min(100, percentage));
        this.featureFlags.set('hybrid-orchestrator', config);
      }
    }
  }

  /**
   * Route une requête entre legacy et hybrid orchestrator
   */
  async routeRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      // Déterminer si on utilise le hybrid orchestrator
      const useHybrid = await this.shouldUseHybridOrchestrator(request.userId, request);
      
      let response: APIResponse;
      
      if (useHybrid) {
        response = await this.executeWithHybridOrchestrator(request);
        response.metadata = {
          ...response.metadata,
          provider: 'hybrid',
          duration: Date.now() - startTime,
          version: 'v2-production',
          timestamp: new Date().toISOString()
        };
      } else {
        response = await this.executeWithLegacySystem(request);
        response.metadata = {
          ...response.metadata,
          provider: 'legacy',
          duration: Date.now() - startTime,
          version: 'v1-legacy',
          timestamp: new Date().toISOString()
        };
      }

      // Enregistrer les métriques pour monitoring
      await this.recordMetrics(request.userId, useHybrid ? 'hybrid' : 'legacy', response, Date.now() - startTime);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Enregistrer l'erreur
      await this.recordMetrics(request.userId, 'error', { success: false, error: error.message }, duration);
      
      // Fallback vers legacy en cas d'erreur hybrid
      if (await this.shouldUseHybridOrchestrator(request.userId, request)) {
        console.warn('[IntegrationMiddleware] Hybrid failed, falling back to legacy:', error.message);
        try {
          const fallbackResponse = await this.executeWithLegacySystem(request);
          fallbackResponse.metadata = {
            ...fallbackResponse.metadata,
            provider: 'legacy',
            duration: Date.now() - startTime,
            version: 'v1-fallback',
            timestamp: new Date().toISOString()
          };
          return fallbackResponse;
        } catch (fallbackError) {
          console.error('[IntegrationMiddleware] Both hybrid and legacy failed:', fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Détermine si on doit utiliser le hybrid orchestrator
   */
  async shouldUseHybridOrchestrator(userId: string, request?: APIRequest): Promise<boolean> {
    const featureFlag = this.featureFlags.get('hybrid-orchestrator');
    
    if (!featureFlag || !featureFlag.enabled) {
      return false;
    }

    // Vérifier la blacklist
    if (featureFlag.userBlacklist.includes(userId)) {
      return false;
    }

    // Vérifier la whitelist (priorité absolue)
    if (featureFlag.userWhitelist.includes(userId)) {
      return true;
    }

    // Vérifier les conditions
    if (request) {
      // Platform condition
      if (featureFlag.conditions.platform) {
        const platform = request.metadata?.platform || 'web';
        if (!featureFlag.conditions.platform.includes(platform)) {
          return false;
        }
      }

      // User tier condition (nécessiterait une query user)
      // Pour l'instant on skip cette vérification
    }

    // Vérifier le rollout percentage avec hash stable
    const userHash = this.hashUserId(userId);
    const userPercentile = userHash % 100;
    
    return userPercentile < featureFlag.rolloutPercentage;
  }

  /**
   * Exécute avec le hybrid orchestrator
   */
  private async executeWithHybridOrchestrator(request: APIRequest): Promise<APIResponse> {
    const orchestrator = await getProductionHybridOrchestrator();
    
    // Transformer la requête au format hybrid
    const workflowIntent = this.transformToWorkflowIntent(request);
    
    const result = await orchestrator.executeWorkflow(request.userId, workflowIntent);
    
    return {
      success: true,
      data: result,
      metadata: {
        provider: 'hybrid',
        duration: 0, // Sera rempli par le caller
        version: 'v2-production',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Exécute avec le système legacy
   */
  private async executeWithLegacySystem(request: APIRequest): Promise<APIResponse> {
    // Simuler l'appel au système legacy
    // Dans la vraie implémentation, ceci appellerait tes services existants
    
    console.log('[IntegrationMiddleware] Executing with legacy system:', request.type);
    
    // Exemple de logique legacy
    let result;
    switch (request.type) {
      case 'content_planning':
        result = await this.legacyContentPlanning(request);
        break;
      case 'message_generation':
        result = await this.legacyMessageGeneration(request);
        break;
      default:
        result = { message: 'Legacy system processed request', data: request.data };
    }
    
    return {
      success: true,
      data: result,
      metadata: {
        provider: 'legacy',
        duration: 0, // Sera rempli par le caller
        version: 'v1-legacy',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Transforme une APIRequest en WorkflowIntent pour le hybrid orchestrator
   */
  private transformToWorkflowIntent(request: APIRequest): any {
    return {
      type: this.mapRequestTypeToWorkflowType(request.type),
      userId: request.userId,
      data: request.data,
      platforms: request.data.platforms || ['instagram'],
      contentType: request.data.contentType || 'post',
      sendToOnlyFans: request.data.sendToOnlyFans || false,
      recipientId: request.data.recipientId,
      requiresMultiPlatform: (request.data.platforms?.length || 0) > 1,
      priority: request.data.priority || 'medium'
    };
  }

  /**
   * Mappe les types de requête legacy vers les types workflow
   */
  private mapRequestTypeToWorkflowType(requestType: string): string {
    const mapping: Record<string, string> = {
      'content_planning': 'content_planning',
      'generate_content': 'content_planning',
      'plan_campaign': 'campaign_execution',
      'send_message': 'message_generation',
      'validate_content': 'content_validation',
      'create_post': 'content_planning'
    };
    
    return mapping[requestType] || 'content_planning';
  }

  /**
   * Transforme une LegacyRequest en APIRequest
   */
  transformLegacyRequest(legacyRequest: LegacyRequest): APIRequest {
    return {
      userId: legacyRequest.userId || legacyRequest.user_id || 'unknown',
      type: legacyRequest.action,
      data: {
        ...legacyRequest.payload,
        platforms: legacyRequest.platforms || (legacyRequest.platform ? [legacyRequest.platform] : undefined)
      }
    };
  }

  /**
   * Transforme une APIResponse en LegacyResponse
   */
  transformToLegacyResponse(response: APIResponse): LegacyResponse {
    return {
      status: response.success ? 'success' : 'error',
      result: response.data,
      message: response.error,
      data: response.data
    };
  }

  /**
   * Vérifie un feature flag spécifique
   */
  async checkFeatureFlag(userId: string, feature: string): Promise<boolean> {
    const featureFlag = this.featureFlags.get(feature);
    
    if (!featureFlag || !featureFlag.enabled) {
      return false;
    }

    // Même logique que shouldUseHybridOrchestrator mais pour n'importe quel flag
    if (featureFlag.userBlacklist.includes(userId)) {
      return false;
    }

    if (featureFlag.userWhitelist.includes(userId)) {
      return true;
    }

    const userHash = this.hashUserId(userId);
    const userPercentile = userHash % 100;
    
    return userPercentile < featureFlag.rolloutPercentage;
  }

  /**
   * Met à jour un feature flag (pour admin/ops)
   */
  async updateFeatureFlag(feature: string, config: Partial<FeatureFlagConfig>): Promise<void> {
    const existingConfig = this.featureFlags.get(feature);
    if (!existingConfig) {
      throw new Error(`Feature flag '${feature}' not found`);
    }

    const updatedConfig = { ...existingConfig, ...config };
    this.featureFlags.set(feature, updatedConfig);

    console.log(`[IntegrationMiddleware] Updated feature flag '${feature}':`, updatedConfig);
  }

  /**
   * Hash stable d'un userId pour rollout consistent
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Enregistre les métriques pour monitoring et rollback automatique
   */
  private async recordMetrics(
    userId: string, 
    provider: string, 
    response: any, 
    duration: number
  ): Promise<void> {
    const timestamp = Date.now();
    const success = response.success !== false;

    // Stocker en mémoire pour analyse rapide
    const key = `${provider}_${Math.floor(timestamp / (5 * 60 * 1000))}`; // 5-minute buckets
    const existing = this.metrics.get(key) || { count: 0, errors: 0, totalDuration: 0 };
    
    existing.count++;
    existing.totalDuration += duration;
    if (!success) existing.errors++;
    
    this.metrics.set(key, existing);

    // Vérifier les triggers de rollback
    await this.checkRollbackTriggers(provider, existing);

    // Log pour CloudWatch (sera capturé par le monitoring)
    console.log('[IntegrationMiddleware] Metrics:', {
      userId,
      provider,
      success,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Vérifie si les conditions de rollback automatique sont atteintes
   */
  private async checkRollbackTriggers(provider: string, metrics: any): Promise<void> {
    if (provider !== 'hybrid') return;

    const featureFlag = this.featureFlags.get('hybrid-orchestrator');
    if (!featureFlag) return;

    const errorRate = (metrics.errors / metrics.count) * 100;
    const avgLatency = metrics.totalDuration / metrics.count;

    // Vérifier le taux d'erreur
    if (errorRate > featureFlag.rollbackTriggers.errorRateThreshold) {
      console.error(`[IntegrationMiddleware] ROLLBACK TRIGGERED: Error rate ${errorRate}% > ${featureFlag.rollbackTriggers.errorRateThreshold}%`);
      await this.triggerRollback('high_error_rate', { errorRate, threshold: featureFlag.rollbackTriggers.errorRateThreshold });
    }

    // Vérifier la latence
    if (avgLatency > featureFlag.rollbackTriggers.latencyThreshold) {
      console.error(`[IntegrationMiddleware] ROLLBACK TRIGGERED: Latency ${avgLatency}ms > ${featureFlag.rollbackTriggers.latencyThreshold}ms`);
      await this.triggerRollback('high_latency', { latency: avgLatency, threshold: featureFlag.rollbackTriggers.latencyThreshold });
    }
  }

  /**
   * Déclenche un rollback automatique
   */
  private async triggerRollback(reason: string, data: any): Promise<void> {
    console.error(`[IntegrationMiddleware] AUTOMATIC ROLLBACK: ${reason}`, data);
    
    // Désactiver le feature flag
    await this.updateFeatureFlag('hybrid-orchestrator', { 
      enabled: false,
      rolloutPercentage: 0 
    });

    // Alerter les ops (dans un vrai système, ceci enverrait des notifications)
    console.error('[IntegrationMiddleware] ALERT: Hybrid orchestrator automatically disabled due to:', reason);
  }

  /**
   * Méthodes legacy simulées (à remplacer par tes vrais services)
   */
  private async legacyContentPlanning(request: APIRequest): Promise<any> {
    // Simuler l'ancien système de content planning
    return {
      content: `Legacy generated content for ${request.data.theme || 'general'}`,
      platforms: request.data.platforms || ['instagram'],
      provider: 'legacy-content-service'
    };
  }

  private async legacyMessageGeneration(request: APIRequest): Promise<any> {
    // Simuler l'ancien système de message generation
    return {
      message: `Legacy generated message: ${request.data.message_type || 'default'}`,
      recipientId: request.data.recipientId,
      provider: 'legacy-message-service'
    };
  }

  /**
   * Obtenir les métriques actuelles (pour monitoring)
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, metrics] of this.metrics.entries()) {
      const [provider, bucket] = key.split('_');
      const errorRate = (metrics.errors / metrics.count) * 100;
      const avgLatency = metrics.totalDuration / metrics.count;
      
      result[key] = {
        provider,
        bucket: parseInt(bucket),
        count: metrics.count,
        errors: metrics.errors,
        errorRate: errorRate.toFixed(2),
        avgLatency: avgLatency.toFixed(0),
        timestamp: new Date(parseInt(bucket) * 5 * 60 * 1000).toISOString()
      };
    }
    
    return result;
  }

  /**
   * Obtenir l'état des feature flags
   */
  getFeatureFlags(): Record<string, FeatureFlagConfig> {
    const result: Record<string, FeatureFlagConfig> = {};
    for (const [name, config] of this.featureFlags.entries()) {
      result[name] = { ...config };
    }
    return result;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Singleton instance
 */
let middlewareInstance: IntegrationMiddleware | null = null;

export async function getIntegrationMiddleware(): Promise<IntegrationMiddleware> {
  if (!middlewareInstance) {
    middlewareInstance = new IntegrationMiddleware();
  }
  return middlewareInstance;
}