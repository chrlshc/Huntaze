# Guide des Tests de Performance

Ce guide explique comment utiliser et maintenir la suite de tests de performance pour l'architecture d'optimisation décrite dans `docs/PERFORMANCE_OPTIMIZATION.md`.

## 🎯 Vue d'Ensemble

La suite de tests de performance valide tous les composants de l'architecture de résilience :

- **Circuit Breaker Pattern** - Protection contre les cascading failures
- **Request Coalescing** - Optimisation des requêtes duplicatas
- **Graceful Degradation** - Stratégies de fallback intelligentes
- **API Monitoring** - Collecte de métriques et alertes
- **Load Testing** - Tests de charge et performance
- **Integration** - Tests end-to-end complets
- **Regression** - Validation de conformité SLI/SLO

## 🚀 Exécution des Tests

### Tests Complets
```bash
# Tous les tests de performance
npm run test:performance

# Tests avec couverture de code
npm run test:coverage

# Suite complète (tests + e2e + performance)
npm run test:all
```

### Tests Spécifiques
```bash
# Circuit Breaker uniquement
npm run test:performance -- circuit-breaker

# Request Coalescing uniquement
npm run test:performance -- coalescing

# Graceful Degradation uniquement
npm run test:performance -- degradation

# API Monitoring uniquement
npm run test:performance -- monitoring

# Load Testing uniquement
npm run test:performance -- load

# Tests d'intégration uniquement
npm run test:performance -- integration

# Tests de régression uniquement
npm run test:performance -- regression
```

### Tests Multiples
```bash
# Plusieurs suites spécifiques
npm run test:performance -- circuit-breaker coalescing monitoring
```

## 📊 Structure des Tests

### Tests Unitaires (`tests/unit/`)

#### `circuit-breaker.test.ts`
- **Fonctionnalité de base** : États CLOSED/OPEN/HALF_OPEN
- **Mécanisme de récupération** : Timeouts et retry logic
- **Métriques et monitoring** : Tracking des performances
- **Contrôle manuel** : Force open/close, reset
- **Gestion d'erreurs** : Fallbacks et error handling
- **Factory pattern** : Configurations prédéfinies
- **Decorator pattern** : Application automatique

#### `request-coalescer.test.ts`
- **Coalescing de base** : Requêtes simultanées identiques
- **Gestion du cache** : TTL, invalidation, warmup
- **Coalescing par arguments** : Génération de clés automatique
- **Opérations batch** : Traitement groupé
- **Métriques et santé** : Monitoring de performance
- **Patterns prédéfinis** : User, campaign, analytics, AI requests

#### `graceful-degradation.test.ts`
- **Stratégies de dégradation** : fail_fast, best_effort, essential_only
- **Gestion des timeouts** : Timeouts par service
- **Fallback handling** : Fallbacks synchrones et asynchrones
- **Métriques et monitoring** : Tracking des dégradations
- **Configurations prédéfinies** : Dashboard, content generation, analytics, maintenance

#### `api-monitoring-service.test.ts`
- **Enregistrement de métriques** : Collecte temps réel
- **Système d'alertes** : Seuils et notifications
- **Métriques par endpoint** : Agrégation par route
- **Métriques par utilisateur** : Tracking individuel
- **Gestion des données** : Cleanup et retention
- **Export de données** : JSON et CSV

#### `load-testing-service.test.ts`
- **Tests de charge de base** : Simulation d'utilisateurs concurrents
- **Gestion des scénarios** : Distribution pondérée du trafic
- **Métriques et timeline** : Capture de performance temps réel
- **Recommandations** : Analyse automatique des résultats
- **Gestion d'erreurs** : Timeouts et failures
- **Configurations prédéfinies** : Smoke, load, stress, spike tests

#### `performance-optimization.test.ts`
- **Intégration Circuit Breaker + Coalescing** : Interaction des composants
- **Intégration Degradation + Circuit Breaker** : États et fallbacks
- **Stack de performance complète** : Tous composants ensemble
- **Monitoring intégré** : Métriques cross-composants
- **Gestion des pannes en cascade** : Résilience avancée

### Tests d'Intégration (`tests/integration/`)

#### `performance-integration.test.ts`
- **Flow API complet** : Requête end-to-end avec optimisations
- **Scénarios de performance dégradée** : Conditions réelles difficiles
- **Tests de charge réalistes** : Patterns de trafic mixtes
- **Patterns de trafic spike** : Montées soudaines de charge
- **Workload mixte** : Différents types de services
- **Gestion mémoire** : Efficacité sous charge soutenue

### Tests de Régression (`tests/regression/`)

#### `performance-optimization-regression.test.ts`
- **Conformité SLI/SLO** : Validation des objectifs de performance
- **Configuration Circuit Breaker** : Vérification des seuils
- **Performance Request Coalescing** : Efficacité sous charge
- **Stratégies Graceful Degradation** : Configurations prédéfinies
- **Standards Load Testing** : Configurations de test
- **Monitoring et alertes** : Seuils et calculs
- **Performance d'intégration** : End-to-end sous charge réaliste
- **Gestion des ressources** : Mémoire et cleanup

## 📈 Métriques et Seuils

### SLI/SLO Targets (Service Level Indicators/Objectives)

#### Availability SLI
- **Target** : 99.9% uptime
- **Mesure** : (successful_requests / total_requests) * 100
- **Seuils** :
  - ✅ Meeting: ≥ 99.9%
  - ⚠️ At Risk: 99.5% - 99.9%
  - ❌ Breaching: < 99.5%

#### Latency SLI
- **Target** : P95 < 500ms, P99 < 1000ms
- **Mesure** : Distribution des temps de réponse
- **Seuils** :
  - ✅ Meeting: P95 ≤ 500ms
  - ⚠️ At Risk: 500ms < P95 ≤ 750ms
  - ❌ Breaching: P95 > 750ms

#### Error Rate SLI
- **Target** : < 0.1% d'erreurs serveur
- **Mesure** : (5xx_responses / total_requests) * 100
- **Seuils** :
  - ✅ Meeting: ≤ 0.1%
  - ⚠️ At Risk: 0.1% - 1%
  - ❌ Breaching: > 1%

### Seuils de Couverture de Code
- **Statements** : 85%
- **Branches** : 80%
- **Functions** : 85%
- **Lines** : 85%

### Seuils de Performance Load Testing
- **Error Rate** : < 5%
- **P95 Latency** : < 2000ms
- **P99 Latency** : < 5000ms
- **Throughput** : > 10 RPS

## 🔧 Configuration des Tests

### Variables d'Environnement
```bash
# Load Testing
LOAD_TEST_API_KEY=your-test-api-key
API_BASE_URL=http://localhost:3000

# Monitoring
MONITORING_WEBHOOK_URL=https://monitoring.example.com/webhook
SLI_AVAILABILITY_TARGET=99.9
SLI_LATENCY_P95_TARGET=500
SLI_ERROR_RATE_TARGET=0.1

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000
CIRCUIT_BREAKER_MONITORING_WINDOW=300000

# Request Coalescing
REQUEST_COALESCER_TTL=5000
REQUEST_COALESCER_MAX_CACHE_SIZE=1000
```

### Configuration Vitest
Les tests de performance sont configurés dans `vitest.config.ts` avec :
- Timeout étendu (30s) pour les tests de charge
- Patterns de fichiers incluant `/tests/regression/` et `/tests/load/`
- Couverture de code incluant les services de load testing

## 🚨 Alertes et Monitoring

### Types d'Alertes Testées
- **High Latency** : Temps de réponse > seuil
- **Error Rate** : Taux d'erreur > seuil
- **Token Usage** : Consommation AI > seuil
- **Rate Limit** : Hits de rate limiting > seuil

### Niveaux de Sévérité
- **Critical** : Impact immédiat sur les utilisateurs
- **High** : Dégradation significative de performance
- **Medium** : Problème à surveiller
- **Low** : Information de monitoring

## 🔄 Intégration CI/CD

### Pipeline de Validation
```yaml
# .github/workflows/performance.yml
- name: Performance Tests
  run: npm run test:performance

- name: Load Tests
  run: npm run load-test:smoke

- name: Coverage Check
  run: npm run coverage:check 85 80 85 85
```

### Checks de Qualité
- Tests de performance obligatoires avant merge
- Validation de couverture de code
- Vérification des seuils SLI/SLO
- Tests de régression automatiques

## 📝 Bonnes Pratiques

### Écriture de Tests
1. **Isolation** : Chaque test doit être indépendant
2. **Cleanup** : Reset des services entre les tests
3. **Mocking** : Mock des services externes appropriés
4. **Assertions** : Vérifications précises des métriques
5. **Performance** : Tests rapides et efficaces

### Maintenance
1. **Mise à jour des seuils** : Ajuster selon l'évolution du système
2. **Nouveaux patterns** : Ajouter tests pour nouvelles optimisations
3. **Monitoring continu** : Surveiller les métriques en production
4. **Documentation** : Maintenir ce guide à jour

### Debugging
1. **Logs détaillés** : Utiliser les logs de debug en développement
2. **Métriques granulaires** : Analyser les métriques par composant
3. **Tests isolés** : Exécuter des suites spécifiques pour identifier les problèmes
4. **Profiling** : Utiliser les outils de profiling pour les problèmes de performance

## 📚 Ressources

### Documentation Technique
- [Circuit Breaker Pattern](../docs/api/circuit-breaker-guide.md)
- [Request Coalescing Best Practices](../docs/api/coalescing-guide.md)
- [Load Testing Strategies](../docs/api/load-testing-guide.md)
- [Monitoring and Alerting](../docs/api/monitoring-guide.md)

### Outils Recommandés
- **Load Testing** : Artillery, k6, Apache Bench
- **Monitoring** : Grafana, Prometheus, DataDog
- **Tracing** : Jaeger, Zipkin, OpenTelemetry
- **Alerting** : PagerDuty, Slack, OpsGenie

### Métriques de Référence
- **E-commerce** : P95 < 1s, 99.9% uptime
- **SaaS** : P95 < 500ms, 99.95% uptime
- **API** : P95 < 200ms, 99.99% uptime

L'architecture de performance est maintenant entièrement testée et validée ! 🚀