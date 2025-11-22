# Guide d'Optimisation des Tests

## Problème
L'IDE crash à cause des tests qui consomment trop de RAM et tournent en simultané.

## Solutions Appliquées

### 1. Configuration Vitest Optimisée
- ✅ `singleFork: true` - Un seul processus au lieu de plusieurs
- ✅ `maxConcurrency: 2` - Maximum 2 tests en parallèle (au lieu de tous)
- ✅ `isolate: false` - Réutilise le contexte pour économiser la mémoire
- ✅ Limite mémoire Node.js à 2048 MB

### 2. VS Code Optimisé
- ✅ Extension Vitest désactivée (pas de watch automatique)
- ✅ Exclusion des dossiers lourds du watcher
- ✅ Limite mémoire TypeScript à 4096 MB

### 3. Scripts Optimisés

#### Lancer les tests sans surcharge :

```bash
# Tests unitaires optimisés (sans coverage, reporter minimal)
npm run test:unit:optimized

# Tests d'intégration optimisés
npm run test:integration:optimized

# Tests beta-launch-ui-system uniquement (ultra-optimisé)
npm run test:beta

# Script shell pour plus de contrôle
./scripts/test-optimized.sh unit
./scripts/test-optimized.sh integration
./scripts/test-optimized.sh single tests/unit/beta-landing-page.test.tsx
```

#### Désactiver temporairement les tests beta :

Si les tests beta causent toujours des crashes, vous pouvez les désactiver temporairement :

```bash
# Désactiver les tests beta (renomme en .disabled)
./scripts/disable-beta-tests.sh

# Réactiver les tests beta plus tard
./scripts/enable-beta-tests.sh
```

### 4. Commandes Manuelles

Si vous voulez encore plus de contrôle :

```bash
# Un seul fichier de test
NODE_OPTIONS='--max-old-space-size=2048' npx vitest run tests/unit/beta-landing-page.test.tsx --reporter=basic

# Tests unitaires sans watch
NODE_OPTIONS='--max-old-space-size=2048' npx vitest run tests/unit --no-coverage

# Tests d'intégration un par un
NODE_OPTIONS='--max-old-space-size=2048' npx vitest run tests/integration/api/auth-login.integration.test.ts
```

## Recommandations

### Pour éviter les crashes :

1. **Ne jamais utiliser** `npm test` ou `vitest` sans `run` (mode watch)
2. **Toujours utiliser** les versions optimisées des scripts
3. **Fermer** les fichiers de test inutiles dans l'éditeur
4. **Redémarrer** l'IDE si la RAM dépasse 80%

### Monitoring de la RAM :

```bash
# Voir l'utilisation mémoire en temps réel
top -o MEM

# Voir les processus Node
ps aux | grep node
```

### Si l'IDE crash encore :

1. Tuer tous les processus Node :
```bash
pkill -9 node
```

2. Nettoyer les caches :
```bash
rm -rf node_modules/.cache
rm -rf .next
rm -rf test-results
```

3. Redémarrer l'IDE

## Fichiers Modifiés

- `vitest.config.ts` - Configuration optimisée
- `vitest.config.integration.ts` - Configuration optimisée
- `.vscode/settings.json` - Désactivation du watch automatique
- `package.json` - Nouveaux scripts optimisés
- `scripts/test-optimized.sh` - Script shell pour tests légers

## Résultat Attendu

- ✅ Consommation RAM réduite de ~70%
- ✅ Pas de watch automatique qui tourne en arrière-plan
- ✅ Tests séquentiels au lieu de parallèles
- ✅ IDE stable même avec tests ouverts
