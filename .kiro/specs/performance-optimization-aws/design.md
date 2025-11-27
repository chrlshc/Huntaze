# Design Document - Performance Optimization avec AWS

## Overview

Ce document décrit l'architecture technique pour diagnostiquer et résoudre les problèmes de performance dans l'application Huntaze. La solution combine des optimisations frontend (code splitting, lazy loading, caching intelligent) avec des services AWS (CloudFront CDN, S3 pour assets, CloudWatch pour monitoring, Lambda@Edge pour optimisations edge).

L'objectif principal est de réduire les états de chargement excessifs, améliorer les temps de réponse, et optimiser la livraison de contenu en utilisant l'infrastructure AWS existante.

## Architecture

### Architecture Globale

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         CloudFront CDN                  │
│  ┌──────────────────────────────────┐  │
│  │     Lambda@Edge Functions        │  │
│  │  - Header optimization           │  │
│  │  - Auth validation               │  │
│  │  - Content transformation        │  │
│  └──────────────────────────────────┘  │
└──────┬──────────────────┬───────────────┘
       │                  │
       │ (Static)         │ (Dynamic)
       ▼                  ▼
┌─────────────┐    ┌─────────────────┐
│   S3 Bucket │    │  Next.js App    │
│   (Assets)  │    │  (Amplify/ECS)  │
└─────────────┘    └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   │   + Redis       │
                   └─────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   CloudWatch    │
                   │   Monitoring    │
                   └─────────────────┘
```

### Flux de Données

1. **Requête initiale**: Browser → CloudFront → Lambda@Edge (validation/transformation)
2. **Assets statiques**: CloudFront → S3 (images, CSS, JS optimisés)
3. **Contenu dynamique**: CloudFront → Next.js App → Database
4. **Monitoring**: Toutes les couches → CloudWatch Logs/Metrics


## Components and Interfaces

### 1. Performance Diagnostic System

**Composant**: `PerformanceDiagnostics`
**Responsabilité**: Identifier les goulots d'étranglement et collecter les métriques

```typescript
interface PerformanceDiagnostics {
  // Analyse des temps de chargement
  analyzePageLoad(): PageLoadReport;
  
  // Identification des requêtes lentes
  identifySlowRequests(): SlowRequestReport[];
  
  // Analyse des états de chargement
  analyzeLoadingStates(): LoadingStateReport;
  
  // Détection des re-renders excessifs
  detectExcessiveRenders(): RenderReport[];
}

interface PageLoadReport {
  url: string;
  metrics: {
    ttfb: number;           // Time to First Byte
    fcp: number;            // First Contentful Paint
    lcp: number;            // Largest Contentful Paint
    fid: number;            // First Input Delay
    cls: number;            // Cumulative Layout Shift
    tti: number;            // Time to Interactive
  };
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

interface SlowRequestReport {
  endpoint: string;
  method: string;
  averageTime: number;
  p95Time: number;
  p99Time: number;
  frequency: number;
  suggestions: string[];
}
```

### 2. CloudWatch Integration

**Composant**: `CloudWatchMonitoring`
**Responsabilité**: Collecter et envoyer les métriques à CloudWatch

```typescript
interface CloudWatchMonitoring {
  // Envoyer des métriques custom
  putMetric(metric: CustomMetric): Promise<void>;
  
  // Créer des dashboards
  createDashboard(config: DashboardConfig): Promise<string>;
  
  // Configurer des alarmes
  setAlarm(alarm: AlarmConfig): Promise<void>;
  
  // Logger des événements
  logEvent(event: PerformanceEvent): Promise<void>;
}

interface CustomMetric {
  namespace: string;
  metricName: string;
  value: number;
  unit: MetricUnit;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

interface AlarmConfig {
  name: string;
  metricName: string;
  threshold: number;
  comparisonOperator: 'GreaterThan' | 'LessThan';
  evaluationPeriods: number;
  actions: string[];  // SNS topic ARNs
}
```


### 3. Asset Optimization System

**Composant**: `AssetOptimizer`
**Responsabilité**: Optimiser et gérer les assets statiques

```typescript
interface AssetOptimizer {
  // Optimiser les images
  optimizeImage(image: ImageInput): Promise<OptimizedImage>;
  
  // Uploader vers S3
  uploadToS3(file: File, options: S3UploadOptions): Promise<S3Object>;
  
  // Générer des URLs CloudFront
  generateCDNUrl(key: string, transformations?: ImageTransformations): string;
  
  // Invalider le cache CloudFront
  invalidateCache(paths: string[]): Promise<void>;
}

interface OptimizedImage {
  formats: {
    avif?: Buffer;
    webp?: Buffer;
    jpeg?: Buffer;
  };
  sizes: {
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
    original: Buffer;
  };
  metadata: ImageMetadata;
}

interface S3UploadOptions {
  bucket: string;
  key: string;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}
```

### 4. Intelligent Caching System

**Composant**: `CacheManager`
**Responsabilité**: Gérer le cache multi-niveaux (browser, Redis, CDN)

```typescript
interface CacheManager {
  // Récupérer depuis le cache
  get<T>(key: string, options?: CacheOptions): Promise<T | null>;
  
  // Stocker dans le cache
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  // Invalider le cache
  invalidate(pattern: string): Promise<void>;
  
  // Stratégie stale-while-revalidate
  getWithRevalidation<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: RevalidationOptions
  ): Promise<T>;
}

interface CacheOptions {
  level?: 'browser' | 'redis' | 'cdn' | 'all';
  ttl?: number;
  tags?: string[];
}

interface RevalidationOptions {
  staleTime: number;      // Temps avant considéré stale
  revalidateTime: number; // Temps avant revalidation
  fallbackToStale: boolean;
}
```

### 5. Request Optimization

**Composant**: `RequestOptimizer`
**Responsabilité**: Optimiser les requêtes API (batching, deduplication, debouncing)

```typescript
interface RequestOptimizer {
  // Dédupliquer les requêtes identiques
  deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
  
  // Batching de requêtes
  batch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>[]>;
  
  // Debouncing
  debounce<T>(fn: () => Promise<T>, delay: number): Promise<T>;
  
  // Retry avec backoff exponentiel
  retryWithBackoff<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T>;
}

interface BatchRequest {
  id: string;
  query: string;
  variables?: Record<string, any>;
}

interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}
```


### 6. Lambda@Edge Functions

**Composant**: `EdgeOptimizations`
**Responsabilité**: Optimisations à la périphérie du CDN

```typescript
// Viewer Request - Avant CloudFront cache lookup
interface ViewerRequestHandler {
  // Normaliser les headers
  normalizeHeaders(request: CloudFrontRequest): CloudFrontRequest;
  
  // Rediriger selon device
  deviceBasedRouting(request: CloudFrontRequest): CloudFrontRequest;
  
  // Valider l'authentification
  validateAuth(request: CloudFrontRequest): CloudFrontRequest | CloudFrontResponse;
}

// Origin Response - Après réponse de l'origin
interface OriginResponseHandler {
  // Ajouter des headers de sécurité
  addSecurityHeaders(response: CloudFrontResponse): CloudFrontResponse;
  
  // Compresser le contenu
  compressContent(response: CloudFrontResponse): CloudFrontResponse;
  
  // Optimiser les images
  optimizeImages(response: CloudFrontResponse): CloudFrontResponse;
}
```

### 7. Loading State Manager

**Composant**: `LoadingStateManager`
**Responsabilité**: Gérer les états de chargement de manière optimale

```typescript
interface LoadingStateManager {
  // Enregistrer un état de chargement
  register(id: string, config: LoadingConfig): void;
  
  // Démarrer le chargement
  start(id: string): void;
  
  // Terminer le chargement
  complete(id: string): void;
  
  // Obtenir l'état actuel
  getState(id: string): LoadingState;
  
  // Grouper les états de chargement
  group(ids: string[]): GroupedLoadingState;
}

interface LoadingConfig {
  type: 'skeleton' | 'spinner' | 'progress' | 'none';
  minDisplayTime?: number;  // Éviter les flashs
  timeout?: number;         // Timeout pour erreur
  showAfter?: number;       // Délai avant affichage
}

interface LoadingState {
  id: string;
  isLoading: boolean;
  startTime?: number;
  error?: Error;
  progress?: number;
}
```

## Data Models

### Performance Metrics

```typescript
interface PerformanceMetrics {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  
  // Core Web Vitals
  webVitals: {
    lcp: number;  // Largest Contentful Paint
    fid: number;  // First Input Delay
    cls: number;  // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
    fcp: number;  // First Contentful Paint
  };
  
  // Custom metrics
  pageLoadTime: number;
  apiResponseTimes: ApiMetric[];
  renderCount: number;
  memoryUsage?: number;
  
  // Context
  page: string;
  userAgent: string;
  connection?: ConnectionInfo;
}

interface ApiMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  cached: boolean;
  timestamp: Date;
}

interface ConnectionInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}
```

### Cache Entry

```typescript
interface CacheEntry<T> {
  key: string;
  value: T;
  metadata: {
    createdAt: Date;
    expiresAt: Date;
    lastAccessed: Date;
    accessCount: number;
    tags: string[];
    size: number;
  };
  level: 'browser' | 'redis' | 'cdn';
}
```

### Asset Metadata

```typescript
interface AssetMetadata {
  id: string;
  originalKey: string;
  s3Key: string;
  cdnUrl: string;
  
  // Formats disponibles
  formats: {
    avif?: string;
    webp?: string;
    jpeg?: string;
  };
  
  // Tailles disponibles
  sizes: {
    thumbnail: AssetSize;
    medium: AssetSize;
    large: AssetSize;
    original: AssetSize;
  };
  
  // Métadonnées
  contentType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  uploadedAt: Date;
  lastModified: Date;
}

interface AssetSize {
  url: string;
  width: number;
  height: number;
  fileSize: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Performance Properties

**Property 1: Page load time constraint**
*For any* page navigation, the content should be displayed within 2 seconds from navigation start
**Validates: Requirements 1.1**

**Property 2: Single loading indicator per section**
*For any* data fetch operation, each UI section should display at most one loading indicator at a time
**Validates: Requirements 1.2**

**Property 3: Request batching**
*For any* set of simultaneous data requests, if they can be batched, they should be combined into a single network call
**Validates: Requirements 1.3**

**Property 4: Stale-while-revalidate**
*For any* cached data request, if cache exists, it should be displayed immediately while background refresh occurs
**Validates: Requirements 1.4**

**Property 5: Immediate visual feedback**
*For any* user action, visual feedback should be provided within 100ms without blocking the interface
**Validates: Requirements 1.5**

### Monitoring Properties

**Property 6: Metrics collection**
*For any* critical operation, performance metrics should be sent to CloudWatch
**Validates: Requirements 2.1**

**Property 7: Web Vitals logging**
*For any* page load, all three Core Web Vitals (LCP, FID, CLS) should be measured and logged
**Validates: Requirements 2.2**

**Property 8: API tracking**
*For any* API call, response time and success/error status should be tracked
**Validates: Requirements 2.3**

**Property 9: Performance alerts**
*For any* performance metric that exceeds defined thresholds, a CloudWatch alarm should be triggered
**Validates: Requirements 2.4**

**Property 10: Trace generation**
*For any* performance analysis request, detailed traces showing bottlenecks should be generated
**Validates: Requirements 2.5**

### Asset Optimization Properties

**Property 11: Multi-format image storage**
*For any* uploaded image, optimized versions in WebP, AVIF, and JPEG formats should be stored in S3
**Validates: Requirements 3.2**

**Property 12: Lazy loading**
*For any* image that is off-screen, the lazy loading attribute should be set
**Validates: Requirements 3.3**

**Property 13: Responsive images**
*For any* device type, appropriately sized images should be served based on viewport and connection quality
**Validates: Requirements 3.4**

**Property 14: Image cache duration**
*For any* image request, Cache-Control headers should specify at least 24 hours
**Validates: Requirements 3.5**

### Caching Properties

**Property 15: Cache retrieval performance**
*For any* cached data request, retrieval time should be under 100ms
**Validates: Requirements 4.1**

**Property 16: Background refresh**
*For any* expired cache entry, data refresh should occur in background without blocking UI
**Validates: Requirements 4.2**

**Property 17: Critical data preloading**
*For any* application start, critical dashboard data should be preloaded before user navigation
**Validates: Requirements 4.3**

**Property 18: Cache invalidation**
*For any* data update, all related cache entries should be invalidated
**Validates: Requirements 4.4**

**Property 19: Offline fallback**
*For any* network failure, stale cached data should be served with appropriate staleness indicators
**Validates: Requirements 4.5**

### Request Optimization Properties

**Property 20: Request deduplication**
*For any* set of identical simultaneous requests, only one network call should be made
**Validates: Requirements 5.1**

**Property 21: Pagination limits**
*For any* paginated response, the number of items should not exceed 50
**Validates: Requirements 5.2**

**Property 22: Selective field queries**
*For any* data fetch, only the required fields should be requested in the query
**Validates: Requirements 5.3**

**Property 23: Request debouncing**
*For any* rapid sequence of API calls, they should be debounced with a 300ms delay
**Validates: Requirements 5.4**

**Property 24: Exponential backoff retry**
*For any* failed request, retries should follow an exponential backoff pattern
**Validates: Requirements 5.5**

### Code Splitting Properties

**Property 25: Bundle size limits**
*For any* JavaScript chunk, the size should not exceed 200KB
**Validates: Requirements 6.1**

**Property 26: Route-based code splitting**
*For any* page visit, only the JavaScript required for that specific page should be loaded
**Validates: Requirements 6.2**

**Property 27: Script deferral**
*For any* non-critical script, it should have defer or async attributes
**Validates: Requirements 6.3**

**Property 28: Async third-party scripts**
*For any* third-party script, it should be loaded asynchronously
**Validates: Requirements 6.4**

**Property 29: Tree-shaking**
*For any* production bundle, unused code should be removed through tree-shaking
**Validates: Requirements 6.5**

### Lambda@Edge Properties

**Property 30: Security headers injection**
*For any* CloudFront response, security headers should be added by Lambda@Edge
**Validates: Requirements 7.1**

**Property 31: Device-based content optimization**
*For any* user agent, device-optimized content should be served by Lambda@Edge
**Validates: Requirements 7.2**

**Property 32: Edge authentication**
*For any* protected resource request, token validation should occur at Lambda@Edge
**Validates: Requirements 7.3**

**Property 33: Edge A/B testing**
*For any* A/B test variant assignment, it should be determined at Lambda@Edge without origin load
**Validates: Requirements 7.4**

**Property 34: Content compression**
*For any* compressible response, Brotli or Gzip compression should be applied by Lambda@Edge
**Validates: Requirements 7.5**

### Mobile Performance Properties

**Property 35: Lighthouse score**
*For any* mobile page load, the Lighthouse performance score should be above 90
**Validates: Requirements 8.1**

**Property 36: Adaptive loading**
*For any* slow connection, image quality should be reduced and non-essential content deferred
**Validates: Requirements 8.2**

**Property 37: Layout shift minimization**
*For any* mobile page render, Cumulative Layout Shift should be below 0.1
**Validates: Requirements 8.3**

**Property 38: Touch responsiveness**
*For any* touch interaction, response should occur within 100ms
**Validates: Requirements 8.4**

**Property 39: Above-the-fold prioritization**
*For any* mobile page load, above-the-fold content should load before below-the-fold content
**Validates: Requirements 8.5**

### Real-time Monitoring Properties

**Property 40: Dashboard creation**
*For any* metric collection, CloudWatch dashboards should be created showing key performance indicators
**Validates: Requirements 9.1**

**Property 41: Threshold notifications**
*For any* threshold breach, SNS notifications should be sent
**Validates: Requirements 9.2**

**Property 42: Error context logging**
*For any* error occurrence, detailed context should be logged to CloudWatch Logs
**Validates: Requirements 9.3**

### Loading State Properties

**Property 43: Skeleton screens**
*For any* data loading operation, skeleton screens should be used instead of spinners
**Validates: Requirements 10.1**

**Property 44: Progress indicators**
*For any* operation exceeding 1 second, progress indicators should be displayed
**Validates: Requirements 10.2**

**Property 45: No loading for cached content**
*For any* background update with cached data, no loading state should be shown
**Validates: Requirements 10.3**

**Property 46: Independent section loading**
*For any* multi-section page, each section should have independent loading states
**Validates: Requirements 10.4**

**Property 47: Smooth transitions**
*For any* loading completion, transitions should be smooth with minimal layout shifts
**Validates: Requirements 10.5**


## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout
   - DNS resolution failure
   - SSL/TLS errors
   - Rate limiting (429)

2. **AWS Service Errors**
   - CloudWatch API failures
   - S3 upload/download errors
   - CloudFront invalidation failures
   - Lambda@Edge execution errors

3. **Performance Degradation**
   - Slow API responses (> 2s)
   - High memory usage
   - Low FPS (< 30)
   - Poor Web Vitals scores

4. **Cache Errors**
   - Redis connection failures
   - Cache corruption
   - Eviction under memory pressure

### Error Handling Strategies

```typescript
interface ErrorHandler {
  // Retry avec backoff exponentiel
  retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;
  
  // Fallback vers cache stale
  fallbackToStaleCache<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T>;
  
  // Circuit breaker pour services externes
  circuitBreaker<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T>;
  
  // Logging structuré vers CloudWatch
  logError(error: Error, context: ErrorContext): void;
}

interface ErrorContext {
  operation: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### Graceful Degradation

1. **CDN Failure**: Fallback vers origin server direct
2. **Cache Failure**: Fetch fresh data avec indication de latence
3. **Image Optimization Failure**: Serve original image
4. **Monitoring Failure**: Continue operation, log locally
5. **Lambda@Edge Failure**: CloudFront serves cached or origin response

### Alert Thresholds

```typescript
const ALERT_THRESHOLDS = {
  // Performance
  pageLoadTime: 3000,        // 3 seconds
  apiResponseTime: 2000,     // 2 seconds
  lcp: 2500,                 // 2.5 seconds
  fid: 100,                  // 100ms
  cls: 0.1,                  // 0.1 score
  
  // Resources
  memoryUsage: 0.85,         // 85% of available
  cpuUsage: 0.80,            // 80% of available
  
  // Errors
  errorRate: 0.05,           // 5% error rate
  cacheHitRate: 0.70,        // 70% minimum
  
  // Availability
  uptime: 0.999,             // 99.9% uptime
};
```

## Testing Strategy

### Unit Testing

Nous utiliserons **Vitest** pour les tests unitaires, en nous concentrant sur:

1. **Cache Manager**
   - Test de get/set/invalidate
   - Test de TTL expiration
   - Test de stale-while-revalidate

2. **Request Optimizer**
   - Test de deduplication
   - Test de batching
   - Test de debouncing
   - Test de retry avec backoff

3. **Asset Optimizer**
   - Test de génération multi-format
   - Test de génération multi-taille
   - Test de génération d'URLs CDN

4. **Loading State Manager**
   - Test de register/start/complete
   - Test de grouping
   - Test de timeout

### Property-Based Testing

Nous utiliserons **fast-check** pour les tests basés sur les propriétés. Chaque test sera configuré pour exécuter au minimum 100 itérations.

**Format des tags**: Chaque test de propriété sera tagué avec le format exact:
`**Feature: performance-optimization-aws, Property {number}: {property_text}**`

Exemples de propriétés à tester:

1. **Property 20: Request deduplication**
   - Générer N requêtes identiques simultanées
   - Vérifier qu'une seule requête réseau est faite
   - Vérifier que toutes les promesses reçoivent la même réponse

2. **Property 24: Exponential backoff retry**
   - Générer des échecs aléatoires
   - Vérifier que les délais suivent la formule: `initialDelay * (backoffMultiplier ^ attemptNumber)`
   - Vérifier que maxRetries est respecté

3. **Property 18: Cache invalidation**
   - Générer des données avec tags aléatoires
   - Mettre en cache
   - Invalider par tag
   - Vérifier que toutes les entrées avec ce tag sont supprimées

4. **Property 21: Pagination limits**
   - Générer des requêtes de pagination avec différentes tailles
   - Vérifier que la réponse ne dépasse jamais 50 items

### Integration Testing

Tests d'intégration avec les services AWS (utilisant des mocks ou environnement de test):

1. **CloudWatch Integration**
   - Test d'envoi de métriques
   - Test de création de dashboards
   - Test de configuration d'alarmes

2. **S3 Integration**
   - Test d'upload d'assets
   - Test de génération d'URLs signées
   - Test d'invalidation CloudFront

3. **Lambda@Edge**
   - Test de transformation de requêtes
   - Test d'ajout de headers
   - Test de compression

### Performance Testing

Tests de performance pour valider les seuils:

1. **Load Testing avec k6**
   - Simuler 100+ utilisateurs concurrents
   - Mesurer les temps de réponse sous charge
   - Vérifier que les seuils sont respectés

2. **Lighthouse CI**
   - Tests automatisés des Core Web Vitals
   - Vérification du score > 90 sur mobile
   - Détection de régressions de performance

3. **Bundle Size Analysis**
   - Vérifier que les chunks sont < 200KB
   - Vérifier le tree-shaking
   - Détecter les dépendances inutilisées

### End-to-End Testing

Tests E2E avec Playwright:

1. **User Flows**
   - Navigation entre pages
   - Chargement de contenu
   - Interactions utilisateur

2. **Performance Monitoring**
   - Capturer les Web Vitals réels
   - Mesurer les temps de chargement
   - Vérifier les états de chargement

3. **Offline Scenarios**
   - Tester le fallback vers cache
   - Vérifier les indicateurs de staleness
   - Tester la reconnexion

### Testing Best Practices

- Les tests de propriétés et les tests unitaires sont complémentaires
- Les tests unitaires vérifient des exemples spécifiques et cas limites
- Les tests de propriétés vérifient les propriétés universelles sur de nombreuses entrées
- Ensemble, ils fournissent une couverture complète
- Chaque propriété de correctness doit avoir un test de propriété correspondant
- Les tests doivent être rapides (< 5s pour les unitaires, < 30s pour les propriétés)
- Utiliser des mocks pour les services externes dans les tests unitaires
- Utiliser un environnement de test AWS pour les tests d'intégration
