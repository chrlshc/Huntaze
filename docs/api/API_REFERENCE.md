# Huntaze API Reference

**Version**: 2.0.0  
**Base URL**: `https://app.huntaze.com/api`  
**Authentication**: Session-based (NextAuth.js)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard APIs](#dashboard-apis)
3. [OnlyFans APIs](#onlyfans-apis)
4. [Campaign APIs](#campaign-apis)
5. [Error Codes](#error-codes)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication via NextAuth.js session cookies.

### Session Cookie

```http
Cookie: next-auth.session-token=<your-session-token>
```

### Getting a Session

Use the NextAuth.js sign-in flow:

```typescript
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false,
});
```

---

## OnlyFans APIs

### GET /onlyfans/subscribers

Get paginated list of OnlyFans subscribers with filtering and search.

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `pageSize` (integer, optional): Items per page (default: 20, max: 100)
- `tier` (string, optional): Filter by tier (`free`, `premium`, `vip`)
- `search` (string, optional): Search by username or email

**Example Request**:
```bash
curl -X GET "https://app.huntaze.com/api/onlyfans/subscribers?page=1&pageSize=20&tier=premium" \
  -H "Cookie: next-auth.session-token=<token>"
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "sub_abc123",
      "userId": "user_xyz789",
      "username": "fan_user_1",
      "email": "fan@example.com",
      "tier": "premium",
      "onlyfansId": "of_12345",
      "isActive": true,
      "createdAt": "2025-10-15T10:30:00Z",
      "updatedAt": "2025-10-29T14:20:00Z",
      "_count": {
        "messages": 45,
        "transactions": 12
      }
    }
  ],
  "metadata": {
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Failed to fetch subscribers

---

### POST /onlyfans/subscribers

Create a new subscriber record.

**Request Body**:
```json
{
  "username": "new_fan_123",
  "email": "newfan@example.com",
  "tier": "free",
  "onlyfansId": "of_67890"
}
```

**Required Fields**:
- `username` (string): Subscriber's username
- `email` (string): Subscriber's email address

**Optional Fields**:
- `tier` (string): Subscription tier - `free`, `premium`, or `vip` (default: `free`)
- `onlyfansId` (string): OnlyFans platform user ID

**Example Request**:
```bash
curl -X POST "https://app.huntaze.com/api/onlyfans/subscribers" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "username": "new_fan_123",
    "email": "newfan@example.com",
    "tier": "premium"
  }'
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "sub_new123",
    "userId": "user_xyz789",
    "username": "new_fan_123",
    "email": "newfan@example.com",
    "tier": "premium",
    "onlyfansId": null,
    "isActive": true,
    "createdAt": "2025-10-29T15:45:00Z",
    "updatedAt": "2025-10-29T15:45:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Username and email are required"
    }
  }
  ```
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Failed to create subscriber

---

### POST /onlyfans/messages/send

Send a message to OnlyFans with automatic rate limiting (10 msg/min).

**Request Body**:
```json
{
  "recipientId": "user_123",
  "content": "Hello! Thanks for subscribing!",
  "mediaUrls": ["https://cdn.example.com/image.jpg"],
  "priority": "high"
}
```

**Response (202 Accepted)**:
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "queuedAt": "2025-10-29T10:30:00Z",
  "estimatedDelivery": "2025-10-29T10:31:00Z"
}
```

---

### GET /onlyfans/messages/status

Check the delivery status of a queued message.

**Query Parameters**:
- `messageId` (required): Message ID from send endpoint

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123",
    "status": "sent",
    "sentAt": "2025-10-29T10:30:45Z",
    "attempts": 1
  }
}
```

**Status Values**:
- `queued`: Message is in queue
- `processing`: Message is being sent
- `sent`: Message delivered successfully
- `failed`: Message delivery failed

---

## Dashboard APIs

### GET /dashboard/metrics

Get aggregated dashboard metrics for the authenticated user.

**Response**:
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 45000,
      "change": 12.5,
      "changeType": "increase",
      "formatted": "$45,000"
    },
    "messages": {
      "sent": 1250,
      "change": 8.3,
      "changeType": "increase"
    },
    "campaigns": {
      "active": 5,
      "total": 23,
      "change": 0,
      "changeType": "increase"
    },
    "engagement": {
      "rate": 68,
      "change": 5.4,
      "changeType": "increase"
    }
  }
}
```

**Metrics Explained**:
- **Revenue**: Last 30 days vs previous 30 days
- **Messages**: Last 30 days vs previous 30 days
- **Campaigns**: Current active vs total
- **Engagement**: Placeholder (needs implementation)

[Full Documentation →](./dashboard-metrics.md)

---

### GET /dashboard/activity

Get recent activity feed.

**Query Parameters**:
- `limit` (optional): Number of items (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "act_123",
      "type": "message_sent",
      "description": "Message sent to @user123",
      "timestamp": "2025-10-30T10:30:00Z"
    }
  ]
}
```

---

### GET /dashboard/revenue

Get detailed revenue breakdown.

**Query Parameters**:
- `period` (optional): "day" | "week" | "month" (default: "month")
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 45000,
    "breakdown": [
      {
        "date": "2025-10-01",
        "amount": 1500
      }
    ]
  }
}
```

---

## OnlyFans APIs

### POST /onlyfans/messages/send

Send a message to OnlyFans with automatic rate limiting (10 msg/min).

**Request Body**:
```json
{
  "recipientId": "user_123",
  "content": "Hello! Thanks for subscribing!",
  "mediaUrls": ["https://cdn.example.com/image.jpg"],
  "priority": "high"
}
```

**Response (202 Accepted)**:
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "queuedAt": "2025-10-30T10:30:00Z",
  "estimatedDelivery": "2025-10-30T10:31:00Z"
}
```

**Rate Limiting**:
- Maximum: 10 messages per minute per user
- Messages are queued via AWS SQS
- Automatic retry with exponential backoff

[Full Documentation →](./onlyfans-messages.md)

---

### GET /onlyfans/messages/status

Check the delivery status of a queued message.

**Query Parameters**:
- `messageId` (required): Message ID from send endpoint

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123",
    "status": "sent",
    "sentAt": "2025-10-30T10:30:45Z",
    "attempts": 1
  }
}
```

**Status Values**:
- `queued`: In SQS queue
- `processing`: Being sent by Lambda
- `sent`: Successfully delivered
- `failed`: Delivery failed after retries

---

## Campaign APIs

### GET /campaigns

List all campaigns for the authenticated user.

**Query Parameters**:
- `status` (optional): "draft" | "active" | "paused" | "completed"
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "camp_123",
      "name": "Welcome Campaign",
      "status": "active",
      "platforms": ["onlyfans", "instagram"],
      "createdAt": "2025-10-01T00:00:00Z"
    }
  ],
  "metadata": {
    "page": 1,
    "pageSize": 20,
    "total": 23
  }
}
```

---

### POST /campaigns

Create a new marketing campaign.

**Request Body**:
```json
{
  "name": "Welcome New Subscribers",
  "type": "email",
  "platforms": ["onlyfans"],
  "templateId": "welcome_new_subscriber",
  "schedule": {
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-11-30T23:59:59Z"
  },
  "targeting": {
    "segmentIds": ["seg_new_users"]
  }
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "camp_456",
    "name": "Welcome New Subscribers",
    "status": "draft",
    "createdAt": "2025-10-30T10:30:00Z"
  }
}
```

---

### GET /campaigns/:id

Get campaign details.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "camp_123",
    "name": "Welcome Campaign",
    "status": "active",
    "metrics": {
      "sent": 1250,
      "opened": 875,
      "clicked": 432,
      "converted": 89
    }
  }
}
```

---

### POST /campaigns/:id/start

Start a campaign.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "camp_123",
    "status": "active",
    "startedAt": "2025-10-30T10:30:00Z"
  }
}
```

---

### POST /campaigns/:id/pause

Pause a running campaign.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "camp_123",
    "status": "paused",
    "pausedAt": "2025-10-30T10:30:00Z"
  }
}
```

---

### GET /campaigns/:id/analytics

Get detailed campaign analytics.

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "impressions": 5000,
      "clicks": 750,
      "conversions": 125,
      "revenue": 2500.00
    },
    "byPlatform": {
      "onlyfans": {
        "clicks": 500,
        "conversions": 80
      },
      "instagram": {
        "clicks": 250,
        "conversions": 45
      }
    },
    "timeline": [
      {
        "date": "2025-10-01",
        "impressions": 250,
        "clicks": 38,
        "conversions": 6
      }
    ]
  }
}
```

---

## Error Codes

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Error Examples

**Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "recipientId is required"
  }
}
```

**Rate Limit Exceeded**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Maximum 10 messages per minute"
  }
}
```

---

## Rate Limiting

### OnlyFans Messages

- **Limit**: 10 messages per minute per user
- **Implementation**: AWS Lambda + SQS + Redis token bucket
- **Behavior**: Messages are queued, not rejected
- **Retry**: Automatic with exponential backoff

### API Endpoints

- **Default**: 100 requests per minute per user
- **Burst**: 200 requests per minute
- **Headers**: 
  - `X-RateLimit-Limit`: Total limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (1-indexed)
- `limit`: Items per page (max: 100)

**Response Metadata**:
```json
{
  "metadata": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Webhooks

Coming soon: Real-time event notifications via webhooks.

---

## SDKs

### TypeScript/JavaScript

```typescript
import { apiClient } from '@/lib/api-client';

// Get dashboard metrics
const metrics = await apiClient.get('/dashboard/metrics');

// Send OnlyFans message
const result = await apiClient.post('/onlyfans/messages/send', {
  recipientId: 'user_123',
  content: 'Hello!',
});
```

### Python (Coming Soon)

```python
from huntaze import HuntazeClient

client = HuntazeClient(api_key='your-api-key')
metrics = client.dashboard.get_metrics()
```

---

## Support

- **Documentation**: https://docs.huntaze.com
- **API Status**: https://status.huntaze.com
- **Support Email**: support@huntaze.com
- **Discord**: https://discord.gg/huntaze

---

**Last Updated**: 2025-10-30  
**API Version**: 2.0.0
