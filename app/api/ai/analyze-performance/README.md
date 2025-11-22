# AI Analyze Performance API

Analyze performance metrics with AI-powered insights, patterns, and recommendations.

## Endpoint

```
POST /api/ai/analyze-performance
```

## Authentication

Requires valid session authentication. Include session cookie in request.

## Request Body

```typescript
{
  metrics: {
    platforms?: string[];          // e.g., ['instagram', 'tiktok']
    contentTypes?: string[];       // e.g., ['photo', 'video']
    timeframe?: string;            // e.g., 'last_30_days', 'last_week'
    engagementData?: {
      likes?: number;
      comments?: number;
      shares?: number;
      views?: number;
      [key: string]: any;
    };
    revenueData?: {
      total?: number;
      byPlatform?: Record<string, number>;
      [key: string]: any;
    };
    audienceData?: {
      followers?: number;
      demographics?: any;
      [key: string]: any;
    };
  };
}
```

## Response

### Success (200 OK)

```typescript
{
  success: true;
  data: {
    insights: Array<{
      type: string;
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      data?: any;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
      actionItems: string[];
    }>;
    patterns: Array<{
      name: string;
      description: string;
      frequency: string;
      confidence: number;
    }>;
    predictions: Array<{
      metric: string;
      prediction: string;
      confidence: number;
      timeframe: string;
    }>;
    confidence: number;
    agentsInvolved: string[];
    usage: {
      totalInputTokens: number;
      totalOutputTokens: number;
      totalCostUsd: number;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
    duration: number;
  };
}
```

### Error Responses

Same error responses as other AI endpoints:
- 400 Bad Request - Validation Error
- 401 Unauthorized
- 429 Rate Limit Exceeded
- 429 Quota Exceeded
- 500 Internal Server Error

## Usage Example

### Basic Analysis

```typescript
import { analyzePerformance, unwrapAnalysisResponse } from '@/app/api/ai/analyze-performance/client';

async function analyzeMyPerformance() {
  try {
    const response = await analyzePerformance({
      metrics: {
        platforms: ['instagram', 'tiktok'],
        contentTypes: ['photo', 'video'],
        timeframe: 'last_30_days',
        engagementData: {
          likes: 15000,
          comments: 500,
          shares: 200,
          views: 50000
        },
        revenueData: {
          total: 5000,
          byPlatform: {
            instagram: 3000,
            tiktok: 2000
          }
        }
      }
    });

    const data = unwrapAnalysisResponse(response);
    
    console.log('Insights:', data.insights);
    console.log('Recommendations:', data.recommendations);
    console.log('Patterns:', data.patterns);
    console.log('Predictions:', data.predictions);
    
    return data;
  } catch (error) {
    console.error('Failed to analyze performance:', error);
    throw error;
  }
}
```

### Comprehensive Analysis

```typescript
const response = await analyzePerformance({
  metrics: {
    platforms: ['instagram', 'tiktok', 'onlyfans'],
    contentTypes: ['photo', 'video', 'story', 'reel'],
    timeframe: 'last_90_days',
    engagementData: {
      likes: 45000,
      comments: 1500,
      shares: 600,
      views: 150000,
      saves: 800,
      engagementRate: 0.08
    },
    revenueData: {
      total: 15000,
      byPlatform: {
        instagram: 5000,
        tiktok: 3000,
        onlyfans: 7000
      },
      growth: 0.25
    },
    audienceData: {
      followers: 50000,
      demographics: {
        age: { '18-24': 0.4, '25-34': 0.35, '35-44': 0.25 },
        gender: { male: 0.6, female: 0.4 }
      },
      topLocations: ['US', 'UK', 'CA']
    }
  }
});
```

## Response Examples

### Insights

```typescript
{
  type: 'engagement',
  title: 'High Engagement on Video Content',
  description: 'Your video content receives 3x more engagement than photos',
  impact: 'high',
  data: {
    videoEngagement: 0.12,
    photoEngagement: 0.04
  }
}
```

### Recommendations

```typescript
{
  title: 'Increase Video Content Frequency',
  description: 'Based on your engagement patterns, posting more video content could significantly boost your reach',
  priority: 'high',
  expectedImpact: '+40% engagement, +25% revenue',
  actionItems: [
    'Post 3-4 videos per week instead of 1-2',
    'Focus on short-form content (15-30 seconds)',
    'Use trending audio tracks',
    'Post during peak hours (6-8 PM)'
  ]
}
```

### Patterns

```typescript
{
  name: 'Weekend Engagement Spike',
  description: 'Your content performs 60% better on weekends',
  frequency: 'weekly',
  confidence: 0.85
}
```

### Predictions

```typescript
{
  metric: 'Monthly Revenue',
  prediction: 'Expected to reach $18,000 (+20%) next month',
  confidence: 0.75,
  timeframe: 'next_30_days'
}
```

## Analysis Types

The AI provides insights across multiple dimensions:

1. **Engagement Analysis**: Likes, comments, shares, saves
2. **Content Performance**: Best performing content types and formats
3. **Audience Behavior**: Demographics, active times, preferences
4. **Revenue Trends**: Growth patterns, platform comparison
5. **Competitive Positioning**: How you compare to similar creators
6. **Growth Opportunities**: Untapped platforms or content types

## Multi-Agent Processing

The analysis endpoint uses the AnalyticsAgent which:

1. Analyzes historical performance data
2. Identifies patterns and trends
3. Generates actionable recommendations
4. Predicts future performance
5. Stores insights in Knowledge Network for future use

## Rate Limits

- **Starter Plan**: 50 requests/hour
- **Pro Plan**: 100 requests/hour
- **Business Plan**: 500 requests/hour

## Monthly Quotas

- **Starter Plan**: $10/month
- **Pro Plan**: $50/month
- **Business Plan**: Unlimited

## Best Practices

1. **Provide Complete Data**: More data = better insights
2. **Regular Analysis**: Analyze weekly or monthly for trends
3. **Act on Recommendations**: Implement high-priority actions
4. **Track Changes**: Monitor impact of implemented recommendations
5. **Compare Timeframes**: Analyze different periods to identify patterns

## Performance

- **Average Response Time**: < 3 seconds (95th percentile)
- **Token Usage**: 500-1000 tokens per request (typical)
- **Cost**: $0.002 - $0.05 per request (typical)

## Error Handling

```typescript
const response = await analyzePerformance(request);

if (!response.success) {
  if (response.error.code === 'VALIDATION_ERROR') {
    console.error('Invalid metrics:', response.error.metadata);
  } else if (response.error.code === 'RATE_LIMIT_EXCEEDED') {
    const retryAfter = response.error.metadata?.retryAfter;
    console.log(`Retry after ${retryAfter} seconds`);
  } else {
    console.error(response.error.message);
  }
}
```

## Integration with Dashboard

```typescript
import { analyzePerformance } from '@/app/api/ai/analyze-performance/client';

function PerformanceDashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadAnalysis() {
    setLoading(true);
    try {
      const response = await analyzePerformance({
        metrics: {
          platforms: ['instagram', 'tiktok'],
          timeframe: 'last_30_days',
          // ... fetch actual metrics from your data
        }
      });

      if (response.success) {
        setAnalysis(response.data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={loadAnalysis}>Analyze Performance</button>
      {analysis && (
        <>
          <InsightsSection insights={analysis.insights} />
          <RecommendationsSection recommendations={analysis.recommendations} />
          <PatternsSection patterns={analysis.patterns} />
          <PredictionsSection predictions={analysis.predictions} />
        </>
      )}
    </div>
  );
}
```
