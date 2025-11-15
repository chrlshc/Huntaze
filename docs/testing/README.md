# Documentation des Tests Huntaze

Documentation complète de la suite de tests production pour Huntaze.

## 📚 Guides Disponibles

### [Guide des Tests d'Intégration](./integration-tests.md)
Guide complet pour écrire et maintenir les tests d'intégration.

**Contenu**:
- Structure des tests
- Configuration Vitest
- Écrire un test d'intégration
- Gestion des données de test
- Mocking
- Tests de sécurité
- Best practices

**Quand l'utiliser**: Pour tester les interactions entre API routes, services et base de données.

### [Guide des Tests E2E](./e2e-tests.md)
Guide complet pour écrire et maintenir les tests end-to-end avec Playwright.

**Contenu**:
- Structure des tests
- Configuration Playwright
- Écrire un test E2E
- Helpers et utilities
- Page Object Model
- Sélecteurs et locators
- Tests multi-navigateurs
- Debugging

**Quand l'utiliser**: Pour tester des parcours utilisateur complets dans un navigateur.

### [Guide des Tests de Charge](./load-tests.md)
Guide complet pour écrire et exécuter les tests de charge avec k6.

**Contenu**:
- Installation de k6
- Écrire un test de charge
- Types de tests (baseline, peak, spike, stress, soak)
- Métriques et seuils
- Utilitaires
- Interprétation des résultats
- Best practices

**Quand l'utiliser**: Pour vérifier que l'application peut gérer le volume de trafic attendu.

### [Guide d'Exécution Locale](./local-testing-guide.md)
Guide complet pour configurer et exécuter tous les types de tests en local.

**Contenu**:
- Prérequis et installation
- Configuration de l'environnement
- Exécution de chaque type de test
- Workflow recommandé
- Résolution des problèmes
- Scripts utiles
- Best practices

**Quand l'utiliser**: Pour configurer votre environnement de test local.

## 🚀 Quick Start

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd huntaze

# Installer les dépendances
npm install

# Installer k6
brew install k6  # macOS
sudo apt-get install k6  # Linux

# Installer Playwright
npx playwright install --with-deps

# Démarrer Redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### Exécution Rapide

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run build && npm run start
npx playwright test

# Tests de performance
npm run test:performance

# Tests de charge
npm run test:load:all
```

## 📊 Types de Tests

### Tests Unitaires
- **Outil**: Vitest
- **Durée**: ~30 secondes
- **Coverage**: Fonctions individuelles
- **Quand**: À chaque modification

### Tests d'Intégration
- **Outil**: Vitest
- **Durée**: ~2-5 minutes
- **Coverage**: API routes, services, DB
- **Quand**: Avant de commit

### Tests E2E
- **Outil**: Playwright
- **Durée**: ~5-15 minutes
- **Coverage**: Parcours utilisateur complets
- **Quand**: Avant de merger une PR

### Tests de Performance
- **Outil**: Vitest
- **Durée**: ~1-2 minutes
- **Coverage**: DB, cache, mémoire
- **Quand**: Après optimisations

### Tests de Charge
- **Outil**: k6
- **Durée**: ~5-60 minutes
- **Coverage**: Performance sous charge
- **Quand**: Avant release

## 🎯 Objectifs de Coverage

| Type | Objectif | Actuel |
|------|----------|--------|
| Unitaires | 80% | ✅ 85% |
| Intégration | 85% | ✅ 87% |
| E2E Critical Paths | 100% | ✅ 100% |
| Performance | Baselines établies | ✅ |
| Load | Seuils définis | ✅ |

## 📈 Métriques de Performance

### Seuils Établis

**API Endpoints**:
- Dashboard: p95 < 300ms
- Content: p95 < 400ms
- Messages: p95 < 200ms
- Revenue: p95 < 500ms

**Cache**:
- Hit rate: > 80%
- Cached response: < 50ms

**Database**:
- Queries: < 100ms
- Writes: < 200ms

**Memory**:
- Growth: < 50MB per test
- Heap usage: < 500MB

**Load**:
- Baseline: 1000 concurrent users
- Peak: 2500 concurrent users
- p95 response time: < 500ms

## 🔧 Configuration

### Variables d'Environnement

```bash
# .env.test
DATABASE_URL="postgresql://test:test@localhost:5432/huntaze_test"
REDIS_URL="redis://localhost:6379"
NODE_ENV="test"
BASE_URL="http://localhost:3000"
```

### Scripts npm

```json
{
  "test": "vitest",
  "test:unit": "vitest run tests/unit",
  "test:integration": "vitest run --config vitest.config.integration.ts",
  "test:integration:coverage": "vitest run --coverage --config vitest.config.integration.ts",
  "test:performance": "vitest run tests/performance",
  "test:performance:db": "vitest run tests/performance/database-performance.test.ts",
  "test:performance:cache": "vitest run tests/performance/cache-performance.test.ts",
  "test:performance:memory": "NODE_OPTIONS=--expose-gc vitest run tests/performance/memory-monitoring.test.ts",
  "test:load:rate-limiter": "k6 run tests/load/rate-limiting/rate-limiter-validation.js",
  "test:load:circuit-breaker": "k6 run tests/load/rate-limiting/circuit-breaker.js",
  "test:load:all": "npm run test:load:rate-limiter && npm run test:load:circuit-breaker"
}
```

## 🏗️ Structure des Tests

```
tests/
├── unit/                        # Tests unitaires
│   └── rate-limiter/
├── integration/                 # Tests d'intégration
│   ├── setup/
│   ├── fixtures/
│   ├── auth/
│   ├── dashboard/
│   ├── content/
│   ├── messages/
│   ├── revenue/
│   ├── marketing/
│   └── rate-limiter/
├── e2e/                        # Tests E2E
│   ├── setup/
│   ├── fixtures/
│   ├── workflows/
│   └── smoke/
├── performance/                # Tests de performance
│   ├── baseline-tracker.ts
│   ├── database-performance.test.ts
│   ├── cache-performance.test.ts
│   └── memory-monitoring.test.ts
└── load/                       # Tests de charge
    ├── scenarios/
    ├── rate-limiting/
    ├── utils/
    ├── config/
    └── reports/
```

## 🔍 Workflow de Test

### Développement Quotidien

```bash
# 1. Tests unitaires en watch mode
npm test -- --watch

# 2. Avant de commit
npm run test:unit
npm run test:integration
```

### Avant une PR

```bash
# 1. Suite complète
npm run test:unit
npm run test:integration

# 2. Tests E2E critiques
npm run build && npm run start
npx playwright test tests/e2e/smoke

# 3. Coverage
npm run test:integration:coverage
```

### Avant une Release

```bash
# 1. Tous les tests
npm run test:unit
npm run test:integration
npx playwright test

# 2. Performance
npm run test:performance

# 3. Charge
npm run test:load:all
```

## 🐛 Troubleshooting

### Tests Échouent

1. **Vérifier l'environnement**:
```bash
./scripts/check-tests.sh
```

2. **Vérifier Redis**:
```bash
redis-cli ping
```

3. **Vérifier l'application**:
```bash
curl http://localhost:3000/api/health
```

4. **Nettoyer les données**:
```bash
./scripts/cleanup-tests.sh
```

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| Redis non disponible | `brew services start redis` |
| Port 3000 occupé | `lsof -i :3000` puis `kill -9 <PID>` |
| Playwright non installé | `npx playwright install --with-deps` |
| k6 non installé | `brew install k6` |
| Tests lents | Utiliser `--pool=forks` |
| Timeouts | Augmenter `testTimeout` |

## 📚 Ressources Externes

### Documentation Officielle
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [k6](https://k6.io/docs/)

### Best Practices
- [Testing Best Practices](https://testingjavascript.com/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [k6 Best Practices](https://k6.io/docs/testing-guides/test-types/)

### Outils Complémentaires
- **Mixpanel**: Métriques business et tracking utilisateur
- **Typeform**: Feedback et satisfaction utilisateur
- **Linear**: Suivi des issues et gestion des régressions

## 🤝 Contribution

### Ajouter un Nouveau Test

1. Choisir le type de test approprié
2. Suivre la structure existante
3. Utiliser les helpers et fixtures
4. Ajouter la documentation
5. Vérifier le coverage

### Guidelines

- Tests indépendants et isolés
- Noms descriptifs
- Arrange-Act-Assert pattern
- Cleanup systématique
- Documentation à jour

## 📞 Support

Pour questions ou problèmes:
- Consulter cette documentation
- Vérifier les tests existants
- Créer une issue dans Linear
- Demander à l'équipe

## 📝 Changelog

### Version 1.0.0 (Novembre 2025)
- ✅ Tests d'intégration complets (118 tests)
- ✅ Tests E2E smoke (6 tests)
- ✅ Tests de charge rate limiting
- ✅ Tests de performance (DB, cache, mémoire)
- ✅ Documentation complète
- ✅ Scripts d'automatisation

---

**Dernière mise à jour**: Novembre 14, 2025
**Maintenu par**: Équipe Huntaze
**Status**: Production Ready ✅
