# ML Pipeline Versioning API - Optimisation Guide

## 📋 Vue d'ensemble

Ce document détaille les optimisations appliquées et recommandées pour l'endpoint `/api/smart-onboarding/ml-pipeline/versioning`.

## ✅ Optimisations Appliquées (Récent Diff)

### 1. Gestion d'Erreur Améliorée
```typescript
// ✅ AVANT (risque de crash)
const exportData = await mlPipelineFacade.exportVersion(modelId, version, format);
return new NextResponse(exportData, { ... });

// ✅ APRÈS (sécurisé)
const exportResult = await mlPipelineFacade.exportVersion(modelId, version, format);
if (!exportResult.success || !exportResult.data) {
  return NextResponse.json(
    { error: exportResult.error?.message || 'Export failed' },
    { status: 500 }
  );
}
```

### 2. Type Safety
```typescript
// Cast explicite pour éviter les erreurs TypeScript
return new NextResponse(exportResult.data as BodyInit, { ... });
```

## 🔧 Optimisations Recommandées

### 1. Types TypeScript Manquants

**Créer:** `app/api/smart-onboarding/ml-pipeline/versioning/types.ts`

```typescript
/**
 * Types for ML Pipeline Versioning API
 */

export interface ExportResult {
  success: boolean;
  data?: Buffer | Uint8Array | Record<string, any>;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface VersionMetadata {
  modelId: string;
  version: string;
  createdAt: string;
  updatedAt?: string;
  metrics?: Record<string, number>;
  tags?: string[];
  branch?: string;
  status?: 'active' | 'archived' | 'deprecated';
}

export interface VersionListOptions {
  limit?: number;
  offset?: number;
  branch?: string;
  tag?: string;
  status?: string;
}

export interface VersionComparison {
  fromVersion: string;
  toVersion: string;
  differences: {
    metrics?: Record<string, { old: number; new: number; change: number }>;
    parameters?: Record<string, { old: any; new: any }>;
  };
  summary: string;
}

export interface ModelLineage {
  modelId: string;
  versions: Array<{
    version: string;
    parent?: string;
    children: string[];
    branch: string;
    tags: string[];
  }>;
  branches: string[];
  tags: Record<string, string>;
}
```

### 2. Retry Strategy pour Échecs Réseau

**Ajouter:** `lib/smart-onboarding/utils/retryStrategy.ts`

```typescript
/**
 * Retry Strategy for Network Failures
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on non-retryable errors
      if (!retryableErrors.includes(error.code)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
        error: error.message,
        code: error.code
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}
```

**Utilisation dans l'API:**

```typescript
import { withRetry } from '@/lib/smart-onboarding/utils/retryStrategy';

// Dans le GET handler, action 'export'
const exportResult = await withRetry(
  () => mlPipelineFacade.exportVersion(modelId, version, format),
  { maxRetries: 3, initialDelay: 1000 }
);
```

### 3. Caching pour Réduire les Appels

**Ajouter:** `lib/smart-onboarding/cache/versionCache.ts`

```typescript
/**
 * Version Cache for ML Pipeline
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class VersionCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const versionCache = new VersionCache();
```

**Utilisation:**

```typescript
import { versionCache } from '@/lib/smart-onboarding/cache/versionCache';

// Dans le GET handler, action 'get'
const cacheKey = `version:${modelId}:${version}`;
let modelVersion = versionCache.get(cacheKey);

if (!modelVersion) {
  modelVersion = await mlPipelineFacade.getVersion(modelId, version);
  versionCache.set(cacheKey, modelVersion, 5 * 60 * 1000); // 5 min cache
}
```

### 4. Rate Limiting

**Ajouter:** `lib/smart-onboarding/middleware/rateLimiter.ts`

```typescript
/**
 * Rate Limiter for ML Pipeline API
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  check(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Filter out old requests
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= config.maxRequests) {
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): boolean {
  return rateLimiter.check(identifier, config);
}
```

**Utilisation:**

```typescript
import { checkRateLimit } from '@/lib/smart-onboarding/middleware/rateLimiter';

export async function GET(request: NextRequest) {
  // Rate limiting par IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!checkRateLimit(ip, { windowMs: 60000, maxRequests: 100 })) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      }
    );
  }

  // ... rest of handler
}
```

### 5. Logging Amélioré

**Optimiser les logs existants:**

```typescript
import { logger } from '@/lib/utils/logger';

// ✅ AVANT
logger.error('ML versioning endpoint failed', { error });

// ✅ APRÈS (plus de contexte)
logger.error('ML versioning endpoint failed', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  action,
  modelId,
  version,
  userId: request.headers.get('x-user-id'),
  requestId: request.headers.get('x-request-id'),
  timestamp: new Date().toISOString()
});
```

### 6. Validation des Paramètres

**Créer:** `lib/smart-onboarding/validation/versionValidation.ts`

```typescript
/**
 * Validation for ML Pipeline Versioning
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateModelId(modelId: string | null): string {
  if (!modelId) {
    throw new ValidationError('Model ID is required', 'modelId', 'REQUIRED');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(modelId)) {
    throw new ValidationError(
      'Model ID must contain only alphanumeric characters, hyphens, and underscores',
      'modelId',
      'INVALID_FORMAT'
    );
  }

  if (modelId.length > 100) {
    throw new ValidationError(
      'Model ID must be less than 100 characters',
      'modelId',
      'TOO_LONG'
    );
  }

  return modelId;
}

export function validateVersion(version: string | null): string {
  if (!version) {
    throw new ValidationError('Version is required', 'version', 'REQUIRED');
  }

  // Semantic versioning pattern
  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version)) {
    throw new ValidationError(
      'Version must follow semantic versioning (e.g., 1.0.0 or 1.0.0-beta.1)',
      'version',
      'INVALID_FORMAT'
    );
  }

  return version;
}

export function validatePagination(
  limit: string | null,
  offset: string | null
): { limit: number; offset: number } {
  const parsedLimit = parseInt(limit || '20');
  const parsedOffset = parseInt(offset || '0');

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new ValidationError(
      'Limit must be between 1 and 100',
      'limit',
      'OUT_OF_RANGE'
    );
  }

  if (isNaN(parsedOffset) || parsedOffset < 0) {
    throw new ValidationError(
      'Offset must be a non-negative number',
      'offset',
      'INVALID_VALUE'
    );
  }

  return { limit: parsedLimit, offset: parsedOffset };
}
```

**Utilisation:**

```typescript
import { validateModelId, validateVersion, ValidationError } from '@/lib/smart-onboarding/validation/versionValidation';

try {
  const validModelId = validateModelId(searchParams.get('modelId'));
  const validVersion = validateVersion(searchParams.get('version'));
  
  // ... use validated values
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        error: error.message,
        field: error.field,
        code: error.code
      },
      { status: 400 }
    );
  }
  throw error;
}
```

### 7. Authentification et Autorisation

**Ajouter:** `lib/smart-onboarding/middleware/auth.ts`

```typescript
/**
 * Authentication Middleware for ML Pipeline
 */

import { NextRequest } from 'next/server';

export interface AuthContext {
  userId: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

export async function authenticate(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token (implement your JWT verification)
    const decoded = await verifyJWT(token);
    
    return {
      userId: decoded.userId,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
  } catch (error) {
    return null;
  }
}

export function authorize(
  context: AuthContext | null,
  requiredPermission: string
): boolean {
  if (!context) {
    return false;
  }

  if (context.role === 'admin') {
    return true;
  }

  return context.permissions.includes(requiredPermission);
}

// Placeholder - implement with your JWT library
async function verifyJWT(token: string): Promise<any> {
  // TODO: Implement JWT verification
  throw new Error('JWT verification not implemented');
}
```

**Utilisation:**

```typescript
import { authenticate, authorize } from '@/lib/smart-onboarding/middleware/auth';

export async function DELETE(request: NextRequest) {
  // Authenticate user
  const authContext = await authenticate(request);
  
  if (!authContext) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check permissions
  if (!authorize(authContext, 'ml:version:delete')) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  // ... rest of handler
}
```

## 📊 Métriques et Monitoring

### Ajouter des Métriques

```typescript
import { logger } from '@/lib/utils/logger';

// Au début de chaque handler
const startTime = Date.now();

// À la fin (succès)
logger.info('ML versioning request completed', {
  action,
  modelId,
  duration: Date.now() - startTime,
  status: 'success'
});

// En cas d'erreur
logger.error('ML versioning request failed', {
  action,
  modelId,
  duration: Date.now() - startTime,
  status: 'error',
  error: error.message
});
```

## 🧪 Tests Recommandés

### 1. Tests Unitaires

**Créer:** `tests/unit/api/ml-pipeline-versioning.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ML Pipeline Versioning API', () => {
  describe('GET /export', () => {
    it('should handle successful export', async () => {
      // Test implementation
    });

    it('should handle export failure gracefully', async () => {
      // Test implementation
    });

    it('should return binary data for binary format', async () => {
      // Test implementation
    });
  });

  describe('Rate Limiting', () => {
    it('should block requests after limit exceeded', async () => {
      // Test implementation
    });
  });

  describe('Validation', () => {
    it('should reject invalid model IDs', async () => {
      // Test implementation
    });

    it('should reject invalid version formats', async () => {
      // Test implementation
    });
  });
});
```

## 📝 Documentation API

### Endpoint Documentation

```typescript
/**
 * GET /api/smart-onboarding/ml-pipeline/versioning
 * 
 * Actions:
 * - get: Retrieve a specific model version
 * - list: List all versions for a model
 * - compare: Compare two versions
 * - lineage: Get model lineage graph
 * - export: Export a version (json or binary)
 * 
 * Query Parameters:
 * @param {string} action - Action to perform (required)
 * @param {string} modelId - Model identifier (required for most actions)
 * @param {string} version - Version identifier (required for get, export)
 * @param {string} format - Export format: 'json' | 'binary' (default: 'json')
 * @param {number} limit - Pagination limit (default: 20, max: 100)
 * @param {number} offset - Pagination offset (default: 0)
 * 
 * Rate Limits:
 * - 100 requests per minute per IP
 * - 1000 requests per hour per user
 * 
 * Authentication:
 * - Bearer token required in Authorization header
 * 
 * Responses:
 * - 200: Success
 * - 400: Bad request (validation error)
 * - 401: Unauthorized
 * - 403: Forbidden
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * 
 * Examples:
 * 
 * Get version:
 * GET /api/smart-onboarding/ml-pipeline/versioning?action=get&modelId=model-123&version=1.0.0
 * 
 * Export as binary:
 * GET /api/smart-onboarding/ml-pipeline/versioning?action=export&modelId=model-123&version=1.0.0&format=binary
 * 
 * List versions:
 * GET /api/smart-onboarding/ml-pipeline/versioning?action=list&modelId=model-123&limit=50&offset=0
 */
```

## 🚀 Checklist d'Implémentation

- [x] ✅ Gestion d'erreur pour export (appliqué)
- [x] ✅ Type safety pour binary data (appliqué)
- [ ] 🔄 Ajouter types TypeScript complets
- [ ] 🔄 Implémenter retry strategy
- [ ] 🔄 Ajouter caching
- [ ] 🔄 Implémenter rate limiting
- [ ] 🔄 Améliorer logging avec contexte
- [ ] 🔄 Ajouter validation robuste
- [ ] 🔄 Implémenter authentification
- [ ] 🔄 Ajouter métriques de performance
- [ ] 🔄 Créer tests unitaires
- [ ] 🔄 Documenter tous les endpoints

## 📚 Références

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Rate Limiting Strategies](https://www.npmjs.com/package/express-rate-limit)
- [JWT Authentication](https://jwt.io/introduction)

---

**Dernière mise à jour:** 2025-01-10  
**Version:** 1.0.0  
**Status:** 🔄 En cours d'optimisation
