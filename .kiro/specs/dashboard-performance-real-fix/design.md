# Design Document

## Overview

Cette spec résout les bottlenecks de performance réels du dashboard Huntaze en utilisant une approche pragmatique basée sur des mesures. L'approche combine l'optimisation du code existant avec la connexion correcte de l'infrastructure AWS essentielle:

1. **Diagnostic d'abord**: Mesurer les vrais problèmes avant d'optimiser
2. **Cache intelligent**: Utiliser le cache Next.js + SWR existant correctement
3. **Monitoring léger**: Désactiver le monitoring lourd en production
4. **Infrastructure AWS**: Connecter S3, CloudFront et CloudWatch (essentiels sur AWS)
5. **Optimisations ciblées**: Fixer uniquement les bottlenecks mesurés

L'objectif est d'améliorer les performances de 50-70% en optimisant le code ET en utilisant correctement l'infrastructure cloud.

## Architecture

### Principes de Design

1. **Measure First**: Toute optimisation doit être précédée d'une mesure
2. **Remove Before Add**: Retirer le code qui ralentit avant d'ajouter du nouveau
3. **Use What Exists**: Exploiter Next.js et SWR au lieu de réinventer
4. **AWS is Essential**: Sur AWS, S3/CloudFront/CloudWatch ne sont pas optionnels mais obligatoires
5. **Production First**: Optimiser pour la production, pas le développement

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Diagnostic                    │
│  - Mesure DB query times                                    │
│  - Mesure render times                                      │
│  - Identifie duplicate requests                             │
│  - Calcule overhead du monitoring                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Optimisation Layers                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js Cache Layer                                 │  │
│  │  - Remove force-dynamic where possible               │  │
│  │  - Enable static generation                          │  │
│  │  - Use revalidate for dynamic pages                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SWR Deduplication Layer                             │  │
│  │  - Configure proper cache times                      │  │
│  │  - Enable request deduplication                      │  │
│  │  - Use stale-while-revalidate                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Application Cache Layer                             │  │
│  │  - Cache expensive DB queries                        │  │
│  │  - Use in-memory cache for hot data                  │  │
│  │  - Implement cache invalidation                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database Query Optimization                         │  │
│  │  - Add missing indexes                               │  │
│  │  - Optimize N+1 queries                              │  │
│  │  - Use database-level aggregations                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring (Dev Only)                     │
│  - Lightweight performance tracking                         │
│  - Conditional rendering in dev mode                        │
│  - Batched metrics collection                               │
└─────────────────────────────────────────────────────────────┘
```

### Pourquoi AWS est Essentiel

Sur une infrastructure AWS (EC2, Lambda, App Runner, Elastic Beanstalk), ces trois services ne sont pas des options mais des **fondations obligatoires**:

**S3 est OBLIGATOIRE**
- Les serveurs AWS sont éphémères - le stockage local est effacé au redémarrage
- Sans S3, tous les fichiers utilisateurs (images, PDF) seront perdus
- C'est la seule manière fiable de persister les fichiers sur AWS
- Coût très faible avec une configuration appropriée

**CloudFront est VIVEMENT RECOMMANDÉ**
- On n'expose jamais directement un serveur ou bucket S3 aux utilisateurs
- CloudFront gère les certificats SSL (https sécurisé)
- Protection contre les attaques DDoS
- Réduit les coûts (sortir des données via CloudFront coûte moins cher que directement depuis S3)
- Améliore les performances pour les utilisateurs éloignés de la région AWS

**CloudWatch est INDISPENSABLE**
- Sans CloudWatch, vous êtes aveugle en production
- Impossible de diagnostiquer les bugs sans logs centralisés
- Permet de monitorer CPU, mémoire, et performances
- Essentiel pour comprendre pourquoi le site est lent ou plante

## Components and Interfaces

### 1. Performance Diagnostic Tool

```typescript
interface PerformanceDiagnostic {
  // Mesure les temps de requête DB
  measureDatabaseQueries(): Promise<QueryMetrics[]>;
  
  // Mesure les temps de rendu
  measureRenderTimes(): Promise<RenderMetrics[]>;
  
  // Identifie les requêtes dupliquées
  findDuplicateRequests(): Promise<DuplicateRequest[]>;
  
  // Calcule l'overhead du monitoring
  measureMonitoringOverhead(): Promise<OverheadMetrics>;
  
  // Génère un rapport priorisé
  generateReport(): Promise<DiagnosticReport>;
}

interface QueryMetrics {
  endpoint: string;
  query: string;
  duration: number;
  count: number;
  calledFrom: string[];
}

interface RenderMetrics {
  page: string;
  component: string;
  renderTime: number;
  reRenderCount: number;
}

interface DuplicateRequest {
  endpoint: string;
  count: number;
  pages: string[];
  potentialSavings: number; // ms
}

interface DiagnosticReport {
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  estimatedImpact: ImpactEstimate;
}

interface Bottleneck {
  type: 'db' | 'render' | 'network' | 'monitoring';
  description: string;
  impact: 'high' | 'medium' | 'low';
  currentTime: number;
  location: string;
}
```

### 2. Cache Configuration Manager

```typescript
interface CacheConfig {
  // Configuration Next.js par page
  nextjs: {
    [route: string]: {
      dynamic: 'force-dynamic' | 'force-static' | 'auto';
      revalidate?: number;
    };
  };
  
  // Configuration SWR par endpoint
  swr: {
    [endpoint: string]: {
      dedupingInterval: number;
      revalidateOnFocus: boolean;
      revalidateOnReconnect: boolean;
      refreshInterval?: number;
    };
  };
  
  // Configuration cache applicatif
  application: {
    [key: string]: {
      ttl: number;
      tags: string[];
      revalidateOnMutation: boolean;
    };
  };
}

class CacheConfigManager {
  // Applique la configuration optimale
  applyOptimalConfig(diagnostic: DiagnosticReport): void;
  
  // Valide la configuration
  validateConfig(config: CacheConfig): ValidationResult;
  
  // Mesure l'impact de la configuration
  measureImpact(): Promise<ImpactMetrics>;
}
```

### 3. Monitoring Controller

```typescript
interface MonitoringConfig {
  enabled: boolean;
  mode: 'development' | 'production';
  sampling: {
    rate: number; // 0-1, percentage of requests to monitor
    maxMetricsPerSession: number;
  };
  batching: {
    enabled: boolean;
    batchSize: number;
    flushInterval: number; // ms
  };
}

class MonitoringController {
  // Contrôle si le monitoring doit s'exécuter
  shouldMonitor(): boolean;
  
  // Collecte les métriques avec sampling
  collectMetrics(metric: Metric): void;
  
  // Flush les métriques en batch
  flushMetrics(): Promise<void>;
  
  // Désactive complètement le monitoring
  disable(): void;
}
```

### 4. Database Query Optimizer

```typescript
interface QueryOptimization {
  // Analyse les requêtes lentes
  analyzeSlowQueries(): Promise<SlowQuery[]>;
  
  // Suggère des indexes
  suggestIndexes(): Promise<IndexSuggestion[]>;
  
  // Détecte les N+1 queries
  detectNPlusOne(): Promise<NPlusOneIssue[]>;
  
  // Optimise les requêtes
  optimizeQuery(query: string): OptimizedQuery;
}

interface SlowQuery {
  query: string;
  avgDuration: number;
  count: number;
  suggestedOptimization: string;
}

interface IndexSuggestion {
  table: string;
  columns: string[];
  reason: string;
  estimatedImprovement: number; // percentage
}
```

## Data Models

### Diagnostic Data

```typescript
interface PerformanceSnapshot {
  timestamp: Date;
  environment: 'development' | 'production';
  
  pages: PageMetrics[];
  apis: APIMetrics[];
  database: DatabaseMetrics;
  cache: CacheMetrics;
  monitoring: MonitoringMetrics;
}

interface PageMetrics {
  route: string;
  loadTime: number;
  renderTime: number;
  hydrationTime: number;
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  avgDuration: number;
  p95Duration: number;
  callCount: number;
  errorRate: number;
  cacheHitRate: number;
}

interface DatabaseMetrics {
  totalQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  nPlusOneIssues: number;
  connectionPoolUsage: number;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  avgLookupTime: number;
  totalSize: number;
}

interface MonitoringMetrics {
  overhead: number; // ms per request
  memoryUsage: number; // bytes
  cpuImpact: number; // percentage
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the diagnostic tool runs THEN the system SHALL measure actual DB query times for each API endpoint
Thoughts: This is about measuring all DB queries across all endpoints. We can run the diagnostic tool with various endpoints and verify that it returns query metrics for each one.
Testable: yes - property

1.2 WHEN the diagnostic tool runs THEN the system SHALL measure actual render times for each dashboard page
Thoughts: This is about measuring render times for all pages. We can test this by running diagnostics on multiple pages and verifying we get render metrics for each.
Testable: yes - property

1.3 WHEN the diagnostic tool runs THEN the system SHALL identify API endpoints called multiple times per page load
Thoughts: This is about detecting duplicate requests. We can test by loading pages that make duplicate requests and verifying the tool identifies them.
Testable: yes - property

1.4 WHEN the diagnostic tool runs THEN the system SHALL measure the overhead of performance monitoring itself
Thoughts: This is about measuring the monitoring overhead. We can test by running with and without monitoring and comparing the difference.
Testable: yes - property

1.5 WHEN the diagnostic tool runs THEN the system SHALL output a prioritized list of bottlenecks with measured impact
Thoughts: This is about the output format and prioritization. We can test that the output contains bottlenecks sorted by impact.
Testable: yes - property

2.1 WHEN a page does not require real-time data THEN the system SHALL remove force-dynamic and enable static generation
Thoughts: This is about configuration decisions based on page requirements. We can test that static pages don't have force-dynamic.
Testable: yes - property

2.2 WHEN a page requires user-specific data THEN the system SHALL use dynamic rendering only for that specific page
Thoughts: This is about selective dynamic rendering. We can test that only pages needing user data are dynamic.
Testable: yes - property

2.3 WHEN the layout component renders THEN the system SHALL not force dynamic rendering for all child pages
Thoughts: This is about layout configuration not affecting children. We can test that child pages can be static even with a layout.
Testable: yes - property

2.4 WHEN static pages are built THEN the system SHALL generate them at build time without database connections
Thoughts: This is about build-time behavior. We can test that static pages build successfully without DB.
Testable: yes - example

2.5 WHEN a user navigates between pages THEN the system SHALL leverage Next.js client-side navigation cache
Thoughts: This is about Next.js built-in behavior. We can test that navigation uses the cache by measuring load times.
Testable: yes - property

3.1 WHEN useContent is called multiple times on the same page THEN the system SHALL deduplicate requests using SWR cache
Thoughts: This is about SWR deduplication. We can test by calling useContent multiple times and verifying only one network request.
Testable: yes - property

3.2 WHEN usePerformanceMonitoring is used THEN the system SHALL only track metrics in development mode
Thoughts: This is about conditional monitoring. We can test that monitoring is disabled in production.
Testable: yes - property

3.3 WHEN a hook fetches data THEN the system SHALL use appropriate cache durations based on data volatility
Thoughts: This is about cache configuration. We can test that different data types have appropriate TTLs.
Testable: yes - property

3.4 WHEN multiple components need the same data THEN the system SHALL share a single request via SWR
Thoughts: This is about request sharing. We can test that multiple components trigger only one request.
Testable: yes - property

3.5 WHEN a page unmounts THEN the system SHALL cancel pending requests to avoid memory leaks
Thoughts: This is about cleanup. We can test that unmounting cancels requests.
Testable: yes - property

4.1 WHEN an API endpoint is called THEN the system SHALL check the cache before querying the database
Thoughts: This is about cache-first strategy. We can test that cache is checked before DB.
Testable: yes - property

4.2 WHEN data is fetched from the database THEN the system SHALL store it in cache with appropriate TTL
Thoughts: This is about cache population. We can test that DB results are cached.
Testable: yes - property

4.3 WHEN cached data is stale THEN the system SHALL refresh it in the background while serving stale data
Thoughts: This is stale-while-revalidate. We can test that stale data is served while refreshing.
Testable: yes - property

4.4 WHEN data is mutated THEN the system SHALL invalidate relevant cache entries
Thoughts: This is about cache invalidation. We can test that mutations clear cache.
Testable: yes - property

4.5 WHEN the cache is full THEN the system SHALL evict least recently used entries
Thoughts: This is about LRU eviction. We can test that old entries are evicted when cache is full.
Testable: yes - property

5.1 WHEN the app runs in production THEN the system SHALL disable client-side performance monitoring
Thoughts: This is about production configuration. We can test that monitoring is disabled in production.
Testable: yes - example

5.2 WHEN the app runs in development THEN the system SHALL enable performance monitoring with sampling
Thoughts: This is about development configuration. We can test that monitoring uses sampling in dev.
Testable: yes - example

5.3 WHEN performance data is collected THEN the system SHALL batch metrics before sending to avoid network overhead
Thoughts: This is about batching. We can test that metrics are batched not sent individually.
Testable: yes - property

5.4 WHEN the PerformanceMonitor component renders THEN the system SHALL only render it in development mode
Thoughts: This is about conditional rendering. We can test that component doesn't render in production.
Testable: yes - example

5.5 WHEN critical user interactions occur THEN the system SHALL not block them with monitoring code
Thoughts: This is about non-blocking monitoring. We can test that interactions complete even if monitoring fails.
Testable: yes - property

6.1 WHEN the application stores user files THEN the system SHALL upload them to S3 instead of local storage
Thoughts: This is about file storage strategy. We can test that file uploads go to S3 for any file type.
Testable: yes - property

6.2 WHEN the application serves static assets THEN the system SHALL deliver them via CloudFront for performance and security
Thoughts: This is about asset delivery. We can test that asset URLs point to CloudFront distribution.
Testable: yes - property

6.3 WHEN the application runs in production THEN the system SHALL send all logs and metrics to CloudWatch
Thoughts: This is about logging in production. We can test that logs appear in CloudWatch.
Testable: yes - property

6.4 WHEN S3 buckets are configured THEN the system SHALL apply proper CORS and security policies
Thoughts: This is about S3 configuration. We can test that buckets have the required policies.
Testable: yes - example

6.5 WHEN CloudFront distributions are configured THEN the system SHALL enable caching and compression for optimal performance
Thoughts: This is about CloudFront configuration. We can test that distributions have caching and compression enabled.
Testable: yes - example

7.1 WHEN a query is executed THEN the system SHALL use database indexes for filtering and sorting
Thoughts: This is about query optimization. We can test by checking query plans.
Testable: yes - property

7.2 WHEN multiple related records are needed THEN the system SHALL use joins instead of N+1 queries
Thoughts: This is about avoiding N+1. We can test that related data uses joins.
Testable: yes - property

7.3 WHEN pagination is used THEN the system SHALL use cursor-based pagination for large datasets
Thoughts: This is about pagination strategy. We can test that large datasets use cursors.
Testable: yes - property

7.4 WHEN aggregations are needed THEN the system SHALL compute them in the database not in application code
Thoughts: This is about database-level aggregations. We can test that aggregations use DB functions.
Testable: yes - property

7.5 WHEN query performance is poor THEN the system SHALL log slow queries for optimization
Thoughts: This is about slow query logging. We can test that slow queries are logged.
Testable: yes - property

8.1 WHEN an optimization is applied THEN the system SHALL measure page load time before and after
Thoughts: This is about measuring impact. We can test that measurements are taken before/after.
Testable: yes - property

8.2 WHEN an optimization is applied THEN the system SHALL measure API response time before and after
Thoughts: This is about API performance measurement. We can test that API times are measured.
Testable: yes - property

8.3 WHEN an optimization is applied THEN the system SHALL measure database query count before and after
Thoughts: This is about query count measurement. We can test that query counts are tracked.
Testable: yes - property

8.4 WHEN an optimization is applied THEN the system SHALL measure cache hit rate before and after
Thoughts: This is about cache metrics. We can test that cache hit rates are measured.
Testable: yes - property

8.5 WHEN measurements are complete THEN the system SHALL generate a report showing performance improvements
Thoughts: This is about reporting. We can test that a report is generated with improvements.
Testable: yes - property

### Property Reflection

After reviewing all properties, several can be consolidated:

- Properties 2.1, 2.2, 2.3 all relate to force-dynamic configuration and can be combined into one comprehensive property about selective dynamic rendering
- Properties 3.1 and 3.4 both test SWR deduplication and can be combined
- Properties 5.1, 5.2, 5.4 all test environment-based monitoring configuration and can be combined
- Properties 6.1, 6.2, 6.3 test AWS service integration and can be combined into one property about AWS connectivity
- Properties 6.4, 6.5 are configuration examples and should remain as examples
- Properties 8.1-8.4 all test measurement before/after and can be combined into one property about impact measurement

### Correctness Properties

Property 1: Diagnostic tool measures all performance metrics
*For any* dashboard page or API endpoint, when the diagnostic tool runs, it should return metrics for DB queries, render times, duplicate requests, and monitoring overhead
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

Property 2: Diagnostic output is prioritized by impact
*For any* diagnostic run, the output should contain bottlenecks sorted by impact (high > medium > low) with measured time costs
**Validates: Requirements 1.5**

Property 3: Selective dynamic rendering
*For any* page in the dashboard, if it doesn't require real-time or user-specific data, it should not have force-dynamic enabled, and the layout should not force dynamic rendering on static children
**Validates: Requirements 2.1, 2.2, 2.3**

Property 4: Client-side navigation uses cache
*For any* navigation between dashboard pages, subsequent visits should be faster than the first visit due to Next.js client-side cache
**Validates: Requirements 2.5**

Property 5: SWR deduplicates requests
*For any* data fetching hook called multiple times with the same parameters, only one network request should be made
**Validates: Requirements 3.1, 3.4**

Property 6: Monitoring only in development
*For any* performance monitoring code, it should only execute when NODE_ENV is 'development'
**Validates: Requirements 3.2, 5.1, 5.2, 5.4**

Property 7: Cache durations match data volatility
*For any* cached data, the TTL should be inversely proportional to its update frequency (frequently changing data = shorter TTL)
**Validates: Requirements 3.3**

Property 8: Request cancellation on unmount
*For any* pending request when a component unmounts, the request should be cancelled to prevent memory leaks
**Validates: Requirements 3.5**

Property 9: Cache-first data fetching
*For any* API endpoint with caching enabled, the cache should be checked before querying the database
**Validates: Requirements 4.1**

Property 10: Database results are cached
*For any* successful database query, the result should be stored in cache with the configured TTL
**Validates: Requirements 4.2**

Property 11: Stale-while-revalidate behavior
*For any* cached data that is stale but within revalidation window, the stale data should be returned immediately while fresh data is fetched in the background
**Validates: Requirements 4.3**

Property 12: Cache invalidation on mutation
*For any* data mutation operation, all cache entries with matching tags should be invalidated
**Validates: Requirements 4.4**

Property 13: LRU cache eviction
*For any* cache at maximum capacity, adding a new entry should evict the least recently used entry
**Validates: Requirements 4.5**

Property 14: Metrics are batched
*For any* performance metrics collected, they should be accumulated and sent in batches rather than individually
**Validates: Requirements 5.3**

Property 15: Non-blocking monitoring
*For any* user interaction, the interaction should complete successfully even if monitoring code throws an error
**Validates: Requirements 5.5**

Property 16: AWS services are connected and used
*For any* file upload, the file should be stored in S3; *for any* static asset request, it should be served via CloudFront; *for any* production log, it should be sent to CloudWatch
**Validates: Requirements 6.1, 6.2, 6.3**

Property 17: Queries use indexes
*For any* database query with WHERE or ORDER BY clauses, the query plan should show index usage
**Validates: Requirements 7.1**

Property 18: No N+1 queries
*For any* operation that fetches related records, it should use joins or batch loading instead of separate queries per record
**Validates: Requirements 7.2**

Property 19: Cursor-based pagination for large datasets
*For any* paginated query with more than 1000 total records, it should use cursor-based pagination instead of offset-based
**Validates: Requirements 7.3**

Property 20: Database-level aggregations
*For any* aggregation operation (COUNT, SUM, AVG, etc.), it should be computed in the database query, not in application code
**Validates: Requirements 7.4**

Property 21: Slow query logging
*For any* database query taking longer than 1000ms, it should be logged with the query text and duration
**Validates: Requirements 7.5**

Property 22: Optimization impact measurement
*For any* performance optimization applied, measurements should be taken before and after for page load time, API response time, query count, and cache hit rate
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

Property 23: Performance improvement reporting
*For any* completed optimization, a report should be generated showing the percentage improvement in each measured metric
**Validates: Requirements 8.5**

## Error Handling

### Diagnostic Errors

- If diagnostic tool cannot connect to DB, fall back to client-side metrics only
- If a page fails to render during diagnostic, log error and continue with other pages
- If monitoring overhead cannot be measured, estimate based on code complexity

### Cache Errors

- If cache read fails, proceed to fetch from source (DB/API)
- If cache write fails, log warning but don't fail the request
- If cache is full and eviction fails, clear entire cache and start fresh

### Monitoring Errors

- All monitoring code must be wrapped in try-catch to never break user experience
- If metrics cannot be sent, store locally and retry later
- If monitoring causes performance degradation, auto-disable it

## Testing Strategy

### Unit Testing

- Test diagnostic tool with mock DB queries and render times
- Test cache configuration manager with various page types
- Test monitoring controller enable/disable logic
- Test query optimizer suggestions with sample queries

### Property-Based Testing

We'll use **fast-check** for JavaScript/TypeScript property-based testing.

Each property-based test must:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: dashboard-performance-real-fix, Property {number}: {property_text}**`
- Test the universal property across randomly generated inputs

Property tests will cover:
- Diagnostic tool returns metrics for all inputs
- Cache deduplication works for any request pattern
- Monitoring is disabled in production regardless of other config
- Cache invalidation clears all matching entries
- Query optimization suggestions are valid SQL

### Integration Testing

- Test full diagnostic run on actual dashboard pages
- Test cache behavior with real API endpoints
- Test monitoring overhead measurement
- Test AWS audit with actual AWS resources (if available)

### Performance Testing

- Measure page load times before and after optimizations
- Measure API response times with and without cache
- Measure database query times with and without indexes
- Measure monitoring overhead in development vs production

Each optimization must show measurable improvement:
- Page load time: Target 30-50% reduction
- API response time: Target 40-60% reduction
- Database query count: Target 50-70% reduction
- Cache hit rate: Target 60-80% for frequently accessed data
