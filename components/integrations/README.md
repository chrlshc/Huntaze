# Integrations Components

This directory contains components for managing OAuth integrations with social media and content platforms.

## Components

### IntegrationCard

Displays a single integration with connection status, account information, and action buttons.

**Props:**
- `provider`: The platform provider ('instagram' | 'tiktok' | 'reddit' | 'onlyfans')
- `isConnected`: Whether the integration is currently connected
- `account`: Optional account information (providerAccountId, metadata, expiresAt, createdAt)
- `onConnect`: Callback when user clicks "Add app" or "Add another"
- `onDisconnect`: Callback when user clicks "Disconnect"
- `onReconnect`: Callback when user clicks "Reconnect" (for expired tokens)
- `showAddAnother`: Optional boolean to show "Add another" button for connected accounts

**Usage:**
```tsx
<IntegrationCard
  provider="instagram"
  isConnected={true}
  account={{
    providerAccountId: "123456",
    metadata: { username: "johndoe" },
    expiresAt: new Date("2025-12-31"),
    createdAt: new Date("2025-01-01"),
  }}
  onConnect={() => connect('instagram')}
  onDisconnect={() => disconnect('instagram', '123456')}
  onReconnect={() => reconnect('instagram', '123456')}
  showAddAnother={true}
/>
```

### AccountSwitcher

Allows users to switch between multiple accounts for the same platform.

**Props:**
- `provider`: The platform provider
- `accounts`: Array of account objects with providerAccountId, username, displayName, etc.
- `selectedAccountId`: The currently selected account ID
- `onAccountChange`: Callback when user selects a different account
- `className`: Optional CSS class name

**Usage:**
```tsx
import { AccountSwitcher } from '@/components/integrations/AccountSwitcher';

function MyComponent() {
  const [selectedAccountId, setSelectedAccountId] = useState('123456');
  
  const accounts = [
    { providerAccountId: '123456', username: 'account1' },
    { providerAccountId: '789012', username: 'account2' },
  ];

  return (
    <AccountSwitcher
      provider="instagram"
      accounts={accounts}
      selectedAccountId={selectedAccountId}
      onAccountChange={setSelectedAccountId}
    />
  );
}
```

### IntegrationIcon

Displays the platform icon with consistent sizing.

**Props:**
- `provider`: The platform provider
- `size`: Icon size ('sm' | 'md' | 'lg')

### IntegrationStatus

Displays the connection status badge.

**Props:**
- `status`: Connection status ('connected' | 'disconnected' | 'expired' | 'error')

## Multi-Account Support

The integrations system supports multiple accounts per platform. Here's how to implement multi-account support in your components:

### 1. Fetching Multiple Accounts

Use the `useIntegrations` hook to fetch all connected accounts:

```tsx
import { useIntegrations } from '@/hooks/useIntegrations';

function MyComponent() {
  const { integrations, loading, error } = useIntegrations();
  
  // Filter accounts by provider
  const instagramAccounts = integrations.filter(
    (integration) => integration.provider === 'instagram'
  );
  
  return (
    <div>
      {instagramAccounts.map((account) => (
        <div key={account.providerAccountId}>
          {account.metadata?.username}
        </div>
      ))}
    </div>
  );
}
```

### 2. Account Selection in Data Fetching Hooks

When fetching data from a platform, pass the selected account ID:

```tsx
import { useOnlyFansDashboard } from '@/hooks/useOnlyFansDashboard';
import { AccountSwitcher } from '@/components/integrations/AccountSwitcher';

function OnlyFansDashboard() {
  const { integrations } = useIntegrations();
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  
  // Get all OnlyFans accounts
  const onlyFansAccounts = integrations.filter(
    (integration) => integration.provider === 'onlyfans'
  );
  
  // Use the first account by default
  useEffect(() => {
    if (onlyFansAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(onlyFansAccounts[0].providerAccountId);
    }
  }, [onlyFansAccounts, selectedAccountId]);
  
  // Fetch dashboard data for selected account
  const { data, loading, error } = useOnlyFansDashboard({
    accountId: selectedAccountId,
  });
  
  return (
    <div>
      {onlyFansAccounts.length > 1 && (
        <AccountSwitcher
          provider="onlyfans"
          accounts={onlyFansAccounts.map(acc => ({
            providerAccountId: acc.providerAccountId,
            username: acc.metadata?.username,
            displayName: acc.metadata?.displayName,
          }))}
          selectedAccountId={selectedAccountId || ''}
          onAccountChange={setSelectedAccountId}
        />
      )}
      
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>{/* Render dashboard data */}</div>}
    </div>
  );
}
```

### 3. Displaying Multiple Accounts in the Integrations Page

The integrations page automatically displays multiple accounts per provider:

```tsx
// In app/(app)/integrations/page.tsx
{AVAILABLE_PROVIDERS.map((provider) => {
  const connectedAccounts = integrations.filter(
    (integration) => integration.provider === provider
  );

  // Show a card for each connected account
  return connectedAccounts.map((account) => (
    <IntegrationCard
      key={`${provider}-${account.providerAccountId}`}
      provider={provider}
      isConnected={true}
      account={account}
      onConnect={() => connect(provider)}
      onDisconnect={() => disconnect(provider, account.providerAccountId)}
      onReconnect={() => reconnect(provider, account.providerAccountId)}
      showAddAnother={true}
    />
  ));
})}
```

## API Integration

### Status Endpoint

The `/api/integrations/status` endpoint returns all connected accounts:

```typescript
{
  success: true,
  data: {
    integrations: [
      {
        id: 1,
        provider: 'instagram',
        accountId: '123456',
        accountName: '@johndoe',
        status: 'connected',
        expiresAt: '2025-12-31T23:59:59Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T12:00:00Z'
      },
      {
        id: 2,
        provider: 'instagram',
        accountId: '789012',
        accountName: '@janedoe',
        status: 'connected',
        expiresAt: '2025-12-31T23:59:59Z',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-15T12:00:00Z'
      }
    ]
  },
  duration: 45
}
```

### Connect Endpoint

To connect a new account, call `/api/integrations/connect/:provider`:

```typescript
const response = await fetch('/api/integrations/connect/instagram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    redirectUrl: window.location.origin + '/integrations',
  }),
});

const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect to OAuth flow
```

### Disconnect Endpoint

To disconnect an account, call `/api/integrations/disconnect/:provider/:accountId`:

```typescript
await fetch('/api/integrations/disconnect/instagram/123456', {
  method: 'DELETE',
});
```

## Requirements

Multi-account support implements the following requirements:

- **Requirement 12.1**: Allow multiple Instagram accounts per user
- **Requirement 12.2**: Allow multiple OnlyFans accounts per user
- **Requirement 12.3**: Display all connected accounts
- **Requirement 12.4**: Use providerAccountId to distinguish between accounts

## Testing

Property-based tests verify multi-account support:

```bash
npm test -- tests/unit/services/multi-account-support.property.test.ts --run
```

The tests verify:
- Multiple accounts per provider with unique IDs
- Independent metadata for each account
- Filtering one account without affecting others
- Different expiry times for each account
- Independence between different providers
- Unique account IDs within a provider
