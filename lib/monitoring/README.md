# Production-Safe Monitoring

Système de monitoring conditionnel qui respecte l'environnement et minimise l'overhead en production.

## Caractéristiques

✅ **Environment-Aware**: Désactivé automatiquement en production  
✅ **Sampling**: 10% des requêtes en développement pour réduire l'overhead  
✅ **Batching**: Accumule les métriques et les envoie par batch  
✅ **Non-Blocking**: Ne bloque jamais l'UI ou les interactions critiques  
✅ **Error-Safe**: Les erreurs de monitoring n'affectent jamais l'application  

## Configuration

Le système se configure automatiquement selon l'environnement :

```typescript
// Development
{
  enabled: true,
  sampling: 0.1,      // 10% des requêtes
  batchSize: 50,      // 50 métriques par batch
  flushInterval: 10000 // Flush toutes les 10 secondes
}

// Production
{
  enabled: false,     // Complètement désactivé
  sampling: 0,
  batchSize: 50,
  flushInterval: 10000
}
```

## Usage

### 1. Track Performance Metrics

```typescript
import { trackPerformance } from '@/lib/monitoring/production-safe-monitoring';

// Track une métrique simple
trackPerformance('api.response', 123.45);

// Avec tags
trackPerformance('api.response', 123.45, {
  endpoint: '/api/users',
  method: 'GET'
});
```

### 2. Measure Execution Time

```typescript
import { measureAsync, measure } from '@/lib/monitoring/production-safe-monitoring';

// Async
const result = await measureAsync('db.query', async () => {
  return await prisma.user.findMany();
}, { table: 'users' });

// Sync
const result = measure('calculation', () => {
  return expensiveCalculation();
}, { type: 'fibonacci' });
```

### 3. React Components

```typescript
import { ConditionalMonitor } from '@/components/monitoring/ConditionalMonitor';

function MyApp() {
  return (
    <>
      <ConditionalMonitor>
        <PerformanceMonitor />
      </ConditionalMonitor>
      
      <MainContent />
    </>
  );
}
```

### 4. React Hooks

```typescript
import { useConditionalMonitoring, useRenderTimeTracking } from '@/hooks/useConditionalMonitoring';

function MyComponent() {
  const { shouldMonitor, trackMetric, startTimer } = useConditionalMonitoring();
  
  // Track render time
  useRenderTimeTracking('MyComponent');
  
  // Track custom metric
  useEffect(() => {
    trackMetric('component.mounted', 1);
  }, []);
  
  // Track operation
  const handleClick = () => {
    const stopTimer = startTimer('button.click');
    doSomething();
    stopTimer();
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### 5. API Call Tracking

```typescript
import { useApiCallTracking } from '@/hooks/useConditionalMonitoring';

function useUsers() {
  const { trackApiCall } = useApiCallTracking();
  
  return useQuery('users', () =>
    trackApiCall('users', async () => {
      const response = await fetch('/api/users');
      return response.json();
    })
  );
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Application Code                        │
│  - trackPerformance()                                   │
│  - measureAsync()                                       │
│  - useConditionalMonitoring()                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│            ProductionSafeMonitoring                      │
│  - Environment check (dev only)                         │
│  - Sampling (10% in dev)                                │
│  - Batching (50 metrics)                                │
│  - Error handling (never throw)                         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Metric Batch                            │
│  - Accumulate in memory                                 │
│  - Flush every 10s or when full                         │
│  - Send to /api/monitoring/batch                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Monitoring API Endpoint                     │
│  - Validate environment (dev only)                      │
│  - Calculate statistics                                 │
│  - Log to console                                       │
└─────────────────────────────────────────────────────────┘
```

## Performance Impact

### Development
- **CPU Impact**: < 1% (avec sampling à 10%)
- **Memory**: < 5MB (batch de 50 métriques)
- **Network**: 1 requête toutes les 10 secondes

### Production
- **CPU Impact**: 0% (complètement désactivé)
- **Memory**: 0 bytes
- **Network**: 0 requêtes

## Testing

```bash
# Test le système de monitoring
npm run test:monitoring

# Ou avec tsx
npx tsx scripts/test-conditional-monitoring.ts
```

## Best Practices

### ✅ DO

- Utiliser `trackPerformance()` pour les métriques simples
- Utiliser `measureAsync()` pour mesurer des opérations async
- Wrapper les composants de monitoring avec `<ConditionalMonitor>`
- Utiliser `useConditionalMonitoring()` dans les hooks custom

### ❌ DON'T

- Ne jamais bloquer l'UI avec du code de monitoring
- Ne jamais throw d'erreurs depuis le code de monitoring
- Ne jamais faire de monitoring synchrone dans le render path
- Ne jamais envoyer des métriques individuellement (utiliser le batching)

## Migration Guide

### Avant

```typescript
// ❌ Monitoring toujours actif
function MyComponent() {
  useEffect(() => {
    trackMetric('component.mounted', 1);
  }, []);
}
```

### Après

```typescript
// ✅ Monitoring conditionnel
function MyComponent() {
  const { trackMetric } = useConditionalMonitoring();
  
  useEffect(() => {
    trackMetric('component.mounted', 1);
  }, [trackMetric]);
}
```

## Troubleshooting

### Metrics not appearing in development

1. Vérifier que `NODE_ENV=development`
2. Vérifier le sampling (10% par défaut)
3. Reset la session: `productionSafeMonitoring.resetSession()`

### Metrics appearing in production

1. Vérifier que `NODE_ENV=production`
2. Vérifier les logs de l'API endpoint
3. Le système devrait retourner 403 en production

### High memory usage

1. Réduire `batchSize` dans la config
2. Réduire `flushInterval` pour flush plus souvent
3. Vérifier qu'il n'y a pas de memory leaks dans le code de monitoring

## Related

- [Diagnostic Tool](../diagnostics/README.md)
- [Cache System](../cache/README.md)
- [SWR Optimization](../swr/README.md)
