# Huntaze API Error Codes Reference

## Overview

This document provides a comprehensive reference for all error codes returned by the Huntaze API.

## Error Response Format

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

---

## HTTP Status Codes

### 2xx Success

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |

### 4xx Client Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 400 | Bad Request | Invalid request parameters | Check request body/params |
| 401 | Unauthorized | Not authenticated | Login required |
| 403 | Forbidden | Insufficient permissions | Contact support |
| 404 | Not Found | Resource doesn't exist | Check resource ID |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry |

### 5xx Server Errors

| Code | Name | Description | Action |
|------|------|-------------|--------|
| 500 | Internal Server Error | Server error | Retry or contact support |
| 503 | Service Unavailable | Service temporarily down | Retry later |

---

## Error Messages by Endpoint

### Authentication Errors

#### 401 Unauthorized

```json
{
  "error": "Not authenticated"
}
```

**Cause**: Missing or invalid JWT token  
**Solution**: Login to obtain valid token

---

### Fans Endpoint Errors

#### GET /api/crm/fans

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid user ID"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to list fans"
}
```

#### POST /api/crm/fans

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid user ID"
}
```
or
```json
{
  "error": "name is required"
}
```
or
```json
{
  "error": "platform is required"
}
```
or
```json
{
  "error": "platform_id is required"
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to create fan"
}
```

---

### Conversations Endpoint Errors

#### GET /api/crm/conversations

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid user ID"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to list conversations"
}
```

#### POST /api/crm/conversations

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid user ID"
}
```
or
```json
{
  "error": "fanId is required"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to create conversation"
}
```

---

### Analytics Endpoint Errors

#### GET /api/analytics/overview

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to load analytics"
}
```

---

## Rate Limiting

### Rate Limit Response

**Status**: 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded"
}
```

**Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698765432
```

### Rate Limits by Endpoint

| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/crm/fans` | GET | No limit | - |
| `/api/crm/fans` | POST | 60 requests | 60 seconds |
| `/api/crm/conversations` | GET | No limit | - |
| `/api/crm/conversations` | POST | No limit | - |
| `/api/analytics/overview` | GET | No limit | - |

---

## Database Errors

### Common Database Errors

#### Connection Error
```json
{
  "error": "Failed to connect to database"
}
```

**Cause**: Database unavailable  
**Solution**: Retry after a few seconds

#### Query Error
```json
{
  "error": "Failed to execute query"
}
```

**Cause**: Invalid SQL or database constraint violation  
**Solution**: Check request data

#### Foreign Key Violation
```json
{
  "error": "Referenced resource does not exist"
}
```

**Cause**: Trying to reference non-existent resource (e.g., invalid fan_id)  
**Solution**: Verify resource exists before referencing

---

## Validation Errors

### Missing Required Fields

```json
{
  "error": "name is required"
}
```

**Fields that can be required**:
- `name`
- `platform`
- `platform_id`
- `fanId`
- `email`
- `password`

### Invalid Field Values

```json
{
  "error": "Invalid platform. Must be one of: onlyfans, fansly, patreon, instagram, tiktok"
}
```

### Invalid Data Types

```json
{
  "error": "fanId must be an integer"
}
```

---

## Error Handling Best Practices

### 1. Check Status Code First

```javascript
const response = await fetch('/api/crm/fans');

if (!response.ok) {
  const { error } = await response.json();
  
  switch (response.status) {
    case 400:
      console.error('Bad request:', error);
      break;
    case 401:
      console.error('Not authenticated:', error);
      window.location.href = '/auth/login';
      break;
    case 429:
      console.error('Rate limited:', error);
      break;
    case 500:
      console.error('Server error:', error);
      break;
  }
}
```

### 2. Parse Error Message

```javascript
try {
  const response = await fetch('/api/crm/fans', {
    method: 'POST',
    body: JSON.stringify(fanData)
  });
  
  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error);
  }
} catch (error) {
  // Display error to user
  alert(error.message);
}
```

### 3. Implement Retry Logic

```javascript
async function retryableRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      
      if (response.status >= 500) {
        // Server error, retry with exponential backoff
        if (i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### 4. Log Errors for Debugging

```javascript
async function loggedRequest(url, options) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Request:`, url, options);
  
  try {
    const response = await fetch(url, options);
    
    console.log(`[${requestId}] Response:`, response.status);
    
    if (!response.ok) {
      const { error } = await response.json();
      console.error(`[${requestId}] Error:`, error);
      throw new Error(error);
    }
    
    return response;
  } catch (error) {
    console.error(`[${requestId}] Exception:`, error);
    throw error;
  }
}
```

---

## Common Error Scenarios

### Scenario 1: User Not Logged In

**Request**:
```bash
curl -X GET https://app.huntaze.com/api/crm/fans
```

**Response**: 401 Unauthorized
```json
{
  "error": "Not authenticated"
}
```

**Solution**: Include authentication cookie
```bash
curl -X GET https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_TOKEN"
```

---

### Scenario 2: Missing Required Field

**Request**:
```bash
curl -X POST https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'
```

**Response**: 400 Bad Request
```json
{
  "error": "platform is required"
}
```

**Solution**: Include all required fields
```bash
curl -X POST https://app.huntaze.com/api/crm/fans \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "platform": "onlyfans",
    "platform_id": "of_john_123"
  }'
```

---

### Scenario 3: Rate Limit Exceeded

**Request**: Multiple rapid POST requests

**Response**: 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

**Solution**: Implement exponential backoff
```javascript
async function createFanWithRetry(fanData) {
  for (let i = 0; i < 3; i++) {
    const response = await fetch('/api/crm/fans', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fanData)
    });
    
    if (response.status !== 429) {
      return response;
    }
    
    // Wait before retry
    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
  }
  
  throw new Error('Rate limit exceeded after retries');
}
```

---

### Scenario 4: Database Numeric Value Type Error

**Code**:
```javascript
const result = await pool.query(
  'SELECT SUM(value_cents) as total FROM fans WHERE user_id = $1',
  [userId]
);

// ❌ This will fail
expect(result.rows[0].total).toBeGreaterThan(0);
```

**Error**: Type error - string is not comparable to number

**Solution**: Parse as integer
```javascript
const result = await pool.query(
  'SELECT SUM(value_cents) as total FROM fans WHERE user_id = $1',
  [userId]
);

// ✅ This works
const total = parseInt(result.rows[0].total);
expect(total).toBeGreaterThan(0);
```

---

## Support

If you encounter an error not documented here:

1. Check the [API Reference](../API_REFERENCE.md)
2. Review the [Integration Guide](./INTEGRATION_GUIDE.md)
3. Contact support: support@huntaze.com

---

**Last Updated**: October 31, 2025  
**Version**: 1.4.1
