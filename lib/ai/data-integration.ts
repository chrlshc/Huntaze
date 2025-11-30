/**
 * AI Data Integration
 * 
 * Utilities for integrating AI insights with existing application data
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { db as prisma } from '@/lib/prisma';

/**
 * Get platform context from OAuth accounts
 * Provides platform-specific information for AI agents
 */
export async function getPlatformContext(userId: number, platform: string) {
  const oauthAccount = await prisma.oauth_accounts.findFirst({
    where: {
      user_id: userId,
      provider: platform,
    },
    select: {
      provider_account_id: true,
      metadata: true,
      created_at: true,
    },
  });

  if (!oauthAccount) {
    return null;
  }

  return {
    accountId: oauthAccount.provider_account_id,
    metadata: oauthAccount.metadata as Record<string, any>,
    connectedSince: oauthAccount.created_at,
  };
}

/**
 * Get all connected platforms for a user
 */
export async function getUserPlatforms(userId: number) {
  const accounts = await prisma.oauth_accounts.findMany({
    where: {
      user_id: userId,
    },
    select: {
      provider: true,
      provider_account_id: true,
      metadata: true,
    },
  });

  return accounts.map(account => ({
    platform: account.provider,
    accountId: account.provider_account_id,
    metadata: account.metadata as Record<string, any>,
  }));
}

/**
 * Link AI insight with marketing campaign
 * Stores AI insights in campaign stats for future reference
 */
export async function linkInsightToCampaign(
  userId: number,
  insightId: string,
  campaignId: string
) {
  // Get the insight
  const insight = await prisma.aIInsight.findUnique({
    where: { id: insightId },
  });

  if (!insight || insight.creatorId !== userId) {
    return null;
  }

  // Get current campaign
  const campaign = await prisma.marketing_campaigns.findUnique({
    where: { id: campaignId },
    select: { stats: true, user_id: true },
  });

  if (!campaign || campaign.user_id !== userId) {
    return null;
  }

  // Update campaign with AI insight
  const currentStats = (campaign.stats as any) || {};
  const aiInsights = currentStats.aiInsights || [];

  await prisma.marketing_campaigns.update({
    where: { id: campaignId },
    data: {
      stats: {
        ...currentStats,
        aiInsights: [
          ...aiInsights,
          {
            insightId: insight.id,
            type: insight.type,
            confidence: insight.confidence,
            data: insight.data,
            timestamp: insight.createdAt.toISOString(),
          },
        ],
      },
    },
  });

  return true;
}

/**
 * Get AI insights for a campaign
 */
export async function getCampaignInsights(userId: number, campaignId: string) {
  const campaign = await prisma.marketing_campaigns.findUnique({
    where: { id: campaignId },
    select: {
      stats: true,
      user_id: true,
    },
  });

  if (!campaign || campaign.user_id !== userId) {
    return [];
  }

  const aiInsights = ((campaign.stats as any)?.aiInsights || []) as Array<{
    insightId: string;
    type: string;
    confidence: number;
    data: any;
    timestamp: string;
  }>;

  return aiInsights;
}

/**
 * Get user statistics context for AI enrichment
 * Provides messaging and engagement data to AI agents
 */
export async function getUserStatsContext(userId: number) {
  const stats = await prisma.user_stats.findUnique({
    where: { user_id: userId },
  });

  if (!stats) {
    return {
      messagesCount: 0,
      messagesTrend: 0,
      responseRate: 0,
      revenue: 0,
      revenueTrend: 0,
      activeChats: 0,
    };
  }

  return {
    messagesCount: stats.messages_sent,
    messagesTrend: stats.messages_trend,
    responseRate: stats.response_rate,
    revenue: stats.revenue,
    revenueTrend: stats.revenue_trend,
    activeChats: stats.active_chats,
  };
}

/**
 * Get subscription context for sales optimization
 * Provides revenue and subscription data to AI agents
 */
export async function getSubscriptionContext(userId: number) {
  const subscriptions = await prisma.subscriptions.findMany({
    where: {
      user_id: userId,
      status: 'active',
    },
    select: {
      tier: true,
      amount: true,
      platform: true,
      started_at: true,
      fan_id: true,
    },
  });

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const platforms = [...new Set(subscriptions.map(s => s.platform))];

  return {
    activeSubscriptions: subscriptions.length,
    totalRevenue,
    platforms,
    averageSubscriptionValue: subscriptions.length > 0
      ? totalRevenue / subscriptions.length
      : 0,
    subscriptionsByPlatform: subscriptions.reduce((acc, sub) => {
      acc[sub.platform] = (acc[sub.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Get fan subscription info for personalized messaging
 */
export async function getFanSubscriptionInfo(userId: number, fanId: string) {
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      user_id: userId,
      fan_id: fanId,
    },
    select: {
      tier: true,
      amount: true,
      status: true,
      started_at: true,
      platform: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!subscription) {
    return null;
  }

  const daysSinceStart = Math.floor(
    (Date.now() - subscription.started_at.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    tier: subscription.tier,
    amount: subscription.amount,
    status: subscription.status,
    daysSinceStart,
    platform: subscription.platform,
    isActive: subscription.status === 'active',
  };
}

/**
 * Get recent content performance for AI context
 */
export async function getRecentContentPerformance(userId: number, limit = 10) {
  const recentContent = await prisma.content.findMany({
    where: {
      user_id: userId,
      status: 'published',
    },
    select: {
      platform: true,
      type: true,
      metadata: true,
      published_at: true,
    },
    orderBy: {
      published_at: 'desc',
    },
    take: limit,
  });

  return recentContent.map(content => ({
    platform: content.platform,
    type: content.type,
    metadata: content.metadata as Record<string, any>,
    publishedAt: content.published_at,
  }));
}

/**
 * Get marketing campaign context for AI insights
 * Provides campaign performance data to AI agents
 */
export async function getMarketingCampaignContext(userId: number, limit = 5) {
  const campaigns = await prisma.marketing_campaigns.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      name: true,
      status: true,
      channel: true,
      goal: true,
      audience_segment: true,
      audience_size: true,
      stats: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  });

  return campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    channel: campaign.channel,
    goal: campaign.goal,
    audienceSegment: campaign.audience_segment,
    audienceSize: campaign.audience_size,
    stats: campaign.stats as Record<string, any>,
    createdAt: campaign.created_at,
  }));
}

/**
 * Get transaction history for revenue insights
 */
export async function getTransactionHistory(userId: number, limit = 20) {
  const transactions = await prisma.transaction.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      type: true,
      platform: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  });

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const revenueByPlatform = transactions
    .filter(t => t.status === 'completed' && t.platform)
    .reduce((acc, t) => {
      const platform = t.platform!;
      acc[platform] = (acc[platform] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    transactions: transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      type: t.type,
      platform: t.platform,
      createdAt: t.created_at,
    })),
    totalRevenue,
    revenueByPlatform,
    averageTransaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
  };
}

/**
 * Get AI usage history for the user
 * Helps understand which AI features are most used
 */
export async function getAIUsageHistory(userId: number, limit = 50) {
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      creatorId: userId,
    },
    select: {
      feature: true,
      agentId: true,
      model: true,
      tokensInput: true,
      tokensOutput: true,
      costUsd: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  const featureUsage = usageLogs.reduce((acc, log) => {
    acc[log.feature] = (acc[log.feature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCost = usageLogs.reduce((sum, log) => sum + Number(log.costUsd), 0);

  return {
    logs: usageLogs,
    featureUsage,
    totalCost,
    mostUsedFeature: Object.entries(featureUsage).sort((a, b) => b[1] - a[1])[0]?.[0],
  };
}

/**
 * Get recent AI insights for context
 */
export async function getRecentAIInsights(userId: number, type?: string, limit = 10) {
  const where: any = {
    creatorId: userId,
  };

  if (type) {
    where.type = type;
  }

  const insights = await prisma.aIInsight.findMany({
    where,
    select: {
      id: true,
      source: true,
      type: true,
      confidence: true,
      data: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return insights.map(insight => ({
    id: insight.id,
    source: insight.source,
    type: insight.type,
    confidence: insight.confidence,
    data: insight.data as Record<string, any>,
    createdAt: insight.createdAt,
  }));
}

/**
 * Get comprehensive messaging context for MessagingAgent
 * Combines user stats, subscription info, and AI insights
 */
export async function getMessagingContext(userId: number, fanId?: string) {
  const [stats, platforms, aiInsights] = await Promise.all([
    getUserStatsContext(userId),
    getUserPlatforms(userId),
    getRecentAIInsights(userId, 'successful_interaction', 5),
  ]);

  const context: any = {
    userId,
    stats,
    platforms,
    recentSuccessfulInteractions: aiInsights,
  };

  // Add fan-specific context if fanId provided
  if (fanId) {
    context.fanSubscription = await getFanSubscriptionInfo(userId, fanId);
  }

  return context;
}

/**
 * Get comprehensive content context for ContentAgent
 * Combines recent content, campaigns, and performance insights
 */
export async function getContentContext(userId: number, platform?: string) {
  const [recentContent, campaigns, aiInsights] = await Promise.all([
    getRecentContentPerformance(userId, 10),
    getMarketingCampaignContext(userId, 5),
    getRecentAIInsights(userId, 'content_strategy', 10),
  ]);

  // Filter by platform if specified
  const filteredContent = platform
    ? recentContent.filter(c => c.platform === platform)
    : recentContent;

  return {
    userId,
    recentContent: filteredContent,
    campaigns,
    contentStrategies: aiInsights,
    platforms: [...new Set(recentContent.map(c => c.platform))],
  };
}

/**
 * Get comprehensive analytics context for AnalyticsAgent
 * Combines stats, transactions, content, and subscriptions
 */
export async function getAnalyticsContext(userId: number) {
  const [stats, transactions, content, subscriptions, campaigns] = await Promise.all([
    getUserStatsContext(userId),
    getTransactionHistory(userId, 30),
    getRecentContentPerformance(userId, 20),
    getSubscriptionContext(userId),
    getMarketingCampaignContext(userId, 10),
  ]);

  return {
    userId,
    stats,
    revenue: transactions,
    content,
    subscriptions,
    campaigns,
    platforms: [...new Set(content.map(c => c.platform))],
  };
}

/**
 * Get comprehensive sales context for SalesAgent
 * Combines subscription data, transaction history, and sales insights
 */
export async function getSalesContext(userId: number, fanId?: string) {
  const [subscriptions, transactions, aiInsights] = await Promise.all([
    getSubscriptionContext(userId),
    getTransactionHistory(userId, 20),
    getRecentAIInsights(userId, 'sales_tactic', 10),
  ]);

  const context: any = {
    userId,
    subscriptions,
    transactions,
    successfulTactics: aiInsights,
  };

  // Add fan-specific context if fanId provided
  if (fanId) {
    context.fanSubscription = await getFanSubscriptionInfo(userId, fanId);
    
    // Get fan's transaction history
    const fanTransactions = await prisma.transaction.findMany({
      where: {
        user_id: userId,
        // Note: You may need to add a fan_id field to transactions table
        // or use another way to link transactions to fans
      },
      select: {
        amount: true,
        type: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    context.fanPurchaseHistory = fanTransactions;
  }

  return context;
}

/**
 * Create enriched context for AI agents
 * Combines multiple data sources for comprehensive context
 */
export async function createEnrichedContext(userId: number, options?: {
  includePlatforms?: boolean;
  includeStats?: boolean;
  includeSubscriptions?: boolean;
  includeContent?: boolean;
  includeCampaigns?: boolean;
  includeTransactions?: boolean;
  includeAIInsights?: boolean;
}) {
  const {
    includePlatforms = true,
    includeStats = true,
    includeSubscriptions = true,
    includeContent = true,
    includeCampaigns = false,
    includeTransactions = false,
    includeAIInsights = false,
  } = options || {};

  const context: any = {
    userId,
  };

  const promises: Promise<any>[] = [];

  if (includePlatforms) {
    promises.push(getUserPlatforms(userId).then(data => ({ platforms: data })));
  }

  if (includeStats) {
    promises.push(getUserStatsContext(userId).then(data => ({ stats: data })));
  }

  if (includeSubscriptions) {
    promises.push(getSubscriptionContext(userId).then(data => ({ subscriptions: data })));
  }

  if (includeContent) {
    promises.push(getRecentContentPerformance(userId, 5).then(data => ({ recentContent: data })));
  }

  if (includeCampaigns) {
    promises.push(getMarketingCampaignContext(userId, 5).then(data => ({ campaigns: data })));
  }

  if (includeTransactions) {
    promises.push(getTransactionHistory(userId, 20).then(data => ({ transactions: data })));
  }

  if (includeAIInsights) {
    promises.push(getRecentAIInsights(userId, undefined, 10).then(data => ({ aiInsights: data })));
  }

  const results = await Promise.all(promises);
  results.forEach(result => Object.assign(context, result));

  return context;
}
