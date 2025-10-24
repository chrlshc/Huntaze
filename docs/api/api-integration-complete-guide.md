# Guide Complet d'Intégration API

## Vue d'ensemble

Ce guide couvre l'intégration complète des APIs avec gestion d'erreurs robuste, retry strategies, authentification, caching et monitoring.

## Architecture

### Services Principaux

1. **APIIntegrationService** - Service centralisé pour toutes les requêtes API
2. **APIMonitoringService** - Monitoring et métriques des performances
3. **APIAuthService** - Gestion de l'authentification et autorisation
4. **APIValidationService** - Validation des requêtes et réponses

### Hooks React

1. **useAPI** - Hook principal pour les requêtes API
2. **useAPIGet** - Hook spécialisé pour les requêtes GET
3. **useAPIMutation** - Hook pour les mutations (POST, PUT, DELETE)
4. **usePaginatedAPI** - Hook pour les données paginées
5. **usePollingAPI** - Hook pour les requêtes en temps réel
6. **useFileUpload** - Hook pour l'upload de fichiers

## Configuration

### Configuration Globale

```typescript
// lib/config/api-config.ts
export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  cacheConfig: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    keyPrefix: 'api_cache',
  },
  authConfig: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenEndpoint: '/api/auth/refresh',
  },
};
```

### Variables d'Environnement

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.huntaze.com
API_SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW=3600000
RATE_LIMIT_MAX_REQUESTS=100
MONITORING_WEBHOOK_URL=https://monitoring.huntaze.com/webhook
```

## Utilisation des Services

### Service d'Intégration API

```typescript
import { apiRequest, apiGet, apiPost } from '@/lib/services/api-integration-service';

// Requête GET simple
const response = await apiGet<User>('/api/users/123');

// Requête POST avec données
const newUser = await apiPost<User>('/api/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// Requête avec options avancées
const response = await apiRequest<ContentIdea[]>('/api/content-ideas', {
  method: 'POST',
  body: { creatorProfile },
  cacheKey: 'content-ideas-creator-123',
  cacheTTL: 600000, // 10 minutes
  retryConfig: {
    maxAttempts: 5,
    baseDelay: 2000,
  },
  debounceKey: 'content-ideas-generation',
  debounceDelay: 500,
});
```

### Hooks React

#### Hook useAPI

```typescript
import { useAPI } from '@/lib/hooks/use-api-integration';

function UserProfile({ userId }: { userId: string }) {
  const {
    data: user,
    loading,
    error,
    execute,
    retry,
  } = useAPI<User>(`/api/users/${userId}`, {
    immediate: true,
    cacheKey: `user-${userId}`,
    onSuccess: (user) => {
      console.log('User loaded:', user.name);
    },
    onError: (error) => {
      console.error('Failed to load user:', error.message);
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={retry}>Refresh</button>
    </div>
  );
}
```

#### Hook useAPIMutation

```typescript
import { useAPIMutation } from '@/lib/hooks/use-api-integration';

function CreateUserForm() {
  const {
    mutate: createUser,
    mutateAsync: createUserAsync,
    loading,
    error,
    data: newUser,
  } = useAPIMutation<User, CreateUserRequest>('/api/users', {
    method: 'POST',
    onSuccess: (user) => {
      console.log('User created:', user.id);
      // Redirect or update UI
    },
  });

  const handleSubmit = async (formData: CreateUserRequest) => {
    try {
      const user = await createUserAsync(formData);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit(Object.fromEntries(formData));
    }}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

#### Hook usePaginatedAPI

```typescript
import { usePaginatedAPI } from '@/lib/hooks/use-api-integration';

function UsersList() {
  const {
    data: users,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedAPI<User>('/api/users', {
    pageSize: 20,
    autoLoad: true,
  });

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
      
      {error && <div className="error">{error.message}</div>}
    </div>
  );
}
```

#### Hook useFileUpload

```typescript
import { useFileUpload } from '@/lib/hooks/use-api-integration';

function FileUploader() {
  const {
    upload,
    uploading,
    progress,
    error,
    reset,
  } = useFileUpload('/api/upload', {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress}%`);
    },
    onSuccess: (response) => {
      console.log('File uploaded:', response.url);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      upload(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {uploading && (
        <div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{progress.toFixed(1)}% uploaded</p>
        </div>
      )}
      
      {error && (
        <div className="error">
          {error}
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

## Gestion des Erreurs

### Error Boundary

```typescript
import { APIErrorProvider } from '@/components/error-boundary/APIErrorBoundary';

function App() {
  return (
    <APIErrorProvider
      enableRetry={true}
      maxRetries={3}
      onError={(error, errorInfo) => {
        // Log to monitoring service
        console.error('API Error:', error, errorInfo);
      }}
    >
      <YourAppContent />
    </APIErrorProvider>
  );
}
```

### Gestion Personnalisée des Erreurs

```typescript
import { useAPIErrorHandler } from '@/components/error-boundary/APIErrorBoundary';

function MyComponent() {
  const { handleError, getErrorMessage, getErrorSeverity } = useAPIErrorHandler();

  const handleAPICall = async () => {
    try {
      const result = await apiGet('/api/data');
      // Handle success
    } catch (error) {
      const severity = getErrorSeverity(error as APIError);
      const message = getErrorMessage(error as APIError);
      
      if (severity === 'critical') {
        // Show critical error UI
        handleError(error as APIError);
      } else {
        // Show inline error message
        setErrorMessage(message);
      }
    }
  };
}
```

## Authentification et Autorisation

### Configuration de l'Auth

```typescript
import { APIAuthService } from '@/lib/middleware/api-auth';

const authService = APIAuthService.getInstance();

// Générer une clé API
const apiKey = authService.generateAPIKey(
  'user-123',
  'creator',
  ['content:generate', 'content:brainstorm'],
  {
    contentGeneration: 100,
    brainstorming: 50,
    trendAnalysis: 10,
  }
);

// Authentifier une requête
const authContext = await authService.authenticate(request);

// Vérifier les permissions
authService.authorize(authContext, 'content:generate');

// Vérifier les rate limits
await authService.checkRateLimit(authContext, 'contentGeneration');
```

### Middleware d'Auth pour les Routes API

```typescript
import { withAuthAndRateLimit } from '@/lib/middleware/api-auth';
import { withCompleteValidation } from '@/lib/middleware/api-validation';

const handler = withCompleteValidation({
  body: RequestSchema,
  enableSanitization: true,
})(async (request: NextRequest) => {
  // Authentification et rate limiting
  const authContext = await withAuthAndRateLimit(
    request,
    'content:generate',
    'contentGeneration'
  );

  // Logique de l'API
  const result = await processRequest(request, authContext);
  
  return NextResponse.json({ success: true, data: result });
});

export { handler as POST };
```

## Validation des Données

### Schémas de Validation

```typescript
import { z } from 'zod';
import { CommonSchemas } from '@/lib/middleware/api-validation';

const CreateContentIdeaSchema = z.object({
  creatorProfile: z.object({
    id: z.string(),
    niche: z.array(z.string()).min(1),
    contentTypes: z.array(z.string()).min(1),
  }),
  options: z.object({
    count: z.number().min(1).max(50).default(10),
    category: z.enum(['photo', 'video', 'story', 'ppv', 'live']).optional(),
    focusArea: z.enum(['trending', 'evergreen', 'seasonal', 'monetization']).default('trending'),
  }).default({}),
});

// Utilisation avec validation personnalisée
const handler = withCompleteValidation({
  body: CreateContentIdeaSchema,
  query: CommonSchemas.pagination,
  customValidator: async (data) => {
    await CustomValidators.validateBusinessRules(data);
  },
})(async (request: ValidatedRequest) => {
  const { body, query } = getValidatedData(request);
  // Données validées et typées
});
```

## Monitoring et Métriques

### Configuration du Monitoring

```typescript
import { getAPIMonitoringService } from '@/lib/services/api-monitoring-service';

const monitoring = getAPIMonitoringService();

// Enregistrer une métrique
monitoring.recordMetric({
  endpoint: '/api/content-ideas/generate',
  method: 'POST',
  statusCode: 200,
  responseTime: 1250,
  userId: 'user-123',
  tokensUsed: 150,
  cacheHit: false,
});

// Obtenir les métriques de santé
const health = monitoring.getHealthMetrics();
console.log(`Success rate: ${health.successRate}%`);
console.log(`Average response time: ${health.averageResponseTime}ms`);

// Obtenir les alertes actives
const alerts = monitoring.getActiveAlerts();
alerts.forEach(alert => {
  console.log(`${alert.severity.toUpperCase()}: ${alert.message}`);
});
```

### Dashboard de Monitoring

```typescript
import { usePollingAPI } from '@/lib/hooks/use-api-integration';

function MonitoringDashboard() {
  const { data: metrics } = usePollingAPI<APIHealthMetrics>('/api/monitoring/health', {
    interval: 30000, // 30 secondes
    enabled: true,
  });

  const { data: alerts } = usePollingAPI<PerformanceAlert[]>('/api/monitoring/alerts', {
    interval: 10000, // 10 secondes
    enabled: true,
  });

  return (
    <div className="monitoring-dashboard">
      <div className="metrics-grid">
        <MetricCard title="Success Rate" value={`${metrics?.successRate}%`} />
        <MetricCard title="Avg Response Time" value={`${metrics?.averageResponseTime}ms`} />
        <MetricCard title="Active Users" value={metrics?.activeUsers} />
        <MetricCard title="Cache Hit Rate" value={`${metrics?.cacheHitRate}%`} />
      </div>
      
      <AlertsList alerts={alerts || []} />
    </div>
  );
}
```

## Optimisations de Performance

### Caching Stratégique

```typescript
// Cache par type de données
const cacheStrategies = {
  // Données statiques - cache long
  userProfile: { ttl: 3600000, key: (userId: string) => `user-${userId}` },
  
  // Données dynamiques - cache court
  contentIdeas: { ttl: 300000, key: (creatorId: string) => `ideas-${creatorId}` },
  
  // Données temps réel - pas de cache
  liveMetrics: { ttl: 0 },
};

// Utilisation avec le hook
const { data } = useAPI('/api/users/123', {
  cacheKey: cacheStrategies.userProfile.key('123'),
  cacheTTL: cacheStrategies.userProfile.ttl,
});
```

### Debouncing et Throttling

```typescript
// Debouncing pour les recherches
const { data: searchResults } = useAPI(
  () => `/api/search?q=${searchQuery}`,
  {
    debounceKey: 'search',
    debounceDelay: 300,
    dependencies: [searchQuery],
    enabled: searchQuery.length > 2,
  }
);

// Throttling pour les analytics
const { execute: trackEvent } = useAPI('/api/analytics/track', {
  immediate: false,
  debounceKey: 'analytics',
  debounceDelay: 1000,
});
```

### Optimisation des Requêtes

```typescript
// Requêtes parallèles
const [userResult, settingsResult, notificationsResult] = await Promise.allSettled([
  apiGet<User>('/api/user'),
  apiGet<Settings>('/api/settings'),
  apiGet<Notification[]>('/api/notifications'),
]);

// Requêtes conditionnelles
const { data: user } = useAPI('/api/user', { immediate: true });
const { data: premiumFeatures } = useAPI('/api/premium-features', {
  immediate: true,
  enabled: user?.isPremium === true,
  dependencies: [user?.isPremium],
});
```

## Tests et Debugging

### Tests Unitaires

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAPI } from '@/lib/hooks/use-api-integration';

describe('useAPI Hook', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => 
      useAPI<User>('/api/users/123', { immediate: true })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle errors correctly', async () => {
    // Mock API error
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => 
      useAPI<User>('/api/users/invalid', { immediate: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeNull();
    });
  });
});
```

### Debugging

```typescript
// Activer les logs de debug
localStorage.setItem('api_debug', 'true');

// Obtenir les logs de debug
import { apiIntegration } from '@/lib/services/api-integration-service';

const debugLogs = apiIntegration.getDebugLogs('error', 50);
console.table(debugLogs);

// Statistiques du cache
const cacheStats = apiIntegration.getCacheStats();
console.log('Cache hit rate:', cacheStats.hitRate);
console.log('Cache size:', cacheStats.size);
```

## Endpoints API Documentés

### Content Ideas Generation

```typescript
/**
 * POST /api/content-ideas/generate
 * 
 * Génère des idées de contenu personnalisées
 * 
 * @param creatorProfile - Profil du créateur
 * @param options - Options de génération
 * @returns ContentIdea[] - Liste des idées générées
 * 
 * Rate Limit: 10 requêtes/heure par créateur
 * Cache: 10 minutes par profil créateur
 * Tokens: ~150-300 par requête
 */
interface GenerateContentIdeasRequest {
  creatorProfile: CreatorProfile;
  options?: {
    count?: number; // 1-50, défaut: 10
    category?: 'photo' | 'video' | 'story' | 'ppv' | 'live';
    focusArea?: 'trending' | 'evergreen' | 'seasonal' | 'monetization';
    includeAnalysis?: boolean; // défaut: true
  };
}

interface GenerateContentIdeasResponse {
  success: boolean;
  data: {
    ideas: ContentIdea[];
    trendAnalysis?: TrendData[];
    recommendations: string[];
    nextSteps: string[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    duration: number;
    tokensUsed?: number;
    cacheHit: boolean;
  };
}
```

### Message Personalization

```typescript
/**
 * POST /api/messages/personalize
 * 
 * Génère des messages personnalisés pour les fans
 * 
 * @param fanProfile - Profil du fan
 * @param messageType - Type de message
 * @param options - Options de personnalisation
 * @returns PersonalizedMessage - Message personnalisé
 * 
 * Rate Limit: 50 requêtes/heure par créateur
 * Cache: 5 minutes par profil fan
 * Tokens: ~50-150 par requête
 */
interface PersonalizeMessageRequest {
  fanProfile: FanProfile;
  messageType: 'greeting' | 'upsell' | 'ppv_offer' | 'reactivation' | 'thank_you';
  options?: {
    tone?: 'friendly' | 'flirty' | 'professional';
    includeEmojis?: boolean;
    maxLength?: number;
  };
}
```

### Optimization Engine

```typescript
/**
 * POST /api/optimization/pricing
 * 
 * Optimise les prix du contenu
 * 
 * @param pricingData - Données de pricing
 * @param options - Options d'optimisation
 * @returns PricingRecommendation - Recommandations de prix
 * 
 * Rate Limit: 20 requêtes/heure par créateur
 * Cache: 1 heure par contenu
 * Tokens: ~200-400 par requête
 */
interface OptimizePricingRequest {
  pricingData: PricingData;
  options?: {
    strategy?: 'revenue_max' | 'conversion_max' | 'balanced';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  };
}
```

## Meilleures Pratiques

### 1. Gestion des Erreurs

- Toujours utiliser l'APIErrorBoundary au niveau racine
- Implémenter des fallbacks pour les erreurs critiques
- Logger les erreurs avec contexte suffisant
- Fournir des messages d'erreur utilisateur-friendly

### 2. Performance

- Utiliser le cache pour les données statiques
- Implémenter le debouncing pour les recherches
- Optimiser les requêtes avec pagination
- Monitorer les métriques de performance

### 3. Sécurité

- Valider toutes les entrées utilisateur
- Utiliser l'authentification pour les endpoints sensibles
- Implémenter le rate limiting
- Sanitiser les données avant traitement

### 4. Monitoring

- Enregistrer toutes les métriques importantes
- Configurer des alertes pour les problèmes critiques
- Monitorer l'usage des tokens AI
- Suivre les taux d'erreur et de succès

### 5. Tests

- Tester tous les cas d'erreur
- Mocker les services externes
- Tester les retry strategies
- Valider les transformations de données

## Dépannage

### Problèmes Courants

1. **Rate Limiting**
   - Vérifier les limites configurées
   - Implémenter l'exponential backoff
   - Utiliser le cache pour réduire les requêtes

2. **Erreurs d'Authentification**
   - Vérifier la validité des tokens
   - Implémenter le refresh automatique
   - Gérer l'expiration des sessions

3. **Performance Lente**
   - Optimiser les requêtes de base de données
   - Utiliser le cache efficacement
   - Réduire la taille des payloads

4. **Erreurs de Validation**
   - Vérifier les schémas Zod
   - Valider les types TypeScript
   - Tester avec des données réelles

### Outils de Debug

```typescript
// Console de debug API
window.apiDebug = {
  logs: () => apiIntegration.getDebugLogs(),
  cache: () => apiIntegration.getCacheStats(),
  health: () => apiIntegration.healthCheck(),
  monitoring: () => getAPIMonitoringService().getHealthMetrics(),
};
```

Ce guide fournit une base complète pour l'intégration API optimisée avec toutes les fonctionnalités nécessaires pour un système robuste et performant.