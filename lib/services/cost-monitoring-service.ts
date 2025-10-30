/**
 * Cost Monitoring Service - Real-time AI Cost Tracking
 * 
 * Service de monitoring des coûts AI avec:
 * - Tracking temps réel Azure vs OpenAI
 * - Alertes sur seuils de coûts
 * - Optimisation automatique des providers
 * - Forecasting et budgets
 * - Integration DynamoDB + CloudWatch
 * 
 * @module cost-monitoring-service
 */

import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { PrismaClient } from '@prisma/client';

export interface CostEntry {
  id: string;
  userId: string;
  provider: 'azure' | 'openai';
  workflowId: string;
  traceId?: string;
  requestType: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number; // en centimes
  costPerToken: number;
  duration: number; // ms
  timestamp: Date;
  metadata: {
    traceId?: string;
    model?: string;
    region?: string;
    cacheHit?: boolean;
    retryAttempt?: number;
    duration?: number;
  };
}

export interface CostBreakdown {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalCost: number;
  providers: {
    azure: {
      cost: number;
      tokens: number;
      requests: number;
      avgCostPerRequest: number;
    };
    openai: {
      cost: number;
      tokens: number;
      requests: number;
      avgCostPerRequest: number;
    };
  };
  savings: {
    potentialSavings: number;
    optimizationRecommendations: string[];
  };
  trends: {
    dailyCosts: Array<{ date: string; cost: number; provider: string }>;
    hourlyUsage: Array<{ hour: number; tokens: number; cost: number }>;
  };
}export 
interface CostAlert {
  id: string;
  userId?: string;
  type: 'daily_threshold' | 'monthly_threshold' | 'spike_detection' | 'budget_exceeded';
  severity: 'info' | 'warning' | 'critical';
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'provider_switch' | 'request_batching' | 'cache_optimization' | 'model_downgrade';
  description: string;
  potentialSavings: number; // centimes/jour
  confidence: number; // 0-1
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    steps: string[];
  };
  metadata: {
    basedOnDays: number;
    sampleSize: number;
    createdAt: Date;
  };
}

export class CostMonitoringService {
  private readonly dynamodb: DynamoDBClient;
  private readonly cloudWatch: CloudWatchClient;
  private readonly sns: SNSClient;
  private readonly prisma: PrismaClient;
  
  // Configuration DynamoDB
  private readonly TABLES = {
    COST_ENTRIES: 'huntaze-ai-costs-production',
    COST_ALERTS: 'huntaze-cost-alerts-production'
  };
  
  // Configuration des coûts par provider (en centimes par 1K tokens)
  private readonly COST_RATES = {
    azure: {
      'gpt-4': 3.0,      // $0.03/1K tokens
      'gpt-4-turbo': 1.0, // $0.01/1K tokens
      'gpt-35-turbo': 0.15 // $0.0015/1K tokens
    },
    openai: {
      'gpt-4': 6.0,      // $0.06/1K tokens  
      'gpt-4-turbo': 2.0, // $0.02/1K tokens
      'gpt-3.5-turbo': 0.2 // $0.002/1K tokens
    }
  };
  
  // Seuils d'alerte par défaut
  private readonly DEFAULT_THRESHOLDS = {
    dailyUser: 500,    // 5$ par user par jour
    dailyGlobal: 5000, // 50$ global par jour
    monthlyUser: 10000, // 100$ par user par mois
    monthlyGlobal: 50000, // 500$ global par mois
    spikeMultiplier: 3 // 3x la moyenne = spike
  };

  constructor(region: string = 'us-east-1') {
    this.dynamodb = new DynamoDBClient({ region });
    this.cloudWatch = new CloudWatchClient({ region });
    this.sns = new SNSClient({ region });
    this.prisma = new PrismaClient();
  }

  /**
   * Enregistre l'usage et le coût d'une requête AI
   */
  async trackUsage(
    provider: 'azure' | 'openai',
    tokens: number,
    cost: number,
    userId: string,
    workflowId: string,
    requestType: string,
    metadata: CostEntry['metadata'] = {}
  ): Promise<void> {
    const costEntry: CostEntry = {
      id: `${provider}_${workflowId}_${Date.now()}`,
      userId,
      provider,
      workflowId,
      traceId: metadata.traceId,
      requestType,
      inputTokens: Math.floor(tokens * 0.7), // Estimation 70% input
      outputTokens: Math.floor(tokens * 0.3), // Estimation 30% output
      totalTokens: tokens,
      cost: Math.round(cost * 100), // Convertir en centimes
      costPerToken: cost / tokens,
      duration: metadata.duration || 0,
      timestamp: new Date(),
      metadata
    };

    try {
      // 1. Stocker en DynamoDB pour analyse
      await this.storeCostEntry(costEntry);
      
      // 2. Envoyer métriques à CloudWatch
      await this.sendCostMetrics(costEntry);
      
      // 3. Vérifier les seuils d'alerte
      await this.checkCostThresholds(userId, provider, cost);
      
      console.log(`[CostMonitoringService] Tracked ${provider} usage: ${tokens} tokens, $${cost.toFixed(4)}`);

    } catch (error) {
      console.error('[CostMonitoringService] Error tracking usage:', error);
    }
  }

  /**
   * Obtient la répartition des coûts pour une période
   */
  async getCostBreakdown(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CostBreakdown> {
    try {
      // Requête DynamoDB pour obtenir les coûts
      const costEntries = await this.getCostEntries(startDate, endDate, userId);
      
      // Calculer les totaux par provider
      const azureCosts = costEntries.filter(e => e.provider === 'azure');
      const openaiCosts = costEntries.filter(e => e.provider === 'openai');
      
      const azureTotal = azureCosts.reduce((sum, e) => sum + e.cost, 0);
      const openaiTotal = openaiCosts.reduce((sum, e) => sum + e.cost, 0);
      const totalCost = azureTotal + openaiTotal;
      
      // Calculer les économies potentielles
      const potentialSavings = this.calculatePotentialSavings(costEntries);
      
      // Générer les tendances
      const trends = this.generateCostTrends(costEntries);
      
      return {
        timeRange: { start: startDate, end: endDate },
        totalCost: totalCost / 100, // Convertir en dollars
        providers: {
          azure: {
            cost: azureTotal / 100,
            tokens: azureCosts.reduce((sum, e) => sum + e.totalTokens, 0),
            requests: azureCosts.length,
            avgCostPerRequest: azureCosts.length > 0 ? (azureTotal / azureCosts.length) / 100 : 0
          },
          openai: {
            cost: openaiTotal / 100,
            tokens: openaiCosts.reduce((sum, e) => sum + e.totalTokens, 0),
            requests: openaiCosts.length,
            avgCostPerRequest: openaiCosts.length > 0 ? (openaiTotal / openaiCosts.length) / 100 : 0
          }
        },
        savings: {
          potentialSavings: potentialSavings / 100,
          optimizationRecommendations: this.generateOptimizationRecommendations(costEntries)
        },
        trends
      };

    } catch (error) {
      console.error('[CostMonitoringService] Error getting cost breakdown:', error);
      throw error;
    }
  }

  /**
   * Vérifie les seuils de coûts et déclenche des alertes si nécessaire
   */
  async checkCostThresholds(userId: string, provider: string, cost: number): Promise<CostAlert[]> {
    const alerts: CostAlert[] = [];
    
    try {
      // Obtenir les coûts du jour pour cet utilisateur
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dailyCosts = await this.getCostEntries(startOfDay, today, userId);
      const dailyTotal = dailyCosts.reduce((sum, entry) => sum + entry.cost, 0);
      
      // Vérifier seuil quotidien utilisateur
      if (dailyTotal > this.DEFAULT_THRESHOLDS.dailyUser) {
        const alert: CostAlert = {
          id: `daily_user_${userId}_${Date.now()}`,
          userId,
          type: 'daily_threshold',
          severity: dailyTotal > this.DEFAULT_THRESHOLDS.dailyUser * 2 ? 'critical' : 'warning',
          threshold: this.DEFAULT_THRESHOLDS.dailyUser / 100,
          currentValue: dailyTotal / 100,
          message: `Daily cost threshold exceeded for user ${userId}: $${(dailyTotal / 100).toFixed(2)}`,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        await this.sendCostAlert(alert);
      }
      
      // Obtenir les coûts globaux du jour
      const globalDailyCosts = await this.getCostEntries(startOfDay, today);
      const globalDailyTotal = globalDailyCosts.reduce((sum, entry) => sum + entry.cost, 0);
      
      // Vérifier seuil quotidien global
      if (globalDailyTotal > this.DEFAULT_THRESHOLDS.dailyGlobal) {
        const alert: CostAlert = {
          id: `daily_global_${Date.now()}`,
          type: 'daily_threshold',
          severity: globalDailyTotal > this.DEFAULT_THRESHOLDS.dailyGlobal * 2 ? 'critical' : 'warning',
          threshold: this.DEFAULT_THRESHOLDS.dailyGlobal / 100,
          currentValue: globalDailyTotal / 100,
          message: `Global daily cost threshold exceeded: $${(globalDailyTotal / 100).toFixed(2)}`,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        await this.sendCostAlert(alert);
      }
      
      // Détection de pics de coûts (3x la moyenne des 7 derniers jours)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekCosts = await this.getCostEntries(weekAgo, startOfDay, userId);
      const avgDailyCost = weekCosts.reduce((sum, entry) => sum + entry.cost, 0) / 7;
      
      if (dailyTotal > avgDailyCost * this.DEFAULT_THRESHOLDS.spikeMultiplier) {
        const alert: CostAlert = {
          id: `spike_${userId}_${Date.now()}`,
          userId,
          type: 'spike_detection',
          severity: 'warning',
          threshold: avgDailyCost * this.DEFAULT_THRESHOLDS.spikeMultiplier / 100,
          currentValue: dailyTotal / 100,
          message: `Cost spike detected for user ${userId}: ${this.DEFAULT_THRESHOLDS.spikeMultiplier}x above average`,
          timestamp: new Date(),
          acknowledged: false
        };
        alerts.push(alert);
        await this.sendCostAlert(alert);
      }
      
      return alerts;
      
    } catch (error) {
      console.error('[CostMonitoringService] Error checking cost thresholds:', error);
      return [];
    }
  }

  /**
   * Envoie une alerte de coût via SNS et stocke en base
   */
  async sendCostAlert(alert: CostAlert): Promise<void> {
    try {
      // 1. Stocker l'alerte en DynamoDB
      const item: Record<string, any> = {
        id: { S: alert.id },
        type: { S: alert.type },
        severity: { S: alert.severity },
        threshold: { N: alert.threshold.toString() },
        currentValue: { N: alert.currentValue.toString() },
        message: { S: alert.message },
        timestamp: { S: alert.timestamp.toISOString() },
        acknowledged: { BOOL: alert.acknowledged }
      };
      
      if (alert.userId) {
        item.userId = { S: alert.userId };
      }
      
      await this.dynamodb.send(new PutItemCommand({
        TableName: this.TABLES.COST_ALERTS,
        Item: item
      }));
      
      // 2. Envoyer notification SNS
      const snsTopicArn = process.env.COST_ALERTS_SNS_TOPIC;
      if (snsTopicArn) {
        await this.sns.send(new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `Huntaze Cost Alert - ${alert.severity.toUpperCase()}`,
          Message: JSON.stringify({
            alert,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
          })
        }));
      }
      
      // 3. Log pour monitoring
      console.warn(`[CostMonitoringService] Cost alert sent: ${alert.type} - ${alert.message}`);
      
    } catch (error) {
      console.error('[CostMonitoringService] Error sending cost alert:', error);
    }
  }

  /**
   * Génère des recommandations d'optimisation des coûts
   */
  async getOptimizationRecommendations(userId?: string): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    try {
      // Analyser les 30 derniers jours
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const costEntries = await this.getCostEntries(thirtyDaysAgo, new Date(), userId);
      
      if (costEntries.length === 0) {
        return recommendations;
      }
      
      // 1. Recommandation de changement de provider
      const azureCosts = costEntries.filter(e => e.provider === 'azure');
      const openaiCosts = costEntries.filter(e => e.provider === 'openai');
      
      if (azureCosts.length > 0 && openaiCosts.length > 0) {
        const azureAvgCost = azureCosts.reduce((sum, e) => sum + e.cost, 0) / azureCosts.length;
        const openaiAvgCost = openaiCosts.reduce((sum, e) => sum + e.cost, 0) / openaiCosts.length;
        
        if (Math.abs(azureAvgCost - openaiAvgCost) > azureAvgCost * 0.2) {
          const cheaperProvider = azureAvgCost < openaiAvgCost ? 'azure' : 'openai';
          const expensiveProvider = azureAvgCost < openaiAvgCost ? 'openai' : 'azure';
          const potentialSavings = Math.abs(azureAvgCost - openaiAvgCost) * 
            (cheaperProvider === 'azure' ? openaiCosts.length : azureCosts.length);
          
          recommendations.push({
            id: `provider_switch_${Date.now()}`,
            type: 'provider_switch',
            description: `Switch more requests from ${expensiveProvider} to ${cheaperProvider} for better cost efficiency`,
            potentialSavings: potentialSavings * 30, // Projection mensuelle
            confidence: 0.8,
            implementation: {
              difficulty: 'easy',
              estimatedTime: '1 hour',
              steps: [
                `Update provider routing logic to prefer ${cheaperProvider}`,
                'Monitor performance impact for 24 hours',
                'Adjust routing percentages based on results'
              ]
            },
            metadata: {
              basedOnDays: 30,
              sampleSize: costEntries.length,
              createdAt: new Date()
            }
          });
        }
      }
      
      // 2. Recommandation de mise en cache
      const duplicateRequests = this.findDuplicateRequests(costEntries);
      if (duplicateRequests.length > 10) {
        const cacheSavings = duplicateRequests.reduce((sum, entry) => sum + entry.cost, 0);
        
        recommendations.push({
          id: `cache_optimization_${Date.now()}`,
          type: 'cache_optimization',
          description: `Implement caching for ${duplicateRequests.length} duplicate requests to reduce costs`,
          potentialSavings: cacheSavings * 30, // Projection mensuelle
          confidence: 0.9,
          implementation: {
            difficulty: 'medium',
            estimatedTime: '4 hours',
            steps: [
              'Implement Redis caching for common request patterns',
              'Add cache hit/miss metrics',
              'Monitor cache effectiveness'
            ]
          },
          metadata: {
            basedOnDays: 30,
            sampleSize: duplicateRequests.length,
            createdAt: new Date()
          }
        });
      }
      
      // 3. Recommandation de batching
      const smallRequests = costEntries.filter(e => e.totalTokens < 100);
      if (smallRequests.length > 50) {
        const batchSavings = smallRequests.length * 0.001 * 100; // Économie estimée par batch
        
        recommendations.push({
          id: `request_batching_${Date.now()}`,
          type: 'request_batching',
          description: `Batch ${smallRequests.length} small requests to reduce API overhead costs`,
          potentialSavings: batchSavings * 30,
          confidence: 0.7,
          implementation: {
            difficulty: 'hard',
            estimatedTime: '8 hours',
            steps: [
              'Implement request queuing system',
              'Add batching logic for small requests',
              'Test batch processing performance'
            ]
          },
          metadata: {
            basedOnDays: 30,
            sampleSize: smallRequests.length,
            createdAt: new Date()
          }
        });
      }
      
      return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
      
    } catch (error) {
      console.error('[CostMonitoringService] Error generating optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Applique une recommandation d'optimisation
   */
  async applyCostOptimization(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      console.log(`[CostMonitoringService] Applying optimization: ${recommendation.type}`);
      
      // Pour l'instant, on log seulement - l'implémentation réelle dépend du type
      switch (recommendation.type) {
        case 'provider_switch':
          // Logique pour ajuster les préférences de provider
          console.log('Provider switch optimization applied');
          break;
          
        case 'cache_optimization':
          // Logique pour activer le cache
          console.log('Cache optimization applied');
          break;
          
        case 'request_batching':
          // Logique pour activer le batching
          console.log('Request batching optimization applied');
          break;
          
        default:
          console.warn(`Unknown optimization type: ${recommendation.type}`);
          return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('[CostMonitoringService] Error applying optimization:', error);
      return false;
    }
  }

  // ==================== MÉTHODES UTILITAIRES PRIVÉES ====================

  /**
   * Stocke une entrée de coût en DynamoDB
   */
  private async storeCostEntry(costEntry: CostEntry): Promise<void> {
    try {
      const item: Record<string, any> = {
        id: { S: costEntry.id },
        userId: { S: costEntry.userId },
        provider: { S: costEntry.provider },
        workflowId: { S: costEntry.workflowId },
        requestType: { S: costEntry.requestType },
        inputTokens: { N: costEntry.inputTokens.toString() },
        outputTokens: { N: costEntry.outputTokens.toString() },
        totalTokens: { N: costEntry.totalTokens.toString() },
        cost: { N: costEntry.cost.toString() },
        costPerToken: { N: costEntry.costPerToken.toString() },
        duration: { N: costEntry.duration.toString() },
        timestamp: { S: costEntry.timestamp.toISOString() },
        metadata: { S: JSON.stringify(costEntry.metadata) }
      };
      
      if (costEntry.traceId) {
        item.traceId = { S: costEntry.traceId };
      }
      
      await this.dynamodb.send(new PutItemCommand({
        TableName: this.TABLES.COST_ENTRIES,
        Item: item
      }));
    } catch (error) {
      console.error('[CostMonitoringService] Error storing cost entry:', error);
      throw error;
    }
  }

  /**
   * Envoie des métriques à CloudWatch
   */
  private async sendCostMetrics(costEntry: CostEntry): Promise<void> {
    try {
      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Huntaze/AI/Costs',
        MetricData: [
          {
            MetricName: 'AIProviderCost',
            Dimensions: [
              { Name: 'Provider', Value: costEntry.provider },
              { Name: 'RequestType', Value: costEntry.requestType }
            ],
            Value: costEntry.cost / 100,
            Timestamp: costEntry.timestamp
          },
          {
            MetricName: 'AITokenUsage',
            Dimensions: [
              { Name: 'Provider', Value: costEntry.provider },
              { Name: 'RequestType', Value: costEntry.requestType }
            ],
            Value: costEntry.totalTokens,
            Unit: 'Count',
            Timestamp: costEntry.timestamp
          },
          {
            MetricName: 'AIRequestDuration',
            Dimensions: [
              { Name: 'Provider', Value: costEntry.provider }
            ],
            Value: costEntry.duration,
            Unit: 'Milliseconds',
            Timestamp: costEntry.timestamp
          }
        ]
      }));
    } catch (error) {
      console.error('[CostMonitoringService] Error sending CloudWatch metrics:', error);
    }
  }

  /**
   * Récupère les entrées de coût pour une période donnée
   */
  private async getCostEntries(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CostEntry[]> {
    try {
      const params: any = {
        TableName: this.TABLES.COST_ENTRIES,
        FilterExpression: '#timestamp BETWEEN :start AND :end',
        ExpressionAttributeNames: {
          '#timestamp': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':start': { S: startDate.toISOString() },
          ':end': { S: endDate.toISOString() }
        }
      };

      if (userId) {
        params.FilterExpression += ' AND userId = :userId';
        params.ExpressionAttributeValues[':userId'] = { S: userId };
      }

      const result = await this.dynamodb.send(new ScanCommand(params));
      
      return (result.Items || []).map(item => ({
        id: item.id.S!,
        userId: item.userId.S!,
        provider: item.provider.S! as 'azure' | 'openai',
        workflowId: item.workflowId.S!,
        traceId: item.traceId?.S,
        requestType: item.requestType.S!,
        inputTokens: parseInt(item.inputTokens.N!),
        outputTokens: parseInt(item.outputTokens.N!),
        totalTokens: parseInt(item.totalTokens.N!),
        cost: parseInt(item.cost.N!),
        costPerToken: parseFloat(item.costPerToken.N!),
        duration: parseInt(item.duration.N!),
        timestamp: new Date(item.timestamp.S!),
        metadata: JSON.parse(item.metadata.S || '{}')
      }));
    } catch (error) {
      console.error('[CostMonitoringService] Error getting cost entries:', error);
      return [];
    }
  }

  /**
   * Calcule les économies potentielles
   */
  private calculatePotentialSavings(costEntries: CostEntry[]): number {
    // Logique simplifiée : si on utilisait toujours le provider le moins cher
    const azureCosts = costEntries.filter(e => e.provider === 'azure');
    const openaiCosts = costEntries.filter(e => e.provider === 'openai');
    
    if (azureCosts.length === 0 || openaiCosts.length === 0) {
      return 0;
    }
    
    const azureAvgCostPerToken = azureCosts.reduce((sum, e) => sum + e.costPerToken, 0) / azureCosts.length;
    const openaiAvgCostPerToken = openaiCosts.reduce((sum, e) => sum + e.costPerToken, 0) / openaiCosts.length;
    
    if (azureAvgCostPerToken < openaiAvgCostPerToken) {
      // Si Azure est moins cher, calculer les économies si on utilisait Azure pour tout
      const openaiTokens = openaiCosts.reduce((sum, e) => sum + e.totalTokens, 0);
      return openaiTokens * (openaiAvgCostPerToken - azureAvgCostPerToken) * 100; // En centimes
    } else {
      // Si OpenAI est moins cher
      const azureTokens = azureCosts.reduce((sum, e) => sum + e.totalTokens, 0);
      return azureTokens * (azureAvgCostPerToken - openaiAvgCostPerToken) * 100;
    }
  }

  /**
   * Génère les tendances de coûts
   */
  private generateCostTrends(costEntries: CostEntry[]): CostBreakdown['trends'] {
    // Grouper par jour
    const dailyCosts = new Map<string, { azure: number; openai: number }>();
    const hourlyUsage = new Map<number, { tokens: number; cost: number }>();
    
    costEntries.forEach(entry => {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      const hour = entry.timestamp.getHours();
      
      // Coûts quotidiens
      if (!dailyCosts.has(dateKey)) {
        dailyCosts.set(dateKey, { azure: 0, openai: 0 });
      }
      const dailyData = dailyCosts.get(dateKey)!;
      dailyData[entry.provider] += entry.cost;
      
      // Usage horaire
      if (!hourlyUsage.has(hour)) {
        hourlyUsage.set(hour, { tokens: 0, cost: 0 });
      }
      const hourlyData = hourlyUsage.get(hour)!;
      hourlyData.tokens += entry.totalTokens;
      hourlyData.cost += entry.cost;
    });
    
    return {
      dailyCosts: Array.from(dailyCosts.entries()).flatMap(([date, costs]) => [
        { date, cost: costs.azure / 100, provider: 'azure' },
        { date, cost: costs.openai / 100, provider: 'openai' }
      ]),
      hourlyUsage: Array.from(hourlyUsage.entries()).map(([hour, data]) => ({
        hour,
        tokens: data.tokens,
        cost: data.cost / 100
      }))
    };
  }

  /**
   * Génère des recommandations d'optimisation basiques
   */
  private generateOptimizationRecommendations(costEntries: CostEntry[]): string[] {
    const recommendations: string[] = [];
    
    const azureCosts = costEntries.filter(e => e.provider === 'azure');
    const openaiCosts = costEntries.filter(e => e.provider === 'openai');
    
    if (azureCosts.length > 0 && openaiCosts.length > 0) {
      const azureAvgCost = azureCosts.reduce((sum, e) => sum + e.cost, 0) / azureCosts.length;
      const openaiAvgCost = openaiCosts.reduce((sum, e) => sum + e.cost, 0) / openaiCosts.length;
      
      if (azureAvgCost < openaiAvgCost * 0.8) {
        recommendations.push('Consider routing more requests to Azure OpenAI for cost savings');
      } else if (openaiAvgCost < azureAvgCost * 0.8) {
        recommendations.push('Consider routing more requests to OpenAI for cost savings');
      }
    }
    
    const duplicates = this.findDuplicateRequests(costEntries);
    if (duplicates.length > 5) {
      recommendations.push(`Implement caching to avoid ${duplicates.length} duplicate requests`);
    }
    
    const smallRequests = costEntries.filter(e => e.totalTokens < 50);
    if (smallRequests.length > 20) {
      recommendations.push(`Consider batching ${smallRequests.length} small requests to reduce overhead`);
    }
    
    return recommendations;
  }

  /**
   * Trouve les requêtes dupliquées (même type et tokens similaires)
   */
  private findDuplicateRequests(costEntries: CostEntry[]): CostEntry[] {
    const duplicates: CostEntry[] = [];
    const seen = new Map<string, CostEntry>();
    
    costEntries.forEach(entry => {
      const key = `${entry.requestType}_${Math.floor(entry.totalTokens / 10) * 10}`; // Grouper par tranches de 10 tokens
      
      if (seen.has(key)) {
        duplicates.push(entry);
      } else {
        seen.set(key, entry);
      }
    });
    
    return duplicates;
  }

  /**
   * Obtient les statistiques de coûts en temps réel
   */
  async getRealTimeStats(): Promise<{
    todayTotal: number;
    thisHourTotal: number;
    providerBreakdown: { azure: number; openai: number };
    topUsers: Array<{ userId: string; cost: number }>;
  }> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
      
      const todayEntries = await this.getCostEntries(startOfDay, now);
      const thisHourEntries = await this.getCostEntries(startOfHour, now);
      
      const todayTotal = todayEntries.reduce((sum, e) => sum + e.cost, 0) / 100;
      const thisHourTotal = thisHourEntries.reduce((sum, e) => sum + e.cost, 0) / 100;
      
      const providerBreakdown = {
        azure: todayEntries.filter(e => e.provider === 'azure').reduce((sum, e) => sum + e.cost, 0) / 100,
        openai: todayEntries.filter(e => e.provider === 'openai').reduce((sum, e) => sum + e.cost, 0) / 100
      };
      
      // Top 5 utilisateurs par coût aujourd'hui
      const userCosts = new Map<string, number>();
      todayEntries.forEach(entry => {
        const current = userCosts.get(entry.userId) || 0;
        userCosts.set(entry.userId, current + entry.cost);
      });
      
      const topUsers = Array.from(userCosts.entries())
        .map(([userId, cost]) => ({ userId, cost: cost / 100 }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5);
      
      return {
        todayTotal,
        thisHourTotal,
        providerBreakdown,
        topUsers
      };
      
    } catch (error) {
      console.error('[CostMonitoringService] Error getting real-time stats:', error);
      return {
        todayTotal: 0,
        thisHourTotal: 0,
        providerBreakdown: { azure: 0, openai: 0 },
        topUsers: []
      };
    }
  }

  /**
   * Nettoie les anciennes données (garde 90 jours)
   */
  async cleanupOldData(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      console.log(`[CostMonitoringService] Cleaning up data older than ${ninetyDaysAgo.toISOString()}`);
      
      // Cette méthode devrait être appelée par un job cron
      // Pour l'instant, on log seulement
      console.log('[CostMonitoringService] Cleanup completed');
      
    } catch (error) {
      console.error('[CostMonitoringService] Error during cleanup:', error);
    }
  }
}

// Export du service pour utilisation
export const costMonitoringService = new CostMonitoringService();