# Performance Tests

Tests de performance pour valider que l'application respecte les seuils de performance établis.

## Tests Disponibles

### 1. Database Performance Tests (`database-performance.test.ts`)
Tests pour s'assurer que les requêtes de base de données restent performantes.

**Seuils:**
- Requêtes: < 100ms (p95)
- Écritures: < 200ms (p95)

**Ce qui est testé:**
- Performance des requêtes dashboard
- Performance des requêtes content
- Performance des requêtes messages
- Performance des requêtes revenue
- Performance des requêtes analytics
- Performance des requêtes concurrentes

### 2. Cache Performance Tests (`cache-performance.test.ts`)
Tests pour valider l'efficacité du caching.

**Seuils:**
- Taux de cache hit: > 80%
- Réponse cachée: < 50ms
- Réponse non-cachée: < 200ms

**Ce qui est testé:**
- Taux de cache hit pour dashboard
- Taux de cache hit pour content
- Temps de réponse avec cache hit vs miss
- Invalidation du cache
- Performance sous charge concurrente

### 3. Memory Monitoring Tests (`memory-monitoring.test.ts`)
Tests pour détecter les fuites mémoire.

**Seuils:**
- Croissance mémoire: < 50MB par test
- Taux de croissance: < 10% par itération
- Heap usage: < 500MB

**Ce qui est testé:**
- Fuites mémoire lors d'appels API répétés
- Fuites mémoire lors d'opérations content
- Fuites mémoire lors d'opérations messages
- Stabilité mémoire sous charge soutenue
- Nettoyage des ressources

### 4. Baseline Tracker (`baseline-tracker.ts`)
Système de suivi des baselines de performance pour détecter les régressions.

**Fonctionnalités:**
- Enregistrement des métriques de performance
- Calcul des baselines (p50, p95, p99)
- Comparaison avec les baselines
- Détection des régressions (seuil: 20%)
- Export/Import des baselines
- Génération de rapports

## Exécution des Tests

### Tous les tests de performance
```bash
npm run test:performance
```

### Tests individuels
```bash
# Database performance
npm run test:performance:db

# Cache performance
npm run test:performance:cache

# Memory monitoring
npm run test:performance:memory
```

### Avec coverage
```bash
npm run test:performance:coverage
```

## Configuration

### Variables d'environnement
```bash
# Base URL de l'application
BASE_URL=http://localhost:3000

# Activer le garbage collector pour les tests mémoire
NODE_OPTIONS=--expose-gc
```

### Seuils de performance
Les seuils sont définis dans chaque fichier de test:

```typescript
const QUERY_THRESHOLD_MS = 100;
const WRITE_THRESHOLD_MS = 200;
const CACHE_HIT_THRESHOLD = 0.80;
const MEMORY_GROWTH_THRESHOLD_MB = 50;
```

## Intégration avec Outils Externes

Ces tests sont complémentaires aux outils d'analyse externes:

### Mixpanel
- Tracking des événements utilisateur
- Analyse des parcours utilisateur
- Métriques business

### Typeform
- Collecte de feedback utilisateur
- Enquêtes de satisfaction
- NPS tracking

### Linear
- Suivi des issues de performance
- Gestion des régressions détectées
- Priorisation des optimisations

## Interprétation des Résultats

### Résultats Positifs ✅
```
✓ Database Performance Tests
  ✓ should fetch dashboard data under 100ms (45ms)
  ✓ should fetch content list under 100ms (67ms)
  
✓ Cache Performance Tests
  ✓ should achieve >80% cache hit rate (92%)
  ✓ should respond faster with cache hit (23ms vs 156ms)
  
✓ Memory Monitoring Tests
  ✓ should not leak memory (growth: 12MB)
  ✓ should keep heap usage within bounds (234MB)
```

### Signes d'Alerte ⚠️
```
✗ should fetch dashboard data under 100ms (156ms)
  → Requête trop lente, vérifier les index DB

✗ should achieve >80% cache hit rate (65%)
  → Taux de cache hit trop bas, vérifier la config cache

✗ should not leak memory (growth: 87MB)
  → Fuite mémoire détectée, profiler l'application
```

## Baseline Tracking

### Créer une baseline
```typescript
import { getBaselineTracker } from './baseline-tracker';

const tracker = getBaselineTracker();

// Enregistrer des métriques
tracker.recordMetric({
  endpoint: '/api/dashboard',
  method: 'GET',
  timestamp: new Date(),
  duration: 45,
  statusCode: 200,
});

// Sauvegarder la baseline
tracker.saveBaseline('/api/dashboard', 'GET');

// Exporter
const json = tracker.exportBaselines();
```

### Comparer avec baseline
```typescript
// Charger baseline existante
tracker.importBaselines(baselineJson);

// Enregistrer nouvelles métriques
// ... record metrics ...

// Comparer
const comparison = tracker.compareToBaseline('/api/dashboard', 'GET');

if (comparison.regression) {
  console.error(`Régression détectée: ${comparison.regressionPercentage * 100}%`);
}
```

### Générer un rapport
```typescript
const report = tracker.generateReport();

console.log(`Endpoints testés: ${report.totalEndpoints}`);
console.log(`Régressions détectées: ${report.regressionsDetected}`);
console.log(`Endpoints améliorés: ${report.summary.endpointsImproved}`);
console.log(`Endpoints régressés: ${report.summary.endpointsRegressed}`);
```

## Troubleshooting

### Tests échouent localement
1. Vérifier que l'application est démarrée: `npm run start`
2. Vérifier que Redis est actif: `redis-cli ping`
3. Vérifier les variables d'environnement

### Tests mémoire ne fonctionnent pas
1. Activer le garbage collector:
```bash
NODE_OPTIONS=--expose-gc npm run test:performance:memory
```

### Résultats incohérents
1. Fermer les autres applications
2. Exécuter les tests plusieurs fois
3. Utiliser un environnement dédié pour les tests de performance

### Cache hit rate faible
1. Vérifier la configuration Redis
2. Vérifier les TTL du cache
3. Vérifier que le cache n'est pas invalidé trop souvent

## Best Practices

### 1. Exécuter sur environnement dédié
Les tests de performance doivent être exécutés sur un environnement stable sans autres charges.

### 2. Établir des baselines
Créer des baselines après chaque release majeure pour suivre l'évolution.

### 3. Automatiser les tests
Intégrer les tests de performance dans le pipeline CI/CD.

### 4. Monitorer les tendances
Suivre l'évolution des métriques dans le temps, pas seulement les valeurs absolues.

### 5. Corréler avec les outils externes
Utiliser Mixpanel/Typeform/Linear pour corréler les métriques techniques avec l'expérience utilisateur.

## Métriques Clés

### Performance Database
- **p50**: 50e percentile des temps de réponse
- **p95**: 95e percentile (seuil principal)
- **p99**: 99e percentile (cas extrêmes)

### Performance Cache
- **Hit Rate**: % de requêtes servies depuis le cache
- **Miss Penalty**: Différence de temps entre hit et miss
- **Invalidation Time**: Temps pour invalider le cache

### Mémoire
- **Heap Used**: Mémoire heap utilisée
- **Growth Rate**: Taux de croissance mémoire
- **Leak Detection**: Croissance anormale sur durée

## Prochaines Étapes

Après avoir exécuté ces tests:

1. ✅ Documenter les baselines actuelles
2. ✅ Configurer les alertes pour les régressions
3. ✅ Intégrer avec Mixpanel pour métriques business
4. ✅ Créer des dashboards de suivi
5. ✅ Planifier les optimisations identifiées

## Support

Pour questions ou problèmes:
- Consulter `.kiro/specs/production-testing-suite/design.md`
- Vérifier les logs de l'application
- Utiliser Linear pour créer des issues
