# Multi-Account Support Implementation

## Overview

Implemented comprehensive multi-account support for the integrations management system, allowing users to connect and manage multiple accounts per platform (Instagram, TikTok, Reddit, OnlyFans).

## Implementation Date

November 18, 2025

## Requirements Addressed

- **Requirement 12.1**: Allow multiple Instagram accounts per user ✅
- **Requirement 12.2**: Allow multiple OnlyFans accounts per user ✅
- **Requirement 12.3**: Display all connected accounts ✅
- **Requirement 12.4**: Use providerAccountId to distinguish between accounts ✅

## Changes Made

### 1. UI Components

#### IntegrationsPage (`app/(app)/integrations/page.tsx`)
- **Before**: Displayed only one account per provider
- **After**: Displays all connected accounts for each provider
- Shows a card for each connected account
- Shows "Add app" button when no accounts are connected
- Shows "Add another" button on connected accounts to add more

**Key Changes:**
```typescript
// Old: Find single account
const connectedAccount = integrations.find(
  (integration) => integration.provider === provider
);

// New: Find all accounts
const connectedAccounts = integrations.filter(
  (integration) => integration.provider === provider
);

// Render a card for each account
return connectedAccounts.map((account) => (
  <IntegrationCard
    key={`${provider}-${account.providerAccountId}`}
    // ... props
    showAddAnother={true}
  />
));
```

#### IntegrationCard (`components/integrations/IntegrationCard.tsx`)
- Added `showAddAnother` prop to display "Add another" button
- Updated button layout to accommodate both "Add another" and "Disconnect" buttons
- Maintains all existing functionality (connect, disconnect, reconnect)

**Key Changes:**
```typescript
export interface IntegrationCardProps {
  // ... existing props
  showAddAnother?: boolean; // New prop
}

// In render:
{status === 'connected' && (
  <>
    {showAddAnother && (
      <button onClick={handleConnect}>Add another</button>
    )}
    <button onClick={handleDisconnect}>Disconnect</button>
  </>
)}
```

#### AccountSwitcher (`components/integrations/AccountSwitcher.tsx`) - NEW
- Created new component for switching between multiple accounts
- Displays dropdown with all accounts for a provider
- Shows account username/display name
- Highlights currently selected account
- Automatically hides when only one account exists

**Features:**
- Dropdown interface with platform icon
- Account selection with visual feedback
- Keyboard accessible
- Responsive design
- Backdrop click to close

### 2. Data Layer

#### Integration Types (`lib/services/integrations/types.ts`)
- Added optional `id` field to `Integration` interface
- Enables unique identification of each integration record

**Changes:**
```typescript
export interface Integration {
  id?: number; // New field
  provider: Provider;
  providerAccountId: string;
  // ... other fields
}
```

#### Integrations Service (`lib/services/integrations/integrations.service.ts`)
- Updated `getConnectedIntegrations` to include `id` field
- No other changes needed - service already supported multiple accounts

**Changes:**
```typescript
return accounts.map(account => ({
  id: account.id, // Now included
  provider: account.provider as Provider,
  providerAccountId: account.providerAccountId,
  // ... other fields
}));
```

#### useIntegrations Hook (`hooks/useIntegrations.ts`)
- Added `id` field to `Integration` interface
- Updated response parsing to handle both old and new API formats
- Maps API response fields correctly (accountId → providerAccountId)

**Changes:**
```typescript
export interface Integration {
  id?: number; // New field
  // ... other fields
}

// Updated parsing:
const parsedIntegrations = integrationsData.map((integration: any) => ({
  id: integration.id,
  provider: integration.provider,
  providerAccountId: integration.accountId || integration.providerAccountId,
  // ... other fields
}));
```

### 3. API Layer

#### Status Endpoint (`app/api/integrations/status/route.ts`)
- Updated to extract display name from metadata
- Properly formats response with account information
- Returns all accounts (no filtering)

**Changes:**
```typescript
const integrationsWithStatus = integrations.map(integration => {
  // Extract display name from metadata
  const username = integration.metadata?.username || 
                  integration.metadata?.displayName || 
                  integration.providerAccountId;
  
  return {
    id: integration.id!,
    provider: integration.provider,
    accountId: integration.providerAccountId,
    accountName: username, // Now uses metadata
    // ... other fields
  };
});
```

### 4. Testing

#### Property-Based Tests (`tests/unit/services/multi-account-support.property.test.ts`) - NEW
- Created comprehensive property-based tests using fast-check
- Tests run 100 iterations each to verify properties hold across random inputs
- All tests passing ✅

**Tests:**
1. **Multiple accounts per provider with unique IDs**
   - Verifies that multiple accounts can exist for the same provider
   - Ensures all account IDs are unique

2. **Independent metadata for each account**
   - Verifies each account maintains its own metadata
   - Ensures metadata is not shared between accounts

3. **Filtering one account without affecting others**
   - Verifies removing one account doesn't affect others
   - Tests list manipulation operations

4. **Different expiry times for each account**
   - Verifies each account can have independent token expiry
   - Ensures expiry times are properly maintained

5. **Independence between different providers**
   - Verifies accounts from different providers are independent
   - Tests cross-provider isolation

6. **Unique account IDs within a provider**
   - Verifies uniqueness constraint is enforced
   - Ensures no duplicate accounts exist

### 5. Documentation

#### Component README (`components/integrations/README.md`) - NEW
- Comprehensive documentation for all integration components
- Usage examples for multi-account support
- API integration guide
- Testing instructions

**Sections:**
- Component API documentation
- Multi-account support guide
- Data fetching with account selection
- API endpoint documentation
- Testing guide

## Database Schema

No changes required! The existing schema already supports multiple accounts:

```prisma
model OAuthAccount {
  id                 Int       @id @default(autoincrement())
  userId             Int
  provider           String
  providerAccountId  String
  // ... other fields
  
  @@unique([provider, providerAccountId]) // Allows multiple accounts per provider
  @@index([userId, provider])
}
```

The unique constraint is on `(provider, providerAccountId)`, not `(userId, provider)`, which allows multiple accounts per user per provider.

## Usage Examples

### Displaying Multiple Accounts

```tsx
import { useIntegrations } from '@/hooks/useIntegrations';

function MyComponent() {
  const { integrations } = useIntegrations();
  
  const instagramAccounts = integrations.filter(
    (int) => int.provider === 'instagram'
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

### Account Switcher

```tsx
import { AccountSwitcher } from '@/components/integrations/AccountSwitcher';

function Dashboard() {
  const { integrations } = useIntegrations();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  const accounts = integrations
    .filter((int) => int.provider === 'instagram')
    .map((int) => ({
      providerAccountId: int.providerAccountId,
      username: int.metadata?.username,
    }));
  
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

### Fetching Data for Specific Account

```tsx
import { useOnlyFansDashboard } from '@/hooks/useOnlyFansDashboard';

function OnlyFansDashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState('123456');
  
  const { data, loading, error } = useOnlyFansDashboard({
    accountId: selectedAccountId, // Pass selected account
  });
  
  // ... render dashboard
}
```

## Testing

Run the property-based tests:

```bash
npm test -- tests/unit/services/multi-account-support.property.test.ts --run
```

**Results:**
```
✓ tests/unit/services/multi-account-support.property.test.ts (6 tests) 51ms
  ✓ Property 7: Multi-Account Support (6)
    ✓ should allow multiple accounts per provider with unique IDs 9ms
    ✓ should maintain independent metadata for each account 14ms
    ✓ should allow filtering one account without affecting others 5ms
    ✓ should allow different expiry times for each account 8ms
    ✓ should maintain independence between different providers 9ms
    ✓ should enforce unique account IDs within a provider 5ms

Test Files  1 passed (1)
     Tests  6 passed (6)
```

## Validation

### Type Safety
All components and hooks are fully typed with TypeScript. No type errors:

```bash
✓ app/(app)/integrations/page.tsx: No diagnostics found
✓ components/integrations/AccountSwitcher.tsx: No diagnostics found
✓ components/integrations/IntegrationCard.tsx: No diagnostics found
✓ hooks/useIntegrations.ts: No diagnostics found
```

### Property-Based Testing
All 6 property tests passing with 100 iterations each (600 total test cases).

### Requirements Coverage
All requirements (12.1, 12.2, 12.3, 12.4) fully implemented and tested.

## Future Enhancements

1. **Account Nicknames**: Allow users to set custom nicknames for accounts
2. **Default Account**: Allow users to set a default account per provider
3. **Account Grouping**: Group accounts by workspace or team
4. **Bulk Operations**: Connect/disconnect multiple accounts at once
5. **Account Analytics**: Show usage statistics per account

## Migration Notes

No migration required! The implementation is backward compatible:
- Existing single-account users will see their account as before
- The "Add another" button only appears when an account is already connected
- All existing API endpoints continue to work
- Database schema unchanged

## Files Modified

1. `app/(app)/integrations/page.tsx` - Updated to display multiple accounts
2. `components/integrations/IntegrationCard.tsx` - Added "Add another" button
3. `lib/services/integrations/types.ts` - Added `id` field to Integration
4. `lib/services/integrations/integrations.service.ts` - Include `id` in response
5. `hooks/useIntegrations.ts` - Added `id` field and updated parsing
6. `app/api/integrations/status/route.ts` - Extract display name from metadata

## Files Created

1. `components/integrations/AccountSwitcher.tsx` - New account switcher component
2. `tests/unit/services/multi-account-support.property.test.ts` - Property tests
3. `components/integrations/README.md` - Component documentation
4. `.kiro/specs/integrations-management/MULTI_ACCOUNT_IMPLEMENTATION.md` - This file

## Conclusion

Multi-account support has been successfully implemented with:
- ✅ Full UI support for displaying and managing multiple accounts
- ✅ New AccountSwitcher component for account selection
- ✅ Updated API responses to include all accounts
- ✅ Comprehensive property-based testing (6 tests, 100 iterations each)
- ✅ Complete documentation and usage examples
- ✅ Backward compatibility with existing single-account users
- ✅ Type-safe implementation with no TypeScript errors

The implementation follows the design document and satisfies all requirements (12.1, 12.2, 12.3, 12.4).
