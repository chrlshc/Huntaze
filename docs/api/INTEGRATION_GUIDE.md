# Huntaze API Integration Guide

This guide will help you integrate with the Huntaze API to build powerful creator tools.

---

## Quick Start

### 1. Authentication

First, authenticate to get a session:

```typescript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'creator@example.com',
  password: 'your-password',
  redirect: false,
});

if (result?.ok) {
  console.log('Authenticated!');
}
```

### 2. Make Your First API Call

```typescript
const response = await fetch('/api/dashboard/metrics', {
  credentials: 'include', // Important: include cookies
});

const data = await response.json();

if (data.success) {
  console.log('Revenue:', data.data.revenue.formatted);
  console.log('Messages:', data.data.messages.sent);
}
```

### 3. Use the API Client

For better error handling and TypeScript support:

```typescript
import { apiClient } from '@/lib/api-client';

try {
  const metrics = await apiClient.get('/dashboard/metrics');
  console.log('Metrics:', metrics);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.code);
  }
}
```

---

## Common Use Cases

### Use Case 1: Display Dashboard Metrics

```typescript
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

function DashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await apiClient.get('/dashboard/metrics');
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Revenue: {metrics.revenue.formatted}</h2>
      <p>Change: {metrics.revenue.change}%</p>
      
      <h2>Messages Sent: {metrics.messages.sent}</h2>
      <p>Change: {metrics.messages.change}%</p>
    </div>
  );
}
```

---

### Use Case 2: Send OnlyFans Messages with Rate Limiting

```typescript
import { apiClient } from '@/lib/api-client';

async function sendMessage(recipientId: string, content: string) {
  try {
    const result = await apiClient.post('/onlyfans/messages/send', {
      recipientId,
      content,
      priority: 'high',
    });

    console.log('Message queued:', result.messageId);
    console.log('Estimated delivery:', result.estimatedDelivery);

    // Poll for status
    const status = await pollMessageStatus(result.messageId);
    return status;
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log('Rate limit hit, message will be queued');
    }
    throw error;
  }
}

async function pollMessageStatus(messageId: string) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const response = await apiClient.get(
      `/onlyfans/messages/status?messageId=${messageId}`
    );

    if (response.data.status === 'sent') {
      return response.data;
    }

    if (response.data.status === 'failed') {
      throw new Error('Message delivery failed');
    }

    // Wait 3 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 3000));
    attempts++;
  }

  throw new Error('Timeout waiting for message delivery');
}
```

---

### Use Case 3: Create and Launch a Campaign

```typescript
import { apiClient } from '@/lib/api-client';

async function createWelcomeCampaign() {
  // Step 1: Create campaign
  const campaign = await apiClient.post('/campaigns', {
    name: 'Welcome New Subscribers',
    type: 'email',
    platforms: ['onlyfans'],
    templateId: 'welcome_new_subscriber',
    schedule: {
      startDate: new Date().toISOString(),
      recurring: 'daily',
    },
    targeting: {
      segmentIds: ['new_subscribers_last_7_days'],
    },
  });

  console.log('Campaign created:', campaign.data.id);

  // Step 2: Start campaign
  await apiClient.post(`/campaigns/${campaign.data.id}/start`);

  console.log('Campaign started!');

  // Step 3: Monitor analytics
  const analytics = await apiClient.get(
    `/campaigns/${campaign.data.id}/analytics`
  );

  console.log('Campaign performance:', analytics.data);

  return campaign.data;
}
```

---

### Use Case 4: Batch Send Messages

```typescript
import { apiClient } from '@/lib/api-client';

async function sendBulkMessages(recipients: string[], content: string) {
  const results = [];

  // Send in batches of 10 (rate limit is 10/min)
  for (let i = 0; i < recipients.length; i += 10) {
    const batch = recipients.slice(i, i + 10);

    const batchResults = await Promise.all(
      batch.map(recipientId =>
        apiClient.post('/onlyfans/messages/send', {
          recipientId,
          content,
          priority: 'medium',
        })
      )
    );

    results.push(...batchResults);

    // Wait 1 minute before next batch
    if (i + 10 < recipients.length) {
      console.log('Waiting 60s for rate limit...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  return results;
}
```

---

## Error Handling

### Handling API Errors

```typescript
import { apiClient, ApiError } from '@/lib/api-client';

async function safeApiCall() {
  try {
    const data = await apiClient.get('/dashboard/metrics');
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          window.location.href = '/auth/login';
          break;

        case 'RATE_LIMIT_EXCEEDED':
          // Show rate limit message
          console.log('Please wait before trying again');
          break;

        case 'VALIDATION_ERROR':
          // Show validation errors
          console.error('Invalid data:', error.message);
          break;

        case 'INTERNAL_ERROR':
          // Show generic error
          console.error('Something went wrong');
          break;

        default:
          console.error('Unknown error:', error);
      }
    } else {
      // Network error or other
      console.error('Network error:', error);
    }
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors
      if (error instanceof ApiError && error.status < 500) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const metrics = await fetchWithRetry(() =>
  apiClient.get('/dashboard/metrics')
);
```

---

## Rate Limiting

### Understanding Rate Limits

The API has two types of rate limits:

1. **OnlyFans Messages**: 10 messages/minute per user
2. **API Endpoints**: 100 requests/minute per user

### Handling Rate Limits

```typescript
async function sendWithRateLimit(messages: Array<{ recipientId: string; content: string }>) {
  const queue = [...messages];
  const results = [];
  let sentThisMinute = 0;
  let minuteStart = Date.now();

  while (queue.length > 0) {
    // Reset counter every minute
    if (Date.now() - minuteStart >= 60000) {
      sentThisMinute = 0;
      minuteStart = Date.now();
    }

    // Wait if we hit the limit
    if (sentThisMinute >= 10) {
      const waitTime = 60000 - (Date.now() - minuteStart);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      sentThisMinute = 0;
      minuteStart = Date.now();
    }

    // Send next message
    const message = queue.shift()!;
    const result = await apiClient.post('/onlyfans/messages/send', message);
    results.push(result);
    sentThisMinute++;
  }

  return results;
}
```

---

## Webhooks (Coming Soon)

Webhooks will allow you to receive real-time notifications:

```typescript
// Future webhook handler
export async function POST(request: Request) {
  const signature = request.headers.get('x-huntaze-signature');
  const body = await request.json();

  // Verify signature
  if (!verifyWebhookSignature(body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Handle event
  switch (body.event) {
    case 'message.sent':
      console.log('Message sent:', body.data.messageId);
      break;

    case 'campaign.completed':
      console.log('Campaign completed:', body.data.campaignId);
      break;
  }

  return new Response('OK');
}
```

---

## Best Practices

### 1. Use TypeScript

Define types for better autocomplete and type safety:

```typescript
interface DashboardMetrics {
  revenue: {
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
    formatted: string;
  };
  messages: {
    sent: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  campaigns: {
    active: number;
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  engagement: {
    rate: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
}

const metrics = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
```

### 2. Cache Responses

```typescript
import { useQuery } from '@tanstack/react-query';

function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiClient.get('/dashboard/metrics'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### 3. Handle Loading States

```typescript
function DashboardMetrics() {
  const { data, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return <Skeleton />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return <MetricsDisplay data={data} />;
}
```

### 4. Implement Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message) => apiClient.post('/onlyfans/messages/send', message),
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['messages']);

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages']);

      // Optimistically update
      queryClient.setQueryData(['messages'], (old) => [...old, newMessage]);

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(['messages'], context.previousMessages);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries(['messages']);
    },
  });
}
```

---

## Testing

### Unit Testing API Calls

```typescript
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';

describe('Dashboard Metrics', () => {
  it('should fetch metrics successfully', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          revenue: { total: 45000, change: 12.5 },
        },
      }),
    });

    const metrics = await apiClient.get('/dashboard/metrics');

    expect(metrics.revenue.total).toBe(45000);
    expect(metrics.revenue.change).toBe(12.5);
  });

  it('should handle errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Auth required' },
      }),
    });

    await expect(apiClient.get('/dashboard/metrics')).rejects.toThrow();
  });
});
```

---

## Support

Need help integrating?

- **Documentation**: https://docs.huntaze.com
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Discord**: https://discord.gg/huntaze
- **Email**: support@huntaze.com

---

**Last Updated**: 2025-10-30
