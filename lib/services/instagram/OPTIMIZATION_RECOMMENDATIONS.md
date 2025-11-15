# Instagram OAuth Service - Recommandations d'Optimisation

## ✅ Implémentation Actuelle - Excellente

Le service `instagramOAuth-optimized.ts` est très bien implémenté avec :
- Gestion d'erreurs structurée
- Retry avec exponential backoff
- Circuit breaker pattern
- Token management avec auto-refresh
- Logging complet
- Types TypeScript complets

## 🔧 Améliorations Recommandées

### 1. Persistance des Tokens

**Problème Actuel** : Les tokens sont stockés en mémoire (`Map`), perdus au redémarrage.

**Solution** :
```typescript
// lib/services/instagram/token-store.ts
import { Redis } from '@upstash/redis';

export class TokenStore {
  private redis: Redis;
  
  constructor() {
    this.redis = Redis.fromEnv();
  }
  
  async storeToken(userId: string, tokenData: TokenData): Promise<void> {
    const key = `instagram:token:${userId}`;
    const ttl = Math.floor((tokenData.expiresAt - Date.now()) / 1000);
    
    await this.redis.setex(key, ttl, JSON.stringify(tokenData));
  }
  
  async getToken(userId: string): Promise<TokenData | null> {
    const key = `instagram:token:${userId}`;
    const data = await this.redis.get(key);
    
    return data ? JSON.parse(data as string) : null;
  }
  
  async deleteToken(userId: string): Promise<void> {
    await this.redis.del(`instagram:token:${userId}`);
  }
}
```

### 2. Rate Limiting Proactif

**Ajout** : Tracking des limites Facebook API

```typescript
// lib/services/instagram/rate-limiter.ts
export class InstagramRateLimiter {
  private callsPerHour: Map<string, number[]> = new Map();
  private readonly MAX_CALLS_PER_HOUR = 200; // Facebook limit
  
  canMakeCall(endpoint: string): boolean {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    const calls = this.callsPerHour.get(endpoint) || [];
    const recentCalls = calls.filter(time => time > hourAgo);
    
    return recentCalls.length < this.MAX_CALLS_PER_HOUR;
  }
  
  recordCall(endpoint: string): void {
    const now = Date.now();
    const calls = this.callsPerHour.get(endpoint) || [];
    calls.push(now);
    this.callsPerHour.set(endpoint, calls);
  }
  
  getCallsRemaining(endpoint: string): number {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const calls = this.callsPerHour.get(endpoint) || [];
    const recentCalls = calls.filter(time => time > hourAgo);
    
    return this.MAX_CALLS_PER_HOUR - recentCalls.length;
  }
}
```

### 3. Timeout Configuration

**Ajout** : Timeout pour les requêtes fetch

```typescript
private async fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw this.createError(
        InstagramErrorType.NETWORK_ERROR,
        'Request timeout',
        this.generateCorrelationId()
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 4. Métriques de Performance

**Ajout** : Tracking des performances API

```typescript
// lib/services/instagram/metrics.ts
export class InstagramMetrics {
  private metrics: Map<string, {
    calls: number;
    errors: number;
    totalDuration: number;
    avgDuration: number;
  }> = new Map();
  
  recordCall(endpoint: string, duration: number, success: boolean): void {
    const current = this.metrics.get(endpoint) || {
      calls: 0,
      errors: 0,
      totalDuration: 0,
      avgDuration: 0,
    };
    
    current.calls++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.calls;
    
    if (!success) {
      current.errors++;
    }
    
    this.metrics.set(endpoint, current);
  }
  
  getMetrics(endpoint: string) {
    return this.metrics.get(endpoint);
  }
  
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }
  
  getErrorRate(endpoint: string): number {
    const metrics = this.metrics.get(endpoint);
    if (!metrics || metrics.calls === 0) return 0;
    
    return (metrics.errors / metrics.calls) * 100;
  }
}
```

### 5. Webhook Validation

**Ajout** : Validation des webhooks Instagram

```typescript
// lib/services/instagram/webhook-validator.ts
import crypto from 'crypto';

export class InstagramWebhookValidator {
  private appSecret: string;
  
  constructor(appSecret: string) {
    this.appSecret = appSecret;
  }
  
  validateSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(payload)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }
  
  verifyChallenge(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    
    return null;
  }
}
```

### 6. Batch Operations

**Ajout** : Support pour les opérations batch

```typescript
async batchGetAccountDetails(
  igBusinessIds: string[],
  accessToken: string
): Promise<InstagramAccountDetails[]> {
  const correlationId = this.generateCorrelationId();
  
  instagramLogger.info('Batch getting account details', {
    correlationId,
    count: igBusinessIds.length,
  });
  
  // Facebook Graph API batch request
  const batch = igBusinessIds.map((id, index) => ({
    method: 'GET',
    relative_url: `/${id}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count`,
  }));
  
  return this.retryApiCall(async () => {
    const response = await fetch(
      `${FACEBOOK_GRAPH_URL}?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Instagram-OAuth-Client/2.0',
        },
        body: JSON.stringify({ batch }),
        cache: 'no-store',
      }
    );
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw this.handleFacebookError(data, response.status, correlationId);
    }
    
    return data.map((item: any) => JSON.parse(item.body));
  }, 'Batch account details', correlationId);
}
```

### 7. Health Check Endpoint

**Ajout** : Endpoint pour vérifier la santé du service

```typescript
async healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    credentials: boolean;
    circuitBreaker: string;
    tokenStore: number;
  };
}> {
  const correlationId = this.generateCorrelationId();
  
  try {
    // Check credentials
    await this.validateCredentials(correlationId);
    
    // Check circuit breaker
    const cbStats = this.circuitBreaker.getStats();
    
    return {
      status: cbStats.state === 'OPEN' ? 'degraded' : 'healthy',
      checks: {
        credentials: true,
        circuitBreaker: cbStats.state,
        tokenStore: this.tokenStore.size,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks: {
        credentials: false,
        circuitBreaker: this.circuitBreaker.getStats().state,
        tokenStore: this.tokenStore.size,
      },
    };
  }
}
```

### 8. Request Deduplication

**Ajout** : Éviter les requêtes dupliquées

```typescript
private pendingRequests: Map<string, Promise<any>> = new Map();

private async deduplicateRequest<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  const pending = this.pendingRequests.get(key);
  if (pending) {
    instagramLogger.debug('Deduplicating request', { key });
    return pending;
  }
  
  // Execute and cache promise
  const promise = operation();
  this.pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up after 1 second
    setTimeout(() => {
      this.pendingRequests.delete(key);
    }, 1000);
  }
}

// Usage in getAccountInfo
async getAccountInfo(accessToken: string): Promise<InstagramAccountInfo> {
  const key = `account-info:${accessToken.substring(0, 10)}`;
  
  return this.deduplicateRequest(key, async () => {
    // ... existing implementation
  });
}
```

### 9. Monitoring Dashboard Data

**Ajout** : Méthodes pour dashboard de monitoring

```typescript
getServiceStats() {
  return {
    circuitBreaker: this.circuitBreaker.getStats(),
    tokenStore: {
      size: this.tokenStore.size,
      tokens: Array.from(this.tokenStore.entries()).map(([userId, data]) => ({
        userId,
        expiresAt: new Date(data.expiresAt).toISOString(),
        expiresIn: Math.floor((data.expiresAt - Date.now()) / 1000),
        needsRefresh: this.shouldRefreshToken(userId),
      })),
    },
    validationCache: {
      size: this.validationCache.size,
    },
  };
}
```

### 10. Error Recovery Strategies

**Ajout** : Stratégies de récupération automatique

```typescript
async recoverFromError(error: InstagramError, userId?: string): Promise<void> {
  const correlationId = this.generateCorrelationId();
  
  instagramLogger.info('Attempting error recovery', {
    correlationId,
    errorType: error.type,
    userId,
  });
  
  switch (error.type) {
    case InstagramErrorType.TOKEN_EXPIRED:
      if (userId) {
        // Try to refresh token
        const tokenData = this.tokenStore.get(userId);
        if (tokenData) {
          try {
            await this.refreshLongLivedToken(tokenData.token);
            instagramLogger.info('Token refreshed during recovery', {
              correlationId,
              userId,
            });
          } catch (refreshError) {
            instagramLogger.error('Token refresh failed during recovery', refreshError as Error, {
              correlationId,
              userId,
            });
            // Clear invalid token
            this.clearToken(userId);
          }
        }
      }
      break;
      
    case InstagramErrorType.RATE_LIMIT_ERROR:
      // Wait and reset circuit breaker
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
      this.resetCircuitBreaker();
      instagramLogger.info('Circuit breaker reset after rate limit', {
        correlationId,
      });
      break;
      
    default:
      instagramLogger.warn('No recovery strategy for error type', {
        correlationId,
        errorType: error.type,
      });
  }
}
```

## 📊 Métriques à Suivre

1. **Performance**
   - Temps de réponse moyen par endpoint
   - P95, P99 latency
   - Taux de succès/échec

2. **Tokens**
   - Nombre de tokens actifs
   - Taux de refresh
   - Tokens expirés

3. **Circuit Breaker**
   - État actuel (CLOSED/OPEN/HALF_OPEN)
   - Nombre de failures
   - Temps en état OPEN

4. **Rate Limiting**
   - Appels restants par heure
   - Taux d'utilisation
   - Rejets pour rate limit

## 🧪 Tests à Ajouter

1. **Tests d'Intégration**
   - OAuth flow complet
   - Token refresh automatique
   - Circuit breaker behavior

2. **Tests de Charge**
   - Concurrent requests
   - Rate limiting
   - Token store performance

3. **Tests de Résilience**
   - Network failures
   - API errors
   - Token expiration

## 📝 Documentation à Compléter

1. **Guide d'Utilisation**
   - Exemples de code
   - Cas d'usage courants
   - Troubleshooting

2. **API Reference**
   - Tous les endpoints
   - Paramètres et réponses
   - Codes d'erreur

3. **Architecture**
   - Diagrammes de flux
   - Décisions de design
   - Patterns utilisés

## 🚀 Prochaines Étapes

1. ✅ Implémenter la persistance des tokens (Redis)
2. ✅ Ajouter le rate limiting proactif
3. ✅ Implémenter les timeouts
4. ✅ Ajouter les métriques de performance
5. ✅ Créer le health check endpoint
6. ✅ Écrire les tests d'intégration
7. ✅ Documenter l'API complète

## 🎯 Priorités

**Haute Priorité** :
- Persistance des tokens (production-critical)
- Timeouts (éviter les hangs)
- Health check (monitoring)

**Moyenne Priorité** :
- Rate limiting proactif
- Métriques de performance
- Request deduplication

**Basse Priorité** :
- Batch operations
- Webhook validation
- Error recovery strategies

---

**Note** : L'implémentation actuelle est déjà excellente et production-ready. Ces recommandations sont des améliorations pour des cas d'usage avancés et une meilleure observabilité.
