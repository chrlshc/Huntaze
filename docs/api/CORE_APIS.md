# Core APIs Documentation

Complete API reference for Content, Analytics, Marketing, and OnlyFans endpoints.

**Requirements:** 7.4

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Content API](#content-api)
- [Analytics API](#analytics-api)
- [Marketing API](#marketing-api)
- [OnlyFans API](#onlyfans-api)

## Authentication

All API endpoints require authentication via NextAuth session. Include session cookie in requests.

**Session Requirements:**
- Valid NextAuth session
- Completed onboarding (`onboardingCompleted: true`)

**Error Responses:**
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Onboarding not completed

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `ONBOARDING_REQUIRED` | 403 | Complete onboarding first |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |

---

## Content API

Manage content creation, scheduling, and publishing across platforms.

### List Content

Get paginated list of content with optional filters.

**Endpoint:** `GET /api/content`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `draft`, `scheduled`, `published` |
| `platform` | string | No | Filter by platform: `onlyfans`, `fansly`, `instagram`, `tiktok` |
| `type` | string | No | Filter by type: `image`, `video`, `text` |
| `limit` | number | No | Items per page (1-100, default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "https://api.huntaze.com/api/content?status=published&limit=10" \
  -H "Cookie: next-auth.session-token=..."
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx123abc",
        "userId": 123,
        "title": "Summer Collection Launch",
        "text": "Check out our new summer collection!",
        "type": "image",
        "platform": "instagram",
        "status": "published",
        "category": "lifestyle",
        "tags": ["summer", "fashion"],
        "mediaIds": ["media_123", "media_456"],
        "scheduledAt": null,
        "publishedAt": "2024-01-15T10:00:00.000Z",
        "createdAt": "2024-01-10T08:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Create Content

Create new content item.

**Endpoint:** `POST /api/content`

**Request Body:**

```json
{
  "title": "Content Title",
  "text": "Optional description",
  "type": "image",
  "platform": "instagram",
  "status": "draft",
  "category": "lifestyle",
  "tags": ["tag1", "tag2"],
  "mediaIds": ["media_123"],
  "scheduledAt": "2024-01-20T10:00:00.000Z"
}
```

**Required Fields:**
- `title` (string, max 200 chars)
- `type` (enum: `image`, `video`, `text`)
- `platform` (enum: `onlyfans`, `fansly`, `instagram`, `tiktok`)
- `status` (enum: `draft`, `scheduled`, `published`)

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "userId": 123,
    "title": "Content Title",
    "type": "image",
    "platform": "instagram",
    "status": "draft",
    "tags": ["tag1", "tag2"],
    "mediaIds": ["media_123"],
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-10T08:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created` - Content created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `429 Too Many Requests` - Rate limit exceeded

### Get Content

Get single content item by ID.

**Endpoint:** `GET /api/content/:id`

**Example Request:**

```bash
curl -X GET "https://api.huntaze.com/api/content/clx123abc" \
  -H "Cookie: next-auth.session-token=..."
```

**Status Codes:**
- `200 OK` - Content retrieved
- `404 Not Found` - Content not found or access denied

### Update Content

Update existing content item.

**Endpoint:** `PATCH /api/content/:id`

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Title",
  "status": "published",
  "tags": ["new", "tags"]
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "title": "Updated Title",
    "status": "published",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Content updated
- `404 Not Found` - Content not found or access denied

### Delete Content

Delete content item.

**Endpoint:** `DELETE /api/content/:id`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "title": "Deleted Content"
  }
}
```

**Status Codes:**
- `200 OK` - Content deleted
- `404 Not Found` - Content not found or access denied

---

## Analytics API

Retrieve performance metrics and trends.

### Get Overview

Get key analytics metrics.

**Endpoint:** `GET /api/analytics/overview`

**Example Request:**

```bash
curl -X GET "https://api.huntaze.com/api/analytics/overview" \
  -H "Cookie: next-auth.session-token=..."
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "arpu": 45.50,
    "ltv": 546.00,
    "churnRate": 5.2,
    "activeSubscribers": 150,
    "totalRevenue": 6825.00,
    "momGrowth": 12.5
  }
}
```

**Metrics:**
- `arpu` - Average Revenue Per User (current month)
- `ltv` - Lifetime Value (ARPU × 12)
- `churnRate` - Percentage of subscribers who cancelled
- `activeSubscribers` - Current active subscriber count
- `totalRevenue` - Total revenue (current month)
- `momGrowth` - Month-over-month growth percentage

**Cache:** 5 minutes

### Get Trends

Get time-series trend data for specific metric.

**Endpoint:** `GET /api/analytics/trends`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric` | string | Yes | Metric: `revenue`, `subscribers`, `arpu` |
| `period` | string | No | Period: `day`, `week`, `month` (default: `day`) |
| `days` | number | No | Days to include (default: 30) |

**Example Request:**

```bash
curl -X GET "https://api.huntaze.com/api/analytics/trends?metric=revenue&period=day&days=7" \
  -H "Cookie: next-auth.session-token=..."
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-10",
      "value": 250.00
    },
    {
      "date": "2024-01-11",
      "value": 320.00
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Trends retrieved
- `400 Bad Request` - Invalid metric parameter

---

## Marketing API

Manage marketing campaigns and automation.

### List Campaigns

Get paginated list of campaigns.

**Endpoint:** `GET /api/marketing/campaigns`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `draft`, `scheduled`, `active`, `paused`, `completed` |
| `channel` | string | No | Filter: `email`, `dm`, `sms`, `push` |
| `limit` | number | No | Items per page (1-100, default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx456def",
        "userId": 123,
        "name": "Welcome Campaign",
        "status": "active",
        "channel": "email",
        "goal": "engagement",
        "audienceSegment": "new_subscribers",
        "audienceSize": 500,
        "message": {
          "subject": "Welcome!",
          "body": "Thanks for subscribing!"
        },
        "stats": {
          "sent": 500,
          "opened": 350,
          "clicked": 120,
          "converted": 45,
          "openRate": 70.0,
          "clickRate": 34.29,
          "conversionRate": 9.0
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 12,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Create Campaign

Create new marketing campaign.

**Endpoint:** `POST /api/marketing/campaigns`

**Request Body:**

```json
{
  "name": "Campaign Name",
  "status": "draft",
  "channel": "email",
  "goal": "engagement",
  "audienceSegment": "all_subscribers",
  "audienceSize": 1000,
  "message": {
    "subject": "Special Offer",
    "body": "Check out our exclusive deal!"
  },
  "schedule": {
    "sendAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Required Fields:**
- `name` (string, max 255 chars)
- `status` (enum: `draft`, `scheduled`, `active`, `paused`, `completed`)
- `channel` (enum: `email`, `dm`, `sms`, `push`)
- `goal` (enum: `engagement`, `conversion`, `retention`)
- `audienceSegment` (string)
- `audienceSize` (number, >= 0)
- `message` (object)

**Status Codes:**
- `201 Created` - Campaign created
- `400 Bad Request` - Invalid input

### Get Campaign

Get single campaign by ID.

**Endpoint:** `GET /api/marketing/campaigns/:id`

**Status Codes:**
- `200 OK` - Campaign retrieved
- `404 Not Found` - Campaign not found

### Update Campaign

Update existing campaign.

**Endpoint:** `PATCH /api/marketing/campaigns/:id`

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Name",
  "status": "active"
}
```

**Status Codes:**
- `200 OK` - Campaign updated
- `404 Not Found` - Campaign not found

### Delete Campaign

Delete campaign.

**Endpoint:** `DELETE /api/marketing/campaigns/:id`

**Status Codes:**
- `200 OK` - Campaign deleted
- `404 Not Found` - Campaign not found

---

## OnlyFans API

Access OnlyFans-specific data and operations.

### List Fans

Get paginated list of OnlyFans subscribers.

**Endpoint:** `GET /api/onlyfans/fans`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Items per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "fan_123",
        "username": "user123",
        "subscriptionTier": "premium",
        "subscribedAt": "2024-01-01T00:00:00.000Z",
        "totalSpent": 150.00,
        "lastActive": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 250,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Cache:** 10 minutes

### Get OnlyFans Stats

Get OnlyFans-specific statistics.

**Endpoint:** `GET /api/onlyfans/stats`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalFans": 250,
    "newFansToday": 5,
    "totalRevenue": 12500.00,
    "revenueToday": 450.00,
    "averageSubscriptionPrice": 15.00,
    "topTier": "premium"
  }
}
```

**Cache:** 10 minutes

### Get OnlyFans Content

Get content published on OnlyFans.

**Endpoint:** `GET /api/onlyfans/content`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Items per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "of_content_123",
        "type": "image",
        "title": "New Post",
        "publishedAt": "2024-01-15T10:00:00.000Z",
        "likes": 125,
        "comments": 34,
        "revenue": 250.00
      }
    ],
    "pagination": {
      "total": 180,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Cache:** 10 minutes

---

## Rate Limiting

All endpoints are rate limited to **100 requests per minute per user**.

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Rate Limit Exceeded Response:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "resetAt": "2024-01-15T10:01:00.000Z"
    }
  }
}
```

---

## Caching

Certain endpoints implement caching for performance:

| Endpoint | Cache Duration |
|----------|----------------|
| `/api/analytics/overview` | 5 minutes |
| `/api/analytics/trends` | 5 minutes |
| `/api/onlyfans/fans` | 10 minutes |
| `/api/onlyfans/stats` | 10 minutes |
| `/api/onlyfans/content` | 10 minutes |

**Cache Headers:**
```
Cache-Control: public, max-age=300
X-Cache: HIT
```

---

## Best Practices

### Error Handling

Always check the `success` field in responses:

```typescript
const response = await fetch('/api/content');
const data = await response.json();

if (!data.success) {
  console.error('Error:', data.error.code, data.error.message);
  // Handle error based on code
}
```

### Pagination

Use pagination for large datasets:

```typescript
let offset = 0;
const limit = 50;
let hasMore = true;

while (hasMore) {
  const response = await fetch(
    `/api/content?limit=${limit}&offset=${offset}`
  );
  const data = await response.json();
  
  // Process data.data.items
  
  hasMore = data.data.pagination.hasMore;
  offset += limit;
}
```

### Rate Limiting

Implement exponential backoff for rate limit errors:

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url);
    
    if (response.status !== 429) {
      return response;
    }
    
    const delay = Math.pow(2, i) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error('Max retries exceeded');
}
```

---

## Support

For API support:
- Documentation: https://docs.huntaze.com
- Email: api-support@huntaze.com
- Status: https://status.huntaze.com
