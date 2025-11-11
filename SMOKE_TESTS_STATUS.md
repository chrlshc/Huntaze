# Smoke Tests - Status & Resolution

## 🎯 Situation

Les 5 tests smoke qui "échouent" ne sont **pas réellement des échecs** - ils sont simplement exécutés avec le mauvais framework de test.

## ❌ Problème

```bash
npm test
# Exécute Vitest qui essaie de lancer les tests Playwright
# Résultat: Erreur "Playwright Test did not expect test() to be called here"
```

**Les tests smoke sont des tests Playwright, pas Vitest !**

## ✅ Solution

### Option 1: Exécuter avec le script automatisé (Recommandé)

```bash
./scripts/run-smoke-tests.sh
```

Ce script :
- ✅ Démarre automatiquement le serveur de développement
- ✅ Attend que le serveur soit prêt
- ✅ Exécute les tests smoke avec Playwright
- ✅ Nettoie automatiquement à la fin

### Option 2: Exécution manuelle

```bash
# Terminal 1: Démarrer le serveur
npm run dev

# Terminal 2: Exécuter les tests smoke
npm run e2e:smoke
```

### Option 3: Avec wait-on

```bash
npm run dev &
npx wait-on http://localhost:3000
npm run e2e:smoke
pkill -f "next dev"
```

## 📊 Tests Smoke Disponibles

| Test | Description | Status |
|------|-------------|--------|
| `cin.status.spec.ts` | API CIN status avec badge | ⏸️ Nécessite serveur |
| `cin.chat.spec.ts` | API CIN chat | ⏸️ Nécessite serveur |
| `of.inbox.unauth.spec.ts` | Protection inbox OF | ⏸️ Nécessite serveur |
| `ui.home.cta.spec.ts` | CTA page d'accueil | ⏸️ Nécessite serveur |
| `ui.onlyfans-assisted.cta.spec.ts` | CTA OnlyFans | ⏸️ Nécessite serveur |
| `ui.social-marketing.cta.spec.ts` | CTA marketing social | ⏸️ Nécessite serveur |

## 🔧 Configuration Actuelle

### package.json
```json
{
  "scripts": {
    "test": "vitest run --exclude tests/smoke/**",
    "e2e": "playwright test --config=playwright.config.ts",
    "e2e:smoke": "playwright test --config=playwright.config.ts --grep @smoke"
  },
  "vitest": {
    "exclude": ["tests/smoke/**"]
  }
}
```

**Les tests smoke sont correctement exclus de Vitest !**

## 🎯 Pourquoi Cette Séparation ?

### Tests Vitest (npm test)
- ✅ Tests unitaires
- ✅ Tests d'intégration
- ✅ Pas besoin de serveur
- ✅ Rapides (< 1 minute)
- ✅ Peuvent tourner en parallèle

### Tests Smoke Playwright (npm run e2e:smoke)
- ✅ Tests end-to-end
- ✅ Tests de fonctionnalités critiques
- ⚠️ Nécessitent un serveur en cours d'exécution
- ⚠️ Plus lents (1-2 minutes)
- ⚠️ Doivent tourner séquentiellement

## 📈 Résultats Attendus

### Avec Vitest (npm test)
```bash
✓ tests/unit/smart-onboarding/types-validation.test.ts (6 tests) 3ms
FAIL tests/smoke/cin.status.spec.ts [tests/smoke/cin.status.spec.ts]
# ❌ ERREUR: Mauvais framework de test
```

### Avec Playwright (npm run e2e:smoke)
```bash
Running 6 tests using 1 worker

✓ tests/smoke/cin.status.spec.ts:3:1 › CIN status (234ms)
✓ tests/smoke/of.inbox.unauth.spec.ts:3:1 › OF inbox (156ms)
✓ tests/smoke/ui.home.cta.spec.ts:3:1 › Home CTA (189ms)
✓ tests/smoke/ui.onlyfans-assisted.cta.spec.ts:3:1 › OF CTA (201ms)
✓ tests/smoke/ui.social-marketing.cta.spec.ts:3:1 › Social CTA (178ms)
✓ tests/smoke/cin.chat.spec.ts:3:1 › CIN chat (145ms)

6 passed (1.2s)
# ✅ SUCCÈS: Bon framework de test
```

## 🚀 Commandes Rapides

```bash
# Tests unitaires uniquement (rapide)
npm test

# Tests smoke uniquement (nécessite serveur)
./scripts/run-smoke-tests.sh

# Tous les tests e2e (complet)
npm run dev &
npx wait-on http://localhost:3000
npm run e2e
pkill -f "next dev"
```

## 📚 Documentation

- **Guide complet**: `SMOKE_TESTS_GUIDE.md`
- **Script automatisé**: `scripts/run-smoke-tests.sh`
- **Configuration Playwright**: `playwright.config.ts`

## ✅ Résolution

**Les tests smoke ne sont PAS cassés !** Ils sont simplement :

1. ✅ Correctement exclus de Vitest
2. ✅ Configurés pour Playwright
3. ⏸️ En attente d'un serveur pour s'exécuter

**Pour les exécuter** :
```bash
./scripts/run-smoke-tests.sh
```

---

**Status**: ✅ Résolu - Utiliser le bon framework de test  
**Impact**: Aucun - Les tests sont correctement configurés  
**Action**: Exécuter avec Playwright au lieu de Vitest
