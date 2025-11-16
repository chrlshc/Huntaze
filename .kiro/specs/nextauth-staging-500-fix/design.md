# Design Document - NextAuth Staging 500 Error Fix

## Overview

Ce document décrit l'architecture et la stratégie pour diagnostiquer et résoudre l'erreur 500 qui affecte NextAuth v5 sur l'environnement staging AWS Amplify. L'approche est basée sur une méthodologie d'isolation progressive et de validation incrémentale.

## Architecture

### Composants Affectés

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Amplify (Staging)                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CloudFront (CDN)                          │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │           Next.js 16 Runtime (Lambda)                  │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Middleware (middleware.ts)               │ │ │
│  │  │  - Rate Limiting (extractIdentity)               │ │ │
│  │  │  - Policy Resolution                             │ │ │
│  │  │  - Debug Auth                                    │ │ │
│  │  └──────────────┬───────────────────────────────────┘ │ │
│  │                 │                                      │ │
│  │  ┌──────────────▼───────────────────────────────────┐ │ │
│  │  │      API Routes                                  │ │ │
│  │  │  - /api/auth/[...nextauth] ❌ 500               │ │ │
│  │  │  - /api/test-env ❌ 500                          │ │ │
│  │  │  - /api/* (autres routes)                        │ │ │
│  │  └──────────────┬───────────────────────────────────┘ │ │
│  │                 │                                      │ │
│  │  ┌──────────────▼───────────────────────────────────┐ │ │
│  │  │      NextAuth v5 (lib/auth/config.ts)           │ │ │
│  │  │  - Credentials Provider                          │ │ │
│  │  │  - JWT Strategy                                  │ │ │
│  │  │  - Session Callbacks                             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Points de Défaillance Potentiels

1. **Middleware Rate Limiting**
   - Le middleware intercepte TOUTES les routes `/api/*`
   - Erreurs possibles dans `extractIdentity()` ou `resolveRateLimitPolicy()`
   - Imports de modules qui échouent en serverless

2. **NextAuth v5 Initialization**
   - Imports synchrones de modules lourds (bcrypt, database clients)
   - Configuration qui tente de se connecter à des services externes
   - Incompatibilité avec le runtime Lambda

3. **Next.js Configuration**
   - `removeConsole` en production peut masquer les erreurs
   - Configuration webpack qui affecte les imports
   - Turbopack configuration

4. **Environment Variables**
   - Variables manquantes ou mal formatées
   - Secrets non accessibles au runtime

## Components and Interfaces

### 1. Diagnostic System

#### 1.1 Ultra-Simple Test Route

Créer une route API minimale sans aucune dépendance pour valider que le runtime fonctionne :

```typescript
// app/api/ping/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'lambda'
  });
}
```

**Objectif** : Valider que les routes API fonctionnent indépendamment de NextAuth et du middleware.

#### 1.2 Middleware Bypass Route

Créer une route qui n'est PAS interceptée par le middleware :

```typescript
// app/api/health-check/route.ts (exclue du matcher middleware)
export async function GET() {
  return Response.json({
    status: 'healthy',
    env: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  });
}
```

**Objectif** : Isoler si le problème vient du middleware.

#### 1.3 Enhanced Logging System

Créer un système de logging structuré avec correlation IDs :

```typescript
// lib/utils/logger.ts
interface LogContext {
  correlationId: string;
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export function createLogger(service: string) {
  return {
    info: (message: string, meta?: Record<string, any>) => {
      const log: LogContext = {
        correlationId: generateCorrelationId(),
        timestamp: new Date().toISOString(),
        service,
        level: 'info',
        message,
        metadata: meta,
      };
      console.log(JSON.stringify(log));
    },
    error: (message: string, error: Error, meta?: Record<string, any>) => {
      const log: LogContext = {
        correlationId: generateCorrelationId(),
        timestamp: new Date().toISOString(),
        service,
        level: 'error',
        message,
        metadata: meta,
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        },
      };
      console.error(JSON.stringify(log));
    },
  };
}
```

### 2. Middleware Improvements

#### 2.1 Fail-Safe Rate Limiting

Modifier le middleware pour qu'il ne bloque JAMAIS les requêtes en cas d'erreur :

```typescript
// middleware.ts (modification)
export default async function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname

  // Skip rate limiting for auth routes during debugging
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/ping') || pathname.startsWith('/api/health-check')) {
    console.log('[Middleware] Bypassing rate limit for:', pathname);
    return NextResponse.next();
  }

  if (rateLimitingEnabled && pathname.startsWith('/api/')) {
    try {
      // Rate limiting logic...
    } catch (error) {
      // CRITICAL: Log but don't block
      console.error('[Middleware] Rate limiting error - allowing request', {
        error: error instanceof Error ? error.message : String(error),
        pathname,
      });
      // FAIL OPEN - continue without rate limiting
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}
```

#### 2.2 Lazy Loading of Rate Limiter

Utiliser des imports dynamiques pour éviter les erreurs d'initialisation :

```typescript
// middleware.ts
let rateLimiterModule: any = null;

async function getRateLimiter() {
  if (!rateLimiterModule) {
    try {
      rateLimiterModule = await import('./lib/services/rate-limiter/rate-limiter');
    } catch (error) {
      console.error('[Middleware] Failed to load rate limiter:', error);
      return null;
    }
  }
  return rateLimiterModule?.rateLimiter;
}
```

### 3. NextAuth Configuration Improvements

#### 3.1 Serverless-Optimized Config

Simplifier la configuration pour éliminer toute dépendance synchrone :

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// NO IMPORTS of: bcrypt, @/lib/db, ioredis, etc.

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt', // CRITICAL: JWT only, no database
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // PHASE 1: Ultra-minimal - accept any credentials
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Return test user (no DB query)
        return {
          id: 'test-user-' + Date.now(),
          email: credentials.email as string,
          name: 'Test User',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: false, // Disable debug in production to avoid console spam
});
```

#### 3.2 Progressive Enhancement Strategy

Une fois la configuration minimale fonctionnelle, réintégrer progressivement :

**Phase 1** : Configuration minimale (actuelle)
- ✅ JWT only
- ✅ Test credentials
- ✅ No external dependencies

**Phase 2** : Database validation (future)
- Add dynamic import of database client
- Validate credentials against DB
- Keep JWT strategy

**Phase 3** : Full features (future)
- Add bcrypt password hashing
- Add session management
- Add OAuth providers

### 4. Next.js Configuration Adjustments

#### 4.1 Disable Console Removal in Staging

```typescript
// next.config.ts
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' && process.env.AMPLIFY_ENV === 'production',
  // Keep console.log in staging for debugging
},
```

#### 4.2 Explicit Runtime Configuration

```typescript
// next.config.ts
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',
  },
  // Force Node.js runtime for API routes
  serverComponentsExternalPackages: ['next-auth'],
},
```

## Data Models

### Log Entry Model

```typescript
interface LogEntry {
  correlationId: string;
  timestamp: string; // ISO 8601
  service: string; // 'nextauth' | 'middleware' | 'api'
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: {
    pathname?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
    userId?: string;
    [key: string]: any;
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### Diagnostic Response Model

```typescript
interface DiagnosticResponse {
  status: 'ok' | 'error';
  timestamp: string;
  correlationId: string;
  checks: {
    runtime: 'pass' | 'fail';
    middleware: 'pass' | 'fail' | 'bypassed';
    nextauth: 'pass' | 'fail' | 'not_tested';
    environment: 'pass' | 'fail';
  };
  env?: {
    nodeEnv: string;
    hasNextAuthSecret: boolean;
    hasNextAuthUrl: boolean;
    hasDatabaseUrl: boolean;
  };
  errors?: string[];
}
```

## Error Handling

### Error Classification

1. **Configuration Errors** (4xx)
   - Missing environment variables
   - Invalid configuration
   - → Return 400 Bad Request with details

2. **Runtime Errors** (5xx)
   - Module import failures
   - Database connection errors
   - → Return 500 Internal Server Error with correlation ID

3. **Rate Limit Errors** (429)
   - Too many requests
   - → Return 429 with Retry-After header

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string; // 'NEXTAUTH_INIT_ERROR', 'MIDDLEWARE_ERROR', etc.
    message: string;
    correlationId: string;
    timestamp: string;
    details?: Record<string, any>;
  };
}
```

### Fail-Safe Strategy

**Principe** : En cas d'erreur non-critique, le système doit continuer à fonctionner en mode dégradé.

- Middleware rate limiting error → Allow request (fail open)
- NextAuth initialization error → Log and return 500 (fail closed for auth)
- Database connection error → Use test credentials (fail open for testing)

## Testing Strategy

### Phase 1: Isolation Testing

1. **Test 1: Ultra-Simple Route**
   ```bash
   curl https://staging.huntaze.com/api/ping
   # Expected: 200 OK
   ```

2. **Test 2: Health Check (No Middleware)**
   ```bash
   curl https://staging.huntaze.com/api/health-check
   # Expected: 200 OK with env status
   ```

3. **Test 3: Test-Env (With Middleware)**
   ```bash
   curl https://staging.huntaze.com/api/test-env
   # Expected: 200 OK or specific error
   ```

4. **Test 4: NextAuth Signin**
   ```bash
   curl -I https://staging.huntaze.com/api/auth/signin
   # Expected: 200 OK
   ```

### Phase 2: Integration Testing

1. **Test 5: Full Auth Flow**
   - Navigate to `/auth`
   - Enter test credentials
   - Verify session creation
   - Verify redirect to dashboard

2. **Test 6: Rate Limiting**
   - Make 100 requests to `/api/test-env`
   - Verify rate limit headers
   - Verify no 500 errors

### Phase 3: Load Testing

1. **Test 7: Concurrent Requests**
   - 50 concurrent requests to `/api/auth/signin`
   - Verify all return 200
   - Verify no timeouts

2. **Test 8: Sustained Load**
   - 1000 requests over 5 minutes
   - Verify error rate < 0.1%
   - Verify p95 latency < 500ms

## Deployment Strategy

### Step 1: Deploy Diagnostic Routes

1. Create `/api/ping` route
2. Create `/api/health-check` route (excluded from middleware)
3. Deploy and test

### Step 2: Update Middleware

1. Add bypass for auth routes
2. Add fail-safe error handling
3. Add structured logging
4. Deploy and test

### Step 3: Simplify NextAuth Config

1. Remove all external dependencies
2. Use test credentials only
3. Deploy and test

### Step 4: Progressive Enhancement

1. Once working, add database validation
2. Add password hashing
3. Add full features

## Monitoring and Observability

### CloudWatch Logs Queries

```
# Find all NextAuth errors
fields @timestamp, @message
| filter @message like /nextauth/i
| filter @message like /error/i
| sort @timestamp desc
| limit 100

# Find correlation ID
fields @timestamp, @message
| filter @message like /correlation-id-here/
| sort @timestamp desc
```

### Metrics to Track

1. **Error Rate**: Percentage of 500 responses
2. **Latency**: p50, p95, p99 response times
3. **Success Rate**: Percentage of successful auth attempts
4. **Rate Limit Hits**: Number of 429 responses

### Alerts

1. **Critical**: Error rate > 5% for 5 minutes
2. **Warning**: Latency p95 > 1000ms for 10 minutes
3. **Info**: Rate limit hits > 100/minute

## Success Criteria

1. ✅ `/api/ping` returns 200
2. ✅ `/api/health-check` returns 200
3. ✅ `/api/test-env` returns 200
4. ✅ `/api/auth/signin` returns 200
5. ✅ Full auth flow works on `/auth`
6. ✅ No 500 errors for 1000 consecutive requests
7. ✅ Structured logs visible in CloudWatch
8. ✅ Correlation IDs traceable across requests
