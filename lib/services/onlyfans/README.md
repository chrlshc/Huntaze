# OnlyFans Gateway API

Production-ready OnlyFans API integration with comprehensive error handling, retry strategies, caching, and compliance features.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Retry Strategy](#retry-strategy)
- [Caching](#caching)
- [Rate Limiting](#rate-limiting)
- [Compliance](#compliance)
- [Monitoring](#monitoring)
- [Examples](#examples)

## ✨ Features

- ✅ **Comprehensive Error Handling** - Typed errors with retry logic
- ✅ **Exponential Backoff** - Automatic retry with configurable backoff
- ✅ **Token Management** - Automatic token refresh
- ✅ **Request Caching** - Configurable TTL-based caching
- ✅ **Rate Limiting** - Per-minute and per-hour limits
- ✅ **Detailed Logging** - Structured JSON logging
- ✅ **Metrics Collection** - Request metrics and health monitoring
- ✅ **Compliance** - Human-in-the-loop enforcement
- ✅ **TypeScript** - Full type safety

## 🚀 Quick Start

### Installation

```typescript
import { createOnlyFansGateway } from '@/lib/services/onlyfans/gateway';
import { ErrorCode } from '@/lib/services/onlyfans/types';
```

### Basic Usage

```typescript
// Create gateway instance
const gateway = createOnlyFansGateway({
  auth: {
    sessionToken: process.env.ONLYFANS_SESSION_TOKEN!,
    cookies: {
      // Optional cookies
    },
  },
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT,
      ErrorCode.RATE_LIMIT,
    ],
  },
  cache: {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
  timeout: 30000,
  logging: {
    enabled: true,
    level: 'info',
  },
});

// Get conversations
const result = await gateway.getConversations();
if (result.success) {
  console.log('Conversations:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## 📚 API Reference

### `getConversations()`

Get all conversations for the authenticated user.

**Returns:** `Promise<ApiResponse<Conversation[]>>`

**Example:**
```typescript
const result = await gateway.getConversations();
if (result.success) {
  result.data.forEach(conv => {
    console.log(`${conv.username}: ${conv.lastMessage}`);
  });
}
```

**Response:**
```typescript
{
  success: true,
  data: [
    {
      userId: "user123",
      username: "fan_username",
      lastMessage: "Thanks for the content!",
      unreadCount: 2,
      avatarUrl: "https://..."
    }
  ],
  metadata: {
    timestamp: "2025-10-28T12:00:00Z",
    requestId: "req_1234567890_abc123"
  }
}
```

### `getMessages(userId, cursor?)`

Get messages for a specific conversation with pagination.

**Parameters:**
- `userId` (string) - The user ID to fetch messages for
- `cursor` (string, optional) - Pagination cursor

**Returns:** `Promise<ApiResponse<{ messages: Message[]; nextCursor?: string }>>`

**Example:**
```typescript
// Get first page
const result = await gateway.getMessages('user123');
if (result.success) {
  const { messages, nextCursor } = result.data;
  
  // Load more
  if (nextCursor) {
    const nextPage = await gateway.getMessages('user123', nextCursor);
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    messages: [
      {
        id: "msg123",
        userId: "user123",
        content: "Hello!",
        createdAt: "2025-10-28T12:00:00Z",
        direction: "in"
      }
    ],
    nextCursor: "cursor_abc123"
  }
}
```

### `sendMessage(userId, content, humanApproval)`

Send a message to a user (requires human approval).

⚠️ **COMPLIANCE:** This method enforces human-in-the-loop workflow.

**Parameters:**
- `userId` (string) - The user ID to send message to
- `content` (string) - The message content (human-approved)
- `humanApproval` (HumanApproval) - Human approval metadata

**Returns:** `Promise<ApiResponse<{ messageId: string }>>`

**Example:**
```typescript
const result = await gateway.sendMessage(
  'user123',
  'Thanks for your message!',
  {
    approvedBy: 'creator-id-123',
    approvedAt: new Date().toISOString(),
    wasModified: false,
  }
);

if (result.success) {
  console.log('Message sent:', result.data.messageId);
}
```

**Human Approval Object:**
```typescript
{
  approvedBy: string;      // Creator user ID
  approvedAt: string;      // ISO 8601 timestamp
  wasModified: boolean;    // Was AI suggestion modified?
  originalSuggestion?: string; // Original AI suggestion if modified
}
```

### `refreshAuth()`

Refresh the authentication token.

**Returns:** `Promise<ApiResponse<AuthToken>>`

**Example:**
```typescript
const result = await gateway.refreshAuth();
if (result.success) {
  console.log('Token refreshed, expires at:', result.data.expiresAt);
}
```

### `healthCheck()`

Check gateway health and connectivity.

**Returns:** `Promise<ApiResponse<HealthStatus>>`

**Example:**
```typescript
const result = await gateway.healthCheck();
if (result.success) {
  console.log('Status:', result.data.status);
  console.log('Error rate:', result.data.errorRate);
  console.log('Avg latency:', result.data.averageLatencyMs, 'ms');
}
```

## 🔧 Error Handling

### Error Types

All errors are typed with `ErrorCode` enum:

```typescript
enum ErrorCode {
  // Network errors (retryable)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Auth errors (not retryable)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Client errors (not retryable)
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (retryable)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Business logic errors (not retryable)
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  HUMAN_APPROVAL_REQUIRED = 'HUMAN_APPROVAL_REQUIRED',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: ErrorCode.RATE_LIMIT,
    message: "Rate limit exceeded",
    retryable: true,
    details: {
      retryAfter: 60
    }
  },
  metadata: {
    timestamp: "2025-10-28T12:00:00Z",
    requestId: "req_1234567890_abc123"
  }
}
```

### Handling Errors

```typescript
const result = await gateway.getConversations();

if (!result.success) {
  const { error } = result;
  
  switch (error.code) {
    case ErrorCode.UNAUTHORIZED:
      // Refresh token
      await gateway.refreshAuth();
      break;
      
    case ErrorCode.RATE_LIMIT:
      // Wait and retry
      console.log('Rate limited, waiting...');
      break;
      
    case ErrorCode.NETWORK_ERROR:
      // Already retried automatically
      console.error('Network error after retries');
      break;
      
    default:
      console.error('Unexpected error:', error.message);
  }
}
```

## 🔄 Retry Strategy

### Configuration

```typescript
const gateway = createOnlyFansGateway({
  auth: { sessionToken: 'token' },
  retry: {
    maxRetries: 3,              // Max retry attempts
    initialDelayMs: 1000,       // Initial delay (1s)
    maxDelayMs: 10000,          // Max delay (10s)
    backoffMultiplier: 2,       // Exponential backoff
    retryableErrors: [          // Which errors to retry
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT,
      ErrorCode.RATE_LIMIT,
      ErrorCode.INTERNAL_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
    ],
  },
});
```

### Retry Behavior

1. **Exponential Backoff:** Delay doubles with each retry
2. **Jitter:** ±20% random jitter to prevent thundering herd
3. **Max Delay:** Capped at `maxDelayMs`
4. **Selective Retry:** Only retries errors marked as `retryable`

**Example delays:**
- Attempt 1: 1000ms ± 200ms
- Attempt 2: 2000ms ± 400ms
- Attempt 3: 4000ms ± 800ms

## 💾 Caching

### Configuration

```typescript
const gateway = createOnlyFansGateway({
  auth: { sessionToken: 'token' },
  cache: {
    enabled: true,
    ttlMs: 5 * 60 * 1000,  // 5 minutes
    maxSize: 100,           // Max cache entries
  },
});
```

### Cache Behavior

- **TTL-based:** Entries expire after `ttlMs`
- **LRU eviction:** Oldest entries removed when `maxSize` reached
- **Automatic invalidation:** Cache cleared on mutations (sendMessage)
- **Pattern matching:** Can invalidate by key prefix

### Cached Endpoints

- ✅ `getConversations()` - Cached for 5 minutes
- ✅ `getMessages()` - Cached per user/cursor
- ❌ `sendMessage()` - Never cached (mutation)
- ❌ `refreshAuth()` - Never cached

## ⏱️ Rate Limiting

### Configuration

```typescript
const gateway = createOnlyFansGateway({
  auth: { sessionToken: 'token' },
  rateLimit: {
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 500,
  },
});
```

### Rate Limit Behavior

- **Per-minute limit:** Resets every 60 seconds
- **Per-hour limit:** Resets every 3600 seconds
- **Automatic enforcement:** Returns `RATE_LIMIT` error when exceeded
- **Monitoring:** Check remaining quota with `healthCheck()`

### Checking Rate Limits

```typescript
const health = await gateway.healthCheck();
if (health.success) {
  console.log('Remaining requests:', health.data.rateLimitRemaining);
}
```

## ✅ Compliance

### Human-in-the-Loop Enforcement

All message sending requires explicit human approval:

```typescript
// ❌ WRONG - No human approval
await gateway.sendMessage('user123', 'Auto-generated message');

// ✅ CORRECT - With human approval
await gateway.sendMessage(
  'user123',
  'Human-reviewed message',
  {
    approvedBy: 'creator-id',
    approvedAt: new Date().toISOString(),
    wasModified: false,
  }
);
```

### Approval Validation

The gateway validates:
- ✅ `approvedBy` is present
- ✅ `approvedAt` is present and recent (< 5 minutes)
- ✅ Timestamp is valid ISO 8601 format

### Audit Trail

All approvals are logged:

```json
{
  "timestamp": "2025-10-28T12:00:00Z",
  "level": "info",
  "message": "Message sent successfully",
  "userId": "user123",
  "messageId": "msg456",
  "approvedBy": "creator-id"
}
```

## 📊 Monitoring

### Health Check

```typescript
const health = await gateway.healthCheck();
console.log(health.data);
```

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  lastSuccessfulRequest: '2025-10-28T12:00:00Z',
  errorRate: 0.05,              // 5% error rate
  averageLatencyMs: 250,        // 250ms avg latency
  rateLimitRemaining: 450       // 450 requests remaining
}
```

### Status Levels

- **healthy:** Error rate < 20%
- **degraded:** Error rate 20-50%
- **unhealthy:** Error rate > 50%

### Metrics

The gateway collects metrics for all requests:

```typescript
{
  endpoint: '/api/conversations',
  method: 'GET',
  statusCode: 200,
  durationMs: 245,
  retryCount: 0,
  cached: false,
  timestamp: '2025-10-28T12:00:00Z'
}
```

## 📝 Examples

### Complete Example

```typescript
import { createOnlyFansGateway } from '@/lib/services/onlyfans/gateway';
import { ErrorCode } from '@/lib/services/onlyfans/types';

async function main() {
  // Create gateway
  const gateway = createOnlyFansGateway({
    auth: {
      sessionToken: process.env.ONLYFANS_SESSION_TOKEN!,
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        ErrorCode.NETWORK_ERROR,
        ErrorCode.TIMEOUT,
        ErrorCode.RATE_LIMIT,
      ],
    },
    cache: {
      enabled: true,
      ttlMs: 5 * 60 * 1000,
    },
    timeout: 30000,
    logging: {
      enabled: true,
      level: 'info',
    },
  });

  // Check health
  const health = await gateway.healthCheck();
  console.log('Gateway health:', health.data?.status);

  // Get conversations
  const conversations = await gateway.getConversations();
  if (!conversations.success) {
    console.error('Failed to get conversations:', conversations.error);
    return;
  }

  // Process each conversation
  for (const conv of conversations.data) {
    console.log(`\nConversation with ${conv.username}`);
    
    // Get messages
    const messages = await gateway.getMessages(conv.userId);
    if (!messages.success) {
      console.error('Failed to get messages:', messages.error);
      continue;
    }

    // Show unread messages
    const unread = messages.data.messages.filter(m => m.direction === 'in');
    console.log(`Unread messages: ${unread.length}`);

    // Send reply (with human approval)
    if (unread.length > 0) {
      const reply = 'Thanks for your message!'; // Human-reviewed
      
      const result = await gateway.sendMessage(
        conv.userId,
        reply,
        {
          approvedBy: 'creator-id',
          approvedAt: new Date().toISOString(),
          wasModified: false,
        }
      );

      if (result.success) {
        console.log('Reply sent:', result.data.messageId);
      } else {
        console.error('Failed to send reply:', result.error);
      }
    }
  }
}

main().catch(console.error);
```

### Error Recovery Example

```typescript
async function sendMessageWithRecovery(
  gateway: OnlyFansGateway,
  userId: string,
  content: string,
  approval: HumanApproval
) {
  let result = await gateway.sendMessage(userId, content, approval);

  // Handle token expiration
  if (!result.success && result.error.code === ErrorCode.UNAUTHORIZED) {
    console.log('Token expired, refreshing...');
    
    const refreshResult = await gateway.refreshAuth();
    if (!refreshResult.success) {
      throw new Error('Failed to refresh token');
    }

    // Retry with new token
    result = await gateway.sendMessage(userId, content, approval);
  }

  // Handle rate limiting
  if (!result.success && result.error.code === ErrorCode.RATE_LIMIT) {
    console.log('Rate limited, waiting 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Retry after waiting
    result = await gateway.sendMessage(userId, content, approval);
  }

  return result;
}
```

### Pagination Example

```typescript
async function getAllMessages(gateway: OnlyFansGateway, userId: string) {
  const allMessages: Message[] = [];
  let cursor: string | undefined;

  do {
    const result = await gateway.getMessages(userId, cursor);
    
    if (!result.success) {
      console.error('Failed to get messages:', result.error);
      break;
    }

    allMessages.push(...result.data.messages);
    cursor = result.data.nextCursor;
    
    console.log(`Loaded ${allMessages.length} messages...`);
  } while (cursor);

  return allMessages;
}
```

## 🔒 Security

### Token Storage

Never commit tokens to version control:

```typescript
// ✅ GOOD - Use environment variables
const gateway = createOnlyFansGateway({
  auth: {
    sessionToken: process.env.ONLYFANS_SESSION_TOKEN!,
  },
});

// ❌ BAD - Hardcoded token
const gateway = createOnlyFansGateway({
  auth: {
    sessionToken: 'hardcoded-token-123',
  },
});
```

### Logging

Sensitive data is automatically redacted in logs:

```json
{
  "config": {
    "auth": {
      "sessionToken": "***REDACTED***",
      "cookies": "***REDACTED***"
    }
  }
}
```

## 📖 See Also

- [OnlyFans Compliance Documentation](../../../docs/HUNTAZE_COMPLIANCE_LEGAL.md)
- [OnlyFans Implementation Status](../../../docs/HUNTAZE_ONLYFANS_IMPLEMENTATION_STATUS.md)
- [OnlyFans Test Suite](../../../tests/unit/ONLYFANS_TESTS_README.md)
