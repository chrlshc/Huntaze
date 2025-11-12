# Admin Feature Flags API

API endpoint for managing onboarding feature flags with role-based access control.

## Endpoints

### GET /api/admin/feature-flags

Retrieve current feature flag configuration.

**Authentication:** Required (admin role recommended)

**Response:**
```typescript
{
  flags: {
    enabled: boolean;
    rolloutPercentage: number;
    markets: string[];
    userWhitelist: string[];
  };
  correlationId: string;
}
```

**Status Codes:**
- `200 OK` - Successfully retrieved flags
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Failed to retrieve flags

**Example:**
```bash
curl -X GET https://api.example.com/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "flags": {
    "enabled": true,
    "rolloutPercentage": 50,
    "markets": ["FR", "US"],
    "userWhitelist": ["123e4567-e89b-12d3-a456-426614174000"]
  },
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### POST /api/admin/feature-flags

Update feature flag configuration.

**Authentication:** Required (admin role recommended)

**Request Body:**
```typescript
{
  enabled?: boolean;           // Enable/disable feature globally
  rolloutPercentage?: number;  // 0-100, percentage of users to enable
  markets?: string[];          // ISO 2-letter country codes (e.g., ["FR", "US"])
  userWhitelist?: string[];    // UUIDs of users to always enable
}
```

**Response:**
```typescript
{
  success: boolean;
  flags: OnboardingFlags;
  correlationId: string;
}
```

**Status Codes:**
- `200 OK` - Successfully updated flags
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Failed to update flags

**Example:**
```bash
curl -X POST https://api.example.com/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "rolloutPercentage": 75,
    "markets": ["FR", "DE", "US"]
  }'
```

**Response:**
```json
{
  "success": true,
  "flags": {
    "enabled": true,
    "rolloutPercentage": 75,
    "markets": ["FR", "DE", "US"],
    "userWhitelist": []
  },
  "correlationId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

---

## Validation Rules

### rolloutPercentage
- **Type:** `number`
- **Range:** 0-100 (inclusive)
- **Description:** Percentage of users to enable feature for
- **Error:** Returns 400 if outside range

### markets
- **Type:** `string[]`
- **Format:** 2-letter ISO country codes (uppercase)
- **Examples:** `["FR", "US", "DE", "GB"]`
- **Validation:** Each code must match `/^[A-Z]{2}$/`
- **Error:** Returns 400 if invalid format

### userWhitelist
- **Type:** `string[]`
- **Format:** Valid UUIDs
- **Examples:** `["123e4567-e89b-12d3-a456-426614174000"]`
- **Validation:** Each ID must be valid UUID format
- **Error:** Returns 400 if invalid format

---

## Error Responses

All error responses include a `correlationId` for debugging.

### 400 Bad Request

**Invalid JSON:**
```json
{
  "error": "Invalid JSON in request body",
  "correlationId": "..."
}
```

**Invalid rolloutPercentage:**
```json
{
  "error": "Invalid rolloutPercentage",
  "message": "Must be between 0 and 100",
  "correlationId": "..."
}
```

**Invalid market codes:**
```json
{
  "error": "Invalid market codes",
  "message": "Invalid markets: XX, YY. Must be 2-letter ISO codes (e.g., FR, US)",
  "correlationId": "..."
}
```

**Invalid user IDs:**
```json
{
  "error": "Invalid user IDs",
  "message": "Invalid user IDs: invalid-id. Must be valid UUIDs",
  "correlationId": "..."
}
```

**No updates provided:**
```json
{
  "error": "No valid updates provided",
  "message": "Request must include at least one of: enabled, rolloutPercentage, markets, userWhitelist",
  "correlationId": "..."
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "correlationId": "..."
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to update feature flags",
  "details": "Error message",
  "correlationId": "..."
}
```

---

## Usage Examples

### Enable feature globally
```typescript
const response = await fetch('/api/admin/feature-flags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    enabled: true
  })
});

const data = await response.json();
console.log('Feature enabled:', data.flags.enabled);
```

### Gradual rollout (50% of users)
```typescript
await fetch('/api/admin/feature-flags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    enabled: true,
    rolloutPercentage: 50
  })
});
```

### Market-specific rollout
```typescript
await fetch('/api/admin/feature-flags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    enabled: true,
    markets: ['FR', 'DE']  // Only France and Germany
  })
});
```

### Whitelist specific users
```typescript
await fetch('/api/admin/feature-flags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    enabled: false,  // Disabled globally
    userWhitelist: [
      '123e4567-e89b-12d3-a456-426614174000',
      '234f5678-f90c-23e4-b567-537725285001'
    ]  // But enabled for these users
  })
});
```

---

## Client-Side Integration

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface FeatureFlags {
  enabled: boolean;
  rolloutPercentage: number;
  markets: string[];
  userWhitelist: string[];
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feature-flags');
      
      if (!response.ok) {
        throw new Error('Failed to fetch flags');
      }
      
      const data = await response.json();
      setFlags(data.flags);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateFlags = async (updates: Partial<FeatureFlags>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update flags');
      }
      
      const data = await response.json();
      setFlags(data.flags);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { flags, loading, error, updateFlags, refetch: fetchFlags };
}
```

---

## Security Considerations

### TODO: Implement Role-Based Access Control

Currently, any authenticated user can access these endpoints. In production:

1. **Add role checking:**
   ```typescript
   const user = await requireUser();
   
   if (user.role !== 'admin') {
     return NextResponse.json(
       { error: 'Forbidden: Admin role required' },
       { status: 403 }
     );
   }
   ```

2. **Audit logging:**
   - Log all flag changes with user ID and timestamp
   - Track who enabled/disabled features
   - Monitor for suspicious activity

3. **Rate limiting:**
   - Limit update frequency per user
   - Prevent abuse of flag toggling

4. **Validation:**
   - Validate user IDs exist in database
   - Validate market codes against supported list
   - Sanitize all inputs

---

## Monitoring & Debugging

### Correlation IDs

Every request/response includes a `correlationId` for tracing:

```typescript
const response = await fetch('/api/admin/feature-flags');
const data = await response.json();
console.log('Correlation ID:', data.correlationId);
```

Use this ID to search logs:
```bash
grep "correlationId: a1b2c3d4-e5f6-7890-abcd-ef1234567890" logs/*.log
```

### Logging

All operations are logged with structured data:

```
[Feature Flags API] POST request started { correlationId: '...' }
[Feature Flags API] POST request completed { userId: '...', updates: {...}, correlationId: '...' }
```

---

## Related Documentation

- [Feature Flags Library](../../lib/feature-flags.ts) - Core flag logic
- [Kill Switch API](./admin-kill-switch.md) - Emergency disable endpoint
- [Onboarding Gating](./gated-routes.md) - How flags affect route access

---

## Changelog

### 2024-11-11
- Initial implementation
- Added validation for markets and userWhitelist
- Added structured logging
- Added TypeScript types
- Added comprehensive error handling
