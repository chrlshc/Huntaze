# Requirements Document

## Introduction

Le dashboard Huntaze souffre de problèmes de performance critiques causés par des décisions architecturales sous-optimales. Cette spec vise à diagnostiquer et résoudre les VRAIS bottlenecks de performance, pas les problèmes théoriques. L'analyse initiale révèle:

1. **force-dynamic sur tout le layout** - Désactive complètement le cache Next.js
2. **Hooks lourds sur chaque page** - useContent, usePerformanceMonitoring font des appels API répétés
3. **Pas de cache applicatif** - Chaque requête frappe la DB directement
4. **Monitoring excessif** - Le monitoring de performance ralentit ironiquement l'app
5. **Infrastructure AWS à connecter** - S3, CloudFront et CloudWatch sont essentiels sur AWS et doivent être correctement intégrés

## Glossary

- **Dashboard**: L'interface utilisateur authentifiée de Huntaze (app/(app)/*)
- **force-dynamic**: Directive Next.js qui force le rendu dynamique et désactive tous les caches
- **SWR**: Bibliothèque de data fetching React avec cache intégré
- **API Route**: Endpoint Next.js côté serveur (/api/*)
- **Bottleneck**: Point de congestion qui limite les performances globales
- **Cache Hit**: Requête servie depuis le cache sans toucher la DB
- **DB Query**: Requête à la base de données PostgreSQL
- **Render Time**: Temps entre le début et la fin du rendu d'une page

## Requirements

### Requirement 1: Diagnostic des Bottlenecks Réels

**User Story:** En tant que développeur, je veux identifier les VRAIS bottlenecks de performance avec des données mesurables, afin de prioriser les optimisations qui auront le plus d'impact.

#### Acceptance Criteria

1. WHEN the diagnostic tool runs THEN the system SHALL measure actual DB query times for each API endpoint
2. WHEN the diagnostic tool runs THEN the system SHALL measure actual render times for each dashboard page
3. WHEN the diagnostic tool runs THEN the system SHALL identify API endpoints called multiple times per page load
4. WHEN the diagnostic tool runs THEN the system SHALL measure the overhead of performance monitoring itself
5. WHEN the diagnostic tool runs THEN the system SHALL output a prioritized list of bottlenecks with measured impact

### Requirement 2: Optimisation du Cache Next.js

**User Story:** En tant qu'utilisateur, je veux que les pages du dashboard se chargent rapidement, afin de pouvoir naviguer efficacement dans l'application.

#### Acceptance Criteria

1. WHEN a page does not require real-time data THEN the system SHALL remove force-dynamic and enable static generation
2. WHEN a page requires user-specific data THEN the system SHALL use dynamic rendering only for that specific page
3. WHEN the layout component renders THEN the system SHALL not force dynamic rendering for all child pages
4. WHEN static pages are built THEN the system SHALL generate them at build time without database connections
5. WHEN a user navigates between pages THEN the system SHALL leverage Next.js client-side navigation cache

### Requirement 3: Optimisation des Hooks et Data Fetching

**User Story:** En tant que développeur, je veux que les hooks ne fassent pas d'appels API redondants, afin de réduire la charge serveur et améliorer les temps de réponse.

#### Acceptance Criteria

1. WHEN useContent is called multiple times on the same page THEN the system SHALL deduplicate requests using SWR cache
2. WHEN usePerformanceMonitoring is used THEN the system SHALL only track metrics in development mode
3. WHEN a hook fetches data THEN the system SHALL use appropriate cache durations based on data volatility
4. WHEN multiple components need the same data THEN the system SHALL share a single request via SWR
5. WHEN a page unmounts THEN the system SHALL cancel pending requests to avoid memory leaks

### Requirement 4: Implémentation du Cache Applicatif

**User Story:** En tant que système, je veux cacher les données fréquemment accédées, afin de réduire la charge sur la base de données.

#### Acceptance Criteria

1. WHEN an API endpoint is called THEN the system SHALL check the cache before querying the database
2. WHEN data is fetched from the database THEN the system SHALL store it in cache with appropriate TTL
3. WHEN cached data is stale THEN the system SHALL refresh it in the background while serving stale data
4. WHEN data is mutated THEN the system SHALL invalidate relevant cache entries
5. WHEN the cache is full THEN the system SHALL evict least recently used entries

### Requirement 5: Réduction du Monitoring en Production

**User Story:** En tant qu'utilisateur, je veux que le monitoring de performance n'impacte pas les performances réelles, afin d'avoir une expérience fluide.

#### Acceptance Criteria

1. WHEN the app runs in production THEN the system SHALL disable client-side performance monitoring
2. WHEN the app runs in development THEN the system SHALL enable performance monitoring with sampling
3. WHEN performance data is collected THEN the system SHALL batch metrics before sending to avoid network overhead
4. WHEN the PerformanceMonitor component renders THEN the system SHALL only render it in development mode
5. WHEN critical user interactions occur THEN the system SHALL not block them with monitoring code

### Requirement 6: Connexion et Utilisation de l'Infrastructure AWS (OBLIGATOIRE)

**User Story:** En tant que développeur sur AWS, je veux que S3, CloudFront et CloudWatch soient correctement connectés et utilisés, car ce sont les fondations essentielles d'une application cloud professionnelle sur AWS.

**Contexte:** Sur AWS, ces services ne sont pas optionnels. Les serveurs sont éphémères (le stockage local est effacé au redémarrage), donc S3 est obligatoire pour persister les fichiers. CloudFront est nécessaire pour la sécurité (SSL/TLS), la protection DDoS, et les coûts optimisés. CloudWatch est indispensable pour le monitoring et le debugging en production.

#### Acceptance Criteria

1. WHEN the application stores user files THEN the system SHALL upload them to S3 instead of local storage
2. WHEN the application serves static assets THEN the system SHALL deliver them via CloudFront for performance and security
3. WHEN the application runs in production THEN the system SHALL send all logs and metrics to CloudWatch
4. WHEN S3 buckets are configured THEN the system SHALL apply proper CORS and security policies
5. WHEN CloudFront distributions are configured THEN the system SHALL enable caching and compression for optimal performance

### Requirement 7: Optimisation des Requêtes Database

**User Story:** En tant que système, je veux exécuter des requêtes database efficaces, afin de minimiser les temps de réponse.

#### Acceptance Criteria

1. WHEN a query is executed THEN the system SHALL use database indexes for filtering and sorting
2. WHEN multiple related records are needed THEN the system SHALL use joins instead of N+1 queries
3. WHEN pagination is used THEN the system SHALL use cursor-based pagination for large datasets
4. WHEN aggregations are needed THEN the system SHALL compute them in the database not in application code
5. WHEN query performance is poor THEN the system SHALL log slow queries for optimization

### Requirement 8: Mesure de l'Impact des Optimisations

**User Story:** En tant que développeur, je veux mesurer l'impact réel de chaque optimisation, afin de valider que les changements améliorent effectivement les performances.

#### Acceptance Criteria

1. WHEN an optimization is applied THEN the system SHALL measure page load time before and after
2. WHEN an optimization is applied THEN the system SHALL measure API response time before and after
3. WHEN an optimization is applied THEN the system SHALL measure database query count before and after
4. WHEN an optimization is applied THEN the system SHALL measure cache hit rate before and after
5. WHEN measurements are complete THEN the system SHALL generate a report showing performance improvements
