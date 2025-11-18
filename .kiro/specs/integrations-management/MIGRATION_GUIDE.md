# Migration Guide: Token Refresh API Changes

**Version**: 2.0  
**Date**: 2025-11-18  
**Breaking Changes**: Yes

## Overview

The `refreshToken()` method has been enhanced with retry logic and now returns an `Integration` object instead of `void`. This guide helps you migrate existing code to the new API.

## Breaking Changes

### 1. Return Type Changed

**Before**:
```typescript
async refreshToken(provider: Provider, accountId: string): Promise<void>
```

**After**:
```typescript
async refreshToken(
  provider: Provider,
  accountId: string,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  }
): Promise<Integration>
```

### 2. New Optional Parameters

The method now accepts an optional `options` parameter for configuring retry behavior.

## Migration Steps

### Step 1: Update Method Calls

**Old Code**:
```typescript
// Fire and forget
await integrationsService.refreshToken('instagram', accountId);
console.log('Token refreshed');
```

**New Code**:
```typescript
// Capture returned integration
const integration = await integrationsService.refreshToken('instagram', accountId);
console.log('Token refreshed:', integration.expiresAt);
```

### Step 2: Handle Returned Integration

**Use Case 1: Update UI State**
```typescript
const integration = await integrationsService.refreshToken(provider, accountId);

// Update UI with new expiry
setIntegration(integration);
setExpiresAt(integration.expiresAt);
```

**Use Case 2: Verify Refresh Success**
```typescript
const integration = await integrationsService.refreshToken(provider, accountId);

if (integration.status === 'connected') {
  showSuccess('Token refreshed successfully');
} else {
  showError('Token refresh failed');
}
```

**Use Case 3: Log Refresh Details**
```typescript
const integration = await integrationsService.refreshToken(provider, accountId);

logger.info('Token refreshed', {
  provider: integration.provider,
  accountId: integration.providerAccountId,
  expiresAt: integration.expiresAt,
  updatedAt: integration.updatedAt,
});
```

### Step 3: Configure Retry Behavior (Optional)

**Default Behavior** (3 retries, 1s initial delay):
```typescript
const integration = await integrationsService.refreshToken(provider, accountId);
```

**Custom Retry Configuration**:
```typescript
const integration = await integrationsService.refreshToken(
  provider,
  accountId,
  {
    maxRetries: 5,        // More retries for critical operations
    initialDelay: 500,    // Faster initial retry
    maxDelay: 15000       // Higher delay cap
  }
);
```

**No Retries** (fail fast):
```typescript
const integration = await integrationsService.refreshToken(
  provider,
  accountId,
  {
    maxRetries: 1,        // Single attempt only
    initialDelay: 0,      // No delay
    maxDelay: 0
  }
);
```

### Step 4: Update Error Handling

**Old Code**:
```typescript
try {
  await integrationsService.refreshToken(provider, accountId);
} catch (error) {
  console.error('Refresh failed:', error);
}
```

**New Code**:
```typescript
try {
  const integration = await integrationsService.refreshToken(provider, accountId);
  console.log('Refresh succeeded:', integration);
} catch (error) {
  const serviceError = error as IntegrationsServiceError;
  
  // Check error code
  if (serviceError.code === 'NO_REFRESH_TOKEN') {
    // Prompt user to reconnect
    showReconnectPrompt(provider);
  } else if (serviceError.code === 'TOKEN_REFRESH_ERROR') {
    // Show retry option
    showRetryOption(provider, accountId);
  } else {
    // Generic error
    showError('Failed to refresh token');
  }
  
  // Log error details
  logger.error('Token refresh failed', {
    code: serviceError.code,
    provider: serviceError.provider,
    retryable: serviceError.retryable,
    correlationId: serviceError.correlationId,
  });
}
```

## Common Migration Patterns

### Pattern 1: Background Token Refresh

**Old Code**:
```typescript
// Refresh in background, ignore result
integrationsService.refreshToken(provider, accountId).catch(console.error);
```

**New Code**:
```typescript
// Refresh in background, update state
integrationsService.refreshToken(provider, accountId)
  .then(integration => {
    updateIntegrationState(integration);
  })
  .catch(error => {
    console.error('Background refresh failed:', error);
    handleRefreshError(error);
  });
```

### Pattern 2: Refresh Before API Call

**Old Code**:
```typescript
// Refresh token
await integrationsService.refreshToken(provider, accountId);

// Get token and make API call
const token = await integrationsService.getAccessToken(userId, provider, accountId);
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**New Code**:
```typescript
// Use auto-refresh (recommended)
const token = await integrationsService.getAccessToken(userId, provider, accountId);
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${token}` }
});

// OR manually refresh and use result
const integration = await integrationsService.refreshToken(provider, accountId);
const token = await integrationsService.getAccessToken(userId, provider, accountId);
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Pattern 3: Bulk Token Refresh

**Old Code**:
```typescript
// Refresh all integrations
await Promise.all(
  integrations.map(int => 
    integrationsService.refreshToken(int.provider, int.providerAccountId)
  )
);
```

**New Code**:
```typescript
// Refresh all integrations and update state
const refreshedIntegrations = await Promise.all(
  integrations.map(int => 
    integrationsService.refreshToken(int.provider, int.providerAccountId)
  )
);

// Update UI with refreshed integrations
setIntegrations(refreshedIntegrations);
```

### Pattern 4: Conditional Refresh

**Old Code**:
```typescript
if (isTokenExpired(integration.expiresAt)) {
  await integrationsService.refreshToken(provider, accountId);
}
```

**New Code**:
```typescript
// Use built-in expiry detection
if (integrationsService.shouldRefreshToken(integration.expiresAt)) {
  const refreshed = await integrationsService.refreshToken(provider, accountId);
  setIntegration(refreshed);
}

// OR use auto-refresh (recommended)
const token = await integrationsService.getAccessToken(userId, provider, accountId);
```

## Recommended Approach

### Use Auto-Refresh Instead of Manual Refresh

**Instead of**:
```typescript
// Manual refresh
if (isExpired(integration.expiresAt)) {
  await integrationsService.refreshToken(provider, accountId);
}
const token = await getToken(userId, provider, accountId);
```

**Use**:
```typescript
// Auto-refresh handles everything
const token = await integrationsService.getAccessToken(userId, provider, accountId);
```

**Benefits**:
- Simpler code
- Automatic expiry detection
- Transparent refresh
- Better error handling

## Testing Your Migration

### Unit Tests

**Update test expectations**:
```typescript
// Old test
it('should refresh token', async () => {
  await integrationsService.refreshToken('instagram', 'account123');
  // No return value to check
});

// New test
it('should refresh token and return integration', async () => {
  const integration = await integrationsService.refreshToken('instagram', 'account123');
  
  expect(integration).toBeDefined();
  expect(integration.provider).toBe('instagram');
  expect(integration.providerAccountId).toBe('account123');
  expect(integration.status).toBe('connected');
  expect(integration.expiresAt).toBeDefined();
});
```

### Integration Tests

**Test retry behavior**:
```typescript
it('should retry on network failure', async () => {
  // Mock network failure on first attempt
  mockAdapter.refreshAccessToken
    .mockRejectedValueOnce(new Error('ETIMEDOUT'))
    .mockResolvedValueOnce({ accessToken: 'new-token', expiresIn: 3600 });
  
  const integration = await integrationsService.refreshToken('instagram', 'account123');
  
  expect(integration).toBeDefined();
  expect(mockAdapter.refreshAccessToken).toHaveBeenCalledTimes(2);
});
```

## Rollback Plan

If you need to rollback to the old API:

1. **Revert the service file**:
```bash
git checkout HEAD~1 lib/services/integrations/integrations.service.ts
```

2. **Update your code**:
```typescript
// Remove return value handling
await integrationsService.refreshToken(provider, accountId);
```

3. **Redeploy**

## Support

### Common Issues

**Issue 1: TypeScript errors about return type**
```
Error: Type 'void' is not assignable to type 'Integration'
```

**Solution**: Update variable declarations to capture the returned integration:
```typescript
const integration = await integrationsService.refreshToken(...);
```

**Issue 2: Tests failing due to return value**
```
Error: Expected undefined, received object
```

**Solution**: Update test expectations to check the returned integration.

**Issue 3: Retry behavior too aggressive**
```
Warning: Token refresh taking too long
```

**Solution**: Reduce retry count or delays:
```typescript
await integrationsService.refreshToken(provider, accountId, {
  maxRetries: 2,
  initialDelay: 500,
  maxDelay: 5000
});
```

### Getting Help

- Check the [API documentation](./README.md)
- Review [test examples](../../tests/unit/services/integrations.service.test.ts)
- Open an issue on GitHub
- Contact the platform team

## Timeline

- **2025-11-18**: New API released
- **2025-11-25**: Migration deadline (1 week)
- **2025-12-02**: Old API deprecated
- **2025-12-09**: Old API removed

## Checklist

- [ ] Updated all `refreshToken()` calls to capture return value
- [ ] Added error handling for new error codes
- [ ] Configured retry behavior where needed
- [ ] Updated unit tests
- [ ] Updated integration tests
- [ ] Tested in development environment
- [ ] Tested in staging environment
- [ ] Updated documentation
- [ ] Notified team members
- [ ] Scheduled production deployment

---

**Questions?** Contact the platform team or open an issue.

