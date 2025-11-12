# Feature Flags API Tests - Commandes Utiles

Référence rapide de toutes les commandes pour travailler avec les tests de l'API Feature Flags.

## 🚀 Commandes de Base

### Démarrer le Serveur

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

### Exécuter les Tests

```bash
# Tous les tests feature flags
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Avec couverture
npm run test:integration -- --coverage tests/integration/api/admin-feature-flags.test.ts

# Mode watch (re-run automatique)
npm run test:integration -- --watch tests/integration/api/admin-feature-flags.test.ts

# Verbose output
npm run test:integration -- --reporter=verbose tests/integration/api/admin-feature-flags.test.ts
```

## 🎯 Tests Spécifiques

### Par Catégorie

```bash
# Tests d'authentification
npm run test:integration -- --grep "Authentication" tests/integration/api/admin-feature-flags.test.ts

# Tests d'autorisation
npm run test:integration -- --grep "Authorization" tests/integration/api/admin-feature-flags.test.ts

# Tests de validation
npm run test:integration -- --grep "Validation" tests/integration/api/admin-feature-flags.test.ts

# Tests de schéma
npm run test:integration -- --grep "Schema" tests/integration/api/admin-feature-flags.test.ts

# Tests de concurrence
npm run test:integration -- --grep "Concurrent" tests/integration/api/admin-feature-flags.test.ts

# Tests de performance
npm run test:integration -- --grep "Performance" tests/integration/api/admin-feature-flags.test.ts

# Tests de sécurité
npm run test:integration -- --grep "Security" tests/integration/api/admin-feature-flags.test.ts

# Tests d'erreur
npm run test:integration -- --grep "Error" tests/integration/api/admin-feature-flags.test.ts
```

### Par Endpoint

```bash
# Tests GET uniquement
npm run test:integration -- --grep "GET /api/admin/feature-flags" tests/integration/api/admin-feature-flags.test.ts

# Tests POST uniquement
npm run test:integration -- --grep "POST /api/admin/feature-flags" tests/integration/api/admin-feature-flags.test.ts

# Tests HTTP methods
npm run test:integration -- --grep "HTTP Methods" tests/integration/api/admin-feature-flags.test.ts
```

## 🔧 Configuration

### Variables d'Environnement

```bash
# Définir l'URL de base
export TEST_BASE_URL=http://localhost:3000

# Définir le token admin
export TEST_ADMIN_TOKEN="your-admin-token-here"

# Définir le token utilisateur régulier
export TEST_AUTH_TOKEN="your-regular-user-token-here"

# Vérifier les variables
echo $TEST_BASE_URL
echo $TEST_ADMIN_TOKEN
echo $TEST_AUTH_TOKEN

# Tout en une ligne
export TEST_BASE_URL=http://localhost:3000 TEST_ADMIN_TOKEN="admin-token" TEST_AUTH_TOKEN="user-token"
```

### Environnements Différents

```bash
# Local
TEST_BASE_URL=http://localhost:3000 npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Staging
TEST_BASE_URL=https://staging.huntaze.com npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Production (read-only tests)
TEST_BASE_URL=https://api.huntaze.com npm run test:integration tests/integration/api/admin-feature-flags.test.ts
```

## 🧪 Tests Manuels avec curl

### GET - Récupérer les Flags

```bash
# Sans authentification (devrait retourner 401)
curl http://localhost:3000/api/admin/feature-flags

# Avec authentification admin
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags

# Avec verbose output
curl -v -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags

# Sauvegarder la réponse
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags > flags.json

# Pretty print JSON
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags | jq .
```

### POST - Mettre à Jour les Flags

```bash
# Activer le système
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Désactiver le système
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Définir le rollout à 25%
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 25}'

# Définir le rollout à 50%
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 50}'

# Définir le rollout à 100%
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 100}'

# Cibler des marchés spécifiques
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markets": ["FR", "DE", "US"]}'

# Définir une whitelist d'utilisateurs
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userWhitelist": ["user-123", "user-456"]}'

# Mise à jour multiple
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "rolloutPercentage": 75,
    "markets": ["FR", "DE"]
  }'

# Pretty print la réponse
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq .
```

### Tests d'Erreur

```bash
# Rollout percentage invalide (< 0)
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": -1}'

# Rollout percentage invalide (> 100)
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 150}'

# Objet vide (devrait retourner 400)
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# JSON invalide (devrait retourner 400)
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

## 🔍 Validation et Diagnostic

### Validation des Tests

```bash
# Exécuter le script de validation
bash scripts/validate-feature-flags-tests.sh

# Vérifier la syntaxe TypeScript
npx tsc --noEmit tests/integration/api/admin-feature-flags.test.ts

# Vérifier ESLint
npx eslint tests/integration/api/admin-feature-flags.test.ts

# Compter les tests
grep -c "it('should" tests/integration/api/admin-feature-flags.test.ts

# Compter les describe blocks
grep -c "describe(" tests/integration/api/admin-feature-flags.test.ts

# Lister tous les tests
grep "it('should" tests/integration/api/admin-feature-flags.test.ts
```

### Diagnostic

```bash
# Vérifier que le serveur est accessible
curl -I http://localhost:3000

# Vérifier l'endpoint feature flags
curl -I http://localhost:3000/api/admin/feature-flags

# Tester la latence
time curl http://localhost:3000/api/admin/feature-flags

# Vérifier les logs du serveur
tail -f .next/server.log

# Vérifier les processus Node.js
ps aux | grep node
```

## 📊 Analyse et Reporting

### Couverture de Code

```bash
# Générer le rapport de couverture
npm run test:integration -- --coverage tests/integration/api/admin-feature-flags.test.ts

# Ouvrir le rapport HTML
open coverage/index.html

# Voir le résumé dans le terminal
npm run test:integration -- --coverage --reporter=text tests/integration/api/admin-feature-flags.test.ts
```

### Performance

```bash
# Mesurer le temps d'exécution
time npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Profiler les tests
npm run test:integration -- --profile tests/integration/api/admin-feature-flags.test.ts

# Mesurer la latence de l'API
for i in {1..10}; do
  time curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    http://localhost:3000/api/admin/feature-flags > /dev/null 2>&1
done
```

## 🔄 CI/CD

### GitHub Actions

```bash
# Simuler le workflow CI
act -j test

# Exécuter les tests comme en CI
CI=true npm run test:integration tests/integration/api/admin-feature-flags.test.ts
```

### Pre-commit Hooks

```bash
# Installer les hooks
npm run prepare

# Exécuter manuellement
npm run pre-commit

# Tester avant commit
bash scripts/validate-feature-flags-tests.sh && \
npm run test:integration tests/integration/api/admin-feature-flags.test.ts
```

## 🧹 Nettoyage

### Nettoyer les Fichiers Temporaires

```bash
# Supprimer les fichiers de couverture
rm -rf coverage/

# Supprimer les fichiers de cache
rm -rf .next/cache/

# Nettoyer node_modules
rm -rf node_modules/
npm install

# Nettoyer tout
npm run clean
```

## 📚 Documentation

### Générer la Documentation

```bash
# Lire le README
cat tests/integration/api/admin-feature-flags-README.md

# Lire le Quick Start
cat FEATURE_FLAGS_TESTS_QUICK_START.md

# Lire le résumé
cat FEATURE_FLAGS_TESTS_SUMMARY.md

# Ouvrir dans l'éditeur
code tests/integration/api/admin-feature-flags-README.md
```

### Rechercher dans la Documentation

```bash
# Rechercher un terme
grep -r "authentication" tests/integration/api/admin-feature-flags*.md

# Rechercher dans tous les fichiers de test
grep -r "should" tests/integration/api/admin-feature-flags.test.ts

# Compter les occurrences
grep -c "expect" tests/integration/api/admin-feature-flags.test.ts
```

## 🎯 Workflows Courants

### Workflow Développeur

```bash
# 1. Démarrer le serveur
npm run dev

# 2. Dans un autre terminal, exécuter les tests
npm run test:integration -- --watch tests/integration/api/admin-feature-flags.test.ts

# 3. Faire des modifications et voir les tests se relancer automatiquement
```

### Workflow QA

```bash
# 1. Valider les tests
bash scripts/validate-feature-flags-tests.sh

# 2. Exécuter tous les tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# 3. Générer le rapport de couverture
npm run test:integration -- --coverage tests/integration/api/admin-feature-flags.test.ts

# 4. Tester manuellement avec curl
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags
```

### Workflow Pre-deployment

```bash
# 1. Valider les tests
bash scripts/validate-feature-flags-tests.sh

# 2. Exécuter tous les tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# 3. Vérifier la syntaxe
npx tsc --noEmit tests/integration/api/admin-feature-flags.test.ts

# 4. Vérifier ESLint
npx eslint tests/integration/api/admin-feature-flags.test.ts

# 5. Tester contre staging
TEST_BASE_URL=https://staging.huntaze.com \
npm run test:integration tests/integration/api/admin-feature-flags.test.ts
```

## 💡 Tips et Astuces

### Debug

```bash
# Activer le mode debug
DEBUG=* npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Voir les requêtes HTTP
NODE_DEBUG=http npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Augmenter le timeout
npm run test:integration -- --testTimeout=10000 tests/integration/api/admin-feature-flags.test.ts
```

### Filtrage Avancé

```bash
# Exclure certains tests
npm run test:integration -- --grep -v "Performance" tests/integration/api/admin-feature-flags.test.ts

# Tests qui contiennent "POST" ET "Validation"
npm run test:integration -- --grep "POST.*Validation" tests/integration/api/admin-feature-flags.test.ts

# Tests qui contiennent "GET" OU "POST"
npm run test:integration -- --grep "GET|POST" tests/integration/api/admin-feature-flags.test.ts
```

### Parallélisation

```bash
# Exécuter en parallèle (si supporté)
npm run test:integration -- --parallel tests/integration/api/admin-feature-flags.test.ts

# Limiter le nombre de workers
npm run test:integration -- --maxWorkers=2 tests/integration/api/admin-feature-flags.test.ts
```

## 📞 Aide

### Obtenir de l'Aide

```bash
# Aide vitest
npx vitest --help

# Aide npm
npm run test:integration -- --help

# Version de Node.js
node --version

# Version de npm
npm --version
```

### Ressources

- **Quick Start**: `FEATURE_FLAGS_TESTS_QUICK_START.md`
- **README**: `tests/integration/api/admin-feature-flags-README.md`
- **API Docs**: `docs/api/admin-feature-flags.md`
- **Validation**: `scripts/validate-feature-flags-tests.sh`

---

**Tip**: Ajoutez ces commandes à vos alias shell pour un accès rapide !

```bash
# Dans ~/.bashrc ou ~/.zshrc
alias ff-test="npm run test:integration tests/integration/api/admin-feature-flags.test.ts"
alias ff-watch="npm run test:integration -- --watch tests/integration/api/admin-feature-flags.test.ts"
alias ff-validate="bash scripts/validate-feature-flags-tests.sh"
alias ff-curl="curl -H 'Authorization: Bearer \$TEST_ADMIN_TOKEN' http://localhost:3000/api/admin/feature-flags"
```
