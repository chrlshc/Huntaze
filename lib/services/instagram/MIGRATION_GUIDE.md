# Instagram OAuth Service - Migration Guide

## 🎯 Objectif

Ce guide vous aide à migrer le service Instagram OAuth existant vers la nouvelle architecture optimisée avec logger centralisé, circuit breaker, et types d'erreurs structurés.

## 📋 Checklist de Migration

- [ ] Phase 1: Intégrer le logger
- [ ] Phase 2: Intégrer les types d'erreurs
- [ ] Phase 3: Intégrer le circuit breaker
- [ ] Phase 4: Tests et validation
- [ ] Phase 5: Déploiement

## Phase 1: Intégrer le Logger

### Étape 1.1: Importer le Logger

**Fichier:** `lib/services/instagramOAuth.ts`

```typescript
// Ajouter en haut du fichier
import { instagramLogger } from './instagram/logger';
```

### Étape 1.2: Remplacer console.log

**Avant:**
```typescript
console.warn(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
```

**Après:**
```typescript
instagramLogger.warn(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms`, {
  error: lastError.message,
  attempt,
  delay,
  correlationId: this.generateCorrelationId(),
});
```

### Étape 1.3: Remplacer console.error

**Avant:**
```typescript
console.error(`${operationName} failed after ${maxRetries} attempts:`, lastError);
```

**Après:**
```typescript
instagramLogger.error(`${operationName} failed after ${maxRetries} attempts`, lastError, {
  maxRetries,
  correlationId: this.generateCorrelationId(),
});
```

### Étape 1.4: Ajouter Correlation IDs

```typescript
private generateCorrelationId(): string {
  return instagramLogger.generateCorrelationId();
}
```

## Phase 2: Intégrer les Types d'Erreurs

### Étape 2.1: Importer les Types

```typescript
import { 
  InstagramError, 
  InstagramErrorType,
  FacebookErrorResponse 
} from './instagram/types';
```

### Étape 2.2: Créer une Méthode de Conversion

```typescript
private createError(
  type: InstagramErrorType,
  message: string,
  statusCode?: number,
  originalError?: Error
): InstagramError {
  const correlationId = this.generateCorrelationId();
  
  const userMessages: Record<InstagramErrorType, string> = {
    [InstagramErrorType.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.',
    [InstagramErrorType.AUTH_ERROR]: 'Authentication failed. Please reconnect your Instagram account.',
    [InstagramErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment and try again.',
    [InstagramErrorType.TOKEN_EXPIRED]: 'Your Instagram connection has expired. Please reconnect.',
    [InstagramErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
    [InstagramErrorType.API_ERROR]: 'Instagram API error. Please try again later.',
    [InstagramErrorType.PERMISSION_ERROR]: 'Missing permissions. Please reconnect with required permissions.',
  };
  
  return {
    type,
    message,
    userMessage: userMessages[type],
    retryable: this.isRetryable(type),
    correlationId,
    statusCode,
    originalError,
    timestamp: new Date().toISOString(),
  };
}

private isRetryable(type: InstagramErrorType): boolean {
  return [
    InstagramErrorType.NETWORK_ERROR,
    InstagramErrorType.API_ERROR,
    InstagramErrorType.RATE_LIMIT_ERROR,
  ].includes(type);
}
```

### Étape 2.3: Remplacer les Throws

**Avant:**
```typescript
if (response.status === 429) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

**Après:**
```typescript
if (response.status === 429) {
  throw this.createError(
    InstagramErrorType.RATE_LIMIT_ERROR,
    'Rate limit exceeded',
    429
  );
}
```

### Étape 2.4: Gérer les Erreurs Facebook

```typescript
private handleFacebookError(
  data: FacebookErrorResponse,
  statusCode: number
): InstagramError {
  const { error } = data;
  
  // Token expired
  if (error.code === 190) {
    return this.createError(
      InstagramErrorType.TOKEN_EXPIRED,
      error.message,
      statusCode
    );
  }
  
  // Rate limit
  if (statusCode === 429) {
    return this.createError(
      InstagramErrorType.RATE_LIMIT_ERROR,
      error.message,
      statusCode
    );
  }
  
  // Auth error
  if (statusCode === 401 || statusCode === 403) {
    return this.createError(
      InstagramErrorType.AUTH_ERROR,
      error.message,
      statusCode
    );
  }
  
  // Validation error
  if (statusCode === 400) {
    return this.createError(
      InstagramErrorType.VALIDATION_ERROR,
      error.message,
      statusCode
    );
  }
  
  // Generic API error
  return this.createError(
    InstagramErrorType.API_ERROR,
    error.message,
    statusCode
  );
}
```

## Phase 3: Intégrer le Circuit Breaker

### Étape 3.1: Créer l'Instance

```typescript
import { CircuitBreaker } from './instagram/circuit-breaker';

export class InstagramOAuthService {
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    // ... existing code ...
    
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitoringPeriod: 120000,
    }, 'Instagram OAuth');
  }
}
```

### Étape 3.2: Wrapper retryApiCall

```typescript
private async retryApiCall<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = this.MAX_RETRIES
): Promise<T> {
  // Wrap with circuit breaker
  return this.circuitBreaker.execute(async () => {
    let lastError: InstagramError;
    const correlationId = this.generateCorrelationId();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        instagramLogger.info(`${operationName} successful`, {
          correlationId,
          attempt,
        });
        
        return result;
      } catch (error) {
        lastError = error as InstagramError;
        
        // Don't retry on non-retryable errors
        if (!lastError.retryable) {
          throw lastError;
        }

        if (attempt === maxRetries) {
          instagramLogger.error(
            `${operationName} failed after ${maxRetries} attempts`,
            lastError.originalError || new Error(lastError.message),
            {
              correlationId,
              maxRetries,
              type: lastError.type,
            }
          );
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
        
        instagramLogger.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${delay}ms`,
          {
            correlationId,
            error: lastError.message,
            attempt,
            delay,
          }
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  });
}
```

### Étape 3.3: Exposer les Stats

```typescript
/**
 * Get circuit breaker statistics
 */
getCircuitBreakerStats() {
  return this.circuitBreaker.getStats();
}

/**
 * Reset circuit breaker manually
 */
resetCircuitBreaker() {
  this.circuitBreaker.reset();
}
```

## Phase 4: Tests et Validation

### Étape 4.1: Tests Unitaires

```typescript
// tests/unit/services/instagramOAuth-optimized.test.ts
import { InstagramOAuthService } from '@/lib/services/instagramOAuth';
import { InstagramErrorType } from '@/lib/services/instagram/types';
import { CircuitState } from '@/lib/services/instagram/circuit-breaker';

describe('InstagramOAuthService - Optimized', () => {
  let service: InstagramOAuthService;

  beforeEach(() => {
    service = new InstagramOAuthService();
  });

  describe('Error Handling', () => {
    it('should throw InstagramError with correlation ID', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit' } }),
      });

      try {
        await service.exchangeCodeForTokens('code');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('type', InstagramErrorType.RATE_LIMIT_ERROR);
        expect(error).toHaveProperty('correlationId');
        expect(error).toHaveProperty('retryable', true);
      }
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures', async () => {
      // Mock fetch to always fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      // Trigger failures
      for (let i = 0; i < 5; i++) {
        try {
          await service.exchangeCodeForTokens('code');
        } catch (error) {
          // Expected
        }
      }

      const stats = service.getCircuitBreakerStats();
      expect(stats.state).toBe(CircuitState.OPEN);
    });
  });
});
```

### Étape 4.2: Tests d'Intégration

```typescript
// tests/integration/instagram/oauth-flow.test.ts
describe('Instagram OAuth Flow - Optimized', () => {
  it('should complete full OAuth flow with logging', async () => {
    const service = new InstagramOAuthService();
    
    // Get auth URL
    const { url, state } = await service.getAuthorizationUrl();
    expect(url).toContain('facebook.com');
    
    // Exchange code (mocked)
    const tokens = await service.exchangeCodeForTokens('test_code');
    expect(tokens.access_token).toBeDefined();
    
    // Get long-lived token
    const longLived = await service.getLongLivedToken(tokens.access_token);
    expect(longLived.expires_in).toBeGreaterThan(0);
    
    // Check circuit breaker stats
    const stats = service.getCircuitBreakerStats();
    expect(stats.totalSuccesses).toBeGreaterThan(0);
  });
});
```

## Phase 5: Déploiement

### Étape 5.1: Configuration

```bash
# .env
NODE_ENV=production
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://your-domain.com/callback
```

### Étape 5.2: Monitoring

```typescript
// Ajouter dans votre monitoring dashboard
import { instagramOAuth } from '@/lib/services/instagramOAuth';

// Check circuit breaker status
const stats = instagramOAuth.getCircuitBreakerStats();

if (stats.state === 'OPEN') {
  // Alert: Service is down
  sendAlert('Instagram OAuth circuit breaker is OPEN');
}

if (stats.totalFailures / stats.totalCalls > 0.1) {
  // Alert: High error rate
  sendAlert('Instagram OAuth error rate is high');
}
```

### Étape 5.3: Rollback Plan

Si problèmes en production :

1. **Désactiver Circuit Breaker**
```typescript
service.resetCircuitBreaker();
```

2. **Augmenter Log Level**
```typescript
import { instagramLogger, LogLevel } from '@/lib/services/instagram';
instagramLogger.setLevel(LogLevel.DEBUG);
```

3. **Rollback Code**
```bash
git revert <commit-hash>
git push origin main
```

## 📊 Validation Checklist

### Avant Déploiement
- [ ] Tous les tests passent
- [ ] Logger intégré partout
- [ ] Types d'erreurs utilisés
- [ ] Circuit breaker configuré
- [ ] Documentation à jour
- [ ] Monitoring configuré

### Après Déploiement
- [ ] Vérifier logs en production
- [ ] Vérifier circuit breaker stats
- [ ] Vérifier error rate < 5%
- [ ] Vérifier response time < 500ms
- [ ] Vérifier aucune régression

## 🚨 Troubleshooting

### Problème: Trop de logs

**Solution:**
```typescript
instagramLogger.setLevel(LogLevel.WARN); // Only warnings and errors
```

### Problème: Circuit breaker trop sensible

**Solution:**
```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 10, // Augmenter le seuil
  timeout: 120000, // Augmenter le timeout
});
```

### Problème: Erreurs non catchées

**Solution:**
```typescript
// Ajouter try-catch global
process.on('unhandledRejection', (error: InstagramError) => {
  instagramLogger.error('Unhandled rejection', error as Error, {
    correlationId: error.correlationId,
  });
});
```

---

**Last Updated:** 2025-11-14  
**Version:** 1.0.0
