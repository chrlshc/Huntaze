# OnlyFans Subscribers API - Integration Guide

**Version**: 2.0.0  
**Last Updated**: 2025-10-30

---

## Overview

The OnlyFans Subscribers API allows you to manage your subscriber base programmatically. You can list, search, filter, and add subscribers to your Huntaze account.

### Key Features

- ✅ Paginated subscriber lists
- ✅ Filter by subscription tier (free, premium, vip)
- ✅ Search by username or email
- ✅ Aggregated activity metrics (messages, transactions)
- ✅ Add new subscribers programmatically

---

## Authentication

All endpoints require authentication via NextAuth.js session cookies.

```typescript
import { signIn } from 'next-auth/react';

// Sign in to get session
await signIn('credentials', {
  email: 'your@email.com',
  password: 'your-password',
  redirect: false,
});
```

---

## Endpoints

### 1. List Subscribers

Retrieve a paginated list of your OnlyFans subscribers.

#### Request

```http
GET /api/onlyfans/subscribers
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (min: 1) |
| `pageSize` | integer | No | 20 | Items per page (min: 1, max: 100) |
| `tier` | string | No | - | Filter by tier: `free`, `premium`, `vip` |
| `search` | string | No | - | Search by username or email (case-insensitive) |

#### Example Requests

**Basic request:**
```bash
curl -X GET "https://app.huntaze.com/api/onlyfans/subscribers" \
  -H "Cookie: next-auth.session-token=<your-token>"
```

**With pagination:**
```bash
curl -X GET "https://app.huntaze.com/api/onlyfans/subscribers?page=2&pageSize=50" \
  -H "Cookie: next-auth.session-token=<your-token>"
```

**Filter by tier:**
```bash
curl -X GET "https://app.huntaze.com/api/onlyfans/subscribers?tier=premium" \
  -H "Cookie: next-auth.session-token=<your-token>"
```

**Search subscribers:**
```bash
curl -X GET "https://app.huntaze.com/api/onlyfans/subscribers?search=john" \
  -H "Cookie: next-auth.session-token=<your-token>"
```

#### Response (200 OK)

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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique subscriber ID |
| `userId` | string | Your user ID (creator) |
| `username` | string | Subscriber's username |
| `email` | string | Subscriber's email |
| `tier` | string | Subscription tier (`free`, `premium`, `vip`) |
| `onlyfansId` | string\|null | OnlyFans platform user ID |
| `isActive` | boolean | Whether subscription is active |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
| `_count.messages` | integer | Total messages sent to subscriber |
| `_count.transactions` | integer | Total transactions from subscriber |

#### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch subscribers"
  }
}
```

---

### 2. Add Subscriber

Create a new subscriber record in your account.

#### Request

```http
POST /api/onlyfans/subscribers
Content-Type: application/json
```

#### Request Body

```json
{
  "username": "new_fan_123",
  "email": "newfan@example.com",
  "tier": "free",
  "onlyfansId": "of_67890"
}
```

#### Body Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `username` | string | **Yes** | - | Subscriber's username |
| `email` | string | **Yes** | - | Subscriber's email address |
| `tier` | string | No | `free` | Subscription tier: `free`, `premium`, `vip` |
| `onlyfansId` | string | No | - | OnlyFans platform user ID |

#### Example Requests

**Basic subscriber:**
```bash
curl -X POST "https://app.huntaze.com/api/onlyfans/subscribers" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -d '{
    "username": "new_fan_123",
    "email": "newfan@example.com"
  }'
```

**Premium subscriber with OnlyFans ID:**
```bash
curl -X POST "https://app.huntaze.com/api/onlyfans/subscribers" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -d '{
    "username": "vip_fan_456",
    "email": "vipfan@example.com",
    "tier": "premium",
    "onlyfansId": "of_67890"
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "sub_new123",
    "userId": "user_xyz789",
    "username": "new_fan_123",
    "email": "newfan@example.com",
    "tier": "free",
    "onlyfansId": null,
    "isActive": true,
    "createdAt": "2025-10-29T15:45:00Z",
    "updatedAt": "2025-10-29T15:45:00Z"
  }
}
```

#### Error Responses

**400 Bad Request (Validation Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username and email are required"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create subscriber"
  }
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Using fetch API
async function listSubscribers(page = 1, tier?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    ...(tier && { tier }),
  });

  const response = await fetch(
    `https://app.huntaze.com/api/onlyfans/subscribers?${params}`,
    {
      credentials: 'include', // Include session cookie
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch subscribers');
  }

  return await response.json();
}

async function addSubscriber(data: {
  username: string;
  email: string;
  tier?: 'free' | 'premium' | 'vip';
  onlyfansId?: string;
}) {
  const response = await fetch(
    'https://app.huntaze.com/api/onlyfans/subscribers',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// Usage
const subscribers = await listSubscribers(1, 'premium');
console.log(`Found ${subscribers.metadata.total} premium subscribers`);

const newSub = await addSubscriber({
  username: 'new_fan',
  email: 'fan@example.com',
  tier: 'free',
});
console.log(`Created subscriber: ${newSub.data.id}`);
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface Subscriber {
  id: string;
  username: string;
  email: string;
  tier: 'free' | 'premium' | 'vip';
  isActive: boolean;
  _count: {
    messages: number;
    transactions: number;
  };
}

export function useSubscribers(page = 1, tier?: string) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    async function fetchSubscribers() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          ...(tier && { tier }),
        });

        const response = await fetch(
          `/api/onlyfans/subscribers?${params}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch subscribers');
        }

        const data = await response.json();
        setSubscribers(data.data);
        setMetadata(data.metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscribers();
  }, [page, tier]);

  return { subscribers, loading, error, metadata };
}

// Usage in component
function SubscribersList() {
  const { subscribers, loading, metadata } = useSubscribers(1, 'premium');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Premium Subscribers ({metadata.total})</h2>
      {subscribers.map((sub) => (
        <div key={sub.id}>
          <h3>{sub.username}</h3>
          <p>{sub.email}</p>
          <p>Messages: {sub._count.messages}</p>
        </div>
      ))}
    </div>
  );
}
```

### Python

```python
import requests

class HuntazeAPI:
    def __init__(self, session_token: str):
        self.base_url = "https://app.huntaze.com/api"
        self.session = requests.Session()
        self.session.cookies.set("next-auth.session-token", session_token)
    
    def list_subscribers(self, page: int = 1, page_size: int = 20, 
                        tier: str = None, search: str = None):
        """List OnlyFans subscribers"""
        params = {
            "page": page,
            "pageSize": page_size,
        }
        if tier:
            params["tier"] = tier
        if search:
            params["search"] = search
        
        response = self.session.get(
            f"{self.base_url}/onlyfans/subscribers",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def add_subscriber(self, username: str, email: str, 
                      tier: str = "free", onlyfans_id: str = None):
        """Add a new subscriber"""
        data = {
            "username": username,
            "email": email,
            "tier": tier,
        }
        if onlyfans_id:
            data["onlyfansId"] = onlyfans_id
        
        response = self.session.post(
            f"{self.base_url}/onlyfans/subscribers",
            json=data
        )
        response.raise_for_status()
        return response.json()

# Usage
api = HuntazeAPI(session_token="your-session-token")

# List premium subscribers
result = api.list_subscribers(tier="premium")
print(f"Found {result['metadata']['total']} premium subscribers")

# Add new subscriber
new_sub = api.add_subscriber(
    username="new_fan",
    email="fan@example.com",
    tier="free"
)
print(f"Created subscriber: {new_sub['data']['id']}")
```

---

## Best Practices

### 1. Pagination

Always use pagination for large subscriber lists:

```typescript
async function getAllSubscribers() {
  const allSubscribers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/onlyfans/subscribers?page=${page}&pageSize=100`
    );
    const data = await response.json();
    
    allSubscribers.push(...data.data);
    hasMore = page < data.metadata.totalPages;
    page++;
  }

  return allSubscribers;
}
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  const response = await fetch('/api/onlyfans/subscribers');
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error.message);
    return;
  }
  
  const data = await response.json();
  // Process data
} catch (error) {
  console.error('Network Error:', error);
}
```

### 3. Search Optimization

Use debouncing for search inputs:

```typescript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

function SubscriberSearch() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  const debouncedSearch = debounce(async (query: string) => {
    if (!query) return;
    
    const response = await fetch(
      `/api/onlyfans/subscribers?search=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data.data);
  }, 300);

  useEffect(() => {
    debouncedSearch(search);
  }, [search]);

  return (
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search subscribers..."
    />
  );
}
```

### 4. Caching

Implement client-side caching to reduce API calls:

```typescript
const subscriberCache = new Map();

async function getCachedSubscribers(page: number, tier?: string) {
  const cacheKey = `${page}-${tier || 'all'}`;
  
  if (subscriberCache.has(cacheKey)) {
    return subscriberCache.get(cacheKey);
  }
  
  const response = await fetch(
    `/api/onlyfans/subscribers?page=${page}${tier ? `&tier=${tier}` : ''}`
  );
  const data = await response.json();
  
  subscriberCache.set(cacheKey, data);
  return data;
}
```

---

## Rate Limiting

The Subscribers API does not have specific rate limits, but follows general API guidelines:

- **Recommended**: Max 100 requests per minute
- **Burst**: Up to 10 concurrent requests
- **Pagination**: Use `pageSize=100` for bulk operations

---

## Support

For questions or issues:

- **Documentation**: https://docs.huntaze.com
- **Support Email**: support@huntaze.com
- **API Status**: https://status.huntaze.com

---

**Last Updated**: 2025-10-30  
**API Version**: 2.0.0
