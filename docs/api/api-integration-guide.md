# Guide d'Intégration API - Huntaze

## Vue d'Ensemble

Ce guide détaille l'intégration API complète de Huntaze avec gestion d'erreurs robuste, retry strategies, authentification, monitoring, et optimisations de performance.

## Architecture API

### Stack Technologique
- **Framework**: Next.js 14 avec App Router
- **Validation**: Zod pour la validation de schémas
- **Authentification**: JWT + API Keys avec RBAC
- **Monitoring**: Service de monitoring personnalisé
- **Cache**: Cache en mémoire avec TTL
- **Rate Limiting**: Sliding window avec exponential backoff

### Middlewares Disponibles

#### 1. Authentification et Autorisation (`api-auth.ts`)
```typescript
import { withAuthAndRateLimit } from '@/lib/middleware/api-auth';

// Usage dans une route API
const authContext = await withAuthAndRateLimit(
  request,
  'content:generate',  // Permission requise
  'contentGeneration'  // Opération pour rate limiting
);
```

**Fonctionnalités:**
- Authentification JWT et API Key
- Système RBAC avec permissions granulaires
- Rate limiting par utilisateur et opération
- Métriques d'authentification
- Health check intégré

#### 2. Validation et Sanitization (`api-validation.ts`)
```typescript
import { withCompleteValidation, CommonSchemas } from '@/lib/middleware/api-validation';

const handler = withCompleteValidation({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().max(1000),
  }),
  query: CommonSchemas.pagination,
  customValidator: async (data) => {
    // Validation métier personnalisée
  },
})(async (request: ValidatedRequest) => {
  const { body, query } = getValidatedData(request);
  // Traitement avec données validées
});
```

**Fonctionnalités:**
- Validation Zod avec messages d'erreur détaillés
- Sanitization automatique des données
- Validation métier personnalisée
- Schémas communs réutilisables
- Support TypeScript complet

#### 3. Monitoring et Métriques (`api-monitoring-service.ts`)
```typescript
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';

const monitoring = getAPIMonitoringService();

// Enregistrement automatique des métriques
monitoring.recordMetric({
  endpoint: '/api/content/generate',
  method: 'POST',
  statusCode: 200,
  responseTime: 150,
  userId: 'user123',
  tokensUsed: 250,
  cacheHit: true,
});
```

**Fonctionnalités:**
- Collecte automatique des métriques
- Alertes en temps réel
- Monitoring de performance
- Tracking des tokens AI
- Export des données

## Services Optimisés

### 1. Optimization Engine

**Améliorations apportées:**
- ✅ Retry automatique avec exponential backoff
- ✅ Cache intelligent avec TTL configurable
- ✅ Rate limiting par opération
- ✅ Logging structuré avec contexte
- ✅ Métriques de performance
- ✅ Health check complet
- ✅ Gestion d'erreurs typée

**Exemple d'utilisation:**
```typescript
import { getOptimizationEngine } from '@/lib/services/optimization-engine';

const engine = getOptimizationEngine();

try {
  const recommendation = await engine.optimizePricing(pricingData, {
    strategy: 'balanced',
    riskTolerance: 'moderate'
  });
  
  console.log(`Recommended price: ${recommendation.recommendedPrice}`);
  console.log(`Confidence: ${recommendation.confidence}%`);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Gérer le rate limiting
    await delay(error.context.resetIn);
  } else {
    // Autres erreurs
    console.error('Optimization failed:', error.message);
  }
}
```

### 2. Content Idea Generator

**Améliorations apportées:**
- ✅ Cache des tendances avec invalidation intelligente
- ✅ Retry avec classification d'erreurs
- ✅ Validation d'entrée robuste
- ✅ Fallback sur échec AI
- ✅ Métriques de performance

### 3. Message Personalization

**Améliorations apportées:**
- ✅ Templates avec performance tracking
- ✅ Personnalisation basée sur l'historique
- ✅ Gestion d'erreurs gracieuse
- ✅ Métriques d'engagement

## Endpoints API

### POST /api/content-ideas/generate

**Description:** Génère des idées de contenu personnalisées avec IA

**Authentification:** Requise (API Key ou JWT)

**Rate Limit:** 100 requêtes/heure

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```typescript
{
  creatorProfile: {
    id: string;
    niche: string[];
    contentTypes: string[];
    audiencePreferences: string[];
    // ... autres champs
  },
  options?: {
    count?: number;        // 1-50, défaut: 10
    focusArea?: string;    // 'trending' | 'evergreen' | 'seasonal' | 'monetization'
    includeAnalysis?: boolean;
  }
}
```

**Réponse Succès (200):**
```typescript
{
  success: true,
  data: {
    ideas: ContentIdea[];
    trendAnalysis?: TrendData[];
    recommendations: string[];
    nextSteps: string[];
    metadata: {
      generatedAt: string;
      tokensUsed?: number;
      cacheHit: boolean;
    };
  },
  meta: {
    requestId: string;
    timestamp: string;
    duration: number;
    performance: {
      tokensUsed?: number;
      cacheHit: boolean;
      processingTime: number;
    };
  }
}
```

**Headers de Réponse:**
```
X-Response-Time: 150
X-Cache-Status: HIT|MISS
X-Tokens-Used: 250
X-RateLimit-Remaining: 95
```

### GET /api/health

**Description:** Health check complet de tous les services

**Authentification:** Non requise

**Réponse:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
  system: {
    memory: { used: number; total: number; percentage: number; };
    cpu: { usage: number; };
  };
}
```

## Gestion d'Erreurs

### Types d'Erreurs

#### 1. Erreurs de Validation (400)
```typescript
{
  success: false,
  error: {
    type: 'validation_error',
    message: 'Request validation failed',
    code: 'VALIDATION_FAILED',
    details: [
      {
        field: 'body.creatorProfile.niche',
        message: 'Array must contain at least 1 element(s)',
        code: 'too_small'
      }
    ]
  }
}
```

#### 2. Erreurs d'Authentification (401)
```typescript
{
  success: false,
  error: {
    type: 'authentication_error',
    message: 'Invalid API key',
    code: 'AUTHENTICATION_ERROR'
  }
}
```

#### 3. Erreurs d'Autorisation (403)
```typescript
{
  success: false,
  error: {
    type: 'authorization_error',
    message: 'Permission denied: content:generate',
    code: 'AUTHORIZATION_ERROR'
  }
}
```

#### 4. Rate Limiting (429)
```typescript
{
  success: false,
  error: {
    type: 'rate_limit_exceeded',
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  }
}
```

**Headers:**
```
Retry-After: 3600
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

#### 5. Erreurs Serveur (500)
```typescript
{
  success: false,
  error: {
    type: 'internal_error',
    message: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_SERVER_ERROR'
  }
}
```

### Stratégies de Retry

#### Configuration Recommandée
```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 seconde
  maxDelay: 10000,      // 10 secondes
  backoffMultiplier: 2,
};
```

#### Erreurs Retryables
- Erreurs réseau (NETWORK_ERROR, TIMEOUT)
- Rate limiting (429)
- Erreurs serveur (5xx)
- Erreurs avec flag `retryable: true`

#### Erreurs Non-Retryables
- Erreurs de validation (400)
- Erreurs d'authentification (401)
- Erreurs d'autorisation (403)

#### Exemple d'Implémentation Client
```typescript
async function callAPIWithRetry<T>(
  apiCall: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // Vérifier si l'erreur est retryable
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }
      
      // Calculer le délai avec exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

function isRetryableError(error: any): boolean {
  return error.status >= 500 || 
         error.status === 429 || 
         error.code === 'NETWORK_ERROR' ||
         error.retryable === true;
}
```

## Authentification

### API Keys

#### Génération
```typescript
import { APIAuthService } from '@/lib/middleware/api-auth';

const authService = APIAuthService.getInstance();

const apiKey = authService.generateAPIKey(
  'user123',
  'creator',
  ['content:generate', 'content:brainstorm'],
  {
    contentGeneration: 100,
    brainstorming: 50,
    trendAnalysis: 10,
  }
);
```

#### Utilisation
```bash
curl -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"creatorProfile": {...}}' \
     https://api.huntaze.com/api/content-ideas/generate
```

### JWT Tokens

#### Format du Payload
```typescript
{
  sub: 'user123',           // User ID
  role: 'creator',          // User role
  permissions: string[];    // Array of permissions
  rateLimits: {            // Rate limits per operation
    contentGeneration: 100,
    brainstorming: 50,
    trendAnalysis: 10,
  },
  exp: 1640995200,         // Expiration timestamp
  iat: 1640908800,         // Issued at timestamp
}
```

## Monitoring et Métriques

### Métriques Collectées

#### Par Requête
- Endpoint et méthode HTTP
- Code de statut de réponse
- Temps de réponse
- ID utilisateur
- Tokens AI utilisés
- Status du cache (HIT/MISS)
- Type d'erreur (si applicable)

#### Agrégées
- Nombre total de requêtes
- Taux de succès/erreur
- Temps de réponse moyen
- Taux de cache hit
- Utilisateurs actifs
- Consommation de tokens

### Alertes Automatiques

#### Seuils par Défaut
```typescript
{
  highLatency: 5000,        // 5 secondes
  errorRate: 5,             // 5%
  rateLimitRate: 10,        // 10%
  tokenUsagePerHour: 10000, // 10k tokens/heure
}
```

#### Types d'Alertes
- **Latence élevée**: Temps de réponse > seuil
- **Taux d'erreur élevé**: % d'erreurs > seuil
- **Rate limiting fréquent**: Trop de 429
- **Usage tokens élevé**: Consommation excessive

### Dashboard de Monitoring

#### Métriques en Temps Réel
```typescript
// Obtenir les métriques de santé
const health = monitoring.getHealthMetrics();

// Métriques par endpoint
const endpointMetrics = monitoring.getEndpointMetrics();

// Alertes actives
const alerts = monitoring.getActiveAlerts();

// Métriques utilisateur
const userMetrics = monitoring.getUserMetrics('user123');
```

## Optimisations de Performance

### 1. Caching

#### Stratégie Multi-Niveau
```typescript
// Cache L1: En mémoire (rapide, limité)
const cacheL1 = new Map(); // TTL: 5 minutes

// Cache L2: Redis (persistant, partagé)
const cacheL2 = redis; // TTL: 1 heure

// Cache L3: Base de données (permanent)
const cacheL3 = database; // Pas d'expiration
```

#### Clés de Cache Intelligentes
```typescript
function generateCacheKey(operation: string, params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return `${operation}:${hashString(sortedParams)}`;
}
```

### 2. Rate Limiting Adaptatif

#### Sliding Window avec Burst
```typescript
interface RateLimitConfig {
  windowSize: number;     // Taille de la fenêtre (ms)
  maxRequests: number;    // Requêtes max par fenêtre
  burstSize: number;      // Burst autorisé
  penaltyMultiplier: number; // Multiplicateur de pénalité
}
```

### 3. Connection Pooling

#### Configuration Optimale
```typescript
const poolConfig = {
  min: 2,                 // Connexions minimum
  max: 10,                // Connexions maximum
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
};
```

### 4. Compression et Optimisation

#### Headers de Performance
```typescript
// Compression automatique
app.use(compression({
  level: 6,
  threshold: 1024,
}));

// Headers de cache
response.headers.set('Cache-Control', 'public, max-age=3600');
response.headers.set('ETag', generateETag(content));
```

## Sécurité

### 1. Validation d'Entrée

#### Sanitization Automatique
```typescript
// Suppression des caractères dangereux
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '')           // HTML
    .replace(/javascript:/gi, '')   // Protocoles dangereux
    .replace(/on\w+=/gi, '');      // Event handlers
}
```

### 2. Rate Limiting de Sécurité

#### Protection DDoS
```typescript
const securityLimits = {
  global: 1000,           // Requêtes/minute globales
  perIP: 100,             // Requêtes/minute par IP
  perUser: 200,           // Requêtes/minute par utilisateur
  perEndpoint: 50,        // Requêtes/minute par endpoint
};
```

### 3. Audit et Logging

#### Logs de Sécurité
```typescript
interface SecurityLog {
  timestamp: Date;
  event: 'auth_failure' | 'rate_limit' | 'suspicious_activity';
  userId?: string;
  ip: string;
  userAgent: string;
  details: any;
}
```

## Déploiement et Configuration

### Variables d'Environnement

```bash
# API Configuration
NODE_ENV=production
API_VERSION=1.0.0
API_BASE_URL=https://api.huntaze.com

# Authentication
JWT_SECRET=your-jwt-secret
API_KEY_SALT=your-api-key-salt

# Rate Limiting
RATE_LIMIT_WINDOW=3600000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
MONITORING_WEBHOOK_URL=https://monitoring.example.com/webhook
LOG_LEVEL=info

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Cache Configuration
CACHE_TTL=3600000
CACHE_MAX_SIZE=1000

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
```

### Configuration Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build application
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
```

### Configuration Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: huntaze-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: huntaze-api
  template:
    metadata:
      labels:
        app: huntaze-api
    spec:
      containers:
      - name: api
        image: huntaze/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Tests et Validation

### Tests d'Intégration

```typescript
describe('API Integration', () => {
  it('should handle complete request lifecycle', async () => {
    const response = await request(app)
      .post('/api/content-ideas/generate')
      .set('Authorization', 'Bearer test-token')
      .send(validRequestBody)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.ideas).toBeDefined();
    expect(response.headers['x-response-time']).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    // Faire plusieurs requêtes rapidement
    const promises = Array(101).fill(null).map(() =>
      request(app)
        .post('/api/content-ideas/generate')
        .set('Authorization', 'Bearer test-token')
        .send(validRequestBody)
    );

    const results = await Promise.allSettled(promises);
    const rateLimited = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### Tests de Performance

```typescript
describe('Performance Tests', () => {
  it('should respond within acceptable time', async () => {
    const startTime = Date.now();
    
    await request(app)
      .post('/api/content-ideas/generate')
      .set('Authorization', 'Bearer test-token')
      .send(validRequestBody)
      .expect(200);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 secondes max
  });

  it('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const promises = Array(concurrentRequests).fill(null).map(() =>
      request(app)
        .post('/api/content-ideas/generate')
        .set('Authorization', 'Bearer test-token')
        .send(validRequestBody)
    );

    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result.status).toBe(200);
    });
  });
});
```

## Conclusion

Cette intégration API complète fournit :

✅ **Gestion d'erreurs robuste** avec retry automatique et fallbacks
✅ **Authentification sécurisée** avec JWT et API keys
✅ **Rate limiting intelligent** avec protection DDoS
✅ **Monitoring complet** avec alertes en temps réel
✅ **Validation stricte** avec sanitization automatique
✅ **Performance optimisée** avec cache multi-niveau
✅ **Documentation complète** avec exemples pratiques
✅ **Tests exhaustifs** pour la fiabilité
✅ **Déploiement production-ready** avec health checks

L'API est maintenant prête pour un environnement de production avec une scalabilité et une fiabilité maximales.