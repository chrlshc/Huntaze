# OnlyFans AI Memory API - Integration Guide

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Gestion des erreurs](#gestion-des-erreurs)
4. [Retry Strategies](#retry-strategies)
5. [Circuit Breaker](#circuit-breaker)
6. [Types TypeScript](#types-typescript)
7. [Authentification](#authentification)
8. [Optimisations](#optimisations)
9. [Logging & Debugging](#logging--debugging)
10. [Endpoints API](#endpoints-api)

---

## Vue d'ensemble

Le système OnlyFans AI Memory fournit une API robuste pour gérer la mémoire contextuelle des interactions fan-créateur avec :

- ✅ **Circuit Breaker** pour la résilience
- ✅ **Retry automatique** avec exponential backoff
- ✅ **Cache Redis** avec stratégie cache-first
- ✅ **Timeouts** configurables
- ✅ **Graceful degradation** sur erreurs
- ✅ **Types TypeScript** complets
- ✅ **Logging structuré** avec correlation IDs
- ✅ **GDPR compliance**

---

## Architecture

### Flux de données

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              UserMemoryService (Orchestration)           │
│  - Input validation                                      │
│  - Correlation ID generation                             │
│  - Error handling                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                     ↓
┌──────────────────┐              ┌──────────────────────┐
│  Cache Layer     │              │  Database Layer      │
│  (Redis)         │              │  (PostgreSQL)        │
│                  │              │                      │
│  Circuit Breaker │              │  Circuit Breaker     │
│  Retry Logic     │              │  Retry Logic         │
│  Timeout: 3s     │              │  Timeout: 5s         │
└──────────────────┘              └──────────────────────┘
        ↓                                     ↓
┌─────────────────────────────────────────────────────────┐
│              Aggregated Memory Context                   │
│  - Recent messages                                       │
│  - Personality profile                                   │
│  - Preferences                                           │
│  - Emotional state                                       │
│  - Engagement metrics                                    │
└─────────────────────────────────────────────────────────┘
```

### Couches de protection

1. **Input Validation** - Validation des paramètres
2. **Circuit Breaker** - Protection contre les cascades de pannes
3. **Retry Logic** - Gestion des erreurs transitoires
4. **Timeout** - Prévention des requêtes bloquées
5. **Graceful Degradation** - Retour de données minimales sur erreur

---

## Gestion des erreurs

### Types d'erreurs

```typescript
export enum MemoryServiceError {
  CACHE_ERROR = 'CACHE_ERROR',        // Erreur Redis
  DATABASE_ERROR = 'DATABASE_ERROR',  // Erreur PostgreSQL
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Paramètres invalides
  NOT_FOUND = 'NOT_FOUND',           // Ressource introuvable
  TIMEOUT = 'TIMEOUT'                // Timeout dépassé
}
```

### Classe d'erreur personnalisée

```typescript
export class MemoryServiceException extends Error {
  constructor(
    public type: MemoryServiceError,
    message: string,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MemoryServiceException';
  }
}
```

### Gestion des erreurs par endpoint

#### GET Memory Context

```typescript
try {
  const context = await userMemoryService.getMemoryContext(fanId, creatorId);
  return Response.json(context);
} catch (error) {
  if (error instanceof MemoryServiceException) {
    switch (error.type) {
      case MemoryServiceError.VALIDATION_ERROR:
        return Response.json(
          { error: error.message, correlationId: error.context?.correlationId },
          { status: 400 }
        );
      case MemoryServiceError.NOT_FOUND:
        return Response.json(
          { error: 'Fan not found', correlationId: error.context?.correlationId },
          { status: 404 }
        );
      case MemoryServiceError.TIMEOUT:
        return Response.json(
          { error: 'Request timeout', correlationId: error.context?.correlationId },
          { status: 504 }
        );
      default:
        return Response.json(
          { error: 'Internal server error', correlationId: error.context?.correlationId },
          { status: 500 }
        );
    }
  }
  
  // Erreur inconnue
  return Response.json(
    { error: 'Unexpected error' },
    { status: 500 }
  );
}
```

---

## Retry Strategies

### Configuration

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,        // Nombre maximum de tentatives
  initialDelay: 100,     // Délai initial (ms)
  maxDelay: 2000,        // Délai maximum (ms)
  backoffFactor: 2       // Facteur d'augmentation
};
```

### Algorithme

1. **Exponential Backoff** : Délai × 2 à chaque tentative
2. **Jitter** : +/- 30% aléatoire pour éviter thundering herd
3. **Max Delay Cap** : Plafonné à 2 secondes

### Exemple de séquence

```
Tentative 1: Échec → Attendre 100ms + jitter (70-130ms)
Tentative 2: Échec → Attendre 200ms + jitter (140-260ms)
Tentative 3: Échec → Lever l'erreur
```

### Implémentation

```typescript
private async withRetry<T>(
  fn: () => Promise<T>,
  operation: string,
  context: Record<string, any>
): Promise<T> {
  let lastError: Error | undefined;
  let delay = RETRY_CONFIG.initialDelay;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === RETRY_CONFIG.maxAttempts) {
        console.error(`Operation failed after ${attempt} attempts`, {
          operation,
          error: lastError.message,
          ...context
        });
        throw lastError;
      }

      // Jitter pour éviter thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const waitTime = Math.min(delay + jitter, RETRY_CONFIG.maxDelay);

      console.warn(`Retry attempt ${attempt}/${RETRY_CONFIG.maxAttempts}`, {
        operation,
        error: lastError.message,
        waitTime,
        ...context
      });

      await new Promise(resolve => setTimeout(resolve, waitTime));
      delay *= RETRY_CONFIG.backoffFactor;
    }
  }

  throw lastError;
}
```

---

## Circuit Breaker

### Configuration

```typescript
// Database Circuit Breaker
private dbCircuitBreaker = circuitBreakerRegistry.getOrCreate('memory-database', {
  failureThreshold: 5,      // Ouvrir après 5 échecs
  resetTimeout: 60000,      // Réessayer après 60s
  monitoringPeriod: 10000   // Fenêtre de 10s
});

// Cache Circuit Breaker
private cacheCircuitBreaker = circuitBreakerRegistry.getOrCreate('memory-cache', {
  failureThreshold: 3,      // Ouvrir après 3 échecs
  resetTimeout: 30000,      // Réessayer après 30s
  monitoringPeriod: 5000    // Fenêtre de 5s
});
```

### États du Circuit Breaker

1. **CLOSED** (Normal)
   - Toutes les requêtes passent
   - Compteur d'échecs actif

2. **OPEN** (Circuit ouvert)
   - Requêtes bloquées immédiatement
   - Fallback exécuté
   - Attente du resetTimeout

3. **HALF_OPEN** (Test)
   - Une requête test autorisée
   - Si succès → CLOSED
   - Si échec → OPEN

### Utilisation

```typescript
// Opération database avec fallback
const data = await this.withDatabaseCircuitBreaker(
  () => memoryRepository.getData(fanId),
  async () => {
    // Fallback: retourner données par défaut
    console.warn('Database circuit breaker open, using defaults');
    return getDefaultData();
  }
);

// Opération cache avec fallback
const cached = await this.withCacheCircuitBreaker(
  () => memoryCache.get(key),
  async () => {
    // Fallback: skip cache
    console.warn('Cache circuit breaker open, skipping cache');
    return null;
  }
);
```

### Monitoring

```typescript
// Obtenir les statistiques
const stats = userMemoryService.getCircuitBreakerStats();

console.log('Circuit Breaker Stats:', {
  database: {
    state: stats.database.state,           // CLOSED | OPEN | HALF_OPEN
    failures: stats.database.failures,     // Nombre d'échecs
    successes: stats.database.successes,   // Nombre de succès
    lastFailure: stats.database.lastFailure
  },
  cache: {
    state: stats.cache.state,
    failures: stats.cache.failures,
    successes: stats.cache.successes,
    lastFailure: stats.cache.lastFailure
  }
});
```

---

## Types TypeScript

### Interfaces principales

```typescript
// Contexte mémoire complet
interface MemoryContext {
  fanId: string;
  creatorId: string;
  recentMessages: ConversationMessage[];
  personalityProfile: PersonalityProfile;
  preferences: FanPreferences;
  emotionalState: EmotionalState;
  engagementMetrics: EngagementMetrics;
  lastInteraction: Date;
}

// Message de conversation
interface ConversationMessage {
  id: string;
  fanId: string;
  creatorId: string;
  content: string;
  sender: 'fan' | 'creator';
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics: string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Profil de personnalité
interface PersonalityProfile {
  fanId: string;
  tone: 'formal' | 'casual' | 'friendly' | 'flirty';
  emojiFrequency: number; // 0-1
  messageLengthPreference: 'short' | 'medium' | 'long';
  punctuationStyle: 'minimal' | 'casual' | 'formal';
  preferredEmojis: string[];
  responseSpeed: 'instant' | 'quick' | 'moderate' | 'slow' | 'variable';
  confidenceScore: number; // 0-1
  lastCalibrated: Date;
  interactionCount: number;
}

// Préférences du fan
interface FanPreferences {
  fanId: string;
  contentPreferences: Record<string, number>; // type → score
  topicInterests: Record<string, number>; // topic → score
  purchasePatterns: string[];
  communicationPreferences: {
    preferredResponseTime?: string;
    messageFrequency?: string;
    preferredMessageLength?: string;
    likesEmojis?: boolean;
    likesGifs?: boolean;
  };
  lastUpdated: Date;
}

// État émotionnel
interface EmotionalState {
  currentSentiment: 'positive' | 'neutral' | 'negative';
  sentimentHistory: Array<{
    sentiment: string;
    timestamp: Date;
  }>;
  dominantEmotions: string[];
  engagementLevel: 'high' | 'medium' | 'low';
  lastPositiveInteraction: Date | null;
  lastNegativeInteraction: Date | null;
}

// Métriques d'engagement
interface EngagementMetrics {
  fanId: string;
  creatorId: string;
  engagementScore: number; // 0-1
  totalMessages: number;
  totalPurchases: number;
  totalRevenue: number;
  avgResponseTimeSeconds: number | null;
  lastInteraction: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Événement d'interaction
interface InteractionEvent {
  fanId: string;
  creatorId: string;
  type: 'message' | 'purchase' | 'tip' | 'like' | 'view';
  content?: string;
  amount?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}
```

### Types de réponse API

```typescript
// Succès
interface SuccessResponse<T> {
  data: T;
  correlationId: string;
  timestamp: string;
}

// Erreur
interface ErrorResponse {
  error: string;
  type?: MemoryServiceError;
  correlationId?: string;
  details?: string;
}
```

---

## Authentification

### JWT Token

Toutes les requêtes API nécessitent un JWT token valide :

```typescript
// Headers requis
const headers = {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
};
```

### Validation

```typescript
import { requireUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  try {
    // Valider l'authentification
    const user = await requireUser();
    
    // Vérifier les permissions
    if (!user.creatorId) {
      return Response.json(
        { error: 'Creator access required' },
        { status: 403 }
      );
    }
    
    // Continuer avec la logique
    const context = await userMemoryService.getMemoryContext(
      fanId,
      user.creatorId
    );
    
    return Response.json({ data: context });
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    throw error;
  }
}
```

---

## Optimisations

### 1. Cache-First Strategy

```typescript
// Toujours vérifier le cache en premier
const cached = await memoryCache.getMemoryContext(fanId, creatorId);
if (cached) {
  return cached; // ~10-50ms
}

// Sinon, fetch depuis la DB
const data = await memoryRepository.getData(fanId, creatorId); // ~200-500ms
await memoryCache.set(key, data, TTL);
return data;
```

### 2. Parallel Fetching

```typescript
// Fetch multiple data sources en parallèle
const [messages, profile, preferences, state, metrics] = await Promise.all([
  memoryRepository.getRecentMessages(fanId, creatorId, 50),
  memoryRepository.getPersonalityProfile(fanId, creatorId),
  memoryRepository.getPreferences(fanId, creatorId),
  memoryRepository.getEmotionalState(fanId, creatorId),
  memoryRepository.getEngagementMetrics(fanId, creatorId)
]);
```

### 3. Batch Operations

```typescript
// Fetch pour plusieurs fans en batch
const contexts = await userMemoryService.getMemoriesForFans(
  ['fan1', 'fan2', 'fan3'],
  creatorId
);

// Traitement par batch de 10
const batchSize = 10;
for (let i = 0; i < fanIds.length; i += batchSize) {
  const batch = fanIds.slice(i, i + batchSize);
  await processBatch(batch);
}
```

### 4. Non-Blocking Cache Writes

```typescript
// Ne pas attendre l'écriture cache
memoryCache.set(key, data, TTL).catch(error => {
  console.warn('Cache write failed:', error);
  // Continue sans bloquer
});

return data; // Retourner immédiatement
```

### 5. Timeouts

```typescript
// Timeout sur les opérations lentes
const data = await this.withTimeout(
  memoryRepository.getRecentMessages(fanId, creatorId, 50),
  5000, // 5 secondes max
  'getRecentMessages'
);
```

### Performance Targets

| Opération | Target | Avec Cache | Sans Cache |
|-----------|--------|------------|------------|
| Get Memory Context | < 100ms | 10-50ms | 200-500ms |
| Save Interaction | < 200ms | N/A | 100-300ms |
| Get Engagement Score | < 50ms | 10-20ms | 50-100ms |
| Bulk Operations (10 fans) | < 1s | 100-500ms | 2-5s |

---

## Logging & Debugging

### Structured Logging

Tous les logs incluent :

```typescript
{
  timestamp: '2024-11-12T10:30:00Z',
  level: 'info' | 'warn' | 'error',
  service: 'UserMemoryService',
  operation: 'getMemoryContext',
  correlationId: 'uuid-v4',
  fanId: 'fan_123',
  creatorId: 'creator_456',
  duration: 150, // ms
  error?: string,
  stack?: string
}
```

### Correlation IDs

Chaque requête génère un correlation ID unique :

```typescript
const correlationId = crypto.randomUUID();

console.log('[UserMemoryService] Operation started', {
  operation: 'getMemoryContext',
  fanId,
  creatorId,
  correlationId
});

// ... opération ...

console.log('[UserMemoryService] Operation completed', {
  operation: 'getMemoryContext',
  fanId,
  creatorId,
  duration: Date.now() - startTime,
  correlationId
});
```

### Niveaux de log

1. **INFO** - Opérations normales
   ```typescript
   console.log('[UserMemoryService] Cache hit', { fanId, correlationId });
   ```

2. **WARN** - Erreurs non-critiques
   ```typescript
   console.warn('[UserMemoryService] Cache write failed', { 
     error: error.message,
     correlationId 
   });
   ```

3. **ERROR** - Erreurs critiques
   ```typescript
   console.error('[UserMemoryService] Database error', {
     error: error.message,
     stack: error.stack,
     correlationId
   });
   ```

### Debugging

```bash
# Filtrer par correlation ID
grep "correlationId: abc-123" logs.txt

# Filtrer par opération
grep "getMemoryContext" logs.txt

# Filtrer par erreur
grep "ERROR" logs.txt | grep "UserMemoryService"

# Suivre une requête complète
grep "correlationId: abc-123" logs.txt | jq .
```

---

## Endpoints API

### GET /api/of-memory/context

Récupère le contexte mémoire complet pour un fan.

**Request:**
```http
GET /api/of-memory/context?fanId=fan_123&creatorId=creator_456
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "fanId": "fan_123",
    "creatorId": "creator_456",
    "recentMessages": [...],
    "personalityProfile": {...},
    "preferences": {...},
    "emotionalState": {...},
    "engagementMetrics": {...},
    "lastInteraction": "2024-11-12T10:00:00Z"
  },
  "correlationId": "uuid-v4",
  "timestamp": "2024-11-12T10:30:00Z"
}
```

**Errors:**
- `400` - Paramètres invalides
- `401` - Non authentifié
- `403` - Accès refusé
- `404` - Fan non trouvé
- `504` - Timeout
- `500` - Erreur serveur

---

### POST /api/of-memory/interaction

Enregistre une nouvelle interaction.

**Request:**
```http
POST /api/of-memory/interaction
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fanId": "fan_123",
  "creatorId": "creator_456",
  "type": "message",
  "content": "Hello!",
  "timestamp": "2024-11-12T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "correlationId": "uuid-v4",
  "timestamp": "2024-11-12T10:30:00Z"
}
```

---

### DELETE /api/of-memory/clear

Supprime toutes les données d'un fan (GDPR).

**Request:**
```http
DELETE /api/of-memory/clear?fanId=fan_123&creatorId=creator_456
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Memory cleared successfully",
  "correlationId": "uuid-v4"
}
```

---

### GET /api/of-memory/engagement-score

Récupère le score d'engagement d'un fan.

**Request:**
```http
GET /api/of-memory/engagement-score?fanId=fan_123&creatorId=creator_456
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "fanId": "fan_123",
    "creatorId": "creator_456",
    "score": 0.85,
    "lastUpdated": "2024-11-12T10:00:00Z"
  },
  "correlationId": "uuid-v4"
}
```

---

### POST /api/of-memory/bulk

Récupère les contextes pour plusieurs fans.

**Request:**
```http
POST /api/of-memory/bulk
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fanIds": ["fan_1", "fan_2", "fan_3"],
  "creatorId": "creator_456"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "fan_1": {...},
    "fan_2": {...},
    "fan_3": {...}
  },
  "correlationId": "uuid-v4",
  "count": 3
}
```

---

## Exemples d'utilisation

### Client TypeScript

```typescript
import { MemoryContext, InteractionEvent } from '@/lib/of-memory/types';

class MemoryAPIClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getMemoryContext(
    fanId: string,
    creatorId: string
  ): Promise<MemoryContext> {
    const response = await fetch(
      `${this.baseUrl}/api/of-memory/context?fanId=${fanId}&creatorId=${creatorId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch memory context');
    }

    const { data } = await response.json();
    return data;
  }

  async saveInteraction(interaction: InteractionEvent): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/of-memory/interaction`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interaction)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save interaction');
    }
  }

  async getEngagementScore(
    fanId: string,
    creatorId: string
  ): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/api/of-memory/engagement-score?fanId=${fanId}&creatorId=${creatorId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch engagement score');
    }

    const { data } = await response.json();
    return data.score;
  }
}

// Usage
const client = new MemoryAPIClient('https://api.example.com', jwtToken);

try {
  const context = await client.getMemoryContext('fan_123', 'creator_456');
  console.log('Memory context:', context);
  
  await client.saveInteraction({
    fanId: 'fan_123',
    creatorId: 'creator_456',
    type: 'message',
    content: 'Hello!',
    timestamp: new Date()
  });
  
  const score = await client.getEngagementScore('fan_123', 'creator_456');
  console.log('Engagement score:', score);
} catch (error) {
  console.error('API error:', error);
}
```

---

## Monitoring & Alertes

### Métriques à surveiller

1. **Latence**
   - p50, p95, p99 pour chaque endpoint
   - Target: p95 < 200ms

2. **Taux d'erreur**
   - Par type d'erreur
   - Target: < 1%

3. **Circuit Breaker**
   - État (OPEN/CLOSED/HALF_OPEN)
   - Nombre de trips
   - Target: < 5 trips/heure

4. **Cache Hit Rate**
   - Ratio cache hits / total requests
   - Target: > 80%

5. **Retry Rate**
   - Nombre de retries / total requests
   - Target: < 5%

### Alertes recommandées

```yaml
# Taux d'erreur élevé
- alert: HighErrorRate
  expr: rate(memory_api_errors_total[5m]) > 0.01
  for: 5m
  annotations:
    summary: "High error rate in Memory API"

# Circuit breaker ouvert
- alert: CircuitBreakerOpen
  expr: memory_circuit_breaker_state{state="open"} == 1
  for: 1m
  annotations:
    summary: "Circuit breaker is open"

# Latence élevée
- alert: HighLatency
  expr: histogram_quantile(0.95, memory_api_duration_seconds) > 0.5
  for: 5m
  annotations:
    summary: "High API latency (p95 > 500ms)"

# Cache hit rate faible
- alert: LowCacheHitRate
  expr: rate(memory_cache_hits_total[5m]) / rate(memory_cache_requests_total[5m]) < 0.8
  for: 10m
  annotations:
    summary: "Low cache hit rate (< 80%)"
```

---

## Troubleshooting

### Problème: Timeouts fréquents

**Symptômes:**
- Erreurs `TIMEOUT` dans les logs
- Latence > 5s

**Solutions:**
1. Vérifier la charge database
2. Augmenter les timeouts si nécessaire
3. Optimiser les requêtes SQL
4. Ajouter des index

### Problème: Circuit breaker ouvert

**Symptômes:**
- État `OPEN` dans les stats
- Fallbacks exécutés

**Solutions:**
1. Identifier la cause des échecs
2. Vérifier la connectivité DB/Redis
3. Augmenter le `failureThreshold` si nécessaire
4. Réduire le `resetTimeout` pour tester plus vite

### Problème: Cache hit rate faible

**Symptômes:**
- < 80% de cache hits
- Latence élevée

**Solutions:**
1. Augmenter le TTL du cache
2. Vérifier que le cache est bien écrit
3. Vérifier la mémoire Redis
4. Optimiser les clés de cache

### Problème: Erreurs de validation

**Symptômes:**
- Erreurs `VALIDATION_ERROR`
- Status 400

**Solutions:**
1. Vérifier les paramètres envoyés
2. Valider les types TypeScript
3. Ajouter des logs de debug
4. Vérifier la documentation API

---

## Références

- [Circuit Breaker Pattern](../circuit-breaker-pattern.md)
- [OnlyFans AI Memory Spec](.kiro/specs/onlyfans-ai-user-memory/)
- [API Types](../../lib/of-memory/types.ts)
- [Integration Tests](../../tests/integration/api/of-memory.test.ts)

---

**Dernière mise à jour:** 2024-11-12  
**Version:** 1.0.0  
**Maintainer:** Platform Team
