# Onboarding Analytics Service

Service de tracking d'événements pour le système d'onboarding avec gestion GDPR, retry automatique et corrélation des requêtes.

## Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [API Reference](#api-reference)
- [Gestion des Erreurs](#gestion-des-erreurs)
- [Performance](#performance)
- [GDPR & Consentement](#gdpr--consentement)

## Vue d'ensemble

Le service `onboarding-analytics` fournit une API type-safe pour tracker les événements d'onboarding avec:

- ✅ **Retry automatique** avec exponential backoff (3 tentatives max)
- ✅ **GDPR-compliant** avec vérification du consentement
- ✅ **Correlation IDs** pour le debugging et le tracing
- ✅ **Graceful degradation** - ne casse jamais le flux utilisateur
- ✅ **Type-safe** avec TypeScript strict
- ✅ **Logging structuré** pour observabilité

## Installation

```typescript
import {
  trackStepCompleted,
  trackGatingBlocked,
  trackOnboardingEvent,
  type TrackingResult
} from '@/lib/services/onboarding-analytics';
```

## Utilisation

### Tracking Simple

```typescript
// Dans un API route handler
export async function POST(req: Request) {
  const user = await requireUser();
  
  // Track step completion
  const result = await trackStepCompleted(
    user.id,
    'payments',
    5000, // duration in ms
    { correlationId: req.headers.get('x-correlation-id') }
  );
  
  if (!result.success) {
    console.warn('Analytics tracking failed:', result.error);
    // Continue anyway - tracking failures don't break user flow
  }
  
  return Response.json({ success: true });
}
```

### Tracking avec Gating Middleware

```typescript
// Dans le gating middleware
import { trackGatingBlocked } from '@/lib/services/onboarding-analytics';

export function requireStep(stepId: string) {
  return async (req: Request) => {
    const user = await requireUser();
    const isComplete = await hasStepDone(user.id, stepId);
    
    if (!isComplete) {
      // Track gating event (essential - always tracked)
      await trackGatingBlocked(
        user.id,
        req.url,
        stepId,
        { correlationId: crypto.randomUUID() }
      );
      
      return Response.json({
        error: 'PRECONDITION_REQUIRED',
        missingStep: stepId
      }, { status: 409 });
    }
  };
}
```

### Tracking Batch

```typescript
import { trackOnboardingEvents } from '@/lib/services/onboarding-analytics';

// Track multiple events at once
const results = await trackOnboardingEvents(
  userId,
  [
    { type: 'onboarding.step_started', stepId: 'payments', version: 1, entrypoint: 'dashboard' },
    { type: 'onboarding.viewed', page: '/onboarding', userRole: 'owner' }
  ],
  { sessionId: 'abc-123' }
);

// Check for failures
const failed = results.filter(r => !r.success);
if (failed.length > 0) {
  console.warn(`${failed.length} events failed to track`);
}
```

### Récupération de Statistiques

```typescript
import { getUserEventStats } from '@/lib/services/onboarding-analytics';

const stats = await getUserEventStats(userId);

console.log(`Total events: ${stats.totalEvents}`);
console.log(`Completions: ${stats.eventsByType['onboarding.step_completed'] || 0}`);
console.log(`Last event: ${stats.lastEventAt}`);
```

## API Reference

### Types d'Événements

```typescript
type OnboardingEventType =
  | 'onboarding.viewed'              // Page view
  | 'onboarding.step_started'        // User started a step
  | 'onboarding.step_completed'      // User completed a step (essential)
  | 'onboarding.step_skipped'        // User skipped a step
  | 'onboarding.nudge_snoozed'       // User snoozed nudge banner
  | 'gating.blocked'                 // User blocked by gating (essential)
  | 'merchant.previewed_store'       // Milestone: first store preview
  | 'merchant.first_product_created' // Milestone: first product
  | 'merchant.first_checkout_attempt'; // Milestone: first checkout
```

### Fonctions Principales

#### `trackOnboardingEvent()`

Fonction générique pour tracker n'importe quel événement.

```typescript
function trackOnboardingEvent(
  userId: string,
  event: OnboardingEvent,
  metadata?: EventMetadata,
  options?: TrackEventOptions
): Promise<TrackingResult>
```

**Paramètres:**
- `userId` - ID de l'utilisateur (requis)
- `event` - Payload de l'événement (type-safe)
- `metadata` - Métadonnées additionnelles (correlationId, sessionId, etc.)
- `options` - Options de tracking:
  - `skipConsentCheck?: boolean` - Skip GDPR consent check
  - `forceTrack?: boolean` - Force tracking même sans consentement

**Retour:**
```typescript
interface TrackingResult {
  success: boolean;
  correlationId: string;
  error?: string;
  retryCount?: number;
}
```

#### Fonctions Helper

Toutes les fonctions helper retournent `Promise<TrackingResult>`:

```typescript
// Page views
trackOnboardingView(userId, page, userRole, variant?, metadata?)

// Step lifecycle
trackStepStarted(userId, stepId, version, entrypoint, metadata?)
trackStepCompleted(userId, stepId, durationMs, metadata?) // Essential
trackStepSkipped(userId, stepId, reason?, metadata?)

// Nudges
trackNudgeSnoozed(userId, durationDays, snoozeCount, metadata?)

// Gating
trackGatingBlocked(userId, route, missingStep, metadata?) // Essential

// Milestones
trackStorePreview(userId, metadata?)
trackFirstProductCreated(userId, productId, metadata?)
trackFirstCheckoutAttempt(userId, amount, currency?, metadata?)
```

#### `trackOnboardingEvents()`

Track multiple events en parallèle.

```typescript
function trackOnboardingEvents(
  userId: string,
  events: OnboardingEvent[],
  metadata?: EventMetadata,
  options?: TrackEventOptions
): Promise<TrackingResult[]>
```

Utilise `Promise.allSettled()` pour gérer les échecs partiels.

#### `getUserEventStats()`

Récupère les statistiques d'événements pour un utilisateur.

```typescript
function getUserEventStats(
  userId: string
): Promise<UserEventStats>

interface UserEventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  lastEventAt?: Date;
  correlationId: string;
}
```

### Types & Interfaces

#### `EventMetadata`

```typescript
interface EventMetadata {
  correlationId?: string;  // For request tracing
  sessionId?: string;      // User session ID
  userAgent?: string;      // Browser user agent
  ipAddress?: string;      // Client IP
  referrer?: string;       // HTTP referrer
  [key: string]: any;      // Additional custom fields
}
```

#### `TrackEventOptions`

```typescript
interface TrackEventOptions {
  skipConsentCheck?: boolean; // Skip GDPR consent check
  forceTrack?: boolean;       // Force tracking (overrides consent)
}
```

## Gestion des Erreurs

### Retry Automatique

Le service implémente un retry automatique avec exponential backoff:

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,        // 3 tentatives max
  initialDelayMs: 100,   // Délai initial: 100ms
  maxDelayMs: 1000,      // Délai max: 1s
  backoffFactor: 2       // Facteur multiplicateur
};
```

**Séquence de retry:**
1. Tentative 1: immédiate
2. Tentative 2: après 100ms
3. Tentative 3: après 200ms

### Types d'Erreurs

```typescript
class AnalyticsError extends Error {
  code: string;           // Error code (e.g., 'INVALID_USER_ID')
  userId?: string;        // User ID if available
  eventType?: string;     // Event type if available
  correlationId?: string; // Correlation ID for tracing
}
```

**Codes d'erreur:**
- `INVALID_USER_ID` - userId manquant ou invalide
- `INVALID_EVENT_TYPE` - Type d'événement non reconnu
- `UNKNOWN_ERROR` - Erreur non catégorisée

### Graceful Degradation

**Principe:** Les échecs de tracking ne doivent JAMAIS casser le flux utilisateur.

```typescript
const result = await trackStepCompleted(userId, stepId, duration);

if (!result.success) {
  // Log l'erreur mais continue
  console.warn('Tracking failed:', result.error);
}

// Continue avec la logique métier
return Response.json({ success: true });
```

### Logging Structuré

Tous les logs incluent:
- `userId` - ID utilisateur
- `eventType` - Type d'événement
- `correlationId` - ID de corrélation
- `error` - Message d'erreur
- `stack` - Stack trace (en cas d'erreur)
- `retryCount` - Nombre de retries (si > 1)

```typescript
console.log('[Analytics] Event tracked successfully', {
  userId: 'user-123',
  eventType: 'onboarding.step_completed',
  stepId: 'payments',
  correlationId: 'abc-123',
  retryCount: 2 // Succeeded on 2nd attempt
});
```

## Performance

### Latence

| Opération | Latence Typique | Latence Max |
|-----------|----------------|-------------|
| Track event (1ère tentative) | 10-50ms | 200ms |
| Track event (avec retry) | 50-300ms | 1.5s |
| Batch tracking (5 events) | 50-200ms | 2s |
| Get user stats | 20-100ms | 500ms |

### Optimisations

1. **Parallel Batch Tracking**: `trackOnboardingEvents()` utilise `Promise.allSettled()`
2. **Connection Pooling**: Réutilise les connexions DB via `getPool()`
3. **Retry Intelligent**: Exponential backoff évite de surcharger la DB
4. **Fail Fast**: Validation des inputs avant les appels DB

### Monitoring

Métriques recommandées à tracker:

```typescript
// Dans votre monitoring
const metrics = {
  'analytics.track.duration_ms': duration,
  'analytics.track.success': result.success ? 1 : 0,
  'analytics.track.retry_count': result.retryCount || 0,
  'analytics.consent.check_duration_ms': consentCheckDuration
};
```

## GDPR & Consentement

### Modèle de Consentement

Par défaut: **Opt-out** (tracking activé sauf refus explicite)

```typescript
// Dans checkAnalyticsConsent()
return result.rows[0]?.granted ?? true; // Default: true (opt-out)
```

Pour passer en **Opt-in** (tracking désactivé par défaut):

```typescript
return result.rows[0]?.granted ?? false; // Default: false (opt-in)
```

### Événements Essentiels

Certains événements sont **toujours trackés** (requis pour la fonctionnalité):

```typescript
const ESSENTIAL_EVENT_TYPES = [
  'gating.blocked',           // Requis pour analytics de gating
  'onboarding.step_completed' // Requis pour calcul de progression
];
```

Ces événements ignorent le consentement car nécessaires au fonctionnement.

### Vérification du Consentement

```typescript
// Vérifier le consentement manuellement
const hasConsent = await checkAnalyticsConsent(userId);

if (hasConsent) {
  await trackOnboardingEvent(userId, event);
}

// Ou utiliser forceTrack pour bypasser
await trackOnboardingEvent(
  userId,
  event,
  metadata,
  { forceTrack: true } // Skip consent check
);
```

### Table de Consentement

Structure de la table `user_consent`:

```sql
CREATE TABLE user_consent (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL, -- 'analytics', 'marketing', etc.
  granted BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ,     -- Optional expiration
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, consent_type)
);
```

## Debugging

### Correlation IDs

Chaque événement a un `correlationId` unique pour le tracing:

```typescript
// Générer un correlation ID
import { generateCorrelationId } from '@/lib/services/onboarding-analytics';

const correlationId = generateCorrelationId(); // UUID v4

// Utiliser dans les requêtes
const result = await trackStepCompleted(
  userId,
  stepId,
  duration,
  { correlationId }
);

// Retrouver tous les événements d'une requête
const events = await eventsRepo.getEventsByCorrelationId(correlationId);
```

### Logs de Debug

Activer les logs détaillés:

```typescript
// Dans votre code
console.log('[Analytics] Tracking event', {
  userId,
  eventType: event.type,
  correlationId,
  metadata
});
```

Rechercher dans les logs:

```bash
# Tous les événements d'un utilisateur
grep "userId.*user-123" logs/analytics.log

# Tous les événements d'une requête
grep "correlationId.*abc-123" logs/analytics.log

# Tous les échecs
grep "Failed to track event" logs/analytics.log
```

## Tests

### Tests Unitaires

```typescript
import { trackStepCompleted, isValidEventType } from '@/lib/services/onboarding-analytics';

describe('Onboarding Analytics', () => {
  it('should track step completion', async () => {
    const result = await trackStepCompleted('user-123', 'payments', 5000);
    
    expect(result.success).toBe(true);
    expect(result.correlationId).toBeDefined();
  });
  
  it('should validate event types', () => {
    expect(isValidEventType('onboarding.step_completed')).toBe(true);
    expect(isValidEventType('invalid.event')).toBe(false);
  });
});
```

### Tests d'Intégration

```typescript
describe('Analytics Integration', () => {
  it('should track and retrieve events', async () => {
    // Track event
    await trackStepCompleted('user-123', 'payments', 5000);
    
    // Retrieve stats
    const stats = await getUserEventStats('user-123');
    
    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.eventsByType['onboarding.step_completed']).toBeDefined();
  });
});
```

## Exemples Complets

### Exemple 1: API Route avec Tracking

```typescript
// app/api/onboarding/steps/[id]/route.ts
import { trackStepCompleted } from '@/lib/services/onboarding-analytics';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const { status } = await req.json();
  const startTime = Date.now();
  
  // Update step status
  await updateStepStatus(user.id, params.id, status);
  
  // Track completion
  if (status === 'done') {
    const duration = Date.now() - startTime;
    await trackStepCompleted(
      user.id,
      params.id,
      duration,
      { correlationId: req.headers.get('x-correlation-id') }
    );
  }
  
  return Response.json({ success: true });
}
```

### Exemple 2: Middleware avec Gating

```typescript
// lib/middleware/onboarding-gating.ts
import { trackGatingBlocked } from '@/lib/services/onboarding-analytics';

export function requireStep(stepId: string) {
  return async (req: Request) => {
    const user = await requireUser();
    const correlationId = crypto.randomUUID();
    
    const isComplete = await hasStepDone(user.id, stepId);
    
    if (!isComplete) {
      // Track gating event
      await trackGatingBlocked(
        user.id,
        req.url,
        stepId,
        { correlationId }
      );
      
      return Response.json({
        error: 'PRECONDITION_REQUIRED',
        missingStep: stepId,
        correlationId
      }, { status: 409 });
    }
  };
}
```

### Exemple 3: Dashboard Analytics

```typescript
// app/api/analytics/onboarding/route.ts
import { getUserEventStats } from '@/lib/services/onboarding-analytics';

export async function GET(req: Request) {
  const user = await requireUser();
  
  // Get user's event statistics
  const stats = await getUserEventStats(user.id);
  
  return Response.json({
    totalEvents: stats.totalEvents,
    completions: stats.eventsByType['onboarding.step_completed'] || 0,
    skips: stats.eventsByType['onboarding.step_skipped'] || 0,
    lastActivity: stats.lastEventAt
  });
}
```

## Références

- [Shopify-Style Onboarding Spec](../../.kiro/specs/shopify-style-onboarding/)
- [Onboarding Events Repository](../db/repositories/onboarding-events.ts)
- [API Integration Tests](../../tests/integration/api/onboarding.test.ts)
- [GDPR Compliance Guide](../../docs/gdpr-compliance.md)

## Support

Pour questions ou problèmes:
1. Consulter cette documentation
2. Vérifier les logs avec correlation IDs
3. Consulter les tests d'intégration
4. Contacter l'équipe Platform

---

**Dernière mise à jour:** 2024-11-11  
**Version:** 1.0.0  
**Statut:** ✅ Production Ready
