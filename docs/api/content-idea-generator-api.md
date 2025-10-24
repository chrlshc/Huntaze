# Content Idea Generator API Documentation

## Overview

The Content Idea Generator service provides AI-powered content ideation for creators, with robust error handling, retry mechanisms, and caching for optimal performance.

## Service Configuration

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: number;      // Default: 3
  baseDelay: number;        // Default: 1000ms
  maxDelay: number;         // Default: 10000ms
  backoffMultiplier: number; // Default: 2
}
```

### Cache Configuration

- **Trend Cache TTL**: 1 hour (3,600,000ms)
- **Cache Key Format**: `niche1,niche2,niche3`

## API Methods

### generateContentIdeas

Generates personalized content ideas for a creator with comprehensive error handling and retry logic.

**Parameters:**
```typescript
creatorProfile: CreatorProfile
options?: {
  count?: number;                    // 1-50, default: 10
  category?: 'photo' | 'video' | 'story' | 'ppv' | 'live';
  difficulty?: 'easy' | 'medium' | 'hard';
  focusArea?: 'trending' | 'evergreen' | 'seasonal' | 'monetization';
  timeframe?: 'week' | 'month' | 'quarter';
  includeAnalysis?: boolean;         // default: true
}
```

**Returns:**
```typescript
{
  ideas: ContentIdea[];
  trendAnalysis?: TrendData[];
  recommendations: string[];
  nextSteps: string[];
  metadata: {
    generatedAt: Date;
    tokensUsed?: number;
    cacheHit: boolean;
  };
}
```

**Error Handling:**
- Validates input parameters
- Retries on network errors (429, 5xx status codes)
- Falls back to cached data when available
- Provides detailed error context

**Example Usage:**
```typescript
const service = new ContentIdeaGeneratorService();

try {
  const result = await service.generateContentIdeas(creatorProfile, {
    count: 5,
    focusArea: 'monetization',
    category: 'video'
  });
  
  console.log(`Generated ${result.ideas.length} ideas`);
  console.log(`Tokens used: ${result.metadata.tokensUsed}`);
  console.log(`Cache hit: ${result.metadata.cacheHit}`);
} catch (error) {
  console.error('Failed to generate ideas:', error.message);
}
```

### brainstormWithAI

Interactive brainstorming session with AI for exploring content topics.

**Parameters:**
```typescript
topic: string
creatorProfile: CreatorProfile
options?: {
  style?: 'creative' | 'analytical' | 'practical';
  depth?: 'surface' | 'detailed' | 'comprehensive';
}
```

**Returns:**
```typescript
{
  mainIdeas: string[];
  variations: string[];
  implementation: string[];
  considerations: string[];
}
```

**Example Usage:**
```typescript
const brainstorm = await service.brainstormWithAI(
  'fitness motivation content',
  creatorProfile,
  { style: 'creative', depth: 'detailed' }
);
```

### analyzeIdeaPerformance

Analyzes performance metrics of generated ideas.

**Parameters:**
```typescript
ideas: ContentIdea[]
```

**Returns:**
```typescript
{
  averageEngagement: number;
  topCategories: string[];
  trendAlignment: number;
  monetizationScore: number;
}
```

### History Management

#### getIdeaHistory
```typescript
getIdeaHistory(creatorId: string, limit?: number): ContentIdea[]
```

#### clearIdeaHistory
```typescript
clearIdeaHistory(creatorId: string): void
```

## Error Types

### AIServiceError
```typescript
interface AIServiceError extends Error {
  code?: string;           // 'NETWORK_ERROR', 'TIMEOUT', etc.
  status?: number;         // HTTP status code
  retryable?: boolean;     // Whether error can be retried
}
```

### Retryable Errors
- Network errors (`NETWORK_ERROR`, `TIMEOUT`)
- Rate limiting (status 429)
- Server errors (5xx status codes)
- Errors with explicit `retryable: true` flag

### Non-Retryable Errors
- Authentication errors (401)
- Authorization errors (403)
- Invalid request errors (400)
- Errors with explicit `retryable: false` flag

## Performance Optimizations

### Caching Strategy
- **Trend Data**: Cached for 1 hour per niche combination
- **Cache Invalidation**: Automatic TTL-based expiration
- **Cache Keys**: Deterministic based on input parameters

### Token Usage Tracking
- Tracks AI service token consumption
- Provides usage metrics in response metadata
- Helps with cost monitoring and optimization

### Retry Strategy
- Exponential backoff with jitter
- Configurable retry attempts and delays
- Smart error classification for retry decisions

## Logging and Monitoring

### Debug Logging
```typescript
// Enable debug logging in development
process.env.NODE_ENV = 'development';
```

### Error Logging
All errors are logged with context:
```typescript
{
  error: string;           // Error message
  stack: string;           // Stack trace
  creatorId?: string;      // Creator context
  operation?: string;      // Operation being performed
  attempt?: number;        // Retry attempt number
  tokensUsed?: number;     // Tokens consumed
  duration?: number;       // Operation duration
}
```

## Rate Limiting Considerations

### AI Service Limits
- Implement client-side rate limiting
- Use exponential backoff for 429 responses
- Monitor token usage to stay within quotas

### Recommended Limits
- **Ideas Generation**: 10 requests/minute per creator
- **Brainstorming**: 5 requests/minute per creator
- **Trend Analysis**: 1 request/hour per niche set

## Best Practices

### Error Handling
```typescript
try {
  const result = await service.generateContentIdeas(profile, options);
  // Handle success
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
    await delay(60000); // Wait 1 minute
    // Retry or show user message
  } else if (error.message.includes('authentication')) {
    // Handle auth errors
    redirectToLogin();
  } else {
    // Handle other errors
    showErrorMessage('Failed to generate ideas. Please try again.');
  }
}
```

### Performance Optimization
```typescript
// Use appropriate options for better performance
const options = {
  count: 5,                    // Request fewer ideas for faster response
  includeAnalysis: false,      // Skip trend analysis if not needed
  focusArea: 'evergreen'       // Use evergreen to avoid trend API calls
};
```

### Caching Best Practices
```typescript
// Check cache status and adjust requests accordingly
const result = await service.generateContentIdeas(profile, options);

if (result.metadata.cacheHit) {
  console.log('Used cached data - no additional API costs');
} else {
  console.log(`Fresh data generated - ${result.metadata.tokensUsed} tokens used`);
}
```

## Integration Examples

### React Hook Integration
```typescript
const useContentIdeas = (creatorProfile: CreatorProfile) => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = useCallback(async (options?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const service = getContentIdeaGeneratorService();
      const result = await service.generateContentIdeas(creatorProfile, options);
      setIdeas(result.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [creatorProfile]);

  return { ideas, loading, error, generateIdeas };
};
```

### Express.js API Endpoint
```typescript
app.post('/api/content-ideas', async (req, res) => {
  try {
    const { creatorProfile, options } = req.body;
    
    const service = getContentIdeaGeneratorService();
    const result = await service.generateContentIdeas(creatorProfile, options);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Content ideas API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate content ideas',
      message: error.message
    });
  }
});
```