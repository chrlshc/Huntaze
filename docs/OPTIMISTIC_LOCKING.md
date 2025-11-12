# Optimistic Locking Implementation

## Overview

Optimistic locking prevents lost updates when multiple requests try to modify the same onboarding step simultaneously. It uses row versioning to detect conflicts.

## How It Works

### 1. Row Version Column

Each row in `user_onboarding` has a `row_version` column:

```sql
ALTER TABLE user_onboarding 
ADD COLUMN row_version INTEGER DEFAULT 1 NOT NULL;
```

### 2. Update with Version Check

When updating a step, the client must provide the expected version:

```typescript
// Client sends
{
  "status": "done",
  "row_version": 1  // Expected version
}
```

### 3. Conditional Update

The update only succeeds if the version matches:

```sql
UPDATE user_onboarding
SET 
  status = $1,
  row_version = row_version + 1,
  updated_at = NOW()
WHERE user_id = $2 
  AND step_id = $3 
  AND row_version = $4  -- Version check
RETURNING *;
```

### 4. Conflict Detection

If the version doesn't match, return 409 Conflict:

```typescript
if (rowsAffected === 0) {
  // Version mismatch - fetch current state
  const currentState = await getCurrentState(userId, stepId);
  
  return NextResponse.json({
    error: 'Conflict',
    message: 'Step was modified by another request',
    currentState: {
      status: currentState.status,
      row_version: currentState.row_version
    }
  }, { status: 409 });
}
```

## API Usage

### PATCH /api/onboarding/steps/:id

**Request:**
```json
{
  "status": "done",
  "row_version": 1
}
```

**Success Response (200):**
```json
{
  "success": true,
  "step": {
    "id": "setup-payments",
    "status": "done",
    "row_version": 2,
    "updatedAt": "2024-11-11T12:00:00Z"
  },
  "progress": 75
}
```

**Conflict Response (409):**
```json
{
  "error": "Conflict",
  "message": "Step was modified by another request",
  "code": "OPTIMISTIC_LOCK_CONFLICT",
  "attemptedVersion": 1,
  "currentVersion": 2,
  "currentState": {
    "id": "setup-payments",
    "status": "in_progress",
    "row_version": 2,
    "updatedAt": "2024-11-11T11:59:00Z"
  },
  "suggestion": "Fetch the latest state and retry your request"
}
```

## Client Implementation

### Basic Update

```typescript
async function updateStep(stepId: string, status: string, version: number) {
  const response = await fetch(`/api/onboarding/steps/${stepId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, row_version: version })
  });

  if (response.status === 409) {
    const conflict = await response.json();
    console.log('Conflict detected:', conflict);
    
    // Option 1: Show conflict to user
    showConflictDialog(conflict.currentState);
    
    // Option 2: Retry with new version
    return updateStep(stepId, status, conflict.currentVersion);
  }

  return response.json();
}
```

### Automatic Retry

```typescript
async function updateStepWithRetry(
  stepId: string, 
  status: string, 
  maxRetries: number = 3
) {
  let attempt = 0;
  let version = await getCurrentVersion(stepId);

  while (attempt < maxRetries) {
    try {
      const response = await fetch(`/api/onboarding/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, row_version: version })
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 409) {
        // Get fresh version and retry
        const conflict = await response.json();
        version = conflict.currentVersion;
        attempt++;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 100 * Math.pow(2, attempt))
        );
        continue;
      }

      throw new Error(`Update failed: ${response.statusText}`);

    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      attempt++;
    }
  }

  throw new Error('Max retries exceeded');
}
```

## Testing Concurrent Updates

### Test Script

```typescript
// Test concurrent updates
async function testConcurrentUpdates() {
  const stepId = 'setup-payments';
  const userId = 'user-123';
  
  // Get initial state
  const initial = await getStepState(userId, stepId);
  console.log('Initial version:', initial.row_version);

  // Simulate 10 concurrent requests
  const requests = Array.from({ length: 10 }, (_, i) => 
    updateStep(stepId, 'done', initial.row_version)
  );

  const results = await Promise.allSettled(requests);

  // Count successes and conflicts
  const successes = results.filter(r => r.status === 'fulfilled').length;
  const conflicts = results.filter(r => r.status === 'rejected').length;

  console.log(`Successes: ${successes}`); // Should be 1
  console.log(`Conflicts: ${conflicts}`); // Should be 9
}
```

### Expected Behavior

- **1 request succeeds** - The first one to reach the database
- **9 requests fail with 409** - Version mismatch detected
- **No lost updates** - All conflicts are detected

## Benefits

1. **No Lost Updates** - Concurrent modifications are detected
2. **Better UX** - Users see conflicts and can resolve them
3. **No Locks** - No database locking required
4. **Scalable** - Works well under high concurrency

## Performance Considerations

- **Minimal Overhead** - Just an integer comparison
- **No Blocking** - No locks held during transaction
- **Index on row_version** - Fast version lookups

## Migration Path

### 1. Add Column

```bash
psql $DATABASE_URL < lib/db/migrations/add-row-version.sql
```

### 2. Update API

Add version check to PATCH endpoint:

```typescript
const { status, row_version } = await request.json();

if (!row_version) {
  return NextResponse.json(
    { error: 'row_version required' },
    { status: 400 }
  );
}
```

### 3. Update Client

Add version to requests:

```typescript
const currentState = await getStepState(stepId);
await updateStep(stepId, 'done', currentState.row_version);
```

## Troubleshooting

### High Conflict Rate

If you see many 409 responses:

1. **Check for polling** - Reduce polling frequency
2. **Batch updates** - Combine multiple updates
3. **Debounce** - Wait before sending updates

### Version Drift

If versions get out of sync:

1. **Fetch fresh state** - Always get latest before update
2. **Implement retry** - Automatic retry with backoff
3. **Show conflicts** - Let users resolve manually

## Related Documentation

- [API Documentation](./api/onboarding-endpoint.md)
- [Concurrency Testing](../tests/integration/api/onboarding.test.ts)
- [Database Schema](../lib/db/migrations/2024-11-11-shopify-style-onboarding.sql)
