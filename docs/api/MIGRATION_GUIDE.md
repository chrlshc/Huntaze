# API Migration Guide

This guide helps you migrate from deprecated APIs to their modern replacements.

## 🚨 Deprecated APIs

### `/api/onlyfans/campaigns` → `/api/marketing/campaigns`

**Deprecation Date:** November 17, 2024  
**Sunset Date:** February 17, 2025 (3 months)  
**Status:** ⚠️ Deprecated

#### Why the Change?

The `/api/onlyfans/campaigns` endpoint was part of the legacy architecture and has been replaced by a more robust, standardized implementation at `/api/marketing/campaigns`.

**Benefits of the new API:**
- ✅ Standardized response format
- ✅ Better error handling
- ✅ Rate limiting
- ✅ Comprehensive validation
- ✅ Service layer architecture
- ✅ Better documentation

#### Migration Steps

##### 1. Update Your Endpoint

**Before:**
```typescript
const response = await fetch('/api/onlyfans/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({
    userId: 'user_abc123',
    planTier: 'pro',
    campaignName: 'My Campaign',
  }),
});
```

**After:**
```typescript
const response = await fetch('/api/marketing/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Use JWT instead of CSRF
  },
  body: JSON.stringify({
    name: 'My Campaign',
    channel: 'email', // Required: email, dm, sms, push
    goal: 'engagement', // Required: engagement, conversion, retention
    audienceSegment: 'all',
    status: 'draft', // Optional: draft, scheduled, active, paused, completed
  }),
});
```

##### 2. Update Request Body

**Field Mapping:**

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `campaignName` | `name` | Direct rename |
| `userId` | N/A | Extracted from JWT token |
| `planTier` | N/A | No longer needed |
| N/A | `channel` | **Required** - email, dm, sms, push |
| N/A | `goal` | **Required** - engagement, conversion, retention |
| N/A | `audienceSegment` | **Required** - audience identifier |
| N/A | `status` | Optional - defaults to 'draft' |

##### 3. Update Response Handling

**Old Response Format:**
```json
{
  "success": true,
  "campaign": {
    "id": "camp_abc123",
    "owner": "user_abc123",
    "plan": "pro",
    "name": "My Campaign",
    "createdAt": "2024-11-17T10:00:00Z"
  }
}
```

**New Response Format:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "My Campaign",
    "status": "draft",
    "channel": "email",
    "goal": "engagement",
    "audienceSegment": "all",
    "audienceSize": 0,
    "createdAt": "2024-11-17T10:00:00Z",
    "updatedAt": "2024-11-17T10:00:00Z"
  },
  "meta": {
    "timestamp": "2024-11-17T10:00:00.123Z",
    "requestId": "req_1234567890",
    "version": "1.0"
  }
}
```

##### 4. Update Error Handling

**Old Error Format:**
```json
{
  "success": false,
  "error": "Invalid campaign payload"
}
```

**New Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid campaign data",
    "details": {
      "field": "channel",
      "issue": "Required field missing"
    },
    "retryable": false
  },
  "meta": {
    "timestamp": "2024-11-17T10:00:00.123Z",
    "requestId": "req_1234567890",
    "version": "1.0"
  }
}
```

#### Code Examples

##### React/Next.js Example

**Before:**
```typescript
import { useState } from 'react';

function CreateCampaign() {
  const [loading, setLoading] = useState(false);
  
  const createCampaign = async (name: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/onlyfans/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          userId: 'user_abc123',
          planTier: 'pro',
          campaignName: name,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Campaign created:', data.campaign);
      } else {
        console.error('Error:', data.error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={() => createCampaign('Test')}>Create</button>;
}
```

**After:**
```typescript
import { useState } from 'react';
import { useApiClient } from '@/hooks/useApiClient';

function CreateCampaign() {
  const [loading, setLoading] = useState(false);
  const apiClient = useApiClient();
  
  const createCampaign = async (name: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/marketing/campaigns', {
        name,
        channel: 'email',
        goal: 'engagement',
        audienceSegment: 'all',
        status: 'draft',
      });
      
      if (response.success) {
        console.log('Campaign created:', response.data);
      } else {
        console.error('Error:', response.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={() => createCampaign('Test')}>Create</button>;
}
```

##### Using the API Client Hook

The new API comes with a standardized client hook:

```typescript
import { useApiClient } from '@/hooks/useApiClient';

function MyComponent() {
  const { post, loading, error } = useApiClient();
  
  const createCampaign = async () => {
    const result = await post('/api/marketing/campaigns', {
      name: 'My Campaign',
      channel: 'email',
      goal: 'engagement',
      audienceSegment: 'all',
    });
    
    if (result.success) {
      // Handle success
      console.log('Campaign ID:', result.data.id);
    }
  };
  
  return (
    <div>
      <button onClick={createCampaign} disabled={loading}>
        Create Campaign
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

#### Testing Your Migration

1. **Test in Development:**
   ```bash
   # Old endpoint (will show deprecation warning)
   curl -X POST http://localhost:3000/api/onlyfans/campaigns \
     -H "Content-Type: application/json" \
     -d '{"userId":"user_test","planTier":"pro","campaignName":"Test"}'
   
   # New endpoint
   curl -X POST http://localhost:3000/api/marketing/campaigns \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name":"Test","channel":"email","goal":"engagement","audienceSegment":"all"}'
   ```

2. **Check Deprecation Headers:**
   ```bash
   curl -I -X POST http://localhost:3000/api/onlyfans/campaigns
   # Look for:
   # Deprecation: true
   # Sunset: Sat, 17 Feb 2025 00:00:00 GMT
   # Link: </api/marketing/campaigns>; rel="alternate"
   ```

3. **Run Integration Tests:**
   ```bash
   npm test -- tests/integration/api/marketing-campaigns.integration.test.ts
   ```

#### Timeline

| Date | Action |
|------|--------|
| Nov 17, 2024 | Deprecation announced |
| Nov 17, 2024 | Deprecation headers added |
| Dec 17, 2024 | Warning emails sent to API users |
| Jan 17, 2025 | Final migration reminder |
| Feb 17, 2025 | **Old API removed** |

#### Need Help?

- 📖 [API Documentation](./CORE_APIS.md)
- 🔧 [API Client Guide](../lib/api/client/README.md)
- 💬 Contact: dev-support@huntaze.com

## 📋 Checklist

Use this checklist to track your migration:

- [ ] Updated endpoint URL
- [ ] Updated request body fields
- [ ] Updated authentication (CSRF → JWT)
- [ ] Updated response handling
- [ ] Updated error handling
- [ ] Tested in development
- [ ] Tested in staging
- [ ] Updated documentation
- [ ] Deployed to production
- [ ] Monitored for errors

## 🎯 Best Practices

1. **Use the API Client Hook:** Always use `useApiClient` for consistent error handling
2. **Handle Errors Gracefully:** Check `response.success` before accessing data
3. **Monitor Deprecation Headers:** Set up alerts for deprecated API usage
4. **Test Thoroughly:** Test all edge cases before deploying
5. **Update Documentation:** Keep your internal docs in sync

---

**Last Updated:** November 17, 2024  
**Version:** 1.0
