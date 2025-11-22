/**
 * Data Integration Examples
 * 
 * Practical examples of using data integration functions with AI agents
 */

import { MessagingAgent } from './agents/messaging';
import { ContentAgent } from './agents/content';
import { AnalyticsAgent } from './agents/analytics';
import { SalesAgent } from './agents/sales';
import {
  getMessagingContext,
  getContentContext,
  getAnalyticsContext,
  getSalesContext,
  linkInsightToCampaign,
  getCampaignInsights,
  getPlatformContext,
  getRecentContentPerformance,
} from './data-integration';

/**
 * Example 1: Generate fan message with full context
 */
export async function generateContextualFanMessage(
  userId: number,
  fanId: string,
  fanMessage: string
) {
  // Get comprehensive messaging context
  const context = await getMessagingContext(userId, fanId);

  // Initialize agent
  const agent = new MessagingAgent();

  // Generate response with enriched context
  const response = await agent.generateResponse(
    userId,
    fanId,
    fanMessage,
    {
      fanHistory: context.recentSuccessfulInteractions.map(insight => ({
        type: insight.type,
        data: insight.data,
        confidence: insight.confidence,
      })),
      creatorStyle: 'friendly and engaging', // Could be fetched from user preferences
      previousMessages: [], // Add from your message history system
    }
  );

  return {
    message: response.response,
    confidence: response.confidence,
    suggestedUpsell: response.suggestedUpsell,
    context: {
      fanIsSubscribed: context.fanSubscription?.isActive || false,
      fanTier: context.fanSubscription?.tier,
      userResponseRate: context.stats.responseRate,
      userRevenue: context.stats.revenue,
    },
    usage: response.usage,
  };
}

/**
 * Example 2: Generate platform-optimized caption
 */
export async function generatePlatformCaption(
  userId: number,
  platform: string,
  contentDescription: string
) {
  // Get content context for specific platform
  const context = await getContentContext(userId, platform);

  // Initialize agent
  const agent = new ContentAgent();

  // Analyze recent content performance for this platform
  const platformContent = context.recentContent.filter(
    c => c.platform === platform
  );

  // Generate caption with platform-specific insights
  const result = await agent.generateCaption(
    userId,
    platform,
    {
      type: 'photo',
      description: contentDescription,
      mood: 'engaging',
      targetAudience: 'existing fans',
    }
  );

  return {
    caption: result.caption,
    hashtags: result.hashtags,
    confidence: result.confidence,
    insights: {
      recentPostCount: platformContent.length,
      activeCampaigns: context.campaigns.filter(c => c.status === 'active').length,
      successfulStrategies: context.contentStrategies.length,
    },
    usage: result.usage,
  };
}

/**
 * Example 3: Comprehensive performance analysis
 */
export async function analyzeCreatorPerformance(
  userId: number,
  timeframe: string = 'last 30 days'
) {
  // Get full analytics context
  const context = await getAnalyticsContext(userId);

  // Initialize agent
  const agent = new AnalyticsAgent();

  // Prepare metrics data
  const metricsData = {
    engagement: {
      messagesCount: context.stats.messagesCount,
      messagesTrend: context.stats.messagesTrend,
      responseRate: context.stats.responseRate,
      activeChats: context.stats.activeChats,
    },
    revenue: {
      total: context.revenue.totalRevenue,
      byPlatform: context.revenue.revenueByPlatform,
      average: context.revenue.averageTransaction,
      transactions: context.revenue.transactions.length,
    },
    subscriptions: {
      active: context.subscriptions.activeSubscriptions,
      total: context.subscriptions.totalRevenue,
      average: context.subscriptions.averageSubscriptionValue,
      platforms: context.subscriptions.platforms,
    },
    content: {
      totalPosts: context.content.length,
      platforms: context.platforms,
      recentPosts: context.content.slice(0, 5),
    },
    campaigns: {
      total: context.campaigns.length,
      active: context.campaigns.filter(c => c.status === 'active').length,
    },
  };

  // Analyze performance
  const analysis = await agent.analyzePerformance(
    userId,
    {
      timeframe,
      platforms: context.platforms as string[],
      data: metricsData,
    }
  );

  return {
    insights: analysis.insights,
    patterns: analysis.patterns,
    predictions: analysis.predictions,
    recommendations: analysis.recommendations,
    confidence: analysis.confidence,
    rawData: metricsData,
    usage: analysis.usage,
  };
}

/**
 * Example 4: Optimize sales message for specific fan
 */
export async function optimizeSalesForFan(
  userId: number,
  fanId: string,
  contentType: string,
  pricePoint: number
) {
  // Get sales context with fan details
  const context = await getSalesContext(userId, fanId);

  // Initialize agent
  const agent = new SalesAgent();

  // Determine engagement level based on subscription
  let engagementLevel = 'low';
  if (context.fanSubscription?.isActive) {
    const daysSinceStart = context.fanSubscription.daysSinceStart;
    if (daysSinceStart > 90) {
      engagementLevel = 'high';
    } else if (daysSinceStart > 30) {
      engagementLevel = 'medium';
    }
  }

  // Optimize sales message
  const result = await agent.optimizeSalesMessage(
    userId,
    fanId,
    {
      fanHistory: context.fanSubscription,
      purchaseHistory: context.fanPurchaseHistory || [],
      engagementLevel,
      contentType,
      pricePoint,
    }
  );

  return {
    message: result.message,
    tactics: result.tactics,
    suggestedPrice: result.suggestedPrice,
    confidence: result.confidence,
    fanContext: {
      isSubscribed: context.fanSubscription?.isActive || false,
      tier: context.fanSubscription?.tier,
      daysSinceStart: context.fanSubscription?.daysSinceStart,
      previousPurchases: context.fanPurchaseHistory?.length || 0,
      engagementLevel,
    },
    usage: result.usage,
  };
}

/**
 * Example 5: Link AI insights to marketing campaign
 */
export async function enrichCampaignWithAIInsights(
  userId: number,
  campaignId: string
) {
  // Get existing campaign insights
  const existingInsights = await getCampaignInsights(userId, campaignId);

  // Get recent AI insights that could be relevant
  const { getRecentAIInsights } = await import('./data-integration');
  const recentInsights = await getRecentAIInsights(userId, undefined, 20);

  // Filter insights that are relevant to the campaign
  // (In a real implementation, you'd have more sophisticated matching)
  const relevantInsights = recentInsights.filter(
    insight => 
      insight.confidence > 0.7 &&
      !existingInsights.some(ei => ei.insightId === insight.id)
  );

  // Link relevant insights to campaign
  for (const insight of relevantInsights.slice(0, 5)) {
    await linkInsightToCampaign(userId, insight.id, campaignId);
  }

  // Get updated insights
  const updatedInsights = await getCampaignInsights(userId, campaignId);

  return {
    campaignId,
    totalInsights: updatedInsights.length,
    newInsightsAdded: relevantInsights.length,
    insights: updatedInsights,
  };
}

/**
 * Example 6: Get platform-specific recommendations
 */
export async function getPlatformRecommendations(
  userId: number,
  platform: string
) {
  // Get platform context
  const platformContext = await getPlatformContext(userId, platform);

  if (!platformContext) {
    return {
      connected: false,
      message: `Platform ${platform} is not connected`,
    };
  }

  // Get content performance for this platform
  const allContent = await getRecentContentPerformance(userId, 50);
  const platformContent = allContent.filter(c => c.platform === platform);

  // Analyze content performance
  const avgEngagement = platformContent.reduce((sum, content) => {
    const engagement = (content.metadata as any)?.engagement || 0;
    return sum + engagement;
  }, 0) / platformContent.length;

  // Get AI insights for this platform
  const { getRecentAIInsights } = await import('./data-integration');
  const insights = await getRecentAIInsights(userId, 'content_strategy', 10);
  const platformInsights = insights.filter(
    insight => (insight.data as any).platform === platform
  );

  return {
    connected: true,
    platform,
    accountId: platformContext.accountId,
    connectedSince: platformContext.connectedSince,
    performance: {
      totalPosts: platformContent.length,
      averageEngagement: avgEngagement,
      recentPosts: platformContent.slice(0, 5),
    },
    aiInsights: platformInsights.map(insight => ({
      type: insight.type,
      confidence: insight.confidence,
      data: insight.data,
    })),
    recommendations: [
      avgEngagement < 100 ? 'Consider posting more engaging content' : null,
      platformContent.length < 10 ? 'Increase posting frequency' : null,
      platformInsights.length === 0 ? 'Use AI to generate optimized captions' : null,
    ].filter(Boolean),
  };
}

/**
 * Example 7: Multi-platform content strategy
 */
export async function generateMultiPlatformStrategy(userId: number) {
  // Get content context for all platforms
  const context = await getContentContext(userId);

  // Analyze performance by platform
  const platformPerformance = context.platforms.map(platform => {
    const platformContent = context.recentContent.filter(
      c => c.platform === platform
    );

    return {
      platform,
      postCount: platformContent.length,
      recentPosts: platformContent.slice(0, 3),
    };
  });

  // Get AI insights for content strategy
  const strategyInsights = context.contentStrategies;

  // Generate recommendations for each platform
  const recommendations = platformPerformance.map(perf => ({
    platform: perf.platform,
    currentActivity: perf.postCount > 5 ? 'active' as const : 'low' as const,
    recommendation: perf.postCount < 5
      ? 'Increase posting frequency'
      : 'Maintain current posting schedule',
    aiInsights: strategyInsights
      .filter(insight => (insight.data as any).platform === perf.platform)
      .slice(0, 3),
  }));

  return {
    userId,
    platforms: context.platforms,
    totalContent: context.recentContent.length,
    activeCampaigns: context.campaigns.filter(c => c.status === 'active').length,
    platformRecommendations: recommendations,
    overallStrategy: {
      focusPlatforms: platformPerformance
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 2)
        .map(p => p.platform) as string[],
      needsAttention: platformPerformance
        .filter(p => p.postCount < 3)
        .map(p => p.platform) as string[],
    },
  };
}

/**
 * Example 8: Revenue optimization analysis
 */
export async function analyzeRevenueOptimization(userId: number) {
  // Get sales context
  const context = await getSalesContext(userId);

  // Analyze transaction patterns
  const transactions = context.transactions.transactions;
  const completedTransactions = transactions.filter(t => t.status === 'completed');

  // Calculate metrics
  const metrics = {
    totalRevenue: context.transactions.totalRevenue,
    transactionCount: completedTransactions.length,
    averageTransaction: context.transactions.averageTransaction,
    revenueByPlatform: context.transactions.revenueByPlatform,
    conversionRate: context.subscriptions.activeSubscriptions / 
      (context.subscriptions.activeSubscriptions + 10), // Estimate
  };

  // Get successful sales tactics
  const successfulTactics = context.successfulTactics
    .filter(insight => insight.confidence > 0.7)
    .map(insight => ({
      tactic: (insight.data as any).primaryTactic,
      confidence: insight.confidence,
    }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (metrics.averageTransaction < 20) {
    recommendations.push('Consider increasing price points for premium content');
  }

  if (metrics.conversionRate < 0.1) {
    recommendations.push('Focus on improving conversion tactics');
  }

  if (successfulTactics.length > 0) {
    const topTactic = successfulTactics[0].tactic;
    recommendations.push(`Continue using "${topTactic}" - it has high success rate`);
  }

  return {
    metrics,
    successfulTactics,
    recommendations,
    opportunities: {
      upsellPotential: context.subscriptions.activeSubscriptions * 
        (30 - metrics.averageTransaction),
      platformExpansion: Object.keys(metrics.revenueByPlatform).length < 3,
    },
  };
}
