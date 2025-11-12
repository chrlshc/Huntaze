# Feature Flags API - Quick Start Guide

Guide rapide pour utiliser l'API Feature Flags optimisée.

## 🚀 Pour les Développeurs Frontend

### Installation

```bash
npm install @tanstack/react-query
```

### Usage Basique

```typescript
import { useFeatureFlags, useUpdateFeatureFlags } from '@/hooks/useFeatureFlags';

function FeatureFlagsPanel() {
  const { data, isLoading, error } = useFeatureFlags();
  const updateFlags = useUpdateFeatureFlags();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Feature Flags</h2>
      
      {/* Toggle feature */}
      <label>
        <input
          type="checkbox"
          checked={data?.flags.enabled}
          onChange={e => updateFlags.mutate({ enabled: e.target.checked })}
        />
        Feature Enabled
      </label>

      {/* Rollout slider */}
      <div>
        <label>Rollout: {data?.flags.rolloutPercentage}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={data?.flags.rolloutPercentage}
          onChange={e => updateFlags.mutate({ 
            rolloutPercentage: Number(e.target.value) 
          })}
        />
      </div>
    </div>
  );
}
```

### Fonctionnalités Clés

✅ **Caching automatique** - 5 minutes de cache  
✅ **Retry automatique** - 3 tentatives avec backoff  
✅ **Optimistic updates** - UI réactive  
✅ **Error handling** - Messages clairs  
✅ **TypeScript** - Types complets  

## 🔧 Pour les Développeurs Backend

### Endpoint GET

```bash
curl -X GET https://api.huntaze.com/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "flags": {
    "enabled": true,
    "rolloutPercentage": 50,
    "markets": ["FR", "US"],
    "userWhitelist": []
  },
  "correlationId": "abc-123-def-456"
}
```

### Endpoint POST

```bash
curl -X POST https://api.huntaze.com/api/admin/feature-flags \
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
  "correlationId": "def-456-ghi-789"
}
```

## 📊 Validation Rules

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| `enabled` | boolean | - | `true` |
| `rolloutPercentage` | number | 0-100 | `50` |
| `markets` | string[] | 2-letter ISO codes | `["FR", "US"]` |
| `userWhitelist` | string[] | Valid UUIDs | `["123e4567-..."]` |

## ❌ Common Errors

### 400 - Invalid rolloutPercentage
```json
{
  "error": "Invalid rolloutPercentage",
  "message": "Must be between 0 and 100",
  "correlationId": "..."
}
```

**Fix:** Use value between 0 and 100

### 400 - Invalid market codes
```json
{
  "error": "Invalid market codes",
  "message": "Invalid markets: USA. Must be 2-letter ISO codes (e.g., FR, US)",
  "correlationId": "..."
}
```

**Fix:** Use 2-letter ISO codes (FR, US, DE, etc.)

### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "correlationId": "..."
}
```

**Fix:** Include valid Bearer token in Authorization header

## 🔍 Debugging

### Correlation IDs

Chaque requête retourne un `correlationId` unique :

```typescript
const response = await fetch('/api/admin/feature-flags');
const data = await response.json();
console.log('Correlation ID:', data.correlationId);
```

Utilisez-le pour chercher dans les logs :

```bash
grep "correlationId: abc-123-def-456" logs/*.log
```

### Logs Structurés

```
[Feature Flags API] GET request started { correlationId: '...' }
[Feature Flags API] GET request completed { userId: '...', correlationId: '...' }
```

## 🧪 Testing

### Run Integration Tests

```bash
# All tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Specific test
npm run test:integration -- --grep "should update enabled flag"
```

### Manual Testing

```bash
# Get flags
curl http://localhost:3000/api/admin/feature-flags

# Update flags
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

## 📚 Documentation Complète

- **API Specs:** `docs/api/admin-feature-flags.md`
- **Client Guide:** `docs/api/admin-feature-flags-client.md`
- **Summary:** `FEATURE_FLAGS_API_OPTIMIZATION_COMPLETE.md`

## 🎯 Use Cases

### 1. Enable Feature Globally

```typescript
await featureFlagsClient.enable();
```

### 2. Gradual Rollout (50%)

```typescript
await featureFlagsClient.setRollout(50);
```

### 3. Market-Specific

```typescript
await featureFlagsClient.setMarkets(['FR', 'DE']);
```

### 4. User Whitelist

```typescript
await featureFlagsClient.addToWhitelist('user-uuid');
```

### 5. Disable Feature

```typescript
await featureFlagsClient.disable();
```

## ⚡ Performance

- **GET:** < 500ms
- **POST:** < 1s
- **Cache:** 5 minutes
- **Retry:** 3 attempts with exponential backoff

## 🔒 Security

- ✅ Bearer token authentication
- ✅ Input validation
- ✅ XSS prevention
- ⚠️ TODO: Role-based access control

## 🚨 Emergency

### Kill Switch

Si besoin de désactiver immédiatement :

```bash
curl -X POST /api/admin/feature-flags \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

Ou utiliser le kill switch endpoint :

```bash
curl -X POST /api/admin/kill-switch \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature": "onboarding", "enabled": false}'
```

## 📞 Support

Questions ? Consultez :

1. `docs/api/admin-feature-flags.md` - Specs complètes
2. `docs/api/admin-feature-flags-client.md` - Guide client
3. Tests d'intégration - Exemples d'usage
4. Équipe Platform - Support technique

---

**Last Updated:** 2024-11-11  
**Status:** ✅ Production Ready
