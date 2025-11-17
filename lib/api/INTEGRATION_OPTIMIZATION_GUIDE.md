# API Integration Optimization Guide

Guide pratique pour optimiser l'intégration API dans Huntaze.

## Table des Matières

1. [Gestion des Erreurs](#gestion-des-erreurs)
2. [Retry Strategies](#retry-strategies)
3. [Types TypeScript](#types-typescript)
4. [Authentification](#authentification)
5. [Optimisation des Appels](#optimisation-des-appels)
6. [Logging](#logging)
7. [Documentation](#documentation)

---

## 1. Gestion des Erreurs

### ✅ Pattern Recommandé

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/utils/response';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('my-api');

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  try {
    // Votre logique ici
    const data = await processRequest();
    
    logger.info('Request successful', {
      correlationId,
      duration: Date.now() - startTime,
    });
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    logger.error('Request failed', error as Error, {
      correlationId,
      duration: Date.now() - startTime,
    });
    
    // Erreur utilisateur (400)
    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', error.message, { correlationId }),
        { status: 400 }
      );
    }
    
    // Erreur serveur (500)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'An error occurred', { correlationId }),
      { status: 500 }
    );
  }
}
```

### Error Response Structure

```typescript
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": { /* Additional context */ },
    "correlationId": "uuid",
    "timestamp": "2025-11-17T10:00:00Z"
  }
}
```

---

## 2. Retry Strategies

### ✅ Retry avec Exponential Backoff

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'],
};

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Vérifier si l'erreur est retryable
    const isRetryable = RETRY_CONFIG.retryableErrors.some(
      (code) => error.code === code || error.message?.includes(code)
    );

    if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    // Calculer le délai avec exponential backoff
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Retrying request', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}
```

### Utilisation

```typescript
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  
  try {
    const result = await retryWithBackoff(
      async () => {
        // Appel externe qui peut échouer
        return await externalAPI.call();
      },
      correlationId
    );
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      errorResponse('EXTERNAL_API_ERROR', 'Failed after retries', { correlationId }),
      { status: 503 }
    );
  }
}
```

---

## 3. Types TypeScript

### ✅ Types Stricts pour API

```typescript
// Request types
export interface CreateContentRequest {
  title: string;
  type: 'image' | 'video' | 'text';
  platform: 'onlyfans' | 'instagram' | 'tiktok';
  content?: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}

// Response types
export interface CreateContentResponse {
  success: true;
  data: {
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  };
  correlationId: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    details?: any;
    correlationId: string;
  };
}

// Union type pour réponse
export type ContentResponse = CreateContentResponse | ErrorResponse;
```

### Utilisation avec Validation

```typescript
import { withValidation, validators } from '@/lib/api/middleware/validation';

const createContentSchema = {
  title: validators.string({ required: true, maxLength: 200 }),
  type: validators.enum(['image', 'video', 'text'], { required: true }),
  platform: validators.enum(['onlyfans', 'instagram', 'tiktok'], { required: true }),
  content: validators.string({ required: false, maxLength: 5000 }),
  mediaUrls: validators.array({ required: false, itemValidator: validators.url() }),
  scheduledAt: validators.date({ required: false }),
};

export const POST = withValidation<CreateContentRequest>(
  createContentSchema,
  async (req, body) => {
    // body est typé comme CreateContentRequest
    const content = await createContent(body);
    
    return NextResponse.json<CreateContentResponse>({
      success: true,
      data: content,
      correlationId: crypto.randomUUID(),
    });
  }
);
```

---

## 4. Authentification

### ✅ Protection des Routes

```typescript
import { requireAuth } from '@/lib/auth/api-protection';

export async function POST(req: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const { user } = authResult;
  
  // Route protégée - user est authentifié
  logger.info('Authenticated request', {
    userId: user.id,
    email: user.email,
  });
  
  // Votre logique ici
  return NextResponse.json({ success: true });
}
```

### Protection avec Onboarding

```typescript
import { requireAuthWithOnboarding } from '@/lib/auth/api-protection';

export async function POST(req: NextRequest) {
  // Vérifier auth + onboarding complété
  const authResult = await requireAuthWithOnboarding(req);
  if (authResult instanceof Response) return authResult;

  const { user } = authResult;
  
  // User authentifié ET onboarding complété
  return NextResponse.json({ success: true });
}
```

### Auth Optionnelle

```typescript
import { getOptionalAuth } from '@/lib/auth/api-protection';

export async function GET(req: NextRequest) {
  const auth = await getOptionalAuth(req);
  
  if (auth) {
    // User authentifié - données personnalisées
    return NextResponse.json({ data: getPersonalizedData(auth.user.id) });
  } else {
    // User non authentifié - données publiques
    return NextResponse.json({ data: getPublicData() });
  }
}
```

---

## 5. Optimisation des Appels

### ✅ Caching

```typescript
import { cache } from '@/lib/api/utils/cache';

export async function GET(req: NextRequest) {
  const cacheKey = 'analytics:overview';
  
  // Vérifier le cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // Calculer les données
  const data = await calculateAnalytics();
  
  // Mettre en cache (5 minutes)
  await cache.set(cacheKey, data, 300);
  
  return NextResponse.json(data);
}
```

### Rate Limiting

```typescript
import { checkRateLimit } from '@/lib/api/middleware/rate-limit';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  // Rate limit: 60 requêtes par minute
  const rateLimit = await checkRateLimit({
    id: `api:content:${authResult.user.id}`,
    limit: 60,
    windowSec: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
          'Retry-After': '60',
        },
      }
    );
  }

  // Continuer avec la requête
  return NextResponse.json({ success: true });
}
```

### Debouncing (Client-Side)

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utilisation
function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Appel API seulement après 500ms d'inactivité
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

---

## 6. Logging

### ✅ Logging Structuré

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('content-api');

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  logger.info('Request started', {
    correlationId,
    method: req.method,
    url: req.url,
  });
  
  try {
    const result = await processRequest();
    
    logger.info('Request completed', {
      correlationId,
      duration: Date.now() - startTime,
      resultSize: JSON.stringify(result).length,
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Request failed', error as Error, {
      correlationId,
      duration: Date.now() - startTime,
      errorType: error.constructor.name,
    });
    
    throw error;
  }
}
```

### Niveaux de Log

```typescript
// DEBUG - Informations détaillées pour debugging
logger.debug('Processing item', { itemId, step: 'validation' });

// INFO - Événements normaux
logger.info('User created', { userId, email });

// WARN - Situations anormales mais gérables
logger.warn('Rate limit approaching', { userId, remaining: 5 });

// ERROR - Erreurs nécessitant attention
logger.error('Database connection failed', error, { attempt: 3 });
```

---

## 7. Documentation

### ✅ JSDoc Complet

```typescript
/**
 * Create new content item
 * 
 * POST /api/content
 * 
 * Creates a new content item for the authenticated user.
 * Validates input, sanitizes data, and stores in database.
 * 
 * @authentication Required - Uses NextAuth session
 * @rateLimit 60 requests per minute per user
 * 
 * @requestBody
 * {
 *   title: string (required, max 200 chars),
 *   type: 'image' | 'video' | 'text' (required),
 *   platform: 'onlyfans' | 'instagram' | 'tiktok' (required),
 *   content?: string (optional, max 5000 chars),
 *   mediaUrls?: string[] (optional, valid URLs),
 *   scheduledAt?: string (optional, ISO 8601 date)
 * }
 * 
 * @responseBody
 * Success (201):
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     title: string,
 *     type: string,
 *     status: 'draft' | 'scheduled' | 'published',
 *     createdAt: string
 *   },
 *   correlationId: string
 * }
 * 
 * Error (400):
 * {
 *   error: {
 *     type: 'VALIDATION_ERROR',
 *     message: string,
 *     details: { errors: ValidationError[] },
 *     correlationId: string
 *   }
 * }
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/content', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   credentials: 'include',
 *   body: JSON.stringify({
 *     title: 'My Content',
 *     type: 'image',
 *     platform: 'instagram',
 *     mediaUrls: ['https://example.com/image.jpg']
 *   })
 * });
 * 
 * const data = await response.json();
 * console.log(data.data.id); // Content ID
 * ```
 * 
 * @see docs/api/content-api.md
 */
export const POST = withValidation<CreateContentRequest>(
  createContentSchema,
  async (req, body) => {
    // Implementation
  }
);
```

### README API

Chaque module API doit avoir un README avec:

1. **Overview** - Description du module
2. **Endpoints** - Liste des endpoints disponibles
3. **Authentication** - Exigences d'authentification
4. **Rate Limits** - Limites de taux
5. **Examples** - Exemples d'utilisation
6. **Error Codes** - Codes d'erreur possibles
7. **Testing** - Comment tester l'API

---

## Checklist d'Optimisation

### Avant de Déployer

- [ ] Gestion d'erreurs complète (try-catch)
- [ ] Retry strategy pour appels externes
- [ ] Types TypeScript stricts
- [ ] Authentification vérifiée
- [ ] Rate limiting configuré
- [ ] Caching implémenté si pertinent
- [ ] Logging structuré avec correlation IDs
- [ ] JSDoc complet
- [ ] Tests unitaires écrits
- [ ] Tests d'intégration écrits
- [ ] Documentation API à jour
- [ ] Validation des entrées
- [ ] Sanitization XSS
- [ ] Métriques de performance

### Performance Targets

- ✅ P50 < 100ms
- ✅ P95 < 500ms
- ✅ P99 < 1000ms
- ✅ Taux d'erreur < 1%
- ✅ Uptime > 99.9%

---

## Ressources

- [API Documentation](./README.md)
- [Response Utilities Guide](./RESPONSE_UTILITIES_GUIDE.md)
- [Error Handling Guide](../../docs/ERROR_HANDLING_GUIDE.md)
- [Authentication Guide](../../docs/AUTH_SETUP.md)
- [Testing Guide](../../tests/integration/api/TESTING_GUIDE.md)

---

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
