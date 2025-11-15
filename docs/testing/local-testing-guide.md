# Guide d'Exécution Locale des Tests

Guide complet pour configurer et exécuter tous les types de tests en local sur Huntaze.

## Prérequis

### Logiciels Requis

```bash
# Node.js (v20+)
node --version

# npm
npm --version

# k6 (pour tests de charge)
k6 version

# Redis (pour tests d'intégration)
redis-cli ping
```

### Installation

#### Node.js et npm

Déjà installés avec le projet.

#### k6

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Vérification
k6 version
```

#### Redis

```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Vérification
redis-cli ping
# Devrait retourner: PONG
```

## Configuration de l'Environnement

### Variables d'Environnement

Créer un fichier `.env.test` à la racine:

```bash
# .env.test
DATABASE_URL="postgresql://test:test@localhost:5432/huntaze_test"
REDIS_URL="redis://localhost:6379"
NODE_ENV="test"
BASE_URL="http://localhost:3000"
```

### Base de Données de Test

```bash
# Créer la DB de test
createdb huntaze_test

# Exécuter les migrations
npm run db:migrate:test
```

## Exécution des Tests

### 1. Tests Unitaires

Tests rapides des fonctions individuelles.

```bash
# Tous les tests unitaires
npm run test:unit

# Tests spécifiques
npm run test:unit tests/unit/rate-limiter

# Mode watch
npm test -- --watch tests/unit

# Avec UI
npm test -- --ui
```

**Durée**: ~30 secondes
**Quand**: À chaque modification de code

### 2. Tests d'Intégration

Tests des interactions entre composants.

```bash
# Tous les tests d'intégration
npm run test:integration

# Tests spécifiques
npm run test:integration tests/integration/dashboard
npm run test:integration tests/integration/revenue

# Mode watch
npm run test:integration:watch

# Avec coverage
npm run test:integration:coverage
```

**Durée**: ~2-5 minutes
**Quand**: Avant de commit

**Prérequis**:
- ✅ Redis en cours d'exécution
- ✅ Base de données de test configurée

### 3. Tests E2E (End-to-End)

Tests des parcours utilisateur complets.

```bash
# Démarrer l'application d'abord
npm run build
npm run start

# Dans un autre terminal:
# Tous les tests E2E
npx playwright test

# Tests spécifiques
npx playwright test login.spec.ts
npx playwright test tests/e2e/workflows/content

# Mode headed (avec navigateur visible)
npx playwright test --headed

# Mode debug
npx playwright test --debug

# Navigateur spécifique
npx playwright test --project=chromium

# Avec UI
npx playwright test --ui
```

**Durée**: ~5-15 minutes
**Quand**: Avant de merger une PR

**Prérequis**:
- ✅ Application en cours d'exécution sur port 3000
- ✅ Playwright installé: `npx playwright install`

### 4. Tests de Performance

Tests de performance de base.

```bash
# Démarrer l'application d'abord
npm run start

# Dans un autre terminal:
# Tous les tests de performance
npm run test:performance

# Tests spécifiques
npm run test:performance:db
npm run test:performance:cache
npm run test:performance:memory

# Avec coverage
npm run test:performance:coverage
```

**Durée**: ~1-2 minutes
**Quand**: Après optimisations

**Prérequis**:
- ✅ Application en cours d'exécution
- ✅ Redis en cours d'exécution

### 5. Tests de Charge

Tests de charge avec k6.

```bash
# Démarrer l'application d'abord
npm run start

# Dans un autre terminal:
# Test rapide (10s)
k6 run tests/load/rate-limiting/quick-test.js

# Tests de rate limiting
npm run test:load:rate-limiter
npm run test:load:circuit-breaker
npm run test:load:all

# Script interactif
./scripts/run-load-tests.sh
```

**Durée**: ~5-15 minutes
**Quand**: Avant release

**Prérequis**:
- ✅ Application en cours d'exécution
- ✅ k6 installé

## Workflow de Test Recommandé

### Développement Quotidien

```bash
# 1. Tests unitaires en watch mode
npm test -- --watch

# 2. Avant de commit
npm run test:unit
npm run test:integration
```

### Avant de Créer une PR

```bash
# 1. Tous les tests unitaires et intégration
npm run test:unit
npm run test:integration

# 2. Tests E2E critiques
npm run build
npm run start
npx playwright test tests/e2e/smoke

# 3. Vérifier le coverage
npm run test:integration:coverage
```

### Avant une Release

```bash
# 1. Suite complète de tests
npm run test:unit
npm run test:integration
npx playwright test

# 2. Tests de performance
npm run test:performance

# 3. Tests de charge
npm run test:load:all
```

## Résolution des Problèmes

### Tests d'Intégration Échouent

#### Problème: Redis non disponible

```bash
# Vérifier Redis
redis-cli ping

# Si pas de réponse, démarrer Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

#### Problème: Base de données non configurée

```bash
# Créer la DB
createdb huntaze_test

# Vérifier la connexion
psql huntaze_test
```

#### Problème: Port déjà utilisé

```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 <PID>
```

### Tests E2E Échouent

#### Problème: Application non démarrée

```bash
# Vérifier que l'app tourne
curl http://localhost:3000/api/health

# Si non, démarrer
npm run build
npm run start
```

#### Problème: Playwright non installé

```bash
# Installer les navigateurs
npx playwright install

# Avec dépendances système
npx playwright install --with-deps
```

#### Problème: Timeouts

```typescript
// Augmenter le timeout dans le test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // test logic
});
```

### Tests de Charge Échouent

#### Problème: k6 non installé

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6
```

#### Problème: Trop d'erreurs

```bash
# Réduire la charge
k6 run --vus 10 --duration 30s tests/load/rate-limiting/quick-test.js

# Vérifier les logs de l'app
npm run start | tee app.log
```

#### Problème: Rate limiting trop agressif

```typescript
// Ajuster les seuils dans lib/config/rate-limits.ts
export const RATE_LIMITS = {
  default: 1000, // Augmenter pour les tests
};
```

## Optimisation des Tests

### Parallélisation

```bash
# Tests d'intégration en parallèle
npm run test:integration -- --pool=forks --poolOptions.forks.maxForks=4

# Tests E2E en parallèle
npx playwright test --workers=4
```

### Cache

```bash
# Utiliser le cache npm
npm ci

# Cache Playwright
npx playwright install --with-deps
```

### Sélection des Tests

```bash
# Tests modifiés seulement
npm test -- --changed

# Tests spécifiques
npm test -- tests/unit/rate-limiter

# Pattern matching
npm test -- --testNamePattern="should handle"
```

## Scripts Utiles

### Script de Setup Complet

```bash
#!/bin/bash
# scripts/setup-tests.sh

echo "🔧 Setting up test environment..."

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
  echo "❌ Redis not running"
  echo "Starting Redis..."
  brew services start redis || sudo systemctl start redis
fi

# Check k6
if ! command -v k6 &> /dev/null; then
  echo "❌ k6 not installed"
  echo "Installing k6..."
  brew install k6 || sudo apt-get install k6
fi

# Check Playwright
if ! npx playwright --version &> /dev/null; then
  echo "❌ Playwright not installed"
  echo "Installing Playwright..."
  npx playwright install --with-deps
fi

# Create test DB
if ! psql -lqt | cut -d \| -f 1 | grep -qw huntaze_test; then
  echo "Creating test database..."
  createdb huntaze_test
fi

echo "✅ Test environment ready!"
```

### Script de Nettoyage

```bash
#!/bin/bash
# scripts/cleanup-tests.sh

echo "🧹 Cleaning up test data..."

# Clean test database
psql huntaze_test -c "TRUNCATE TABLE users, content, messages CASCADE;"

# Clear Redis
redis-cli FLUSHDB

# Remove test artifacts
rm -rf test-results/
rm -rf playwright-report/
rm -rf coverage/

echo "✅ Cleanup complete!"
```

### Script de Vérification

```bash
#!/bin/bash
# scripts/check-tests.sh

echo "🔍 Checking test environment..."

# Check Node
node --version || echo "❌ Node not found"

# Check npm
npm --version || echo "❌ npm not found"

# Check Redis
redis-cli ping || echo "❌ Redis not running"

# Check k6
k6 version || echo "❌ k6 not installed"

# Check Playwright
npx playwright --version || echo "❌ Playwright not installed"

# Check app
curl -s http://localhost:3000/api/health || echo "⚠️  App not running"

echo "✅ Check complete!"
```

## Commandes Rapides

```bash
# Setup complet
./scripts/setup-tests.sh

# Vérification environnement
./scripts/check-tests.sh

# Tests rapides (unitaires seulement)
npm run test:unit

# Tests complets (unit + integration)
npm run test:unit && npm run test:integration

# Tests E2E smoke
npx playwright test tests/e2e/smoke

# Tests de charge rapides
k6 run tests/load/rate-limiting/quick-test.js

# Nettoyage
./scripts/cleanup-tests.sh
```

## Monitoring des Tests

### Voir les Résultats

```bash
# Rapport HTML des tests E2E
npx playwright show-report

# Coverage HTML
open coverage/index.html

# Résultats k6
cat tests/load/reports/latest/results.json
```

### Logs

```bash
# Logs de l'application
npm run start | tee app.log

# Logs Redis
redis-cli MONITOR

# Logs des tests
npm test -- --reporter=verbose
```

## Best Practices

### 1. Toujours Nettoyer

```bash
# Avant les tests
./scripts/cleanup-tests.sh

# Après les tests
npm run test:cleanup
```

### 2. Vérifier l'Environnement

```bash
# Avant de lancer les tests
./scripts/check-tests.sh
```

### 3. Isoler les Tests

```bash
# Tests unitaires d'abord (rapides)
npm run test:unit

# Puis intégration (plus lents)
npm run test:integration
```

### 4. Utiliser le Watch Mode

```bash
# Pendant le développement
npm test -- --watch
```

### 5. Vérifier le Coverage

```bash
# Régulièrement
npm run test:integration:coverage

# Objectif: > 85%
```

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- Documentation des tests: `docs/testing/`
- Tests existants: `tests/`

## Support

Pour questions ou problèmes:
- Consulter cette documentation
- Vérifier les tests existants
- Créer une issue dans Linear
- Demander à l'équipe
