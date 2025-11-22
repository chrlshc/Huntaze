# Plan de Stabilisation des Tests d'Intégration

## État Actuel

### Tests Confirmés Stables (100%)
✅ **integrations-status** (28/28)  
✅ **integrations-disconnect** (21/21)  
✅ **integrations-callback** (22/22)  
✅ **integrations-refresh** (21/21)  
✅ **auth-login** (29/29)  
✅ **auth-register** (57/57)  
✅ **csrf-token** (20/20)  
✅ **onboarding-complete** (22/22)  
✅ **monitoring-metrics** (20/20)  
✅ **s3-service** (12/12)  
✅ **s3-session-token** (10/10)  

**Total**: 262/262 tests (100%)

### Tests avec Instabilité Intermittente
⚠️ **home-stats** (26 tests) - Échoue parfois (5-10 tests)

**Problèmes identifiés:**
- Tests de cache avec timing (60 secondes d'attente)
- Tests de performance sensibles au timing
- Possibles conflits de données entre tests

## Problèmes Identifiés

### 1. Performance des Tests
**Symptôme**: Les tests prennent >2 minutes à s'exécuter
**Impact**: Timeout fréquents, feedback lent

**Causes:**
- Tests de cache avec `setTimeout(60000)` (60 secondes)
- Tests concurrents qui attendent les uns les autres
- Connexions DB non optimisées

**Solutions:**
1. Réduire les délais de cache dans l'environnement de test
2. Utiliser des mocks pour les délais longs
3. Paralléliser intelligemment les tests

### 2. Tests de Cache Instables
**Fichier**: `tests/integration/api/home-stats.integration.test.ts`

**Tests problématiques:**
- `should expire cache after 60 seconds` - Attend 60 secondes réelles
- `should serve cached data faster` - Sensible au timing
- `should respond within 500ms (p95 target)` - Sensible à la charge système

**Solutions:**
```typescript
// ❌ Avant - Attend 60 secondes réelles
await new Promise(resolve => setTimeout(resolve, 61000));

// ✅ Après - Mock le temps ou réduit le TTL en test
// Option 1: Mock le cache
vi.spyOn(cacheService, 'get').mockReturnValue(null);

// Option 2: Réduire le TTL en environnement de test
const CACHE_TTL = process.env.NODE_ENV === 'test' ? 100 : 60000;
```

### 3. Conflits de Données
**Symptôme**: Tests échouent quand exécutés en parallèle

**Causes:**
- Emails/IDs non uniques entre tests
- Cleanup incomplet entre tests
- État global partagé (cache, connexions)

**Solutions:**
1. Générer des IDs vraiment uniques (timestamp + random)
2. Isoler complètement les données de test
3. Nettoyer le cache entre chaque test

## Plan d'Action

### Phase 1: Optimisation Immédiate ✅
- [x] Corriger les OAuth adapters
- [x] Réparer les fichiers corrompus
- [x] Stabiliser les tests de base

### Phase 2: Stabilisation des Tests de Cache
**Priorité**: Haute  
**Temps estimé**: 30 minutes

**Actions:**
1. Modifier `home-stats.integration.test.ts`:
   - Réduire le TTL de cache en environnement de test
   - Utiliser des mocks pour les tests de timing
   - Ajouter des retries pour les tests de performance

2. Créer une configuration de cache spécifique aux tests:
```typescript
// lib/services/cache.service.ts
export const CACHE_CONFIG = {
  TTL: process.env.NODE_ENV === 'test' ? 1000 : 60000, // 1s en test, 60s en prod
  MAX_SIZE: process.env.NODE_ENV === 'test' ? 100 : 1000,
};
```

### Phase 3: Amélioration de l'Isolation
**Priorité**: Moyenne  
**Temps estimé**: 45 minutes

**Actions:**
1. Ajouter un préfixe unique par test:
```typescript
const testId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `${testId}@example.com`;
```

2. Nettoyer le cache avant chaque test:
```typescript
beforeEach(async () => {
  cacheService.clear();
  // ... autres setups
});
```

3. Utiliser des transactions DB pour l'isolation:
```typescript
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

### Phase 4: Optimisation de la Performance
**Priorité**: Basse  
**Temps estimé**: 1 heure

**Actions:**
1. Paralléliser les tests indépendants
2. Utiliser un pool de connexions DB optimisé
3. Pré-charger les données de test communes
4. Implémenter un système de fixtures réutilisables

## Métriques de Succès

### Objectifs Court Terme (Cette Session)
- ✅ 262/262 tests stables passent (100%)
- ⏳ home-stats stabilisé (26/26)
- ⏳ Temps d'exécution < 60 secondes

### Objectifs Moyen Terme
- 100% des tests passent de manière déterministe
- Temps d'exécution < 30 secondes
- Aucun test flaky (< 1% de taux d'échec)

### Objectifs Long Terme
- Tests exécutés en parallèle efficacement
- Feedback instantané (< 10 secondes pour un fichier)
- Couverture de code > 80%

## Recommandations

### Pour les Nouveaux Tests
1. **Toujours** utiliser des IDs uniques
2. **Toujours** nettoyer les données après le test
3. **Éviter** les délais réels (utiliser des mocks)
4. **Préférer** les assertions déterministes aux assertions de timing
5. **Documenter** les dépendances entre tests

### Pour le Refactoring
1. Extraire la logique de setup commune
2. Créer des helpers de test réutilisables
3. Implémenter un système de fixtures
4. Ajouter des retries pour les tests de performance
5. Utiliser des snapshots pour les réponses complexes

## Prochaines Étapes

1. **Immédiat**: Stabiliser `home-stats` en réduisant les délais de cache
2. **Court terme**: Implémenter l'isolation complète des données
3. **Moyen terme**: Optimiser la performance globale
4. **Long terme**: Mettre en place un système de CI/CD avec tests parallèles

## Notes

- Les tests sont globalement bien écrits et suivent les bonnes pratiques
- L'approche "sans mocks excessifs" fonctionne très bien
- La principale source d'instabilité est le timing et les données partagées
- Une fois stabilisés, ces tests fourniront une excellente couverture
