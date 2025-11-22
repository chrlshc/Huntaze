# Beta Launch UI System - Optimisation des Tests

## Problème Résolu ✅

L'IDE crashait à cause des tests de la spec `beta-launch-ui-system` qui consommaient trop de RAM et tournaient en simultané.

## Solution Appliquée

### 1. Configuration Dédiée Ultra-Optimisée

Créé `vitest.config.beta.ts` avec :
- Limite mémoire : 1024 MB (au lieu de 4096 MB par défaut)
- Tests séquentiels : 1 test à la fois (maxConcurrency: 1)
- Processus unique : singleFork: true
- Pas de coverage : économise ~40% de RAM
- Timeout court : 10 secondes max par test

### 2. Scripts Dédiés

```bash
# Lancer les tests beta de manière optimisée
npm run test:beta

# Avec watch mode (si nécessaire)
npm run test:beta:watch
```

### 3. Scripts de Désactivation/Réactivation

Si les tests causent toujours des problèmes :

```bash
# Désactiver temporairement
./scripts/disable-beta-tests.sh

# Réactiver plus tard
./scripts/enable-beta-tests.sh
```

## Tests Concernés

1. `tests/unit/beta-landing-page.test.tsx` (17 tests)
2. `tests/unit/responsive-layout.property.test.tsx` (4 property tests, 61 runs)
3. `tests/unit/animation-performance.test.ts` (14 tests)

**Total : 35 tests**

## Résultats

✅ **Tous les tests passent** (35/35)
✅ **Durée d'exécution** : 3.6 secondes
✅ **Consommation RAM** : ~1 GB (au lieu de 4+ GB)
✅ **IDE stable** : Pas de crash

## Utilisation Recommandée

### Pour développer sur la spec beta :

```bash
# Lancer les tests beta uniquement
npm run test:beta

# Vérifier la RAM avant/après
npm run check:memory
```

### Si l'IDE devient instable :

```bash
# 1. Désactiver les tests beta
./scripts/disable-beta-tests.sh

# 2. Travailler sur autre chose

# 3. Réactiver quand prêt
./scripts/enable-beta-tests.sh
```

### Pour lancer un test spécifique :

```bash
# Un seul fichier
./scripts/test-optimized.sh single tests/unit/beta-landing-page.test.tsx

# Ou directement
NODE_OPTIONS='--max-old-space-size=1024' npx vitest run tests/unit/beta-landing-page.test.tsx
```

## Monitoring

```bash
# Vérifier si des tests tournent en arrière-plan
ps aux | grep vitest

# Vérifier la RAM
npm run check:memory

# Tuer tous les processus Node si nécessaire
pkill -9 node
```

## Documentation

- Guide complet : `.kiro/OPTIMIZE_TESTS_GUIDE.md`
- Tests beta : `.kiro/specs/beta-launch-ui-system/TESTING.md`
- Tâches : `.kiro/specs/beta-launch-ui-system/tasks.md`

## Prochaines Étapes

Les tests beta sont maintenant optimisés et ne devraient plus causer de crashes. Vous pouvez :

1. Continuer le développement de la spec beta
2. Lancer `npm run test:beta` régulièrement pour vérifier
3. Utiliser les scripts de désactivation si besoin

## Fichiers Créés/Modifiés

- ✅ `vitest.config.beta.ts` - Configuration ultra-optimisée
- ✅ `scripts/disable-beta-tests.sh` - Désactiver les tests
- ✅ `scripts/enable-beta-tests.sh` - Réactiver les tests
- ✅ `.kiro/specs/beta-launch-ui-system/TESTING.md` - Guide des tests
- ✅ `package.json` - Nouveaux scripts `test:beta` et `test:beta:watch`
- ✅ `.kiro/OPTIMIZE_TESTS_GUIDE.md` - Mis à jour avec infos beta
