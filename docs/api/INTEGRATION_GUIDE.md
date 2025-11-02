# Huntaze API Integration Guide

## Overview

This guide helps you integrate with the Huntaze CRM API. Whether you're building a custom dashboard, mobile app, or third-party integration, this guide covers everything you need to know.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Code Examples](#code-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Active Huntaze account
- JWT authentication token
- Basic understanding of REST APIs
- HTTP client (fetch, axios, curl, etc.)

### Base URL

```
Production: https://app.huntaze.com/api
Development: http://localhost:3000/api
```

### Quick Test

```bash
# Test authentication
curl -X GET https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_JWT_TOKEN"
```

---

## Authentication

### Cookie-Based Authentication

Huntaze uses HTTP-only cookies for authentication. The JWT token is automatically included in requests when using `credentials: 'include'`.

#### Browser (Fetch API)

```javascript
const response = await fetch('/api/crm/fans', {
  credentials: 'include' // Include cookies
});
```

#### Node.js (with cookies)

```javascript
const fetch = require('node-fetch');

const response = await fetch('https://app.huntaze.com/api/crm/fans', {
  headers: {
    'Cookie': `access_token=${yourToken}`
  }
});
```

#### cURL

```bash
curl -X GET https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_JWT_TOKEN"
```

### Handling Authentication Errors

```javascript
async function authenticatedRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  
  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/auth/login';
    throw new Error('Not authenticated');
  }
  
  return response;
}
```

---

## Common Patterns

### 1. List Resources

```javascript
async function listFans() {
  const response = await fetch('/api/crm/fans', {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to list fans');
  }
  
  const { fans } = await response.json();
  return fans;
}
```

### 2. Create Resource

```javascript
async function createFan(fanData) {
  const response = await fetch('/api/crm/fans', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fanData)
  });
  
  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error);
  }
  
  const { fan } = await response.json();
  return fan;
}
```

### 3. Handle Rate Limiting

```javascript
async function rateLimitedRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      // Rate limited, wait and retry
      const retryAfter = response.headers.get('Retry-After') || 60;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Rate limit exceeded after retries');
}
```

### 4. Parse Database Numeric Values

⚠️ **Critical**: PostgreSQL aggregate functions return strings, not numbers.

```javascript
async function getTotalFanValue(userId) {
  const result = await pool.query(
    'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
    [userId]
  );
  
  // ❌ Wrong - will fail type checks
  // const total = result.rows[0].total_value;
  
  // ✅ Correct - parse as integer
  const total = parseInt(result.rows[0].total_value);
  
  return total;
}
```

**Always parse these SQL functions:**
- `SUM()` → `parseInt()`
- `COUNT()` → `parseInt()`
- `AVG()` → `parseFloat()`
- Any numeric calculation

---

## Code Examples

### Example 1: Complete Fan Management

```javascript
class FanManager {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async listFans() {
    const response = await fetch(`${this.baseUrl}/crm/fans`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to list fans');
    }
    
    const { fans } = await response.json();
    return fans;
  }
  
  async createFan(fanData) {
    const response = await fetch(`${this.baseUrl}/crm/fans`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fanData)
    });
    
    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error);
    }
    
    const { fan } = await response.json();
    return fan;
  }
  
  async getFansByTag(tag) {
    const fans = await this.listFans();
    return fans.filter(fan => fan.tags?.includes(tag));
  }
  
  async getTotalValue() {
    const fans = await this.listFans();
    return fans.reduce((sum, fan) => sum + fan.value_cents, 0);
  }
}

// Usage
const fanManager = new FanManager();

// List all fans
const fans = await fanManager.listFans();

// Create new fan
const newFan = await fanManager.createFan({
  name: 'John Doe',
  platform: 'onlyfans',
  platform_id: 'of_john_123',
  tags: ['vip']
});

// Get VIP fans
const vipFans = await fanManager.getFansByTag('vip');

// Calculate total value
const totalValue = await fanManager.getTotalValue();
console.log(`Total fan value: $${totalValue / 100}`);
```

### Example 2: Conversation Management

```javascript
class ConversationManager {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async listConversations() {
    const response = await fetch(`${this.baseUrl}/crm/conversations`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to list conversations');
    }
    
    const { conversations } = await response.json();
    return conversations;
  }
  
  async createConversation(fanId, platform) {
    const response = await fetch(`${this.baseUrl}/crm/conversations`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fanId, platform })
    });
    
    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error);
    }
    
    const { conversation } = await response.json();
    return conversation;
  }
  
  async getUnreadCount() {
    const conversations = await this.listConversations();
    return conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  }
  
  async getRecentConversations(limit = 10) {
    const conversations = await this.listConversations();
    return conversations
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
      .slice(0, limit);
  }
}

// Usage
const convManager = new ConversationManager();

// List all conversations
const conversations = await convManager.listConversations();

// Create conversation
const conversation = await convManager.createConversation(1, 'onlyfans');

// Get unread count
const unreadCount = await convManager.getUnreadCount();
console.log(`Unread messages: ${unreadCount}`);

// Get recent conversations
const recent = await convManager.getRecentConversations(5);
```

### Example 3: Analytics Dashboard

```javascript
class AnalyticsDashboard {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async getOverview() {
    const response = await fetch(`${this.baseUrl}/analytics/overview`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to load analytics');
    }
    
    return await response.json();
  }
  
  async getMetrics() {
    const data = await this.getOverview();
    return data.metrics;
  }
  
  async getTopFans(limit = 10) {
    const data = await this.getOverview();
    return data.topFans.slice(0, limit);
  }
  
  async getPlatformDistribution() {
    const data = await this.getOverview();
    return data.platformDistribution;
  }
  
  formatCurrency(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }
  
  formatPercentage(value) {
    return `${(value * 100).toFixed(1)}%`;
  }
}

// Usage
const dashboard = new AnalyticsDashboard();

// Get all metrics
const metrics = await dashboard.getMetrics();
console.log('Monthly Revenue:', dashboard.formatCurrency(metrics.revenueMonthly));
console.log('Active Subscribers:', metrics.activeSubscribers);
console.log('AI Automation:', dashboard.formatPercentage(metrics.aiAutomationRate));

// Get top fans
const topFans = await dashboard.getTopFans(5);
topFans.forEach(fan => {
  console.log(`${fan.name}: ${dashboard.formatCurrency(fan.revenue)}`);
});

// Get platform distribution
const platforms = await dashboard.getPlatformDistribution();
platforms.forEach(platform => {
  console.log(`${platform.platform}: ${dashboard.formatPercentage(platform.share)}`);
});
```

### Example 4: Error Handling Wrapper

```javascript
class APIClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // Handle different status codes
      switch (response.status) {
        case 401:
          // Not authenticated
          window.location.href = '/auth/login';
          throw new Error('Not authenticated');
        
        case 429:
          // Rate limited
          const retryAfter = response.headers.get('Retry-After') || 60;
          throw new Error(`Rate limited. Retry after ${retryAfter}s`);
        
        case 400:
        case 500:
          // API error
          const { error } = await response.json();
          throw new Error(error);
        
        default:
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }
  
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Usage
const api = new APIClient();

try {
  const { fans } = await api.get('/crm/fans');
  console.log('Fans:', fans);
  
  const { fan } = await api.post('/crm/fans', {
    name: 'New Fan',
    platform: 'onlyfans',
    platform_id: 'of_new_123'
  });
  console.log('Created fan:', fan);
} catch (error) {
  console.error('Failed:', error.message);
}
```

---

## Best Practices

### 1. Always Use `credentials: 'include'`

```javascript
// ✅ Correct
fetch('/api/crm/fans', {
  credentials: 'include'
});

// ❌ Wrong - cookies won't be sent
fetch('/api/crm/fans');
```

### 2. Handle All Error Cases

```javascript
async function robustRequest(url) {
  try {
    const response = await fetch(url, { credentials: 'include' });
    
    if (response.status === 401) {
      // Handle authentication
      redirectToLogin();
    } else if (response.status === 429) {
      // Handle rate limiting
      showRateLimitMessage();
    } else if (!response.ok) {
      // Handle other errors
      const { error } = await response.json();
      showErrorMessage(error);
    }
    
    return await response.json();
  } catch (error) {
    // Handle network errors
    console.error('Network error:', error);
    showNetworkError();
  }
}
```

### 3. Parse Database Numeric Values

```javascript
// ✅ Always parse aggregate results
const total = parseInt(result.rows[0].total_value);
const count = parseInt(result.rows[0].message_count);
const average = parseFloat(result.rows[0].avg_response);
```

### 4. Implement Retry Logic for Rate Limits

```javascript
async function retryableRequest(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, { credentials: 'include' });
    
    if (response.status !== 429) {
      return response;
    }
    
    // Wait before retry
    const delay = Math.pow(2, i) * 1000; // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error('Max retries exceeded');
}
```

### 5. Cache Responses When Appropriate

```javascript
class CachedAPIClient {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 60000; // 1 minute
  }
  
  async get(endpoint) {
    const cached = this.cache.get(endpoint);
    
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    
    const response = await fetch(endpoint, { credentials: 'include' });
    const data = await response.json();
    
    this.cache.set(endpoint, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

### 6. Use TypeScript for Type Safety

```typescript
interface Fan {
  id: number;
  user_id: number;
  name: string;
  platform: 'onlyfans' | 'fansly' | 'patreon' | 'instagram' | 'tiktok';
  platform_id: string;
  handle?: string;
  tags: string[];
  value_cents: number;
  created_at: string;
  updated_at: string;
}

async function listFans(): Promise<Fan[]> {
  const response = await fetch('/api/crm/fans', {
    credentials: 'include'
  });
  
  const { fans } = await response.json();
  return fans;
}
```

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Missing or invalid authentication token

**Solution**:
```javascript
// Ensure credentials are included
fetch('/api/crm/fans', {
  credentials: 'include' // ← Add this
});

// Check if token exists
console.log(document.cookie); // Should contain access_token
```

### Issue: 429 Rate Limit Exceeded

**Cause**: Too many requests in short time

**Solution**:
```javascript
// Implement exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('429') && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

### Issue: Numeric Values Failing Type Checks

**Cause**: PostgreSQL returns aggregate results as strings

**Solution**:
```javascript
// ❌ Wrong
const total = result.rows[0].total_value;
expect(total).toBeGreaterThan(0); // Fails!

// ✅ Correct
const total = parseInt(result.rows[0].total_value);
expect(total).toBeGreaterThan(0); // Works!
```

### Issue: CORS Errors

**Cause**: Cross-origin requests without proper configuration

**Solution**:
```javascript
// Use same-origin requests or configure CORS
// For same-origin:
fetch('/api/crm/fans', { credentials: 'include' });

// For cross-origin (if needed):
fetch('https://app.huntaze.com/api/crm/fans', {
  credentials: 'include',
  mode: 'cors'
});
```

### Issue: Network Timeout

**Cause**: Slow network or server

**Solution**:
```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      credentials: 'include',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

---

## Next Steps

1. **Read the API Reference**: [API_REFERENCE.md](../API_REFERENCE.md)
2. **View OpenAPI Spec**: [openapi.yaml](./openapi.yaml)
3. **Check Examples**: See code examples above
4. **Test in Development**: Use `http://localhost:3000/api`
5. **Deploy to Production**: Use `https://app.huntaze.com/api`

---

## Support

Need help? Contact us:
- **Email**: support@huntaze.com
- **Documentation**: https://docs.huntaze.com
- **API Reference**: [API_REFERENCE.md](../API_REFERENCE.md)

---

**Last Updated**: October 31, 2025  
**Version**: 1.4.0
