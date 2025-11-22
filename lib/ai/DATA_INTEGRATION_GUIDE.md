# AI Data Integration Guide

This guide explains how the AI system integrates with existing Huntaze application data to provide context-aware, personalized AI assistance.

## Overview

The data integration layer connects AI agents with your existing application data including:
- OAuth accounts (platform connections)
- User statistics (messages, revenue, engagement)
- Subscriptions (fan relationships)
- Content (posts, performance)
- Marketing campaigns
- Transactions (revenue history)
- AI insights (learned patterns)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agents Layer                         │
│  (MessagingAgent, ContentAgent, AnalyticsAgent, SalesAgent) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Integration Layer                          │
│         (lib/ai/data-integration.ts)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Existing App Data                           │
│  users, oauth_accounts, subscriptions, content, campaigns   │
└─────────────────────────────────────────────────────────────┘
```

## Core Functions

### Platform Context

#### `getPlatformContext(userId, platform)`
Get OAuth account information for a specific platform.

```typescript
const instagramContext = await getPlatformContext(userId, 'instagram');
// Returns: { accountId, metadata, connectedSince }
```

#### `getUserPlatforms(userId)`
Get all connected platforms for a user.

```typescript
const platforms = await getUserPlatforms(userId);
// Returns: [{ platform, accountId, metadata }, ...]
```

### User Statistics

#### `getUserStatsContext(userId)`
Get user engagement and revenue statistics.

```typescript
const stats = await getUserStatsContext(userId);
// Returns: {
//   messagesCount, messagesTrend, responseRate,
//   revenue, revenueTrend, activeChats
// }
```

### Subscription Context

#### `getSubscriptionContext(userId)`
Get aggregated subscription data.

```typescript
const subContext = await getSubscriptionContext(userId);
// Returns: {
//   activeSubscriptions, totalRevenue, platforms,
//   averageSubscriptionValue, subscriptionsByPlatform
// }
```

#### `getFanSubscriptionInfo(userId, fanId)`
Get specific fan's subscription details.

```typescript
const fanInfo = await getFanSubscriptionInfo(userId, fanId);
// Returns: {
//   tier, amount, status, daysSinceStart,
//   platform, isActive
// }
```

### Content Performance

#### `getRecentContentPerformance(userId, limit)`
Get recent published content with metadata.

```typescript
const content = await getRecentContentPerformance(userId, 10);
// Returns: [{ platform, type, metadata, publishedAt }, ...]
```

### Marketing Campaigns

#### `getMarketingCampaignContext(userId, limit)`
Get recent marketing campaigns with stats.

```typescript
const campaigns = await getMarketingCampaignContext(userId, 5);
// Returns: [{
//   id, name, status, channel, goal,
//   audienceSegment, audienceSize, stats, createdAt
// }, ...]
```

#### `linkInsightToCampaign(userId, insightId, campaignId)`
Link an AI insight to a marketing campaign.

```typescript
await linkInsightToCampaign(userId, insightId, campaignId);
```

#### `getCampaignInsights(userId, campaignId)`
Get all AI insights linked to a campaign.

```typescript
const insights = await getCampaignInsights(userId, campaignId);
// Returns: [{ insightId, type, confidence, data, timestamp }, ...]
```

### Transaction History

#### `getTransactionHistory(userId, limit)`
Get transaction history with revenue analytics.

```typescript
const txHistory = await getTransactionHistory(userId, 20);
// Returns: {
//   transactions: [...],
//   totalRevenue,
//   revenueByPlatform,
//   averageTransaction
// }
```

### AI Usage & Insights

#### `getAIUsageHistory(userId, limit)`
Get AI feature usage history.

```typescript
const usage = await getAIUsageHistory(userId, 50);
// Returns: {
//   logs, featureUsage, totalCost, mostUsedFeature
// }
```

#### `getRecentAIInsights(userId, type?, limit)`
Get recent AI insights, optionally filtered by type.

```typescript
const insights = await getRecentAIInsights(userId, 'sales_tactic', 10);
// Returns: [{ id, source, type, confidence, data, createdAt }, ...]
```

## Agent-Specific Context Functions

These functions provide pre-aggregated context optimized for each AI agent.

### MessagingAgent Context

#### `getMessagingContext(userId, fanId?)`
Get comprehensive context for fan messaging.

```typescript
const context = await getMessagingContext(userId, fanId);
// Returns: {
//   userId, stats, platforms,
//   recentSuccessfulInteractions,
//   fanSubscription (if fanId provided)
// }
```

**Use case:** When generating responses to fan messages, this provides:
- User's messaging statistics and trends
- Connected platforms
- Previously successful interaction patterns
- Fan's subscription status and history

### ContentAgent Context

#### `getContentContext(userId, platform?)`
Get comprehensive context for content generation.

```typescript
const context = await getContentContext(userId, 'instagram');
// Returns: {
//   userId, recentContent, campaigns,
//   contentStrategies, platforms
// }
```

**Use case:** When generating captions/hashtags, this provides:
- Recent content performance
- Active marketing campaigns
- Successful content strategies
- Platform-specific insights

### AnalyticsAgent Context

#### `getAnalyticsContext(userId)`
Get comprehensive context for performance analysis.

```typescript
const context = await getAnalyticsContext(userId);
// Returns: {
//   userId, stats, revenue, content,
//   subscriptions, campaigns, platforms
// }
```

**Use case:** When analyzing performance, this provides:
- Complete user statistics
- Revenue and transaction history
- Content performance data
- Subscription metrics
- Campaign results

### SalesAgent Context

#### `getSalesContext(userId, fanId?)`
Get comprehensive context for sales optimization.

```typescript
const context = await getSalesContext(userId, fanId);
// Returns: {
//   userId, subscriptions, transactions,
//   successfulTactics,
//   fanSubscription, fanPurchaseHistory (if fanId provided)
// }
```

**Use case:** When optimizing sales messages, this provides:
- Overall subscription metrics
- Transaction history and patterns
- Previously successful sales tactics
- Fan-specific purchase history

### Universal Context

#### `createEnrichedContext(userId, options)`
Create custom enriched context with selective data inclusion.

```typescript
const context = await createEnrichedContext(userId, {
  includePlatforms: true,
  includeStats: true,
  includeSubscriptions: true,
  includeContent: true,
  includeCampaigns: true,
  includeTransactions: true,
  includeAIInsights: true,
});
```

**Use case:** When you need custom context combinations for specific features.

## Integration Examples

### Example 1: Enhanced Fan Messaging

```typescript
import { MessagingAgent } from '@/lib/ai/agents/messaging';
import { getMessagingContext } from '@/lib/ai/data-integration';

// Get enriched context
const context = await getMessagingContext(userId, fanId);

// Use with MessagingAgent
const agent = new MessagingAgent();
const response = await agent.generateResponse(
  userId,
  fanId,
  fanMessage,
  {
    fanHistory: context.recentSuccessfulInteractions,
    previousMessages: [], // Add from your message history
  }
);
```

### Example 2: Platform-Specific Content Generation

```typescript
import { ContentAgent } from '@/lib/ai/agents/content';
import { getContentContext } from '@/lib/ai/data-integration';

// Get platform-specific context
const context = await getContentContext(userId, 'instagram');

// Generate caption with context
const agent = new ContentAgent();
const result = await agent.generateCaption(
  userId,
  'instagram',
  {
    type: 'photo',
    description: 'Beach photoshoot',
    mood: 'playful',
  }
);
```

### Example 3: Performance Analysis with Full Context

```typescript
import { AnalyticsAgent } from '@/lib/ai/agents/analytics';
import { getAnalyticsContext } from '@/lib/ai/data-integration';

// Get comprehensive analytics context
const context = await getAnalyticsContext(userId);

// Analyze with full context
const agent = new AnalyticsAgent();
const analysis = await agent.analyzePerformance(
  userId,
  {
    timeframe: 'last 30 days',
    platforms: context.platforms,
    data: {
      stats: context.stats,
      revenue: context.revenue,
      content: context.content,
      subscriptions: context.subscriptions,
    },
  }
);
```

### Example 4: Sales Optimization with Fan History

```typescript
import { SalesAgent } from '@/lib/ai/agents/sales';
import { getSalesContext } from '@/lib/ai/data-integration';

// Get sales context with fan details
const context = await getSalesContext(userId, fanId);

// Optimize sales message
const agent = new SalesAgent();
const result = await agent.optimizeSalesMessage(
  userId,
  fanId,
  {
    fanHistory: context.fanSubscription,
    purchaseHistory: context.fanPurchaseHistory,
    engagementLevel: context.fanSubscription?.isActive ? 'high' : 'medium',
    contentType: 'exclusive_video',
    pricePoint: 25,
  }
);
```

### Example 5: Linking AI Insights to Campaigns

```typescript
import { linkInsightToCampaign, getCampaignInsights } from '@/lib/ai/data-integration';

// After AI generates an insight
const insightId = 'insight_123';
const campaignId = 'campaign_456';

// Link the insight to the campaign
await linkInsightToCampaign(userId, insightId, campaignId);

// Later, retrieve all insights for the campaign
const campaignInsights = await getCampaignInsights(userId, campaignId);

// Use insights to improve future campaigns
console.log(`Campaign has ${campaignInsights.length} AI insights`);
```

## Data Flow Diagram

```
User Action (e.g., "Generate caption for Instagram")
    │
    ▼
API Route (/api/ai/generate-caption)
    │
    ▼
Get Context (getContentContext)
    │
    ├─► Query oauth_accounts (platform tokens)
    ├─► Query content (recent posts)
    ├─► Query marketing_campaigns (active campaigns)
    └─► Query ai_insights (content strategies)
    │
    ▼
ContentAgent.generateCaption()
    │
    ├─► Use context to build prompt
    ├─► Call Gemini API
    └─► Store new insight
    │
    ▼
Store Insight (AIKnowledgeNetwork)
    │
    └─► Insert into ai_insights table
    │
    ▼
Return Result to User
```

## Best Practices

### 1. Always Use Context Functions
Don't query the database directly in agents. Use the data integration functions:

```typescript
// ❌ Bad
const user = await prisma.users.findUnique({ where: { id: userId } });

// ✅ Good
const context = await getMessagingContext(userId);
```

### 2. Cache Context When Possible
If making multiple AI calls for the same user, cache the context:

```typescript
const context = await getAnalyticsContext(userId);

// Use context for multiple analyses
const analysis1 = await analyzeRevenue(context);
const analysis2 = await analyzeEngagement(context);
```

### 3. Use Agent-Specific Context Functions
Use the pre-built context functions for each agent:

```typescript
// ❌ Bad - manually building context
const stats = await getUserStatsContext(userId);
const platforms = await getUserPlatforms(userId);
const context = { stats, platforms };

// ✅ Good - use agent-specific function
const context = await getMessagingContext(userId);
```

### 4. Link Insights to Campaigns
Always link valuable insights to relevant campaigns:

```typescript
if (insight.confidence > 0.8 && campaignId) {
  await linkInsightToCampaign(userId, insight.id, campaignId);
}
```

### 5. Filter by Platform When Relevant
Use platform filtering to get more relevant context:

```typescript
// For Instagram-specific content
const context = await getContentContext(userId, 'instagram');
```

## Performance Considerations

### Selective Data Loading
Use the `createEnrichedContext` options to load only what you need:

```typescript
// Only load what's necessary
const context = await createEnrichedContext(userId, {
  includePlatforms: true,
  includeStats: true,
  includeSubscriptions: false, // Skip if not needed
  includeContent: false,
  includeCampaigns: false,
  includeTransactions: false,
});
```

### Limit Result Sets
Use the `limit` parameter to control data volume:

```typescript
// Get only recent data
const content = await getRecentContentPerformance(userId, 5); // Not 100
const campaigns = await getMarketingCampaignContext(userId, 3);
```

### Parallel Queries
The context functions use `Promise.all` for parallel queries:

```typescript
// These run in parallel, not sequential
const [stats, platforms, content] = await Promise.all([
  getUserStatsContext(userId),
  getUserPlatforms(userId),
  getRecentContentPerformance(userId),
]);
```

## Troubleshooting

### Missing Data
If context returns empty arrays or null:
1. Check that the user has connected platforms (`oauth_accounts`)
2. Verify the user has published content
3. Ensure subscriptions exist for the user

### Performance Issues
If queries are slow:
1. Check database indexes on `user_id` fields
2. Reduce `limit` parameters
3. Use selective loading with `createEnrichedContext`

### Insight Storage Failures
If insights aren't being stored:
1. Verify AIKnowledgeNetwork is initialized
2. Check confidence threshold (should be > 0.7)
3. Ensure database permissions for `ai_insights` table

## Next Steps

1. **Integrate with API Routes**: Use these functions in your API routes to provide context to AI agents
2. **Add to UI Components**: Display enriched data in your React components
3. **Monitor Usage**: Track which context functions are most used
4. **Optimize Queries**: Add indexes based on actual usage patterns

## Related Documentation

- [AI System Architecture](./README.md)
- [AI Agents Guide](./agents/README.md)
- [Knowledge Network](./KNOWLEDGE_NETWORK_IMPLEMENTATION.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
