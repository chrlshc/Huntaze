# Step Version Migration API

## Overview

The Step Version Migration API allows administrators to migrate onboarding steps to new versions while preserving user progress. This is essential for evolving the onboarding experience without losing historical data.

**Base URL:** `/api/admin/onboarding/migrate-version`  
**Authentication:** Required (Admin role)  
**Runtime:** Node.js  

## Endpoints

### POST /api/admin/onboarding/migrate-version

Migrate a step to a new version.

#### Request

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body (Single Migration):**
```typescript
{
  stepId: string;              // Step identifier (required)
  fromVersion: number;         // Current version (required)
  toVersion: number;           // Target version (required)
  newStepData?: {              // Optional new step configuration
    title?: string;
    description?: string;
    required?: boolean;
    weight?: number;
    roleVisibility?: string[];
    marketRule?: Record<string, any>;
  };
  dryRun?: boolean;            // Default: false
  maxRetries?: number;         // Default: 3
  retryDelayMs?: number;       // Default: 1000
}
```

**Body (Batch Migration):**
```typescript
[
  {
    stepId: string;
    fromVersion: number;
    toVersion: number;
    newStepData?: object;
    dryRun?: boolean;
  },
  // ... up to 10 migrations
]
```

**Example Request:**
```bash
curl -X POST https://api.huntaze.com/api/admin/onboarding/migrate-version \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "payments",
    "fromVersion": 1,
    "toVersion": 2,
    "newStepData": {
      "title": "Configure Payment Methods",
      "description": "Set up Stripe or PayPal",
      "weight": 35
    },
    "dryRun": false
  }'
```

#### Response

**Success (200 OK):**
```typescript
{
  success: true;
  message: string;              // Human-readable summary
  result: {
    stepId: string;
    fromVersion: number;
    toVersion: number;
    usersAffected: number;      // Total users with this step
    progressCopied: number;     // Users with completed progress
    progressReset: number;      // Users with in-progress steps
    warnings: string[];         // Non-critical issues
    dryRun: boolean;
    duration: number;           // Milliseconds
    timestamp: string;          // ISO 8601
  };
  correlationId: string;        // For tracing
}
```

**Example Success Response:**
```json
{
  "success": true,
  "message": "Migration completed successfully:\n- Step: payments\n- Version: 1 → 2\n- Users affected: 1523\n- Progress copied: 1245\n- Progress reset: 278\n- Duration: 3456ms",
  "result": {
    "stepId": "payments",
    "fromVersion": 1,
    "toVersion": 2,
    "usersAffected": 1523,
    "progressCopied": 1245,
    "progressReset": 278,
    "warnings": [],
    "dryRun": false,
    "duration": 3456,
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Batch Success Response:**
```json
{
  "success": true,
  "message": "Batch migration: 3/3 successful",
  "results": [
    {
      "stepId": "payments",
      "success": true,
      "usersAffected": 1523,
      "errors": [],
      "warnings": []
    },
    {
      "stepId": "theme",
      "success": true,
      "usersAffected": 892,
      "errors": [],
      "warnings": ["Expected version 2 but got 3. Using 3."]
    },
    {
      "stepId": "product",
      "success": true,
      "usersAffected": 1045,
      "errors": [],
      "warnings": []
    }
  ],
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

| Status | Description | Response Body |
|--------|-------------|---------------|
| 400 | Missing required fields | `{ "error": "Missing required fields", "required": [...], "correlationId": "..." }` |
| 400 | Validation failed | `{ "error": "Validation failed", "errors": [...], "correlationId": "..." }` |
| 400 | Invalid types | `{ "error": "fromVersion and toVersion must be integers", "correlationId": "..." }` |
| 400 | Batch too large | `{ "error": "Batch size too large", "max": 10, "received": 15, "correlationId": "..." }` |
| 401 | Unauthorized | `{ "error": "Unauthorized", "correlationId": "..." }` |
| 403 | Forbidden | `{ "error": "Forbidden", "correlationId": "..." }` |
| 500 | Migration failed | `{ "error": "Migration failed", "errors": [...], "warnings": [...], "correlationId": "..." }` |

---

### GET /api/admin/onboarding/migrate-version

Get version history for a step.

#### Request

**Method:** `GET`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stepId` | string | Yes | Step identifier |

**Example Request:**
```bash
curl -X GET "https://api.huntaze.com/api/admin/onboarding/migrate-version?stepId=payments" \
  -H "Authorization: Bearer $TOKEN"
```

#### Response

**Success (200 OK):**
```typescript
{
  stepId: string;
  versions: Array<{
    version: number;
    title: string;
    required: boolean;
    weight: number;
    activeFrom?: string;        // ISO 8601
    activeTo?: string;          // ISO 8601
    isActive: boolean;
    createdAt: string;          // ISO 8601
    updatedAt: string;          // ISO 8601
  }>;
  activeVersion: number | null;
  totalVersions: number;
  correlationId: string;
}
```

**Example Response:**
```json
{
  "stepId": "payments",
  "versions": [
    {
      "version": 1,
      "title": "Configure Payments",
      "required": true,
      "weight": 30,
      "activeFrom": "2024-01-01T00:00:00Z",
      "activeTo": "2025-11-11T10:30:00Z",
      "isActive": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2025-11-11T10:30:00Z"
    },
    {
      "version": 2,
      "title": "Configure Payment Methods",
      "required": true,
      "weight": 35,
      "activeFrom": "2025-11-11T10:30:00Z",
      "activeTo": null,
      "isActive": true,
      "createdAt": "2025-11-11T10:30:00Z",
      "updatedAt": "2025-11-11T10:30:00Z"
    }
  ],
  "activeVersion": 2,
  "totalVersions": 2,
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

| Status | Description | Response Body |
|--------|-------------|---------------|
| 400 | Missing stepId | `{ "error": "stepId parameter required", "correlationId": "..." }` |
| 401 | Unauthorized | `{ "error": "Unauthorized", "correlationId": "..." }` |
| 404 | Step not found | `{ "error": "Step not found", "stepId": "...", "correlationId": "..." }` |
| 500 | Server error | `{ "error": "Internal server error", "message": "...", "correlationId": "..." }` |

---

## Migration Process

### Step-by-Step Flow

1. **Validation**
   - Check version numbers are valid
   - Verify step exists in database
   - Ensure target version doesn't already exist

2. **Transaction Start**
   - Begin database transaction
   - Lock affected rows

3. **Create New Version**
   - Insert new step definition
   - Copy configuration from old version
   - Apply new step data if provided

4. **Migrate User Progress**
   - For each user with the step:
     - If status is 'done': Copy to new version
     - If status is 'todo' or 'skipped': Reset to 'todo'

5. **Deactivate Old Version**
   - Set `activeTo` timestamp on old version
   - Mark as inactive

6. **Transaction Commit**
   - Commit all changes
   - Release locks

7. **Recalculate Progress**
   - Update user progress percentages
   - Trigger analytics events

### Dry Run Mode

Use `dryRun: true` to validate migration without making changes:

```bash
curl -X POST https://api.huntaze.com/api/admin/onboarding/migrate-version \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "payments",
    "fromVersion": 1,
    "toVersion": 2,
    "dryRun": true
  }'
```

**Dry Run Response:**
```json
{
  "success": true,
  "message": "[DRY RUN] Migration completed successfully:\n- Step: payments\n- Version: 1 → 2\n- Users affected: 1523\n- Progress copied: 1245\n- Progress reset: 278",
  "result": {
    "stepId": "payments",
    "fromVersion": 1,
    "toVersion": 2,
    "usersAffected": 1523,
    "progressCopied": 1245,
    "progressReset": 278,
    "warnings": [],
    "dryRun": true,
    "duration": 234,
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Error Handling

### Retry Logic

The API automatically retries transient failures with exponential backoff:

- **Default retries:** 3
- **Initial delay:** 1000ms
- **Backoff factor:** 2x

Configure retry behavior:
```json
{
  "stepId": "payments",
  "fromVersion": 1,
  "toVersion": 2,
  "maxRetries": 5,
  "retryDelayMs": 2000
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `VALIDATION_ERROR` | Input validation failed | Fix request parameters |
| `MIGRATION_ERROR` | Migration execution failed | Check logs, retry |
| `DATABASE_ERROR` | Database operation failed | Check database health |
| `TRANSACTION_ERROR` | Transaction rollback | Safe to retry |

### Correlation IDs

Every request generates a unique correlation ID for tracing:

```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Use this ID to:
- Search logs
- Debug issues
- Track request flow
- Contact support

---

## Best Practices

### 1. Always Test with Dry Run First

```bash
# Step 1: Dry run
curl -X POST .../migrate-version -d '{"stepId": "payments", "fromVersion": 1, "toVersion": 2, "dryRun": true}'

# Step 2: Review results

# Step 3: Execute migration
curl -X POST .../migrate-version -d '{"stepId": "payments", "fromVersion": 1, "toVersion": 2, "dryRun": false}'
```

### 2. Migrate During Low Traffic

Schedule migrations during maintenance windows or low-traffic periods.

### 3. Monitor Progress

Track migration metrics:
- Users affected
- Duration
- Error rate
- Warnings

### 4. Backup Before Migration

Always backup the database before major migrations:

```bash
./scripts/backup-database.sh
```

### 5. Use Batch Migrations Carefully

Batch migrations stop on first failure. Test individually first:

```json
[
  {"stepId": "payments", "fromVersion": 1, "toVersion": 2, "dryRun": true},
  {"stepId": "theme", "fromVersion": 1, "toVersion": 2, "dryRun": true},
  {"stepId": "product", "fromVersion": 1, "toVersion": 2, "dryRun": true}
]
```

### 6. Handle Warnings

Review warnings in the response:

```json
{
  "warnings": [
    "Expected version 2 but got 3. Using 3.",
    "15 users had invalid status, reset to 'todo'"
  ]
}
```

---

## Client Examples

### TypeScript/JavaScript

```typescript
import { z } from 'zod';

// Response schema
const MigrationResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  result: z.object({
    stepId: z.string(),
    fromVersion: z.number(),
    toVersion: z.number(),
    usersAffected: z.number(),
    progressCopied: z.number(),
    progressReset: z.number(),
    warnings: z.array(z.string()),
    dryRun: z.boolean(),
    duration: z.number(),
    timestamp: z.string()
  }),
  correlationId: z.string()
});

async function migrateStep(
  stepId: string,
  fromVersion: number,
  toVersion: number,
  options?: {
    dryRun?: boolean;
    newStepData?: any;
  }
) {
  const response = await fetch('/api/admin/onboarding/migrate-version', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stepId,
      fromVersion,
      toVersion,
      ...options
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Migration failed: ${error.error}`);
  }

  const data = await response.json();
  return MigrationResultSchema.parse(data);
}

// Usage
try {
  const result = await migrateStep('payments', 1, 2, { dryRun: true });
  console.log(`Migration would affect ${result.result.usersAffected} users`);
} catch (error) {
  console.error('Migration failed:', error);
}
```

### Python

```python
import requests
from typing import Optional, Dict, Any

def migrate_step(
    step_id: str,
    from_version: int,
    to_version: int,
    token: str,
    dry_run: bool = False,
    new_step_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Migrate an onboarding step to a new version."""
    
    url = "https://api.huntaze.com/api/admin/onboarding/migrate-version"
    
    payload = {
        "stepId": step_id,
        "fromVersion": from_version,
        "toVersion": to_version,
        "dryRun": dry_run
    }
    
    if new_step_data:
        payload["newStepData"] = new_step_data
    
    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    response.raise_for_status()
    return response.json()

# Usage
try:
    result = migrate_step(
        step_id="payments",
        from_version=1,
        to_version=2,
        token=get_token(),
        dry_run=True
    )
    
    print(f"Users affected: {result['result']['usersAffected']}")
    print(f"Duration: {result['result']['duration']}ms")
    
except requests.HTTPError as e:
    print(f"Migration failed: {e.response.json()}")
```

---

## Monitoring & Observability

### Metrics

Track these metrics in your monitoring dashboard:

- `migration_requests_total` - Total migration requests
- `migration_duration_seconds` - Migration duration histogram
- `migration_users_affected` - Users affected per migration
- `migration_errors_total` - Migration errors by type

### Logs

All migrations are logged with structured metadata:

```
[Step Migration] Migration started {
  stepId: "payments",
  fromVersion: 1,
  toVersion: 2,
  dryRun: false,
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}

[Step Migration] Transaction started {
  stepId: "payments",
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}

[Step Migration] Transaction committed {
  stepId: "payments",
  usersAffected: 1523,
  progressCopied: 1245,
  progressReset: 278,
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}

[Step Migration] Migration completed {
  success: true,
  duration: 3456,
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

### Alerts

Set up alerts for:

- Migration failures (error rate > 5%)
- Long-running migrations (duration > 30s)
- High user impact (usersAffected > 10000)
- Frequent retries (retries > 2)

---

## Troubleshooting

### Migration Fails with "Step not found"

**Cause:** Source version doesn't exist

**Solution:**
```bash
# Check existing versions
curl -X GET ".../migrate-version?stepId=payments"

# Use correct fromVersion
```

### Migration Fails with "Target version already exists"

**Cause:** Target version was already created

**Solution:**
```bash
# Check existing versions
curl -X GET ".../migrate-version?stepId=payments"

# Use next available version number
```

### Migration Times Out

**Cause:** Too many users affected

**Solution:**
- Run during low-traffic period
- Increase timeout settings
- Consider chunked migration

### Transaction Rollback

**Cause:** Database error during migration

**Solution:**
- Check database health
- Review error logs with correlation ID
- Retry migration

---

## Related Documentation

- [Onboarding System Overview](../HUNTAZE_ONBOARDING_READY.md)
- [Database Schema](../../lib/db/migrations/2024-11-11-shopify-style-onboarding.sql)
- [Rollback Procedure](../ROLLBACK_PROCEDURE.md)
- [Backup Guide](../../scripts/backup-database.sh)

---

## Support

For issues or questions:
1. Check logs for correlation ID
2. Review error response details
3. Consult troubleshooting guide
4. Contact platform team with correlation ID

**API Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Production Ready
