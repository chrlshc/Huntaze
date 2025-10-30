# AI Service API Integration Guide

## 📋 Overview

The AI Service provides a unified, production-ready interface for integrating multiple AI providers (OpenAI, Azure OpenAI, Claude) with enterprise-grade features:

- ✅ **Automatic Retry Logic** with exponential backoff
- ✅ **Response Caching** for performance optimization
- ✅ **Rate Limiting** per user and provider
- ✅ **Provider Fallback** for high availability
- ✅ **Structured Error Handling** with detailed error types
- ✅ **Comprehensive Logging** for debugging and monitoring
- ✅ **TypeScript Types** for type safety
- ✅ **Timeout Management** to prevent hanging requests

## 🚀 Quick Start

### Basic Usage

```typescript
import { getAIService } from '@/lib/services/ai-service';

const aiService = getAIService();

const response = await aiService.generateText({
  prompt: "Write a friendly message to a fan",
  context: {
    userId: "user-123",
    contentType: "message"
  }
});

console.log(response.content);
```

### With Options

```typescript
const response = await aiService.generateText({
  prompt: "Generate a caption for Instagram",
  context: { 
    userId: "user-123", 
    contentType: "caption",
    metadata: { platform: "instagram" }
  },
  options: {
    temperature: 0.9,      // Creativity (0-2)
    maxTokens: 500,        // Max response length
    model: "gpt-4",        // Specific model
    timeout: 15000         // 15 second timeout
  }
}, "openai");  // Preferred provider
```

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI (Standard)
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional

# Azure OpenAI
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Service Configuration
DEFAULT_AI_PROVIDER=openai  # or claude
NODE_ENV=production  # Enables caching in production
```

### Programmatic Configuration

```typescript
import { AIService } from '@/lib/services/ai-service';

const aiService = new AIService({
  // Provider Configuration
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseURL: process.env.OPENAI_BASE_URL,
  isAzureOpenAI: true,
  azureApiVersion: '2024-02-15-preview',
  claudeApiKey: process.env.ANTHROPIC_API_KEY,
  defaultProvider: 'openai',
  
  // Cache Configuration
  cache: {
    enabled: true,
    ttlSeconds: 300,  // 5 minutes
    maxSize: 1000     // Max cached responses
  },
  
  // Retry Configuration
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      AIErrorType.RATE_LIMIT,
      AIErrorType.SERVER_ERROR,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.TIMEOUT
    ]
  },
  
  // Custom Logger
  logger: customLogger
});
```

## 📡 API Endpoints

### OpenAI / Azure OpenAI

#### Standard OpenAI
```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer {apiKey}
Content-Type: application/json
```

#### Azure OpenAI
```
POST {baseURL}/openai/deployments/{model}/chat/completions?api-version={version}
api-key: {apiKey}
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "user": "user-id"
}
```

**Response:**
```json
{
  "choices": [{
    "message": { "content": "Hello! How can I help you?" },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  },
  "model": "gpt-4o-mini"
}
```

### Claude (Anthropic)

```
POST https://api.anthropic.com/v1/messages
x-api-key: {apiKey}
anthropic-version: 2023-06-01
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 1000,
  "temperature": 0.7,
  "system": "You are a helpful assistant",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

**Response:**
```json
{
  "content": [{ "text": "Hello! How can I help you?" }],
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  },
  "model": "claude-3-haiku-20240307",
  "stop_reason": "end_turn"
}
```

## 🛡️ Error Handling

### Error Types

```typescript
enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',           // 429 - Rate limit exceeded
  AUTHENTICATION = 'AUTHENTICATION',    // 401/403 - Invalid credentials
  INVALID_REQUEST = 'INVALID_REQUEST',  // 400 - Bad request
  SERVER_ERROR = 'SERVER_ERROR',        // 500+ - Server issues
  NETWORK_ERROR = 'NETWORK_ERROR',      // Network connectivity
  TIMEOUT = 'TIMEOUT',                  // Request timeout
  CONTENT_FILTER = 'CONTENT_FILTER',    // Content policy violation
  UNKNOWN = 'UNKNOWN'                   // Unknown error
}
```

### Error Handling Example

```typescript
import { AIServiceError, AIErrorType } from '@/lib/services/ai-service';

try {
  const response = await aiService.generateText(request);
  console.log(response.content);
} catch (error) {
  if (error instanceof AIServiceError) {
    switch (error.type) {
      case AIErrorType.RATE_LIMIT:
        console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, error.retryAfter));
        break;
        
      case AIErrorType.AUTHENTICATION:
        console.error('Invalid API key');
        // Update credentials
        break;
        
      case AIErrorType.TIMEOUT:
        console.warn('Request timeout, retrying...');
        // Retry with longer timeout
        break;
        
      case AIErrorType.SERVER_ERROR:
        if (error.retryable) {
          console.log('Server error, will retry automatically');
        }
        break;
        
      default:
        console.error('Unexpected error:', error.message);
    }
    
    // Log error details
    console.error(error.toJSON());
  }
}
```

### Error Response Structure

```typescript
{
  name: 'AIServiceError',
  message: 'Rate limit exceeded',
  type: 'RATE_LIMIT',
  provider: 'openai',
  statusCode: 429,
  retryable: true,
  retryAfter: 60000  // milliseconds
}
```

## 🔄 Retry Strategy

### Automatic Retry

The service automatically retries failed requests with exponential backoff:

```typescript
// Default retry configuration
{
  maxAttempts: 3,
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 10000,         // 10 seconds
  backoffMultiplier: 2,      // Exponential: 1s, 2s, 4s
  retryableErrors: [
    AIErrorType.RATE_LIMIT,
    AIErrorType.SERVER_ERROR,
    AIErrorType.NETWORK_ERROR,
    AIErrorType.TIMEOUT
  ]
}
```

### Retry Timeline

```
Attempt 1: Immediate
  ↓ (fails with 503)
Wait: 1000ms
  ↓
Attempt 2: After 1s
  ↓ (fails with 503)
Wait: 2000ms (1000 * 2^1)
  ↓
Attempt 3: After 2s
  ↓ (succeeds)
Total: ~3 seconds
```

### Respecting Rate Limits

When a `429 Rate Limit` error includes a `retry-after` header, the service waits for the specified duration before retrying:

```typescript
// Server says: retry after 60 seconds
{
  error: {
    message: 'Rate limit exceeded',
    retry_after: 60  // seconds
  }
}

// Service waits 60 seconds before next attempt
```

## 💾 Caching

### Cache Behavior

Responses are cached based on:
- Prompt content
- Content type
- Temperature setting

```typescript
// First call - hits API
const response1 = await aiService.generateText({
  prompt: "Hello",
  context: { userId: "user-1", contentType: "message" }
});
// response1.cached = undefined

// Second call - uses cache
const response2 = await aiService.generateText({
  prompt: "Hello",
  context: { userId: "user-1", contentType: "message" }
});
// response2.cached = true
```

### Cache Configuration

```typescript
{
  enabled: true,        // Enable/disable caching
  ttlSeconds: 300,      // Cache lifetime (5 minutes)
  maxSize: 1000         // Max cached responses
}
```

### Cache Invalidation

```typescript
// Clear all cached responses
aiService.clearCache();
```

## 📊 Rate Limits

### OpenAI
- **Per Minute**: 60 requests
- **Per Hour**: 3,000 requests
- **Per Day**: 10,000 requests

### Claude
- **Per Minute**: 50 requests
- **Per Hour**: 1,000 requests
- **Per Day**: 5,000 requests

### Rate Limit Tracking

The service automatically tracks rate limits per user and provider:

```typescript
// Rate limit key format: {provider}:{userId}
// Example: "openai:user-123"
```

## 🎯 Content Types

The service provides specialized system prompts for different content types:

### Message
```typescript
context: { contentType: "message" }
// Optimized for: Fan messages, DMs, personalized communication
```

### Caption
```typescript
context: { contentType: "caption" }
// Optimized for: Social media captions, post descriptions
```

### Idea
```typescript
context: { contentType: "idea" }
// Optimized for: Content ideas, brainstorming, creative suggestions
```

### Pricing
```typescript
context: { contentType: "pricing" }
// Optimized for: Pricing strategies, revenue optimization
```

### Timing
```typescript
context: { contentType: "timing" }
// Optimized for: Optimal posting times, scheduling recommendations
```

## 📝 Logging

### Log Levels

```typescript
logger.debug('Debug message', { key: 'value' });  // Development only
logger.info('Info message', { key: 'value' });    // Always logged
logger.warn('Warning message', { key: 'value' }); // Always logged
logger.error('Error message', { key: 'value' });  // Always logged
```

### Custom Logger

```typescript
import { Logger } from '@/lib/services/ai-service';

class CustomLogger implements Logger {
  debug(message: string, meta?: Record<string, any>): void {
    // Send to logging service
  }
  
  info(message: string, meta?: Record<string, any>): void {
    // Send to logging service
  }
  
  warn(message: string, meta?: Record<string, any>): void {
    // Send to logging service
  }
  
  error(message: string, meta?: Record<string, any>): void {
    // Send to error tracking service
  }
}

const aiService = new AIService({
  openaiApiKey: 'key',
  logger: new CustomLogger()
});
```

### Log Output Example

```
[OpenAIProvider] Generating text { userId: 'user-123', contentType: 'message', model: 'gpt-4o-mini' }
[OpenAIProvider] Sending request to OpenAI { url: 'https://api.openai.com/v1/chat/completions' }
[OpenAIProvider] Text generated successfully { model: 'gpt-4o-mini', tokensUsed: 45, latencyMs: 1234 }
[AIService] Text generated successfully { provider: 'openai', totalLatencyMs: 1250 }
```

## 🔐 Security Best Practices

### API Key Management

```typescript
// ✅ Good: Use environment variables
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Bad: Hardcode API keys
const apiKey = 'sk-...';
```

### User ID Tracking

Always include user ID for:
- Rate limiting per user
- Audit trails
- Usage analytics

```typescript
context: {
  userId: authenticatedUser.id,  // Required
  contentType: "message"
}
```

### Timeout Configuration

Set appropriate timeouts to prevent hanging requests:

```typescript
options: {
  timeout: 30000  // 30 seconds (default)
}
```

## 📈 Performance Optimization

### Caching Strategy

```typescript
// Enable caching in production
cache: {
  enabled: process.env.NODE_ENV === 'production',
  ttlSeconds: 300,
  maxSize: 1000
}
```

### Token Optimization

```typescript
// Use appropriate maxTokens for your use case
options: {
  maxTokens: 100   // Short responses
  maxTokens: 500   // Medium responses
  maxTokens: 2000  // Long responses
}
```

### Model Selection

```typescript
// Fast and cheap
options: { model: 'gpt-4o-mini' }

// Balanced
options: { model: 'gpt-4o' }

// High quality
options: { model: 'gpt-4' }
```

## 🧪 Testing

### Unit Tests

```typescript
import { AIService, AIServiceError, AIErrorType } from '@/lib/services/ai-service';

describe('AI Service', () => {
  it('should handle rate limits', async () => {
    // Mock fetch to return 429
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limit' } })
    });

    const service = new AIService({ openaiApiKey: 'test' });

    await expect(
      service.generateText({
        prompt: 'test',
        context: { userId: 'user-1' }
      })
    ).rejects.toThrow(AIServiceError);
  });
});
```

### Integration Tests

```typescript
describe('AI Service Integration', () => {
  it('should generate text successfully', async () => {
    const service = getAIService();
    
    const response = await service.generateText({
      prompt: 'Say hello',
      context: { userId: 'test-user' }
    });

    expect(response.content).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });
});
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference)
- [AI Service Source Code](../lib/services/ai-service.ts)
- [AI Service Tests](../tests/unit/ai-service-optimized.test.ts)

## 🆘 Troubleshooting

### Common Issues

#### "No AI providers available"
- Check that API keys are set in environment variables
- Verify provider initialization in configuration

#### "Rate limit exceeded"
- Wait for the specified `retryAfter` duration
- Implement request queuing in your application
- Consider upgrading your API plan

#### "Request timeout"
- Increase timeout value in options
- Check network connectivity
- Verify API endpoint is accessible

#### "Authentication failed"
- Verify API key is correct and active
- Check API key permissions
- Ensure correct authentication header format

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development
```

This will output detailed logs for troubleshooting.

---

**Last Updated**: October 26, 2025  
**Version**: 2.0.0  
**Maintainer**: Huntaze Dev Team
