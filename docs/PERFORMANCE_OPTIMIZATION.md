# Performance Optimization Guide

## Vue d'Ensemble

Ce guide détaille les optimisations de performance implémentées dans l'API Huntaze, incluant les patterns de résilience avancés, le monitoring en temps réel, et les stratégies de test de charge.

## 🏗️ Architecture de Résilience

### 1. Circuit Breaker Pattern

Le Circuit Breaker protège contre les cascading failures et améliore la résilience du système.

#### Configuration par Type de Service

```typescript
// Services AI (OpenAI, Claude)
const aiCircuitBreaker = CircuitBreakerFactory.getCircuitBreaker('openai', 'ai_service', {
  failureThreshold: 5,      // 5 échecs consécutifs
  recoveryTimeout: 60000,   // 1 minute de récupération
  expectedFailureRate: 10,  // 10% d'échecs acceptables
});

// Base de données
const dbCircuitBreaker = CircuitBreakerFactory.getCircuitBreaker('postgres', 'database', {
  failureThreshold: 3,      // 3 échecs consécutifs
  recoveryTimeout: 30000,   // 30 secondes de récupération
  expectedFailureRate: 5,   // 5% d'échecs acceptables
});
```

#### Utilisation avec Decorator

```typescript
class AIService {
  @withCircuitBreaker('content-generation', 'ai_service')
  async generateContent(prompt: string): Promise<string> {
    return await this.openaiClient.generate(prompt);
  }
}
```

#### États du Circuit Breaker

- **CLOSED**: Fonctionnement normal
- **OPEN**: Service indisponible, requêtes rejetées
- **HALF_OPEN**: Test de récupération en cours

### 2. Request Coalescing

Évite les requêtes duplicatas simultanées et optimise l'utilisation des ressources.

#### Utilisation Basique

```typescript
const coalescer = getRequestCoalescer();

// Plusieurs appels simultanés → 1 seule requête
const result = await coalescer.coalesce(
  'user-stats-123',
  () => fetchUserStats('123'),
  { ttl: 30000 } // Cache 30 secondes
);
```

#### Patterns Prédéfinis

```typescript
// Données utilisateur (TTL: 30s)
const userData = await CoalescingPatterns.userRequest(
  userId, 
  'profile', 
  () => fetchUserProfile(userId)
);

// Recommandations AI (TTL: 30min)
const recommendations = await CoalescingPatterns.aiRecommendations(
  userId,
  'content-ideas',
  () => generateContentIdeas(userId)
);
```

### 3. Graceful Degradation

Gère les fallbacks intelligents et maintient la fonctionnalité essentielle.

#### Stratégies de Dégradation

```typescript
// Fail Fast: Arrêt dès qu'un service critique échoue
const dashboardConfig = DegradationConfigs.userDashboard();
const result = await gracefulDegradation.executeWithDegradation(dashboardConfig);

// Best Effort: Tente tous les services, utilise les fallbacks
const analyticsConfig = DegradationConfigs.analytics();
const analyticsResult = await gracefulDegradation.executeWithDegradation(analyticsConfig);
```

#### Configuration des Services

```typescript
const config: DegradationConfig = {
  strategy: 'best_effort',
  globalTimeout: 10000,
  services: [
    {
      name: 'user_profile',
      priority: 'critical',
      timeout: 2000,
      fallback: () => ({ name: 'User', plan: 'free' }),
    },
    {
      name: 'ai_recommendations',
      priority: 'optional',
      timeout: 8000,
      // Pas de fallback = service optionnel
    },
  ],
};
```

## 📊 Monitoring et Métriques

### 1. Service Level Indicators (SLIs)

#### Availability SLI
- **Target**: 99.9% uptime
- **Mesure**: (successful_requests / total_requests) * 100
- **Seuils**: 
  - ✅ Meeting: ≥ 99.9%
  - ⚠️ At Risk: 99.5% - 99.9%
  - ❌ Breaching: < 99.5%

#### Latency SLI
- **Target**: P95 < 500ms, P99 < 1000ms
- **Mesure**: Distribution des temps de réponse
- **Seuils**:
  - ✅ Meeting: P95 ≤ 500ms
  - ⚠️ At Risk: 500ms < P95 ≤ 750ms
  - ❌ Breaching: P95 > 750ms

#### Error Rate SLI
- **Target**: < 0.1% d'erreurs serveur
- **Mesure**: (5xx_responses / total_requests) * 100
- **Seuils**:
  - ✅ Meeting: ≤ 0.1%
  - ⚠️ At Risk: 0.1% - 1%
  - ❌ Breaching: > 1%

### 2. Health Check Avancé

```bash
# Health check simple
curl http://localhost:3000/api/health

# Health check détaillé
curl -X POST http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -d '{"includeDetails": true, "services": ["optimization-engine", "auth-service"]}'
```

#### Réponse Health Check

```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T21:00:00Z",
  "uptime": 3600,
  "slis": [
    {
      "name": "Availability",
      "current": 99.95,
      "target": 99.9,
      "unit": "%",
      "status": "meeting",
      "trend": "stable"
    }
  ],
  "circuitBreakers": {
    "ai_service:optimization-engine": {
      "state": "CLOSED",
      "failureCount": 0,
      "healthStatus": "healthy"
    }
  }
}
```

## 🧪 Load Testing

### 1. Types de Tests

#### Smoke Test (Validation Basique)
```bash
npm run load-test:smoke
```
- 5 utilisateurs concurrents
- 30 secondes de durée
- Validation des endpoints critiques

#### Load Test (Charge Normale)
```bash
npm run load-test:load
```
- 50 utilisateurs concurrents
- 5 minutes de durée
- Simulation d'usage réel

#### Stress Test (Charge Élevée)
```bash
npm run load-test:stress
```
- 200 utilisateurs concurrents
- 10 minutes de durée
- Test des limites du système

#### Spike Test (Pic Soudain)
```bash
npm run load-test:spike
```
- 500 utilisateurs concurrents
- 2 minutes de durée
- Montée très rapide (10s)

### 2. Métriques de Performance

#### Seuils de Réussite
- **Error Rate**: < 5%
- **P95 Latency**: < 2000ms
- **P99 Latency**: < 5000ms
- **Throughput**: > 10 RPS

#### Exemple de Résultat

```
📊 Load Test Results:
==================================================
Total Requests: 15000
Success Rate: 99.2%
Average Response Time: 450ms
P95 Response Time: 800ms
P99 Response Time: 1200ms
Requests/Second: 50.2
Concurrent Users: 50

✅ Load test passed!
```

### 3. Scénarios de Test

#### Génération de Contenu (40% du trafic)
```typescript
{
  name: 'content_generation',
  weight: 40,
  requests: [
    { 
      method: 'POST', 
      path: '/api/content-ideas/generate',
      body: sampleContentRequest,
      expectedStatus: 200,
      timeout: 15000
    }
  ]
}
```

#### Optimisation (30% du trafic)
```typescript
{
  name: 'optimization',
  weight: 30,
  requests: [
    { 
      method: 'POST', 
      path: '/api/optimize/pricing',
      body: samplePricingRequest,
      expectedStatus: 200,
      timeout: 10000
    }
  ]
}
```

## 🔧 Configuration et Tuning

### 1. Variables d'Environnement

```bash
# Circuit Breaker Configuration
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000
CIRCUIT_BREAKER_MONITORING_WINDOW=300000

# Request Coalescing
REQUEST_COALESCER_TTL=5000
REQUEST_COALESCER_MAX_CACHE_SIZE=1000

# Load Testing
LOAD_TEST_API_KEY=your-test-api-key
API_BASE_URL=http://localhost:3000

# Monitoring
MONITORING_WEBHOOK_URL=https://monitoring.example.com/webhook
SLI_AVAILABILITY_TARGET=99.9
SLI_LATENCY_P95_TARGET=500
SLI_ERROR_RATE_TARGET=0.1
```

### 2. Optimisations par Environnement

#### Development
```typescript
const config = {
  circuitBreaker: {
    failureThreshold: 3,
    recoveryTimeout: 30000,
  },
  coalescing: {
    ttl: 5000,
    maxCacheSize: 100,
  },
  monitoring: {
    logLevel: 'debug',
    metricsInterval: 1000,
  },
};
```

#### Production
```typescript
const config = {
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000,
  },
  coalescing: {
    ttl: 30000,
    maxCacheSize: 1000,
  },
  monitoring: {
    logLevel: 'warn',
    metricsInterval: 5000,
  },
};
```

## 📈 Métriques et Alertes

### 1. Métriques Collectées

#### Par Service
- Nombre de requêtes
- Temps de réponse (P50, P95, P99)
- Taux d'erreur
- État du circuit breaker
- Utilisation du cache

#### Système
- Utilisation mémoire
- Utilisation CPU
- Connexions actives
- Uptime

### 2. Alertes Automatiques

#### Seuils Critiques
```typescript
const alertThresholds = {
  errorRate: 5,           // 5% d'erreurs
  latencyP95: 2000,       // 2 secondes P95
  circuitBreakerOpen: 1,  // Circuit ouvert
  memoryUsage: 85,        // 85% de mémoire
  cpuUsage: 80,           // 80% de CPU
};
```

#### Canaux d'Alerte
- **Slack**: Alertes temps réel
- **Email**: Incidents critiques
- **PagerDuty**: Escalade automatique
- **Webhook**: Intégration personnalisée

## 🚀 Déploiement et CI/CD

### 1. Pipeline de Validation

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        
      - name: Wait for application
        run: sleep 30
      
      - name: Health check
        run: npm run health-check
      
      - name: Smoke test
        run: npm run load-test:smoke
      
      - name: Load test
        run: npm run load-test:load
        if: github.event_name == 'push'
```

### 2. Monitoring en Production

#### Dashboards Grafana
- **Overview**: Métriques globales et SLIs
- **Services**: Détail par service
- **Infrastructure**: Métriques système
- **Errors**: Analyse des erreurs

#### Alertes Prometheus
```yaml
groups:
  - name: api.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
```

## 🎯 Recommandations d'Optimisation

### 1. Priorités Immédiates

#### Performance
- ✅ Circuit breakers implémentés
- ✅ Request coalescing actif
- ✅ Graceful degradation configurée
- ✅ Load testing automatisé

#### Monitoring
- ✅ SLIs/SLOs définis
- ✅ Health checks avancés
- ✅ Métriques temps réel
- ✅ Alertes automatiques

### 2. Améliorations Futures

#### Court Terme (1-2 semaines)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Cache warming intelligent
- [ ] Rate limiting adaptatif
- [ ] Retry budgets

#### Moyen Terme (1 mois)
- [ ] Multi-région deployment
- [ ] Predictive scaling
- [ ] ML-powered anomaly detection
- [ ] Advanced caching strategies

#### Long Terme (3 mois)
- [ ] Chaos engineering
- [ ] Auto-healing systems
- [ ] Performance ML models
- [ ] Edge computing optimization

## 📚 Ressources et Documentation

### 1. Guides Techniques
- [Circuit Breaker Pattern](./circuit-breaker-guide.md)
- [Request Coalescing Best Practices](./coalescing-guide.md)
- [Load Testing Strategies](./load-testing-guide.md)
- [Monitoring and Alerting](./monitoring-guide.md)

### 2. Outils Recommandés
- **Load Testing**: Artillery, k6, Apache Bench
- **Monitoring**: Grafana, Prometheus, DataDog
- **Tracing**: Jaeger, Zipkin, OpenTelemetry
- **Alerting**: PagerDuty, Slack, OpsGenie

### 3. Métriques de Référence

#### Benchmarks Industrie
- **E-commerce**: P95 < 1s, 99.9% uptime
- **SaaS**: P95 < 500ms, 99.95% uptime
- **API**: P95 < 200ms, 99.99% uptime

#### Objectifs Huntaze
- **Availability**: 99.9% (43.2 min downtime/mois)
- **Latency**: P95 < 500ms, P99 < 1000ms
- **Error Rate**: < 0.1%
- **Throughput**: > 100 RPS

L'architecture de performance est maintenant production-ready avec une résilience avancée et un monitoring complet ! 🚀