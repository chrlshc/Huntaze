# 🔍 Analyse Détaillée des Tests Échouants (26%)

**Date**: Novembre 14, 2025  
**Tests qui échouent**: 469/3469 (26%)  
**Fichiers qui échouent**: 74/116 (64%)

---

## 📊 Répartition par Catégorie

### 1. Tests UI/Components (~150 tests, ~32%)
**Problème principal**: Mocking React/Next.js incomplet

#### Fichiers affectés:
- `tests/unit/auth/auth-ui-components.test.tsx`
- `tests/unit/components/ImageEditor.test.tsx`
- `tests/unit/components/TagInput.test.tsx`
- `tests/unit/components/VariationManager.test.tsx`
- `tests/unit/content-creation/rich-text-editor.test.tsx`
- `tests/unit/hydration/*.test.tsx` (4 fichiers)
- `tests/unit/ui/*.test.tsx` (2 fichiers)
- `tests/unit/ui-enhancements/*.test.tsx` (2 fichiers)

**Erreurs typiques**:
```
ReferenceError: document is not defined
TypeError: Cannot read property 'createElement' of undefined
Error: Uncaught [Error: useRouter() should be mocked]
```

**Cause**:
- Environnement jsdom pas complètement configuré
- Mocks Next.js manquants (useRouter, Image, Link)
- React Testing Library pas configuré

**Solution**:
1. Configurer `@testing-library/react`
2. Créer mocks Next.js standards
3. Setup file pour jsdom

---

### 2. Tests Three.js (~30 tests, ~6%)
**Problème principal**: Dépendances manquantes

#### Fichiers affectés:
- `tests/unit/three-js/three-basic-validation.test.ts`
- `tests/unit/three-js/three-components-validation.test.ts`
- `tests/unit/three-js/three-simple-performance.test.ts`

**Erreurs**:
```
Error: Cannot find package 'three'
Error: Cannot find package '@react-three/drei'
```

**Cause**: Packages optionnels non installés

**Solution**:
```bash
npm install -D three @react-three/drei @react-three/fiber
```

**OU** skip ces tests si feature 3D non utilisée

---

### 3. Tests Services/OAuth (~80 tests, ~17%)
**Problème principal**: Configuration OAuth manquante

#### Fichiers affectés:
- `tests/unit/services/instagramOAuth-enhancements.test.ts`
- `tests/unit/services/tiktokOAuth.test.ts`
- `tests/unit/services/redditOAuth.test.ts`
- `tests/unit/workers/tokenRefreshScheduler-*.test.ts`

**Erreurs**:
```
Error: TikTok OAuth credentials not configured
Error: Instagram client ID not found
AssertionError: promise rejected instead of resolving
```

**Cause**: Variables d'environnement manquantes dans `.env.test`

**Solution**: Déjà créé `.env.test` mais besoin de:
1. Charger `.env.test` dans tests
2. Vérifier que mocks utilisent ces valeurs

---

### 4. Tests Database/Migrations (~60 tests, ~13%)
**Problème principal**: Mocking database incorrect

#### Fichiers affectés:
- `tests/unit/db/*.test.ts`
- Tests avec erreur "Database validation failed"

**Erreurs**:
```
TypeError: () => ({ ... }) is not a constructor
Database validation failed: () => ({ ... })
Error: Target version (1) must be greater than source version (2)
```

**Cause**: 
- Mocks mal configurés (arrow functions au lieu de classes)
- Pool de connexions pas mocké correctement

**Solution**:
1. Fixer pattern de mocking:
```typescript
// ❌ Mauvais
vi.mock('pg', () => ({
  Pool: () => ({ query: vi.fn() })
}));

// ✅ Bon
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn()
  }))
}));
```

---

### 5. Tests Media/Upload (~40 tests, ~9%)
**Problème principal**: Mocking filesystem et fetch

#### Fichiers affectés:
- `tests/unit/services/mediaUploadService.test.ts`
- `tests/unit/services/thumbnailService.test.ts`
- `tests/unit/bimi/logo-validation.test.ts`

**Erreurs**:
```
TypeError: Invalid URL
Error: ENOENT: no such file or directory
```

**Cause**:
- Fetch pas mocké
- Filesystem operations pas mockées
- URLs invalides dans tests

**Solution**:
1. Mock `fetch` globalement
2. Mock `fs` operations
3. Utiliser URLs valides dans tests

---

### 6. Tests Onboarding (~30 tests, ~6%)
**Problème principal**: State management mocking

#### Fichiers affectés:
- `tests/unit/onboarding/gating-logic.test.ts`
- `tests/unit/onboarding/progress-calculation.test.ts`
- `tests/unit/onboarding/step-transitions.test.ts`

**Erreurs**:
```
TypeError: Cannot read property 'getState' of undefined
Error: Store not initialized
```

**Cause**: Zustand/Redux store pas mocké

**Solution**:
1. Mock store correctement
2. Ou utiliser vrai store en mode test

---

### 7. Tests Documentation (~50 tests, ~11%)
**Problème principal**: Validation de fichiers

#### Fichiers affectés:
- `tests/unit/docs/*.test.ts`
- `tests/unit/specs/*.test.ts`
- `tests/unit/production-ready/*.test.ts`

**Erreurs**:
```
Error: File not found
AssertionError: expected content to match
```

**Cause**: 
- Fichiers de documentation déplacés/supprimés
- Validation trop stricte

**Solution**:
1. Mettre à jour chemins
2. Ou supprimer tests obsolètes
3. Rendre validation plus flexible

---

### 8. Tests Infrastructure (~20 tests, ~4%)
**Problème principal**: Configuration environment

#### Fichiers affectés:
- `tests/unit/infrastructure/*.test.ts`

**Erreurs**:
```
Error: Environment variable not set
```

**Cause**: Variables d'environnement manquantes

**Solution**: Charger `.env.test` correctement

---

## 📈 Priorités de Fix

### 🔴 Priorité 1 (Impact: 32% des échecs)
**Tests UI/Components** - 150 tests

**Effort**: Moyen (4-6h)  
**Impact**: Haut

**Actions**:
1. Installer `@testing-library/react`
2. Créer `tests/setup.ts` avec mocks Next.js
3. Fixer 5-10 tests comme exemples
4. Documenter pattern

### 🟠 Priorité 2 (Impact: 17% des échecs)
**Tests Services/OAuth** - 80 tests

**Effort**: Faible (1-2h)  
**Impact**: Moyen

**Actions**:
1. Charger `.env.test` dans vitest.config.ts
2. Vérifier mocks utilisent env vars
3. Fixer tests OAuth un par un

### 🟡 Priorité 3 (Impact: 13% des échecs)
**Tests Database** - 60 tests

**Effort**: Moyen (3-4h)  
**Impact**: Moyen

**Actions**:
1. Créer helper de mocking database
2. Fixer pattern de mocking
3. Appliquer à tous tests DB

### 🟢 Priorité 4 (Impact: 6% des échecs)
**Tests Three.js** - 30 tests

**Effort**: Faible (30min)  
**Impact**: Faible

**Actions**:
1. Décider: installer packages OU skip tests
2. Si skip: ajouter condition dans tests
3. Si install: `npm install -D three @react-three/drei`

### ⚪ Priorité 5 (Impact: 32% des échecs)
**Autres** - 149 tests (Media, Onboarding, Docs, Infrastructure)

**Effort**: Variable  
**Impact**: Variable

**Actions**: Traiter au cas par cas

---

## 🎯 Plan d'Action Recommandé

### Phase 1: Quick Wins (2-3h) → +10%
1. ✅ Charger `.env.test` dans config
2. ✅ Installer Three.js OU skip tests
3. ✅ Fixer 10-15 tests OAuth simples

**Résultat attendu**: 84% coverage

### Phase 2: UI/Components (4-6h) → +15%
1. Setup React Testing Library
2. Créer mocks Next.js
3. Fixer tests UI progressivement

**Résultat attendu**: 89% coverage

### Phase 3: Database (3-4h) → +5%
1. Créer helpers mocking
2. Fixer pattern
3. Appliquer partout

**Résultat attendu**: 94% coverage

### Phase 4: Cleanup (2-3h) → +6%
1. Fixer tests restants
2. Supprimer tests obsolètes
3. Documentation

**Résultat attendu**: 100% coverage

---

## 💡 Solutions Rapides

### 1. Charger .env.test
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    env: loadEnv('test', process.cwd(), ''),
    // ...
  }
});
```

### 2. Mock Next.js Router
```typescript
// tests/setup.ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));
```

### 3. Mock Database Pool
```typescript
// tests/mocks/database.ts
export const mockPool = {
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn(),
};

vi.mock('pg', () => ({
  Pool: vi.fn(() => mockPool),
}));
```

---

## 📊 Résumé

### Problèmes Principaux
1. **UI/Components** (32%) - Mocking React/Next.js
2. **Services/OAuth** (17%) - Configuration env
3. **Database** (13%) - Pattern mocking
4. **Three.js** (6%) - Dépendances
5. **Autres** (32%) - Divers

### Effort Total Estimé
- **Phase 1**: 2-3h → 84%
- **Phase 2**: 4-6h → 89%
- **Phase 3**: 3-4h → 94%
- **Phase 4**: 2-3h → 100%

**Total**: 11-16h pour 100% coverage

### Recommandation
Commencer par **Phase 1** (Quick Wins) pour atteindre rapidement 84% coverage, puis décider si continuer selon priorités business.

---

**Analysé par**: Kiro AI  
**Date**: Novembre 14, 2025  
**Status**: 📊 **ANALYSE COMPLÈTE**
