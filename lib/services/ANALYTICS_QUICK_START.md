# Onboarding Analytics - Guide de Démarrage Rapide

## 🚀 Installation

```typescript
import {
  trackStepCompleted,
  trackStepStarted,
  trackOnboardingView,
  trackGatingBlocked,
  trackOnboardingEvents,
  clearConsentCache
} from '@/lib/services/onboarding-analytics';
```

## 📝 Cas d'Usage Courants

### 1. Tracker une Étape Complétée

```typescript
// Dans votre API route ou composant serveur
export async function POST(req: Request) {
  const user = await requireUser();
  const startTime = Date.now();
  
  // ... logique métier ...
  
  // Tracker la complétion
  await trackStepCompleted(
    user.id,
    'payments',
    Date.now() - startTime,
    { 
      correlationId: req.headers.get('x-correlation-id'),
      sessionId: req.headers.get('x-session-id')
    }
  );
  
  return Response.json({ success: true });
}
```

### 2. Tracker un Blocage de Gating

```typescript
// Dans votre middleware de gating
export async function requireStep(config: GatingConfig) {
  const user = await requireUser();
  const hasCompleted = await checkStepCompleted(user.id, config.requiredStep);
  
  if (!hasCompleted) {
    // Tracker le blocage
    await trackGatingBlocked(
      user.id,
      req.url,
      config.requiredStep,
      { correlationId: crypto.randomUUID() }
    );
    
    return NextResponse.json({
      error: 'PRECONDITION_REQUIRED',
      missingStep: config.requiredStep
    }, { status: 409 });
  }
  
  return null;
}
```

### 3. Tracker Plusieurs Événements en Batch

```typescript
// Tracker plusieurs événements en une fois
const response = await trackOnboardingEvents(
  userId,
  [
    { 
      type: 'onboarding.step_started', 
      stepId: 'payments', 
      version: 1, 
      entrypoint: 'dashboard' 
    },
    { 
      type: 'onboarding.viewed', 
      page: '/onboarding/payments', 
      userRole: 'owner' 
    }
  ],
  { correlationId: req.headers.get('x-correlation-id') }
);

console.log(`✅ ${response.successCount}/${response.totalEvents} events tracked`);

if (response.failureCount > 0) {
  console.warn(`⚠️ ${response.failureCount} events failed`);
}
```

### 4. Invalider le Cache de Consentement

```typescript
// Après mise à jour du consentement utilisateur
export async function POST(req: Request) {
  const user = await requireUser();
  const { granted } = await req.json();
  
  // Mettre à jour le consentement en DB
  await updateUserConsent(user.id, 'analytics', granted);
  
  // Invalider le cache pour forcer une nouvelle vérification
  clearConsentCache(user.id);
  
  return Response.json({ success: true });
}
```

## 🎯 Patterns Recommandés

### Pattern 1: Tracking avec Correlation ID

```typescript
export async function POST(req: Request) {
  // Générer ou récupérer correlation ID
  const correlationId = 
    req.headers.get('x-correlation-id') || 
    crypto.randomUUID();
  
  try {
    // Logique métier
    const result = await processRequest(req);
    
    // Tracker succès
    await trackStepCompleted(
      userId,
      'step_id',
      duration,
      { correlationId }
    );
    
    return Response.json({ success: true, correlationId });
  } catch (error) {
    // Tracker échec
    await trackOnboardingEvent(
      userId,
      { type: 'onboarding.step_skipped', stepId: 'step_id', reason: 'error' },
      { correlationId }
    );
    
    throw error;
  }
}
```

### Pattern 2: Tracking Non-Bloquant

```typescript
// Ne jamais bloquer le flow utilisateur pour l'analytics
export async function POST(req: Request) {
  const user = await requireUser();
  
  // Logique métier critique
  const result = await processRequest(req);
  
  // Tracker en arrière-plan (fire-and-forget)
  trackStepCompleted(user.id, 'step_id', 1000).catch(error => {
    console.error('Analytics tracking failed:', error);
    // Ne pas propager l'erreur
  });
  
  // Retourner immédiatement
  return Response.json(result);
}
```

### Pattern 3: Tracking avec Retry Automatique

```typescript
// Le service gère automatiquement les retries
// Pas besoin de logique de retry manuelle
const result = await trackStepCompleted(userId, 'payments', 5000);

if (!result.success) {
  // L'événement a échoué après 3 tentatives
  console.error('Failed to track after retries:', result.error);
  
  // Optionnel: envoyer à un système de monitoring
  await sendToMonitoring({
    type: 'analytics_failure',
    userId,
    error: result.error,
    correlationId: result.correlationId
  });
}
```

## ⚡ Optimisations Automatiques

### Debouncing (1 seconde)

```typescript
// Ces deux appels rapides ne créeront qu'un seul événement
await trackStepCompleted(userId, 'payments', 1000);
await trackStepCompleted(userId, 'payments', 1000);  // Debounced

// Résultat du deuxième appel:
// { success: true, debounced: true, skippedReason: 'debounced' }
```

### Cache de Consentement (5 minutes)

```typescript
// Premier appel - hit DB
const consent1 = await checkAnalyticsConsent(userId);

// Appels suivants dans les 5 min - hit cache
const consent2 = await checkAnalyticsConsent(userId);  // Cached
const consent3 = await checkAnalyticsConsent(userId);  // Cached

// Après 5 minutes - hit DB à nouveau
await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
const consent4 = await checkAnalyticsConsent(userId);  // DB query
```

### Retry Automatique avec Backoff

```typescript
// Retry automatique sur erreurs transientes:
// - Erreurs réseau (ECONNREFUSED, ETIMEDOUT)
// - Deadlocks DB
// - Timeouts

// Configuration:
// - Max 3 tentatives
// - Délai initial: 100ms
// - Backoff: 2x (100ms, 200ms, 400ms)
// - Timeout par opération: 5s
```

## 🔍 Debugging

### Utiliser les Correlation IDs

```typescript
// Générer un correlation ID unique
const correlationId = crypto.randomUUID();

// L'utiliser dans tous les appels
await trackStepStarted(userId, 'payments', 1, 'dashboard', { correlationId });
await trackStepCompleted(userId, 'payments', 5000, { correlationId });

// Rechercher dans les logs
// [Analytics] Event tracked successfully { correlationId: "abc-123-..." }
```

### Vérifier les Résultats

```typescript
const result = await trackStepCompleted(userId, 'payments', 5000);

console.log({
  success: result.success,
  correlationId: result.correlationId,
  retryCount: result.retryCount,
  debounced: result.debounced,
  skippedReason: result.skippedReason,
  error: result.error
});
```

### Logs Structurés

```typescript
// Tous les logs incluent:
// - userId
// - eventType
// - stepId (si applicable)
// - correlationId
// - retryCount (si > 1)
// - error details (si échec)

// Exemple de log:
// [Analytics] Event tracked successfully {
//   userId: "user-123",
//   eventType: "onboarding.step_completed",
//   stepId: "payments",
//   correlationId: "abc-123",
//   retryCount: 2
// }
```

## ⚠️ Erreurs Courantes

### 1. Oublier le Correlation ID

```typescript
// ❌ Mauvais - difficile à tracer
await trackStepCompleted(userId, 'payments', 5000);

// ✅ Bon - facile à tracer
const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
await trackStepCompleted(userId, 'payments', 5000, { correlationId });
```

### 2. Bloquer le Flow Utilisateur

```typescript
// ❌ Mauvais - bloque si analytics fail
const result = await trackStepCompleted(userId, 'payments', 5000);
if (!result.success) {
  throw new Error('Analytics failed');  // Ne jamais faire ça!
}

// ✅ Bon - fire-and-forget
trackStepCompleted(userId, 'payments', 5000).catch(console.error);
return Response.json({ success: true });
```

### 3. Ne Pas Invalider le Cache

```typescript
// ❌ Mauvais - cache obsolète
await updateUserConsent(userId, 'analytics', false);
// Le cache contient encore l'ancienne valeur!

// ✅ Bon - invalider après mise à jour
await updateUserConsent(userId, 'analytics', false);
clearConsentCache(userId);
```

### 4. Ignorer les Partial Failures en Batch

```typescript
// ❌ Mauvais - ne vérifie pas les échecs
const response = await trackOnboardingEvents(userId, events);
// Certains événements peuvent avoir échoué!

// ✅ Bon - vérifier et logger
const response = await trackOnboardingEvents(userId, events);
if (response.failureCount > 0) {
  console.warn(`${response.failureCount} events failed`);
  response.results
    .filter(r => !r.success)
    .forEach(r => console.error(`Failed: ${r.error}`));
}
```

## 📊 Monitoring

### Métriques à Surveiller

```typescript
// 1. Taux de succès
const successRate = response.successCount / response.totalEvents;

// 2. Événements debouncés
const debouncedCount = response.results.filter(r => r.debounced).length;

// 3. Événements avec retry
const retriedCount = response.results.filter(r => r.retryCount > 0).length;

// 4. Événements sans consentement
const noConsentCount = response.results.filter(r => r.skippedReason === 'no_consent').length;
```

### Alertes Recommandées

```yaml
# Taux d'échec élevé
- alert: AnalyticsHighFailureRate
  expr: analytics_failure_rate > 0.1  # > 10%
  for: 5m

# Trop de retries
- alert: AnalyticsHighRetryRate
  expr: analytics_retry_rate > 0.3  # > 30%
  for: 5m

# Cache de consentement inefficace
- alert: AnalyticsLowCacheHitRate
  expr: analytics_consent_cache_hit_rate < 0.8  # < 80%
  for: 10m
```

## 🔗 Références

- [Documentation Complète](./README-onboarding-analytics.md)
- [Optimisations API](./ONBOARDING_ANALYTICS_OPTIMIZATIONS.md)
- [Tests Unitaires](../../tests/unit/services/onboarding-analytics-optimizations.test.ts)
- [Retry Strategies](../../docs/api/retry-strategies.md)
- [GDPR Compliance](../../docs/GDPR_DATA_PROCESSING_REGISTRY.md)

## 💡 Tips & Tricks

### Tip 1: Utiliser les Types TypeScript

```typescript
import type { 
  OnboardingEvent, 
  TrackingResult,
  BatchTrackingResponse 
} from '@/lib/services/onboarding-analytics';

// Bénéficiez de l'autocomplétion et type checking
const event: OnboardingEvent = {
  type: 'onboarding.step_completed',  // Autocomplete!
  stepId: 'payments',
  durationMs: 5000
};
```

### Tip 2: Créer des Helpers Métier

```typescript
// lib/analytics-helpers.ts
export async function trackPaymentSetup(
  userId: string,
  durationMs: number,
  metadata?: EventMetadata
) {
  return trackStepCompleted(userId, 'payments', durationMs, metadata);
}

export async function trackThemeCustomization(
  userId: string,
  durationMs: number,
  metadata?: EventMetadata
) {
  return trackStepCompleted(userId, 'theme', durationMs, metadata);
}
```

### Tip 3: Wrapper pour API Routes

```typescript
// lib/with-analytics.ts
export function withAnalytics<T>(
  handler: (req: Request) => Promise<T>,
  stepId: string
) {
  return async (req: Request): Promise<T> => {
    const user = await requireUser();
    const startTime = Date.now();
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
    
    try {
      const result = await handler(req);
      
      // Tracker succès
      trackStepCompleted(
        user.id,
        stepId,
        Date.now() - startTime,
        { correlationId }
      ).catch(console.error);
      
      return result;
    } catch (error) {
      // Tracker échec
      trackStepSkipped(
        user.id,
        stepId,
        'error',
        { correlationId }
      ).catch(console.error);
      
      throw error;
    }
  };
}

// Usage
export const POST = withAnalytics(
  async (req: Request) => {
    // Logique métier
    return Response.json({ success: true });
  },
  'payments'
);
```

---

**Besoin d'aide ?** Consultez la [documentation complète](./README-onboarding-analytics.md) ou contactez l'équipe Platform.
