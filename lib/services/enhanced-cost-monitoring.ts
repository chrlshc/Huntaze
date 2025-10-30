/**
 * Enhanced Cost Monitoring Service
 * 
 * Aggregates AWS infrastructure costs and AI usage costs into DynamoDB
 * Provides cost tracking, budget alerts, and anomaly detection
 * 
 * Features:
 * - AWS Cost Explorer integration
 * - AI provider cost tracking (OpenAI, Azure, Anthropic)
 * - Budget threshold monitoring
 * - SNS alerting for overages
 * - TTL-based data retention (90 days)
 */

import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  type GetCostAndUsageCommandInput,
} from '@aws-sdk/client-cost-explorer';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  type PutItemCommandInput,
  type QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  SNSClient,
  PublishCommand,
  type PublishCommandInput,
} from '@aws-sdk/client-sns';

// ============================================================================
// Types
// ============================================================================

export type CostProvider = 'aws' | 'openai' | 'azure' | 'anthropic' | 'other';
export type CostCategory = 'compute' | 'storage' | 'network' | 'ai' | 'database' | 'other';

export interface CostEntry {
  date: string;              // YYYY-MM-DD
  provider: CostProvider;
  service?: string;          // AWS service name or AI model
  category: CostCategory;
  amount: number;            // USD
  units?: number;            // Tokens, GB, hours, etc.
  metadata?: Record<string, any>;
}

export interface BudgetThreshold {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface CostSummary {
  date: string;
  totalCost: number;
  byProvider: Record<CostProvider, number>;
  byCategory: Record<CostCategory, number>;
  topServices: Array<{ service: string; cost: number }>;
}

// ============================================================================
// Enhanced Cost Monitoring Service
// ============================================================================

export class EnhancedCostMonitoring {
  private readonly costExplorer: CostExplorerClient;
  private readonly dynamodb: DynamoDBClient;
  private readonly sns: SNSClient;
  
  private readonly tableName: string;
  private readonly snsTopicArn: string;
  private readonly budgetThresholds: BudgetThreshold;
  private readonly ttlDays: number = 90;

  constructor(config: {
    region?: string;
    tableName?: string;
    snsTopicArn?: string;
    budgetThresholds?: BudgetThreshold;
  } = {}) {
    const region = config.region || process.env.AWS_REGION || 'us-east-1';
    
    this.costExplorer = new CostExplorerClient({ region });
    this.dynamodb = new DynamoDBClient({ region });
    this.sns = new SNSClient({ region });
    
    this.tableName = config.tableName || process.env.DYNAMODB_COSTS_TABLE || 'huntaze-ai-costs-production';
    this.snsTopicArn = config.snsTopicArn || process.env.COST_ALERTS_SNS_TOPIC || '';
    
    this.budgetThresholds = config.budgetThresholds || {
      daily: 50,
      weekly: 300,
      monthly: 1200,
    };
  }

  // ==========================================================================
  // AWS Cost Tracking
  // ==========================================================================

  /**
   * Pull AWS infrastructure costs from Cost Explorer
   */
  async pullAwsCosts(date: string): Promise<void> {
    const nextDay = this.getNextDay(date);
    
    const input: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: date,
        End: nextDay,
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        { Type: 'DIMENSION', Key: 'SERVICE' },
      ],
    };

    try {
      const response = await this.costExplorer.send(new GetCostAndUsageCommand(input));
      
      const results = response.ResultsByTime?.[0];
      if (!results || !results.Groups) {
        console.log(`No cost data for ${date}`);
        return;
      }

      for (const group of results.Groups) {
        const service = group.Keys?.[0] || 'Unknown';
        const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
        
        if (amount > 0) {
          await this.trackCost({
            date,
            provider: 'aws',
            service,
            category: this.categorizeAwsService(service),
            amount,
          });
        }
      }

      console.log(`✅ Pulled AWS costs for ${date}: ${results.Groups.length} services`);
    } catch (error) {
      console.error(`Failed to pull AWS costs for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Categorize AWS service into cost category
   */
  private categorizeAwsService(service: string): CostCategory {
    const serviceUpper = service.toUpperCase();
    
    if (serviceUpper.includes('EC2') || serviceUpper.includes('ECS') || serviceUpper.includes('LAMBDA')) {
      return 'compute';
    }
    if (serviceUpper.includes('S3') || serviceUpper.includes('EBS')) {
      return 'storage';
    }
    if (serviceUpper.includes('RDS') || serviceUpper.includes('DYNAMODB') || serviceUpper.includes('ELASTICACHE')) {
      return 'database';
    }
    if (serviceUpper.includes('DATA TRANSFER') || serviceUpper.includes('CLOUDFRONT')) {
      return 'network';
    }
    if (serviceUpper.includes('BEDROCK') || serviceUpper.includes('SAGEMAKER')) {
      return 'ai';
    }
    
    return 'other';
  }

  // ==========================================================================
  // AI Cost Tracking
  // ==========================================================================

  /**
   * Track AI provider costs (OpenAI, Azure, Anthropic)
   */
  async trackAICost(params: {
    date: string;
    provider: 'openai' | 'azure' | 'anthropic';
    model: string;
    tokens: number;
    costPerToken: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const amount = params.tokens * params.costPerToken;
    
    await this.trackCost({
      date: params.date,
      provider: params.provider,
      service: params.model,
      category: 'ai',
      amount,
      units: params.tokens,
      metadata: params.metadata,
    });
  }

  // ==========================================================================
  // Generic Cost Tracking
  // ==========================================================================

  /**
   * Track a cost entry in DynamoDB
   */
  async trackCost(entry: CostEntry): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + (this.ttlDays * 24 * 3600);
    
    const pk = `COST#${entry.date}#${entry.provider}`;
    const sk = `${entry.category}#${entry.service || 'unknown'}#${Date.now()}`;
    
    const item: PutItemCommandInput = {
      TableName: this.tableName,
      Item: {
        pk: { S: pk },
        sk: { S: sk },
        date: { S: entry.date },
        provider: { S: entry.provider },
        service: { S: entry.service || 'unknown' },
        category: { S: entry.category },
        amount: { N: entry.amount.toFixed(6) },
        ...(entry.units && { units: { N: entry.units.toString() } }),
        ...(entry.metadata && { metadata: { S: JSON.stringify(entry.metadata) } }),
        ttl: { N: ttl.toString() },
        createdAt: { S: new Date().toISOString() },
      },
    };

    try {
      await this.dynamodb.send(new PutItemCommand(item));
    } catch (error) {
      console.error('Failed to track cost:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Cost Queries
  // ==========================================================================

  /**
   * Get daily costs summary
   */
  async getDailyCosts(date: string): Promise<CostSummary> {
    const costs: CostEntry[] = [];
    
    // Query all providers for the date
    const providers: CostProvider[] = ['aws', 'openai', 'azure', 'anthropic', 'other'];
    
    for (const provider of providers) {
      const pk = `COST#${date}#${provider}`;
      
      const input: QueryCommandInput = {
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': { S: pk },
        },
      };

      try {
        const response = await this.dynamodb.send(new QueryCommand(input));
        
        if (response.Items) {
          for (const item of response.Items) {
            costs.push({
              date: item.date?.S || date,
              provider: item.provider?.S as CostProvider || provider,
              service: item.service?.S,
              category: item.category?.S as CostCategory || 'other',
              amount: parseFloat(item.amount?.N || '0'),
              units: item.units?.N ? parseInt(item.units.N) : undefined,
              metadata: item.metadata?.S ? JSON.parse(item.metadata.S) : undefined,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to query costs for ${provider}:`, error);
      }
    }

    return this.aggregateCosts(date, costs);
  }

  /**
   * Get costs by provider
   */
  async getCostsByProvider(date: string, provider: CostProvider): Promise<number> {
    const pk = `COST#${date}#${provider}`;
    
    const input: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: pk },
      },
      ProjectionExpression: 'amount',
    };

    try {
      const response = await this.dynamodb.send(new QueryCommand(input));
      
      if (!response.Items) {
        return 0;
      }

      return response.Items.reduce((sum, item) => {
        return sum + parseFloat(item.amount?.N || '0');
      }, 0);
    } catch (error) {
      console.error(`Failed to get costs for ${provider}:`, error);
      return 0;
    }
  }

  /**
   * Get costs by category
   */
  async getCostsByCategory(date: string, category: CostCategory): Promise<number> {
    // This requires a GSI on category, or we scan all providers
    const summary = await this.getDailyCosts(date);
    return summary.byCategory[category] || 0;
  }

  // ==========================================================================
  // Budget Monitoring
  // ==========================================================================

  /**
   * Check if daily budget threshold is exceeded
   */
  async checkDailyBudget(date: string): Promise<void> {
    const summary = await this.getDailyCosts(date);
    
    if (summary.totalCost > this.budgetThresholds.daily) {
      await this.sendBudgetAlert({
        period: 'daily',
        date,
        threshold: this.budgetThresholds.daily,
        actual: summary.totalCost,
        summary,
      });
    }
  }

  /**
   * Check if weekly budget threshold is exceeded
   */
  async checkWeeklyBudget(endDate: string): Promise<void> {
    const dates = this.getLastNDays(endDate, 7);
    let totalCost = 0;
    
    for (const date of dates) {
      const summary = await this.getDailyCosts(date);
      totalCost += summary.totalCost;
    }
    
    if (totalCost > this.budgetThresholds.weekly) {
      await this.sendBudgetAlert({
        period: 'weekly',
        date: endDate,
        threshold: this.budgetThresholds.weekly,
        actual: totalCost,
      });
    }
  }

  /**
   * Send budget alert via SNS
   */
  private async sendBudgetAlert(params: {
    period: 'daily' | 'weekly' | 'monthly';
    date: string;
    threshold: number;
    actual: number;
    summary?: CostSummary;
  }): Promise<void> {
    if (!this.snsTopicArn) {
      console.warn('SNS topic ARN not configured, skipping alert');
      return;
    }

    const message = `
🚨 Budget Alert: ${params.period.toUpperCase()} threshold exceeded

Date: ${params.date}
Threshold: $${params.threshold.toFixed(2)}
Actual: $${params.actual.toFixed(2)}
Overage: $${(params.actual - params.threshold).toFixed(2)} (${((params.actual / params.threshold - 1) * 100).toFixed(1)}%)

${params.summary ? `
Breakdown:
${Object.entries(params.summary.byProvider)
  .filter(([_, cost]) => cost > 0)
  .map(([provider, cost]) => `  ${provider}: $${cost.toFixed(2)}`)
  .join('\n')}
` : ''}

Action required: Review costs and optimize spending.
    `.trim();

    const input: PublishCommandInput = {
      TopicArn: this.snsTopicArn,
      Subject: `Budget Alert: ${params.period} threshold exceeded`,
      Message: message,
    };

    try {
      await this.sns.send(new PublishCommand(input));
      console.log(`✅ Budget alert sent for ${params.period} on ${params.date}`);
    } catch (error) {
      console.error('Failed to send budget alert:', error);
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private aggregateCosts(date: string, costs: CostEntry[]): CostSummary {
    const byProvider: Record<CostProvider, number> = {
      aws: 0,
      openai: 0,
      azure: 0,
      anthropic: 0,
      other: 0,
    };
    
    const byCategory: Record<CostCategory, number> = {
      compute: 0,
      storage: 0,
      network: 0,
      ai: 0,
      database: 0,
      other: 0,
    };
    
    const serviceMap = new Map<string, number>();
    
    for (const cost of costs) {
      byProvider[cost.provider] += cost.amount;
      byCategory[cost.category] += cost.amount;
      
      if (cost.service) {
        serviceMap.set(cost.service, (serviceMap.get(cost.service) || 0) + cost.amount);
      }
    }
    
    const topServices = Array.from(serviceMap.entries())
      .map(([service, cost]) => ({ service, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
    
    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    
    return {
      date,
      totalCost,
      byProvider,
      byCategory,
      topServices,
    };
  }

  private getNextDay(date: string): string {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  private getLastNDays(endDate: string, n: number): string[] {
    const dates: string[] = [];
    const d = new Date(endDate);
    
    for (let i = 0; i < n; i++) {
      dates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() - 1);
    }
    
    return dates.reverse();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: EnhancedCostMonitoring | null = null;

export function getEnhancedCostMonitoring(): EnhancedCostMonitoring {
  if (!instance) {
    instance = new EnhancedCostMonitoring();
  }
  return instance;
}
