# Beta Launch UI System - Testing Guide

## Tests Associés

Cette spec a 3 fichiers de tests principaux :

1. `tests/unit/beta-landing-page.test.tsx` - Tests de la page de landing beta
2. `tests/unit/responsive-layout.property.test.tsx` - Tests property-based pour le responsive
3. `tests/unit/animation-performance.test.ts` - Tests de performance des animations

## Problème de Performance

Ces tests peuvent consommer beaucoup de RAM et faire crasher l'IDE, surtout en mode watch.

## Solutions

### Option 1 : Lancer les tests de manière optimisée

```bash
# Lancer uniquement les tests beta (configuration ultra-optimisée)
npm run test:beta

# Avec watch mode (si nécessaire)
npm run test:beta:watch
```

Cette configuration :
- Limite la mémoire à 1024 MB
- Lance les tests un par un (maxConcurrency: 1)
- Utilise un seul processus (singleFork: true)
- Désactive le coverage par défaut

### Option 2 : Désactiver temporairement les tests

Si les tests causent toujours des problèmes :

```bash
# Désactiver les tests beta
./scripts/disable-beta-tests.sh

# Travailler sur autre chose...

# Réactiver quand vous êtes prêt
./scripts/enable-beta-tests.sh
```

### Option 3 : Lancer un seul test à la fois

```bash
# Test spécifique
NODE_OPTIONS='--max-old-space-size=1024' npx vitest run tests/unit/beta-landing-page.test.tsx --reporter=basic

# Ou avec le script
./scripts/test-optimized.sh single tests/unit/beta-landing-page.test.tsx
```

## Configuration Spéciale

Les tests beta utilisent `vitest.config.beta.ts` qui est ultra-optimisé :
- Un seul processus
- Tests séquentiels
- Pas de coverage
- Timeout court (10s)

## Monitoring

Pour vérifier si les tests tournent en arrière-plan :

```bash
# Vérifier la RAM
npm run check:memory

# Voir les processus vitest
ps aux | grep vitest
```

## Recommandations

1. **Ne jamais** lancer `npm test` sans `run` (mode watch)
2. **Toujours** utiliser `npm run test:beta` pour ces tests
3. **Fermer** les fichiers de test quand vous ne travaillez pas dessus
4. **Désactiver** les tests si l'IDE devient instable

## Tâches de la Spec

Voir `tasks.md` pour la liste complète des tâches. Les tests sont marqués avec `*` pour indiquer qu'ils sont optionnels.

Tâches de test principales :
- [x] 1.1 Property test: Design System Token Completeness
- [x] 24.1 Property test: Skeleton Loading Structure (optionnel)
- [x] 25.1 Property test: Responsive Layout Adaptation
- [x] 26.1 Property test: Animation Performance (optionnel)
- [x] 26.2 Property test: Reduced Motion Support (optionnel)
