# Smoke Tests Guide

## 🎯 Overview

Les tests smoke sont des tests Playwright qui vérifient les fonctionnalités critiques de l'application. Ils nécessitent un serveur en cours d'exécution.

## ⚠️ Important

**Ces tests ne sont PAS des tests Vitest !** Ils utilisent Playwright et doivent être exécutés séparément.

## 🚀 Exécution des Tests Smoke

### Prérequis

1. **Serveur de développement en cours d'exécution**
   ```bash
   npm run dev
   ```
   Le serveur doit être accessible sur `http://localhost:3000`

2. **Playwright installé**
   ```bash
   npx playwright --version
   ```

### Commandes

#### Exécuter tous les tests smoke
```bash
npm run e2e:smoke
```

#### Exécuter tous les tests e2e (incluant smoke)
```bash
npm run e2e
```

#### Exécuter un test spécifique
```bash
npx playwright test tests/smoke/cin.status.spec.ts
```

#### Exécuter avec UI interactive
```bash
npx playwright test --ui
```

#### Exécuter en mode debug
```bash
npx playwright test --debug
```

## 📋 Tests Smoke Disponibles

| Test | Description | Endpoint |
|------|-------------|----------|
| `cin.status.spec.ts` | Vérifie le statut CIN avec badge | `/api/cin/status?badge=true` |
| `cin.chat.spec.ts` | Vérifie le chat CIN | `/api/cin/chat` |
| `of.inbox.unauth.spec.ts` | Vérifie la protection de l'inbox OF | `/api/of/inbox` |
| `ui.home.cta.spec.ts` | Vérifie les CTA de la page d'accueil | `/` |
| `ui.onlyfans-assisted.cta.spec.ts` | Vérifie les CTA OnlyFans | `/platforms/onlyfans` |
| `ui.social-marketing.cta.spec.ts` | Vérifie les CTA marketing social | `/platforms/social` |

## 🔧 Configuration

La configuration Playwright se trouve dans `playwright.config.ts`.

### Base URL
Par défaut, les tests utilisent `http://localhost:3000`. Pour changer :

```bash
# Via variable d'environnement
BASE_URL=http://localhost:3001 npm run e2e:smoke

# Ou modifier playwright.config.ts
```

## 🐛 Dépannage

### Erreur: "Playwright Test did not expect test() to be called here"

**Cause**: Les tests smoke sont exécutés avec Vitest au lieu de Playwright.

**Solution**: Utiliser `npm run e2e:smoke` au lieu de `npm test`

### Erreur: "Connection refused"

**Cause**: Le serveur de développement n'est pas en cours d'exécution.

**Solution**:
```bash
# Terminal 1: Démarrer le serveur
npm run dev

# Terminal 2: Exécuter les tests
npm run e2e:smoke
```

### Erreur: "Timeout waiting for page"

**Cause**: Le serveur est lent à démarrer ou la page met du temps à charger.

**Solution**:
1. Vérifier que le serveur est complètement démarré
2. Augmenter le timeout dans `playwright.config.ts`
3. Vérifier les logs du serveur pour des erreurs

### Tests échouent en CI/CD

**Solution**:
1. S'assurer que le serveur est démarré avant les tests
2. Utiliser `wait-on` pour attendre que le serveur soit prêt
3. Exemple:
   ```bash
   npm run dev &
   npx wait-on http://localhost:3000
   npm run e2e:smoke
   ```

## 📊 Résultats des Tests

### Format de sortie

```bash
Running 6 tests using 1 worker

  ✓ tests/smoke/cin.status.spec.ts:3:1 › CIN status returns 200 (234ms)
  ✓ tests/smoke/of.inbox.unauth.spec.ts:3:1 › OF inbox is gated (156ms)
  ...

  6 passed (1.2s)
```

### Rapports

Les rapports Playwright sont générés dans `playwright-report/`:

```bash
# Ouvrir le rapport HTML
npx playwright show-report
```

## 🎯 Bonnes Pratiques

### 1. Exécuter avant chaque commit
```bash
# Dans .git/hooks/pre-commit
npm run dev &
SERVER_PID=$!
npx wait-on http://localhost:3000
npm run e2e:smoke
kill $SERVER_PID
```

### 2. Exécuter en CI/CD
```yaml
# .github/workflows/test.yml
- name: Start server
  run: npm run dev &
  
- name: Wait for server
  run: npx wait-on http://localhost:3000
  
- name: Run smoke tests
  run: npm run e2e:smoke
```

### 3. Tests rapides vs complets

**Smoke tests** (rapides, critiques):
```bash
npm run e2e:smoke
```

**Tous les tests e2e** (complets):
```bash
npm run e2e
```

## 🔍 Debugging

### Mode interactif
```bash
npx playwright test --ui
```

### Mode debug avec breakpoints
```bash
npx playwright test --debug
```

### Voir les traces
```bash
npx playwright show-trace trace.zip
```

### Capturer des screenshots
Les screenshots sont automatiquement capturés en cas d'échec dans `test-results/`

## 📝 Écrire de Nouveaux Tests Smoke

```typescript
import { test, expect } from '@playwright/test'

test('My smoke test', async ({ request }) => {
  // Test API
  const res = await request.get('/api/my-endpoint')
  expect(res.status()).toBe(200)
})

test('My UI smoke test', async ({ page }) => {
  // Test UI
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})
```

### Marquer comme smoke test
```typescript
test('My test @smoke', async ({ page }) => {
  // Ce test sera exécuté avec npm run e2e:smoke
})
```

## ✅ Checklist de Validation

Avant de considérer les tests smoke comme passés :

- [ ] Serveur de développement démarré
- [ ] Tous les tests smoke passent (6/6)
- [ ] Aucune erreur dans les logs du serveur
- [ ] Temps d'exécution < 2 minutes
- [ ] Rapports générés sans erreur

## 🎯 Commandes Rapides

```bash
# Setup complet
npm run dev &                    # Démarrer le serveur
npx wait-on http://localhost:3000  # Attendre le serveur
npm run e2e:smoke                # Exécuter les tests

# Cleanup
pkill -f "next dev"              # Arrêter le serveur
```

---

**Note**: Les tests smoke sont exclus de `npm test` car ils nécessitent un serveur en cours d'exécution. Utilisez toujours `npm run e2e:smoke` pour les exécuter.
