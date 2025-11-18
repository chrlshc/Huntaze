# Integrations Service - Usage Examples

## Quick Start

### 1. Connect an Integration

```typescript
import { integrationsService } from '@/lib/services/integrations/integrations.service';

// Initiate OAuth flow
const result = await integrationsService.initiateOAuthFlow(
  'instagram',
  userId,
  'https://app.huntaze.com/integrations/callback',
  req.ip,
  req.headers['user-agent']
);

// Redirect user to OAuth URL
res.redirect(result.authUrl);
```

### 2. Handle OAuth Callback

```typescript
// In your callback route
const { code, state } = req.query;

try {
  const { userId, accountId } = await integrationsService.handleOAuthCallback(
    'instagram',
    code,
    state,
    req.ip,
    req.headers['user-agent']
  );
  
  // Success - redirect to integrations page
  res.redirect('/integrations?success=true');
} catch (error) {
  if (error.code === 'INVALID_STATE') {
    // CSRF attack detected
    res.redirect('/integrations?error=csrf');
  } else {
    // Other error
    res.redirect('/integrations?error=oauth_failed');
  }
}
```

### 3. Get Access Token with Auto-Refresh

```typescript
// Automatically refreshes if token is expired
const accessToken = await integrationsService.getAccessToken(
  userId,
  'instagram',
  accountId
);

// Use token for API calls
const response = await fetch('https://graph.instagram.com/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### 4. List Connected Integrations

```typescript
const integrations = await integrationsService.getConnectedIntegrations(userId);

integrations.forEach(integration => {
  console.log(`${integration.provider}: ${integration.status}`);
  
  if (integration.status === 'expired') {
    // Token needs refresh
    console.log('Token expired, please reconnect');
  }
});
```

### 5. Manually Refresh Token

```typescript
try {
  const updatedIntegration = await integrationsService.refreshToken(
    'instagram',
    accountId,
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
    }
  );
  
  console.log('Token refreshed successfully');
} catch (error) {
  if (error.code === 'TOKEN_REFRESH_ERROR') {
    // Refresh failed - user needs to reconnect
    console.log('Please reconnect your Instagram account');
  }
}
```

### 6. Disconnect Integration

```typescript
await integrationsService.disconnectIntegration(
  userId,
  'instagram',
  accountId,
  req.ip,
  req.headers['user-agent']
);

console.log('Integration disconnected');
```

## Advanced Usage

### Batch Token Refresh

```typescript
const requests = [
  { provider: 'instagram', accountId: 'account1' },
  { provider: 'tiktok', accountId: 'account2' },
  { provider: 'reddit', accountId: 'account3' },
];

const results = await integrationsService.batchRefreshTokens(requests);

console.log(`Refreshed ${results.length} tokens`);
```

### Error Handling

```typescript
try {
  const token = await integrationsService.getAccessToken(userId, 'instagram', accountId);
} catch (error) {
  if (error.code === 'TOKEN_EXPIRED') {
    // Token expired and refresh failed
    // Prompt user to reconnect
  } else if (error.code === 'ACCOUNT_NOT_FOUND') {
    // Integration not found
    // Redirect to connect page
  } else if (error.retryable) {
    // Network error - can retry
    // Show retry button
  } else {
    // Fatal error
    // Show error message
  }
}
```

### React Hook Usage

```typescript
import { useIntegrations } from '@/hooks/useIntegrations';

function IntegrationsPage() {
  const { integrations, isLoading, isError, refresh } = useIntegrations();
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading integrations</div>;
  
  return (
    <div>
      {integrations.map(integration => (
        <IntegrationCard
          key={integration.provider}
          integration={integration}
          onRefresh={() => refresh()}
        />
      ))}
    </div>
  );
}
```

### Custom Retry Configuration

```typescript
// Custom retry for slow networks
const integration = await integrationsService.refreshToken(
  'instagram',
  accountId,
  {
    maxRetries: 5,        // More retries
    initialDelay: 2000,   // Longer initial delay
    maxDelay: 30000,      // Higher max delay
  }
);
```

## Best Practices

### 1. Always Use Auto-Refresh

```typescript
// ✅ Good - uses auto-refresh
const token = await integrationsService.getAccessToken(userId, provider, accountId);

// ❌ Bad - manual token management
const account = await prisma.oAuthAccount.findFirst(...);
const token = decryptToken(account.accessToken);
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good - specific error handling
try {
  const token = await integrationsService.getAccessToken(...);
} catch (error) {
  if (error.code === 'TOKEN_EXPIRED') {
    // Prompt reconnection
  } else if (error.retryable) {
    // Show retry option
  } else {
    // Show error message
  }
}

// ❌ Bad - generic error handling
try {
  const token = await integrationsService.getAccessToken(...);
} catch (error) {
  console.error('Error:', error);
}
```

### 3. Use Correlation IDs for Debugging

```typescript
// All errors include correlation IDs
try {
  await integrationsService.handleOAuthCallback(...);
} catch (error) {
  console.error('OAuth failed', {
    correlationId: error.correlationId,
    code: error.code,
    message: error.message,
  });
  
  // Send to error tracking service
  Sentry.captureException(error, {
    tags: { correlationId: error.correlationId },
  });
}
```

### 4. Invalidate Cache After Changes

```typescript
// Cache is automatically invalidated after:
// - New connection
// - Token refresh
// - Disconnection

// Manual invalidation if needed
import { integrationCache } from '@/lib/services/integrations/cache';
integrationCache.invalidate(userId);
```

### 5. Monitor Performance

```typescript
import { withPerformanceMonitoring } from '@/lib/services/integrations/monitoring';

const monitoredRefresh = withPerformanceMonitoring(
  integrationsService.refreshToken.bind(integrationsService),
  'token_refresh'
);

await monitoredRefresh('instagram', accountId);
// Logs: [Performance] token_refresh completed { duration: 1234, success: true }
```

## Common Patterns

### Pattern 1: Connect Flow

```typescript
// Step 1: Initiate OAuth
app.post('/api/integrations/connect/:provider', async (req, res) => {
  const { provider } = req.params;
  const userId = req.session.userId;
  
  const result = await integrationsService.initiateOAuthFlow(
    provider,
    userId,
    `${process.env.APP_URL}/integrations/callback`,
    req.ip,
    req.headers['user-agent']
  );
  
  res.json({ authUrl: result.authUrl });
});

// Step 2: Handle callback
app.get('/api/integrations/callback/:provider', async (req, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;
  
  try {
    await integrationsService.handleOAuthCallback(
      provider,
      code,
      state,
      req.ip,
      req.headers['user-agent']
    );
    
    res.redirect('/integrations?success=true');
  } catch (error) {
    res.redirect(`/integrations?error=${error.code}`);
  }
});
```

### Pattern 2: API Call with Auto-Refresh

```typescript
async function makeInstagramAPICall(userId: string, accountId: string, endpoint: string) {
  // Get token with auto-refresh
  const token = await integrationsService.getAccessToken(
    userId,
    'instagram',
    accountId
  );
  
  // Make API call
  const response = await fetch(`https://graph.instagram.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.statusText}`);
  }
  
  return response.json();
}
```

### Pattern 3: Batch Operations

```typescript
async function refreshAllExpiredTokens(userId: number) {
  // Get all integrations
  const integrations = await integrationsService.getConnectedIntegrations(userId);
  
  // Filter expired tokens
  const expired = integrations.filter(i => i.status === 'expired');
  
  // Batch refresh
  const requests = expired.map(i => ({
    provider: i.provider,
    accountId: i.providerAccountId,
  }));
  
  const results = await integrationsService.batchRefreshTokens(requests);
  
  console.log(`Refreshed ${results.length}/${expired.length} tokens`);
}
```

## Testing

### Unit Test Example

```typescript
import { IntegrationsService } from '@/lib/services/integrations/integrations.service';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  
  beforeEach(() => {
    service = new IntegrationsService();
  });
  
  it('should retry on network error', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce({ accessToken: 'token' });
    
    const result = await service['retryWithBackoff'](mockFn, 3, 'test');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ accessToken: 'token' });
  });
});
```

### Integration Test Example

```typescript
describe('OAuth Flow', () => {
  it('should complete full OAuth flow', async () => {
    // Initiate
    const { authUrl, state } = await integrationsService.initiateOAuthFlow(
      'instagram',
      userId,
      redirectUrl
    );
    
    expect(authUrl).toContain('instagram.com');
    expect(state).toMatch(/^\d+:\d+:.+$/);
    
    // Callback
    const { userId: returnedUserId, accountId } = 
      await integrationsService.handleOAuthCallback(
        'instagram',
        'mock_code',
        state
      );
    
    expect(returnedUserId).toBe(userId);
    expect(accountId).toBeDefined();
  });
});
```

---

**Last Updated**: 2025-11-18  
**Version**: 1.0.0

