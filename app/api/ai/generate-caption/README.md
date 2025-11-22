# AI Generate Caption API

Generate AI-powered captions and hashtags for social media content using multi-agent collaboration.

## Endpoint

```
POST /api/ai/generate-caption
```

## Authentication

Requires valid session authentication. Include session cookie in request.

## Request Body

```typescript
{
  platform: 'instagram' | 'tiktok' | 'twitter' | 'onlyfans' | 'facebook';
  contentInfo: {
    type?: string;              // e.g., 'photo', 'video', 'story'
    description?: string;       // Content description
    mood?: string;              // e.g., 'fun', 'serious', 'relaxed'
    targetAudience?: string;    // Target audience description
    analyticsInsights?: any;    // Optional analytics data
  };
}
```

## Response

### Success (200 OK)

```typescript
{
  success: true;
  data: {
    caption: string;                  // Generated caption
    hashtags: string[];               // Suggested hashtags
    confidence: number;               // Confidence score (0-1)
    performanceInsights?: any;        // Performance insights from analytics
    agentsInvolved: string[];         // Agents that processed request
    usage: {
      totalInputTokens: number;       // Input tokens used
      totalOutputTokens: number;      // Output tokens used
      totalCostUsd: number;           // Cost in USD
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

Same error responses as `/api/ai/chat`:
- 400 Bad Request - Validation Error
- 401 Unauthorized
- 429 Rate Limit Exceeded
- 429 Quota Exceeded
- 500 Internal Server Error

## Usage Example

### Client-side (React)

```typescript
import { generateCaption, unwrapCaptionResponse } from '@/app/api/ai/generate-caption/client';

async function createInstagramCaption() {
  try {
    const response = await generateCaption({
      platform: 'instagram',
      contentInfo: {
        type: 'photo',
        description: 'Beach sunset with palm trees',
        mood: 'relaxed',
        targetAudience: 'travel enthusiasts'
      }
    });

    const data = unwrapCaptionResponse(response);
    
    console.log('Caption:', data.caption);
    console.log('Hashtags:', data.hashtags);
    console.log('Cost:', data.usage.totalCostUsd);
    
    return {
      caption: data.caption,
      hashtags: data.hashtags
    };
  } catch (error) {
    console.error('Failed to generate caption:', error);
    throw error;
  }
}
```

### With Analytics Insights

```typescript
const response = await generateCaption({
  platform: 'tiktok',
  contentInfo: {
    type: 'video',
    description: 'Dance challenge video',
    mood: 'energetic',
    targetAudience: 'Gen Z',
    analyticsInsights: {
      topPerformingHashtags: ['#dance', '#viral'],
      bestPostingTime: '18:00',
      avgEngagementRate: 0.08
    }
  }
});
```

## Platform-Specific Optimization

The AI optimizes captions for each platform:

- **Instagram**: Focus on visual storytelling, emoji usage, 3-5 hashtags
- **TikTok**: Trending hashtags, call-to-action, viral hooks
- **Twitter**: Concise, engaging, 1-2 hashtags
- **OnlyFans**: Exclusive content teasers, engagement prompts
- **Facebook**: Longer-form, community-focused, minimal hashtags

## Multi-Agent Processing

The caption endpoint uses multiple AI agents:

1. **AnalyticsAgent**: Provides performance insights (optional)
2. **ContentAgent**: Generates optimized caption and hashtags

Agents collaborate to create data-driven, platform-optimized content.

## Rate Limits

- **Starter Plan**: 50 requests/hour
- **Pro Plan**: 100 requests/hour
- **Business Plan**: 500 requests/hour

## Monthly Quotas

- **Starter Plan**: $10/month
- **Pro Plan**: $50/month
- **Business Plan**: Unlimited

## Best Practices

1. **Provide Context**: Include detailed content description for better results
2. **Specify Mood**: Help AI match your brand voice
3. **Target Audience**: Define audience for more relevant captions
4. **Use Analytics**: Pass performance data for data-driven optimization
5. **Review Output**: Always review and adjust generated content

## Example Outputs

### Instagram Photo

```typescript
{
  caption: "Golden hour magic ✨ There's something special about watching the sun dip below the horizon. What's your favorite time of day? 🌅",
  hashtags: ["#sunset", "#goldenhour", "#beachlife", "#travelgram", "#paradise"]
}
```

### TikTok Video

```typescript
{
  caption: "POV: You finally nailed the dance challenge 💃 Who else is obsessed with this trend? Drop a ❤️ if you want a tutorial!",
  hashtags: ["#dancechallenge", "#fyp", "#viral", "#trending", "#tutorial"]
}
```

### Twitter Post

```typescript
{
  caption: "Just witnessed the most incredible sunset 🌅 Nature never fails to amaze. #sunset #nature",
  hashtags: ["#sunset", "#nature"]
}
```

## Performance

- **Average Response Time**: < 3 seconds (95th percentile)
- **Token Usage**: 200-500 tokens per request (typical)
- **Cost**: $0.001 - $0.02 per request (typical)

## Error Handling

```typescript
const response = await generateCaption(request);

if (!response.success) {
  if (response.error.code === 'VALIDATION_ERROR') {
    // Handle validation error
    console.error('Invalid request:', response.error.metadata);
  } else if (response.error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limit
    const retryAfter = response.error.metadata?.retryAfter;
    console.log(`Retry after ${retryAfter} seconds`);
  } else {
    // Handle other errors
    console.error(response.error.message);
  }
}
```
