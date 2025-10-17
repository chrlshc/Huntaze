import { EventEmitter } from 'events';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { WebSocketManager } from '@/lib/websocket/websocket-manager';

export type AnalyticsEventType =
  | 'pageview'
  | 'message_sent'
  | 'message_received'
  | 'purchase'
  | 'tip'
  | 'content_unlock'
  | 'subscription_start'
  | 'subscription_end'
  | 'profile_view'
  | 'ai_suggestion_used'
  | 'ai_suggestion_rejected';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: AnalyticsEventType;
  metadata: {
    fanId?: string;
    amount?: number;
    contentId?: string;
    aiPersonality?: string;
    aiConfidence?: number;
    duration?: number;
    source?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface RealtimeMetrics {
  activeUsers: number;
  messagesPerMinute: number;
  revenueToday: number;
  newSubscribers: number;
  aiSuggestionsAccepted: number;
  topPerformingContent: Array<{
    contentId: string;
    revenue: number;
    unlocks: number;
  }>;
}

export interface FanEngagementMetrics {
  fanId: string;
  engagementScore: number;
  lastActiveTime: Date;
  messageFrequency: number;
  purchaseFrequency: number;
  averageSpend: number;
  lifetimeValue: number;
  riskScore: number;
}

class RealtimeAnalytics extends EventEmitter {
  private dynamodb: DynamoDBClient;
  private wsManager: WebSocketManager;
  private metricsCache: Map<string, any>;
  private eventBuffer: AnalyticsEvent[];
  private flushInterval: NodeJS.Timeout;
  private aggregationInterval: NodeJS.Timeout;

  constructor() {
    super();
    this.dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.wsManager = WebSocketManager.getInstance();
    this.metricsCache = new Map();
    this.eventBuffer = [];

    this.flushInterval = setInterval(() => this.flushEvents(), 5000);
    this.aggregationInterval = setInterval(() => this.updateAggregatedMetrics(), 10000);

    this.setupWebSocketHandlers();
  }

  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
    };

    this.eventBuffer.push(fullEvent);
    this.emit('event', fullEvent);

    await this.wsManager.broadcast({
      type: 'analytics_event',
      data: fullEvent,
    });

    this.updateRealtimeMetrics(fullEvent);
  }

  async trackPageView(userId: string, page: string, source?: string): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'pageview',
      metadata: { page, source },
    });
  }

  async trackMessage(
    userId: string,
    fanId: string,
    type: 'sent' | 'received',
    aiUsed?: boolean,
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: type === 'sent' ? 'message_sent' : 'message_received',
      metadata: { fanId, aiUsed },
    });
  }

  async trackTransaction(
    userId: string,
    fanId: string,
    type: 'purchase' | 'tip' | 'subscription_start',
    amount: number,
    contentId?: string,
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: type,
      metadata: { fanId, amount, contentId },
    });

    this.updateRevenueMetrics(amount);
  }

  async trackAIInteraction(
    userId: string,
    fanId: string,
    personality: string,
    confidence: number,
    accepted: boolean,
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: accepted ? 'ai_suggestion_used' : 'ai_suggestion_rejected',
      metadata: { fanId, aiPersonality: personality, aiConfidence: confidence },
    });
  }

  getRealtimeMetrics(): RealtimeMetrics {
    return {
      activeUsers: this.metricsCache.get('activeUsers') || 0,
      messagesPerMinute: this.metricsCache.get('messagesPerMinute') || 0,
      revenueToday: this.metricsCache.get('revenueToday') || 0,
      newSubscribers: this.metricsCache.get('newSubscribers') || 0,
      aiSuggestionsAccepted: this.metricsCache.get('aiSuggestionsAccepted') || 0,
      topPerformingContent: this.metricsCache.get('topPerformingContent') || [],
    };
  }

  async getFanEngagementMetrics(fanId: string): Promise<FanEngagementMetrics> {
    const params = {
      TableName: 'huntaze-analytics-events',
      KeyConditionExpression: 'fanId = :fanId',
      ExpressionAttributeValues: {
        ':fanId': { S: fanId },
      },
      Limit: 100,
      ScanIndexForward: false,
    };

    const result = await this.dynamodb.send(new QueryCommand(params));
    const events = result.Items || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEvents = events.filter((event) => new Date(parseInt(event.timestamp.N!, 10)) > thirtyDaysAgo);
    const messageEvents = recentEvents.filter((event) => event.eventType.S?.includes('message'));
    const purchaseEvents = recentEvents.filter((event) =>
      ['purchase', 'tip', 'content_unlock'].includes(event.eventType.S || ''),
    );

    const totalSpend = purchaseEvents.reduce(
      (sum, event) => sum + parseFloat(event.metadata?.M?.amount?.N || '0'),
      0,
    );

    const lastActiveTime = events.length > 0 ? new Date(parseInt(events[0].timestamp.N!, 10)) : new Date();
    const daysSinceLastActive = (now.getTime() - lastActiveTime.getTime()) / (1000 * 60 * 60 * 24);

    const engagementScore = Math.min(
      100,
      Math.round(messageEvents.length * 2 + purchaseEvents.length * 10 + Math.max(0, 30 - daysSinceLastActive) * 2),
    );

    const riskScore = Math.min(
      100,
      Math.round(
        daysSinceLastActive * 3 + Math.max(0, 14 - messageEvents.length) * 5 + (purchaseEvents.length === 0 ? 20 : 0),
      ),
    );

    return {
      fanId,
      engagementScore,
      lastActiveTime,
      messageFrequency: messageEvents.length / 30,
      purchaseFrequency: purchaseEvents.length / 30,
      averageSpend: purchaseEvents.length > 0 ? totalSpend / purchaseEvents.length : 0,
      lifetimeValue: totalSpend,
      riskScore,
    };
  }

  async getPerformanceInsights(userId: string, timeRange: '1h' | '24h' | '7d' | '30d') {
    const now = new Date();
    const startTime = this.getStartTime(now, timeRange);

    const params = {
      TableName: 'huntaze-analytics-events',
      KeyConditionExpression: 'userId = :userId AND #ts BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':start': { N: startTime.getTime().toString() },
        ':end': { N: now.getTime().toString() },
      },
    };

    const result = await this.dynamodb.send(new QueryCommand(params));
    const items = result.Items || [];

    const insights = {
      totalRevenue: 0,
      totalMessages: 0,
      totalPurchases: 0,
      aiAcceptanceRate: 0,
      topFans: new Map<string, number>(),
      hourlyActivity: new Array(24).fill(0),
      contentPerformance: new Map<string, { revenue: number; unlocks: number }>(),
    };

    let aiSuggestions = 0;
    let aiAccepted = 0;

    for (const item of items) {
      const eventType = item.eventType.S!;
      const metadata = item.metadata?.M || {};

      if (['purchase', 'tip', 'content_unlock'].includes(eventType)) {
        const amount = parseFloat(metadata.amount?.N || '0');
        insights.totalRevenue += amount;
        insights.totalPurchases += 1;

        const fanId = metadata.fanId?.S;
        if (fanId) {
          insights.topFans.set(fanId, (insights.topFans.get(fanId) || 0) + amount);
        }

        const contentId = metadata.contentId?.S;
        if (contentId) {
          const current = insights.contentPerformance.get(contentId) || { revenue: 0, unlocks: 0 };
          current.revenue += amount;
          current.unlocks += 1;
          insights.contentPerformance.set(contentId, current);
        }
      }

      if (eventType.includes('message')) {
        insights.totalMessages += 1;
      }

      if (eventType === 'ai_suggestion_used') {
        aiAccepted += 1;
        aiSuggestions += 1;
      } else if (eventType === 'ai_suggestion_rejected') {
        aiSuggestions += 1;
      }

      const hour = new Date(parseInt(item.timestamp.N!, 10)).getHours();
      insights.hourlyActivity[hour] += 1;
    }

    if (aiSuggestions > 0) {
      insights.aiAcceptanceRate = (aiAccepted / aiSuggestions) * 100;
    }

    const topFans = Array.from(insights.topFans.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topContent = Array.from(insights.contentPerformance.entries())
      .map(([id, data]) => ({ contentId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      timeRange,
      period: { start: startTime, end: now },
      revenue: {
        total: insights.totalRevenue,
        averagePerPurchase: insights.totalPurchases > 0 ? insights.totalRevenue / insights.totalPurchases : 0,
      },
      activity: {
        totalMessages: insights.totalMessages,
        totalPurchases: insights.totalPurchases,
        messagesPerHour: insights.totalMessages / this.getHoursDiff(startTime, now),
        hourlyDistribution: insights.hourlyActivity,
      },
      ai: {
        acceptanceRate: insights.aiAcceptanceRate,
        totalSuggestions: aiSuggestions,
        accepted: aiAccepted,
      },
      topFans,
      topContent,
    };
  }

  private setupWebSocketHandlers(): void {
    this.wsManager.on('connection', (connectionId: string) => {
      void this.wsManager.sendToConnection(connectionId, {
        type: 'initial_metrics',
        data: this.getRealtimeMetrics(),
      });
    });

    this.wsManager.on('message', async (payload: any) => {
      if (payload.type === 'request_metrics') {
        await this.wsManager.sendToConnection(payload.connectionId, {
          type: 'metrics_update',
          data: this.getRealtimeMetrics(),
        });
      }
    });
  }

  private updateRealtimeMetrics(event: AnalyticsEvent): void {
    const activeUsers = this.metricsCache.get('activeUsersSet') || new Set<string>();
    activeUsers.add(event.userId);
    this.metricsCache.set('activeUsersSet', activeUsers);
    this.metricsCache.set('activeUsers', activeUsers.size);

    if (event.eventType.includes('message')) {
      const now = Date.now();
      const timestamps: number[] = this.metricsCache.get('messageTimestamps') || [];
      timestamps.push(now);
      const threshold = now - 60000;
      const recent = timestamps.filter((timestamp) => timestamp > threshold);
      this.metricsCache.set('messageTimestamps', recent);
      this.metricsCache.set('messagesPerMinute', recent.length);
    }

    if (event.eventType === 'ai_suggestion_used') {
      const accepted = this.metricsCache.get('aiSuggestionsAccepted') || 0;
      this.metricsCache.set('aiSuggestionsAccepted', accepted + 1);
    }

    if (event.eventType === 'subscription_start') {
      const subscribers = this.metricsCache.get('newSubscribers') || 0;
      this.metricsCache.set('newSubscribers', subscribers + 1);
    }

    if (['purchase', 'tip', 'content_unlock'].includes(event.eventType)) {
      const contentId = event.metadata.contentId;
      if (!contentId) {
        return;
      }

      const current = this.metricsCache.get('topPerformingContent') || new Map<string, { revenue: number; unlocks: number }>();
      const record = current.get(contentId) || { revenue: 0, unlocks: 0 };
      record.revenue += event.metadata.amount || 0;
      record.unlocks += 1;
      current.set(contentId, record);

      const sorted = Array.from(current.entries())
        .map(([id, data]) => ({ contentId: id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      this.metricsCache.set('topPerformingContent', sorted);
    }
  }

  private updateRevenueMetrics(amount: number): void {
    const revenue = this.metricsCache.get('revenueToday') || 0;
    this.metricsCache.set('revenueToday', revenue + amount);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    for (const event of events) {
      const input = {
        TableName: 'huntaze-analytics-events',
        Item: {
          eventId: { S: event.id },
          userId: { S: event.userId },
          eventType: { S: event.eventType },
          metadata: { M: this.marshalMetadata(event.metadata) },
          timestamp: { N: event.timestamp.getTime().toString() },
          ttl: { N: Math.floor(event.timestamp.getTime() / 1000 + 30 * 24 * 60 * 60).toString() },
        },
      };

      try {
        await this.dynamodb.send(new PutItemCommand(input));
      } catch (error) {
        console.error('Failed to write analytics event', error);
      }
    }
  }

  private async updateAggregatedMetrics(): Promise<void> {
    const metrics = this.getRealtimeMetrics();
    await this.wsManager.broadcast({
      type: 'metrics_update',
      data: metrics,
    });
  }

  private marshalMetadata(metadata: Record<string, any>): any {
    const marshalled: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        marshalled[key] = { S: value };
      } else if (typeof value === 'number') {
        marshalled[key] = { N: value.toString() };
      } else if (typeof value === 'boolean') {
        marshalled[key] = { BOOL: value };
      }
    }

    return marshalled;
  }

  private getStartTime(now: Date, range: '1h' | '24h' | '7d' | '30d'): Date {
    const start = new Date(now);

    switch (range) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      default:
        break;
    }

    return start;
  }

  private getHoursDiff(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  destroy(): void {
    clearInterval(this.flushInterval);
    clearInterval(this.aggregationInterval);
    this.removeAllListeners();
  }
}

export const realtimeAnalytics = new RealtimeAnalytics();
export const analytics = realtimeAnalytics;
