# Huntaze CRM API Reference

## Overview

The Huntaze CRM API provides endpoints for managing creator relationships, conversations, messages, and analytics. All endpoints require authentication and return JSON responses.

**Base URL**: `https://app.huntaze.com/api`  
**Version**: 1.4.2  
**Last Updated**: October 31, 2025

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Data Types](#data-types)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Fans Management](#fans-management)
  - [Conversations](#conversations)
  - [Analytics](#analytics)
  - [Webhooks](#webhooks)
- [Integration Guide](#integration-guide)
- [Changelog](#changelog)

---

## Authentication

All API endpoints require authentication via JWT token stored in HTTP-only cookies.

### Cookie Names
- `access_token` (primary)
- `auth_token` (fallback)

### Example Request
```bash
curl -X GET https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_JWT_TOKEN"
```

### Authentication Errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid token but insufficient permissions

---

## Rate Limiting

Rate limits are applied per user to protect the API from abuse.

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Read (GET) | No limit | - |
| Write (POST/PUT/DELETE) | 60 requests | 60 seconds |

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698765432
```

### Rate Limit Exceeded Response
```json
{
  "error": "Rate limit exceeded"
}
```
**Status Code**: 429 Too Many Requests

---

## Data Types

### Monetary Values
All monetary values are represented in **cents (USD)**.

```json
{
  "value_cents": 25000  // $250.00
}
```

### Timestamps
All timestamps use **ISO 8601 format** with UTC timezone.

```json
{
  "created_at": "2025-10-31T10:00:00Z"
}
```

### IDs
All IDs are **integers**.

```json
{
  "id": 42,
  "user_id": 123,
  "fan_id": 456
}
```

### Database Numeric Values
⚠️ **Important**: Numeric values from PostgreSQL aggregate functions (SUM, COUNT, etc.) are returned as **strings** and must be parsed as integers.

```javascript
// ❌ Wrong
const total = result.rows[0].total_value;
expect(total).toBeGreaterThan(0);

// ✅ Correct
const total = parseInt(result.rows[0].total_value);
expect(total).toBeGreaterThan(0);
```

This applies to:
- `SUM()` aggregates
- `COUNT()` aggregates
- `AVG()` aggregates
- Any numeric calculation in SQL

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Status Code | Meaning | Example |
|------------|---------|---------|
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Database error |

### Error Examples

#### 400 Bad Request
```json
{
  "error": "fanId is required"
}
```

#### 401 Unauthorized
```json
{
  "error": "Not authenticated"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to list fans"
}
```

---

## Endpoints

### Fans Management

#### List Fans
Retrieve all fans for the authenticated user.

**Endpoint**: `GET /api/crm/fans`

**Request**:
```bash
curl -X GET https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_JWT_TOKEN"
```

**Response**: 200 OK
```json
{
  "fans": [
    {
      "id": 1,
      "user_id": 42,
      "name": "John Subscriber",
      "platform": "onlyfans",
      "platform_id": "of_john_123",
      "handle": "@johnfan",
      "tags": ["vip", "active"],
      "value_cents": 25000,
      "created_at": "2025-10-31T10:00:00Z",
      "updated_at": "2025-10-31T10:00:00Z"
    }
  ]
}
```

**Fields**:
- `id` (integer): Unique fan identifier
- `user_id` (integer): Creator's user ID
- `name` (string): Fan's display name
- `platform` (string): Platform (onlyfans, fansly, patreon, instagram, tiktok)
- `platform_id` (string): Platform-specific unique ID
- `handle` (string, nullable): Fan's username/handle
- `tags` (array): Tags for categorization
- `value_cents` (integer): Total lifetime value in cents
- `created_at` (string): Creation timestamp
- `updated_at` (string): Last update timestamp

**Errors**:
- 401: Not authenticated
- 500: Failed to list fans

---

#### Create Fan
Create a new fan record.

**Endpoint**: `POST /api/crm/fans`

**Request**:
```bash
curl -X POST https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Mitchell",
    "platform": "fansly",
    "platform_id": "fansly_sarah_456",
    "handle": "@sarahm",
    "tags": ["vip"],
    "value_cents": 0
  }'
```

**Request Body**:
```json
{
  "name": "Sarah Mitchell",
  "platform": "fansly",
  "platform_id": "fansly_sarah_456",
  "handle": "@sarahm",
  "tags": ["vip"],
  "value_cents": 0
}
```

**Required Fields**:
- `name` (string): Fan's display name
- `platform` (string): Platform name
- `platform_id` (string): Platform-specific ID

**Optional Fields**:
- `handle` (string): Username/handle
- `tags` (array): Categorization tags
- `value_cents` (integer): Initial lifetime value (default: 0)

**Response**: 201 Created
```json
{
  "fan": {
    "id": 2,
    "user_id": 42,
    "name": "Sarah Mitchell",
    "platform": "fansly",
    "platform_id": "fansly_sarah_456",
    "handle": "@sarahm",
    "tags": ["vip"],
    "value_cents": 0,
    "created_at": "2025-10-31T12:00:00Z",
    "updated_at": "2025-10-31T12:00:00Z"
  }
}
```

**Errors**:
- 400: Invalid request (missing required fields)
- 401: Not authenticated
- 429: Rate limit exceeded
- 500: Failed to create fan

---

### Conversations

#### List Conversations
Retrieve all conversations for the authenticated user.

**Endpoint**: `GET /api/crm/conversations`

**Request**:
```bash
curl -X GET https://app.huntaze.com/api/crm/conversations \
  -H "Cookie: access_token=YOUR_JWT_TOKEN"
```

**Response**: 200 OK
```json
{
  "conversations": [
    {
      "id": 1,
      "user_id": 42,
      "fan_id": 1,
      "platform": "onlyfans",
      "platform_conversation_id": "conv_john_123",
      "last_message_at": "2025-10-31T12:30:00Z",
      "unread_count": 3,
      "created_at": "2025-10-31T10:00:00Z"
    }
  ]
}
```

**Fields**:
- `id` (integer): Unique conversation identifier
- `user_id` (integer): Creator's user ID
- `fan_id` (integer): Fan's ID
- `platform` (string): Platform name
- `platform_conversation_id` (string, nullable): Platform-specific conversation ID
- `last_message_at` (string, nullable): Last message timestamp
- `unread_count` (integer): Number of unread messages
- `created_at` (string): Creation timestamp

**Errors**:
- 401: Not authenticated
- 500: Failed to list conversations

---

#### Create Conversation
Create a new conversation with a fan.

**Endpoint**: `POST /api/crm/conversations`

**Request**:
```bash
curl -X POST https://app.huntaze.com/api/crm/conversations \
  -H "Cookie: access_token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fanId": 1,
    "platform": "onlyfans"
  }'
```

**Request Body**:
```json
{
  "fanId": 1,
  "platform": "onlyfans"
}
```

**Required Fields**:
- `fanId` (integer): ID of the fan
- `platform` (string): Platform name

**Response**: 201 Created
```json
{
  "conversation": {
    "id": 2,
    "user_id": 42,
    "fan_id": 1,
    "platform": "onlyfans",
    "platform_conversation_id": null,
    "last_message_at": null,
    "unread_count": 0,
    "created_at": "2025-10-31T13:00:00Z"
  }
}
```

**Errors**:
- 400: fanId is required
- 401: Not authenticated
- 500: Failed to create conversation

---

### Analytics

#### Get Analytics Overview
Retrieve comprehensive analytics including revenue, subscribers, and AI metrics.

**Endpoint**: `GET /api/analytics/overview`

**Request**:
```bash
curl -X GET https://app.huntaze.com/api/analytics/overview \
  -H "Cookie: access_token=YOUR_JWT_TOKEN"
```

**Response**: 200 OK
```json
{
  "metrics": {
    "revenueMonthly": 24586,
    "activeSubscribers": 2847,
    "avgResponseSeconds": 72,
    "aiAutomationRate": 0.87,
    "change": {
      "revenue": 0.324,
      "subscribers": 0.123,
      "response": -0.25,
      "automation": 0.052
    }
  },
  "topFans": [
    {
      "name": "Alex Thompson",
      "username": "@alex_t",
      "revenue": 2456,
      "messages": 145,
      "lastActive": "2m",
      "badge": "vip",
      "trend": 0.15
    }
  ],
  "platformDistribution": [
    {
      "platform": "onlyfans",
      "share": 0.55,
      "revenue": 55896
    }
  ],
  "revenueSeries": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "values": [12000, 19000, 15000, 25000, 22000, 30000]
  },
  "fanGrowth": {
    "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
    "newFans": [120, 150, 180, 240],
    "activeFans": [80, 120, 140, 190]
  }
}
```

**Fields**:
- `metrics.revenueMonthly` (integer): Monthly revenue in cents
- `metrics.activeSubscribers` (integer): Number of active subscribers
- `metrics.avgResponseSeconds` (integer): Average response time
- `metrics.aiAutomationRate` (float): AI automation percentage (0-1)
- `metrics.change` (object): Percentage changes from previous period
- `topFans` (array): Top fans by revenue
- `platformDistribution` (array): Revenue distribution by platform
- `revenueSeries` (object): Historical revenue data
- `fanGrowth` (object): Fan growth metrics

**Errors**:
- 401: Not authenticated
- 500: Failed to load analytics

---

## Integration Guide

### Quick Start

1. **Authenticate**: Obtain JWT token via login
2. **List Fans**: Get existing fans
3. **Create Fan**: Add new fan
4. **Create Conversation**: Start conversation with fan
5. **Get Analytics**: View performance metrics

### Example: Complete Flow

```javascript
// 1. Authenticate (handled by your auth system)
const token = await login(email, password);

// 2. List existing fans
const fansResponse = await fetch('/api/crm/fans', {
  credentials: 'include' // Include cookies
});
const { fans } = await fansResponse.json();

// 3. Create a new fan
const createResponse = await fetch('/api/crm/fans', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Fan',
    platform: 'onlyfans',
    platform_id: 'of_new_123',
    tags: ['new']
  })
});
const { fan } = await createResponse.json();

// 4. Create conversation
const convResponse = await fetch('/api/crm/conversations', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fanId: fan.id,
    platform: 'onlyfans'
  })
});
const { conversation } = await convResponse.json();

// 5. Get analytics
const analyticsResponse = await fetch('/api/analytics/overview', {
  credentials: 'include'
});
const analytics = await analyticsResponse.json();
```

### Error Handling Best Practices

```javascript
async function listFans() {
  try {
    const response = await fetch('/api/crm/fans', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const { error } = await response.json();
      
      switch (response.status) {
        case 401:
          // Redirect to login
          window.location.href = '/auth/login';
          break;
        case 429:
          // Show rate limit message
          alert('Too many requests. Please wait.');
          break;
        case 500:
          // Show error message
          console.error('Server error:', error);
          break;
      }
      
      throw new Error(error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to list fans:', error);
    throw error;
  }
}
```

### Working with Database Numeric Values

When processing analytics or aggregate data, always parse numeric strings:

```javascript
// ❌ Wrong - will fail type checks
const totalValue = result.rows[0].total_value;
expect(totalValue).toBeGreaterThan(0);

// ✅ Correct - parse as integer
const totalValue = parseInt(result.rows[0].total_value);
expect(totalValue).toBeGreaterThan(0);

// ✅ Also correct - use Number()
const messageCount = Number(result.rows[0].message_count);
expect(messageCount).toBeGreaterThanOrEqual(3);
```

This is required for:
- `SUM(value_cents)` → `parseInt(total_value)`
- `COUNT(*)` → `parseInt(message_count)`
- `AVG(response_time)` → `parseFloat(avg_response)`

---

## Webhooks

### Instagram Webhook

Receives webhook events from Instagram/Meta Graph API for real-time notifications about media posts, comments, and mentions.

#### POST /api/webhooks/instagram

**Description**: Receives Instagram webhook events

**Authentication**: None (signature verification via header)

**Headers**:
- `x-hub-signature-256` (optional): HMAC SHA-256 signature for payload verification

**Request Body**:
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "instagram_account_id",
      "time": 1635724800,
      "changes": [
        {
          "field": "media",
          "value": {
            "id": "media_id_123",
            "media_type": "IMAGE",
            "caption": "New post!"
          }
        }
      ]
    }
  ]
}
```

**Event Types**:
- `media` - New posts
- `comments` - New comments on posts
- `mentions` - Mentions in stories or posts

**Response**:
```json
{
  "success": true
}
```

**Status Codes**:
- `200 OK` - Webhook received successfully
- `400 Bad Request` - Invalid payload format
- `401 Unauthorized` - Invalid signature

**Security**:
- Signature verification using HMAC SHA-256
- Set `INSTAGRAM_WEBHOOK_SECRET` environment variable
- Signature format: `sha256=<hash>`

**Example - Media Event**:
```bash
curl -X POST https://app.huntaze.com/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=abc123..." \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "instagram_account_id",
      "time": 1635724800,
      "changes": [{
        "field": "media",
        "value": {
          "id": "media_id_123",
          "media_type": "IMAGE"
        }
      }]
    }]
  }'
```

**Example - Comment Event**:
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_account_id",
    "time": 1635724800,
    "changes": [{
      "field": "comments",
      "value": {
        "id": "comment_id_456",
        "text": "Great content!",
        "from": {
          "id": "user_id",
          "username": "fan_username"
        }
      }
    }]
  }]
}
```

**Example - Mention Event**:
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_account_id",
    "time": 1635724800,
    "changes": [{
      "field": "mentions",
      "value": {
        "id": "mention_id_789",
        "media_id": "story_id"
      }
    }]
  }]
}
```

**Processing**:
- Responds immediately with 200 (Meta requirement)
- Processes events asynchronously via `webhookProcessor`
- Events are stored in database for processing
- Failed events are retried automatically

---

#### GET /api/webhooks/instagram

**Description**: Handles Meta webhook verification challenge

**Authentication**: None

**Query Parameters**:
- `hub.mode` (required): Verification mode (always "subscribe")
- `hub.verify_token` (required): Verification token (must match configured token)
- `hub.challenge` (required): Challenge string to echo back

**Response**:
```
1234567890
```
(Plain text echo of the challenge parameter)

**Status Codes**:
- `200 OK` - Verification successful
- `403 Forbidden` - Verification failed (invalid token)

**Setup**:
1. Set `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` environment variable
2. Configure webhook URL in Meta Developer Console: `https://app.huntaze.com/api/webhooks/instagram`
3. Meta will call this endpoint to verify
4. Endpoint validates token and returns challenge

**Example**:
```bash
curl -X GET "https://app.huntaze.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=huntaze_instagram_webhook&hub.challenge=1234567890"
```

**Response**:
```
1234567890
```

**Configuration**:
```bash
# .env
INSTAGRAM_WEBHOOK_SECRET=your_webhook_secret_from_meta
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=huntaze_instagram_webhook
```

**Meta Developer Console Setup**:
1. Go to App Dashboard → Webhooks
2. Click "Add Subscription"
3. Enter callback URL: `https://app.huntaze.com/api/webhooks/instagram`
4. Enter verify token: `huntaze_instagram_webhook`
5. Select fields: `media`, `comments`, `mentions`
6. Click "Verify and Save"

**Troubleshooting**:
- **Verification fails**: Check `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches Meta console
- **Invalid signature**: Check `INSTAGRAM_WEBHOOK_SECRET` matches Meta app secret
- **Events not received**: Check webhook subscription is active in Meta console
- **Processing errors**: Check logs for `webhookProcessor` errors

---

## Changelog

### v1.4.2 (2025-10-31)
- ✅ Added Instagram webhook endpoint documentation
- ✅ Documented webhook signature verification
- ✅ Added webhook setup guide for Meta Developer Console
- ✅ Added webhook event examples (media, comments, mentions)
- ✅ Documented webhook verification challenge flow

### v1.4.0 (2025-10-31)
- ✅ Added OpenAPI 3.0 specification
- ✅ Documented all CRM endpoints
- ✅ Added integration guide
- ✅ Documented database numeric value parsing requirement
- ✅ Added error handling examples
- ✅ Added rate limiting documentation

### v1.3.0 (2025-10-31)
- ✅ Migrated CRM data from in-memory to PostgreSQL
- ✅ Created fans, conversations, messages tables
- ✅ Added cascade delete constraints
- ✅ Optimized indexes for performance

### v1.2.0 (2025-10-05)
- ✅ Added observability with CloudWatch metrics
- ✅ Added request ID correlation
- ✅ Added structured logging

---

## Support

For API support, contact:
- **Email**: support@huntaze.com
- **Documentation**: https://docs.huntaze.com
- **Status Page**: https://status.huntaze.com

---

**Last Updated**: October 31, 2025  
**API Version**: 1.4.2  
**OpenAPI Spec**: [docs/api/openapi.yaml](./api/openapi.yaml)
