# 🛡️ Auth Register - Rate Limiting Implementation Guide

**Date**: 2025-11-15  
**Endpoint**: `/api/auth/register`  
**Priority**: Moyenne (Recommandé pour production)

---

## 🎯 Objectif

Ajouter un rate limiting sur l'endpoint de registration pour prévenir:
- ✅ Attaques par force brute
- ✅ Spam de création de comptes
- ✅ Abus de ressources serveur
- ✅ Attaques DDoS

---

## 📊 Configuration Recommandée

### Limites Proposées

| Type | Limite | Fenêtre | Raison |
|------|--------|---------|--------|
| **Par IP** | 5 registrations | 1 heure | Prévenir spam |
| **Par Email** | 3 tentatives | 24 heures | Prévenir abus |
| **Global** | 100 registrations | 1 minute | Prévenir DDoS |

---

## 🔧 Implémentation

### Option 1: Utiliser le Rate Limiter Existant

Le projet a déjà un rate limiter optimisé dans `lib/services/rate-limiter/`.

```typescript
// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { registrationService } from '@/lib/services/auth/register';
import { authLogger } from '@/lib/services/auth/logger';
import { rateLimiter } from '@/lib/services/rate-limiter';
import type { RegisterRequest, RegisterResponse } from '@/lib/services/auth/types';

export async function POST(request: NextRequest) {
  const correlationId = authLogger.generateCorrelationId();
  const startTime = Date.now();

  try {
    // ============================================================================
    // RATE LIMITING - NOUVEAU
    // ============================================================================
    
    // 1. Rate limit par IP (5 registrations/heure)
    const ipRateLimit = await rateLimiter.checkLimit(request, {
      key: 'register:ip',
      max: 5,
      window: 3600000, // 1 heure en ms
    });

    if (!ipRateLimit.success) {
      authLogger.warn('Registration rate limit exceeded (IP)', {
        correlationId,
        ip: request.ip,
        remaining: ipRateLimit.remaining,
        resetAt: ipRateLimit.resetAt,
      });

      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          type: 'RATE_LIMIT_ERROR',
          retryAfter: ipRateLimit.retryAfter,
          correlationId,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(ipRateLimit.retryAfter / 1000)),
            'X-RateLimit-Limit': String(ipRateLimit.limit),
            'X-RateLimit-Remaining': String(ipRateLimit.remaining),
            'X-RateLimit-Reset': String(ipRateLimit.resetAt),
          },
        }
      );
    }

    // ============================================================================
    // CODE EXISTANT
    // ============================================================================
    
    // Parse request body
    const body = await request.json();
    const data: RegisterRequest = {
      email: body.email,
      password: body.password,
    };

    // 2. Rate limit par email (3 tentatives/24h)
    const emailRateLimit = await rateLimiter.checkLimit(request, {
      key: `register:email:${data.email.toLowerCase()}`,
      max: 3,
      window: 86400000, // 24 heures en ms
    });

    if (!emailRateLimit.success) {
      authLogger.warn('Registration rate limit exceeded (Email)', {
        correlationId,
        email: data.email,
        remaining: emailRateLimit.remaining,
        resetAt: emailRateLimit.resetAt,
      });

      return NextResponse.json(
        {
          error: 'Too many registration attempts for this email. Please try again tomorrow.',
          type: 'RATE_LIMIT_ERROR',
          retryAfter: emailRateLimit.retryAfter,
          correlationId,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(emailRateLimit.retryAfter / 1000)),
          },
        }
      );
    }

    authLogger.info('Registration request received', {
      correlationId,
      email: data.email,
      ipRateLimitRemaining: ipRateLimit.remaining,
      emailRateLimitRemaining: emailRateLimit.remaining,
    });

    // Register user
    const result: RegisterResponse = await registrationService.register(data);

    const duration = Date.now() - startTime;
    authLogger.info('Registration request completed', {
      correlationId,
      userId: result.user.id,
      duration,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle structured errors
    if (error.type) {
      authLogger.warn('Registration request failed', {
        correlationId,
        type: error.type,
        statusCode: error.statusCode,
        duration,
      });

      return NextResponse.json(
        {
          error: error.userMessage || error.message,
          type: error.type,
          correlationId: error.correlationId,
        },
        { status: error.statusCode || 500 }
      );
    }

    // Handle unexpected errors
    authLogger.error('Registration request error', error, {
      correlationId,
      duration,
    });

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        type: 'INTERNAL_ERROR',
        correlationId,
      },
      { status: 500 }
    );
  }
}
```

---

### Option 2: Middleware Global

Créer un middleware pour tous les endpoints d'authentification:

```typescript
// middleware.ts (ajouter à l'existant)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from '@/lib/services/rate-limiter';

export async function middleware(request: NextRequest) {
  // Rate limiting pour /api/auth/register
  if (request.nextUrl.pathname === '/api/auth/register') {
    const rateLimit = await rateLimiter.checkLimit(request, {
      key: 'register:ip',
      max: 5,
      window: 3600000, // 1 heure
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          type: 'RATE_LIMIT_ERROR',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.retryAfter / 1000)),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*'],
};
```

---

## 📊 Headers de Rate Limiting

### Headers Standard

```
X-RateLimit-Limit: 5           # Limite maximale
X-RateLimit-Remaining: 3       # Requêtes restantes
X-RateLimit-Reset: 1699999999  # Timestamp de reset
Retry-After: 3600              # Secondes avant retry
```

### Exemple de Réponse 429

```json
{
  "error": "Too many registration attempts. Please try again later.",
  "type": "RATE_LIMIT_ERROR",
  "retryAfter": 3600000,
  "correlationId": "auth-1699999999-abc123"
}
```

---

## 🧪 Tests

### Test Unitaire

```typescript
// tests/unit/api/auth-register-rate-limit.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { rateLimiter } from '@/lib/services/rate-limiter';

vi.mock('@/lib/services/rate-limiter');

describe('POST /api/auth/register - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow registration within rate limit', async () => {
    // Mock rate limiter success
    vi.mocked(rateLimiter.checkLimit).mockResolvedValue({
      success: true,
      remaining: 4,
      limit: 5,
      resetAt: Date.now() + 3600000,
      retryAfter: 0,
    });

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(201);
  });

  it('should return 429 when rate limit exceeded', async () => {
    // Mock rate limiter failure
    vi.mocked(rateLimiter.checkLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      limit: 5,
      resetAt: Date.now() + 3600000,
      retryAfter: 3600000,
    });

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.type).toBe('RATE_LIMIT_ERROR');
    expect(data.retryAfter).toBeDefined();
  });

  it('should include rate limit headers', async () => {
    vi.mocked(rateLimiter.checkLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      limit: 5,
      resetAt: Date.now() + 3600000,
      retryAfter: 3600000,
    });

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    });

    const response = await POST(request as any);
    
    expect(response.headers.get('Retry-After')).toBe('3600');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('should rate limit by IP', async () => {
    const checkLimitSpy = vi.mocked(rateLimiter.checkLimit);
    
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    });

    await POST(request as any);

    expect(checkLimitSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: 'register:ip',
        max: 5,
        window: 3600000,
      })
    );
  });

  it('should rate limit by email', async () => {
    const checkLimitSpy = vi.mocked(rateLimiter.checkLimit);
    
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
      }),
    });

    await POST(request as any);

    expect(checkLimitSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: 'register:email:test@example.com',
        max: 3,
        window: 86400000,
      })
    );
  });
});
```

### Test d'Intégration

```typescript
// tests/integration/auth/register-rate-limit.test.ts

import { describe, it, expect, beforeEach } from 'vitest';

describe('Registration Rate Limiting Integration', () => {
  beforeEach(async () => {
    // Clear rate limit cache
    await redis.flushdb();
  });

  it('should allow 5 registrations per hour per IP', async () => {
    const ip = '192.168.1.1';

    // First 5 should succeed
    for (let i = 0; i < 5; i++) {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ip,
        },
        body: JSON.stringify({
          email: `test${i}@example.com`,
          password: 'SecurePass123!',
        }),
      });

      expect(response.status).toBe(201);
    }

    // 6th should fail
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({
        email: 'test6@example.com',
        password: 'SecurePass123!',
      }),
    });

    expect(response.status).toBe(429);
  });

  it('should allow 3 registrations per 24h per email', async () => {
    const email = 'test@example.com';

    // First 3 should succeed
    for (let i = 0; i < 3; i++) {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'SecurePass123!',
        }),
      });

      // First will succeed, others will fail with USER_EXISTS
      if (i === 0) {
        expect(response.status).toBe(201);
      } else {
        expect(response.status).toBe(409);
      }
    }

    // 4th should fail with rate limit
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'SecurePass123!',
      }),
    });

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.type).toBe('RATE_LIMIT_ERROR');
  });
});
```

---

## 📊 Monitoring

### Métriques à Tracker

```typescript
// Dans la route
import { metrics } from '@/lib/monitoring';

// Track rate limit hits
if (!ipRateLimit.success) {
  metrics.increment('auth.register.rate_limit.ip', {
    ip: request.ip,
  });
}

if (!emailRateLimit.success) {
  metrics.increment('auth.register.rate_limit.email', {
    email: data.email,
  });
}

// Track successful registrations
metrics.increment('auth.register.success');
```

### Dashboard Queries

```sql
-- Rate limit hits par heure
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as hits
FROM rate_limit_logs
WHERE endpoint = 'register'
  AND status = 'blocked'
GROUP BY hour
ORDER BY hour DESC;

-- Top IPs bloquées
SELECT 
  ip,
  COUNT(*) as blocks
FROM rate_limit_logs
WHERE endpoint = 'register'
  AND status = 'blocked'
GROUP BY ip
ORDER BY blocks DESC
LIMIT 10;
```

---

## 🔧 Configuration Avancée

### Configuration Dynamique

```typescript
// lib/config/rate-limits.ts

export const RATE_LIMITS = {
  register: {
    ip: {
      max: parseInt(process.env.RATE_LIMIT_REGISTER_IP_MAX || '5'),
      window: parseInt(process.env.RATE_LIMIT_REGISTER_IP_WINDOW || '3600000'),
    },
    email: {
      max: parseInt(process.env.RATE_LIMIT_REGISTER_EMAIL_MAX || '3'),
      window: parseInt(process.env.RATE_LIMIT_REGISTER_EMAIL_WINDOW || '86400000'),
    },
    global: {
      max: parseInt(process.env.RATE_LIMIT_REGISTER_GLOBAL_MAX || '100'),
      window: parseInt(process.env.RATE_LIMIT_REGISTER_GLOBAL_WINDOW || '60000'),
    },
  },
};
```

### Whitelist

```typescript
// lib/config/rate-limits.ts

const WHITELISTED_IPS = [
  '127.0.0.1',
  '::1',
  // IPs de confiance
];

export function isWhitelisted(ip: string): boolean {
  return WHITELISTED_IPS.includes(ip);
}

// Dans la route
if (isWhitelisted(request.ip)) {
  // Skip rate limiting
}
```

---

## 📝 Documentation

### Mettre à jour la documentation API

```markdown
<!-- docs/api/auth-register.md -->

## Rate Limiting

L'endpoint `/api/auth/register` est protégé par rate limiting:

### Limites

| Type | Limite | Fenêtre |
|------|--------|---------|
| Par IP | 5 registrations | 1 heure |
| Par Email | 3 tentatives | 24 heures |
| Global | 100 registrations | 1 minute |

### Headers de Réponse

Toutes les réponses incluent les headers suivants:

- `X-RateLimit-Limit`: Limite maximale
- `X-RateLimit-Remaining`: Requêtes restantes
- `X-RateLimit-Reset`: Timestamp de reset (Unix)

### Réponse 429 (Rate Limit Exceeded)

```json
{
  "error": "Too many registration attempts. Please try again later.",
  "type": "RATE_LIMIT_ERROR",
  "retryAfter": 3600000,
  "correlationId": "auth-1699999999-abc123"
}
```

Headers additionnels:
- `Retry-After`: Secondes avant de pouvoir réessayer
```

---

## ✅ Checklist d'Implémentation

### Code
- [ ] Ajouter rate limiting par IP
- [ ] Ajouter rate limiting par email
- [ ] Ajouter headers de rate limiting
- [ ] Gérer les erreurs 429
- [ ] Logger les rate limit hits

### Tests
- [ ] Tests unitaires (rate limiting)
- [ ] Tests d'intégration (limites)
- [ ] Tests de headers
- [ ] Tests de whitelist

### Documentation
- [ ] Mettre à jour docs/api/auth-register.md
- [ ] Documenter les limites
- [ ] Documenter les headers
- [ ] Ajouter exemples de réponses

### Monitoring
- [ ] Configurer métriques
- [ ] Créer dashboard
- [ ] Configurer alertes
- [ ] Logger les abus

### Configuration
- [ ] Variables d'environnement
- [ ] Configuration par environnement
- [ ] Whitelist IPs
- [ ] Ajustement des limites

---

## 🚀 Déploiement

### Étapes

1. **Développement**
   ```bash
   # Implémenter le code
   # Ajouter les tests
   npm test tests/unit/api/auth-register-rate-limit.test.ts
   ```

2. **Staging**
   ```bash
   # Déployer en staging
   # Tester avec des vraies requêtes
   # Ajuster les limites si nécessaire
   ```

3. **Production**
   ```bash
   # Déployer en production
   # Monitorer les métriques
   # Ajuster si nécessaire
   ```

### Variables d'Environnement

```bash
# .env.production
RATE_LIMIT_REGISTER_IP_MAX=5
RATE_LIMIT_REGISTER_IP_WINDOW=3600000
RATE_LIMIT_REGISTER_EMAIL_MAX=3
RATE_LIMIT_REGISTER_EMAIL_WINDOW=86400000
RATE_LIMIT_REGISTER_GLOBAL_MAX=100
RATE_LIMIT_REGISTER_GLOBAL_WINDOW=60000
```

---

## 📊 Impact Attendu

### Sécurité
- ✅ Prévention des attaques par force brute
- ✅ Protection contre le spam
- ✅ Réduction des abus

### Performance
- ✅ Réduction de la charge serveur
- ✅ Protection contre les DDoS
- ✅ Meilleure stabilité

### Expérience Utilisateur
- ⚠️ Légère friction pour les utilisateurs légitimes
- ✅ Messages d'erreur clairs
- ✅ Headers informatifs

---

**Créé par**: Kiro AI  
**Date**: 2025-11-15  
**Priority**: Moyenne (Recommandé pour production)  
**Effort**: 2-4 heures
