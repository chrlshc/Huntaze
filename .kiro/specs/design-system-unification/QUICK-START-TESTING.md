# 🚀 Guide Rapide - Tests Optimisés 5GB RAM

## 🎯 Commandes Essentielles

### Tests par Suite (RECOMMANDÉ pour 5GB RAM)

```bash
# 1. Tests des tokens (2-3 min) ⚡
npm run test:light -- --suite=tokens

# 2. Tests des composants (3-4 min) 🧩
npm run test:light -- --suite=components

# 3. Tests visuels (2-3 min) 🎨
npm run test:light -- --suite=visual

# 4. Tests animations (2-3 min) ✨
npm run test:light -- --suite=animations

# 5. Tests responsive (1-2 min) 📱
npm run test:light -- --suite=responsive

# 6. Tests qualité code (1-2 min) 🔍
npm run test:light -- --suite=quality
```

### Test Complet (si tu as le temps)

```bash
# Tous les tests séquentiellement (~15-20 min)
npm run test:light
```

---

## 💡 Stratégie Recommandée

### Quotidien (5 min)
```bash
# Tester juste les tokens et composants
npm run test:light -- --suite=tokens
npm run test:light -- --suite=components
```

### Hebdomadaire (20 min)
```bash
# Test complet
npm run test:light
```

### Avant commit (3 min)
```bash
# Tests critiques
npm run test:light -- --suite=tokens
```

---

## 🔧 Dépannage

### Si un test échoue

```bash
# Exécuter le test individuellement pour voir l'erreur
npm test tests/unit/properties/[nom-du-test].test.ts -- --run
```

### Si la mémoire est toujours un problème

```bash
# Limiter encore plus la mémoire
NODE_OPTIONS="--max-old-space-size=512" npm run test:light -- --suite=tokens
```

### Nettoyer avant les tests

```bash
# Libérer de l'espace disque
npm run cleanup

# Vérifier la mémoire disponible
npm run check:memory
```

---

## 📊 Temps d'Exécution Estimés

| Suite | Temps | Fichiers |
|-------|-------|----------|
| Tokens | 2-3 min | ~8 tests |
| Components | 3-4 min | ~4 tests |
| Visual | 2-3 min | ~4 tests |
| Animations | 2-3 min | ~4 tests |
| Responsive | 1-2 min | ~2 tests |
| Quality | 1-2 min | ~3 tests |
| **TOTAL** | **15-20 min** | **~25 tests** |

---

## ✅ Checklist Avant de Commencer

- [ ] Fermer les applications gourmandes en RAM
- [ ] Vérifier l'espace disque disponible (`npm run analyze:disk`)
- [ ] Vérifier la mémoire disponible (`npm run check:memory`)
- [ ] Commencer par une suite légère (`--suite=tokens`)

---

## 🎓 Exemples Pratiques

### Scénario 1: Premier test rapide
```bash
# Juste pour voir si ça marche
npm run test:light -- --suite=tokens
```

### Scénario 2: Avant de push du code
```bash
# Tests critiques
npm run test:light -- --suite=tokens
npm run test:light -- --suite=components
```

### Scénario 3: Validation complète
```bash
# Tous les tests (prendre un café ☕)
npm run test:light
```

---

## 🚨 Que Faire Si...

### ❌ "Out of memory"
```bash
# Réduire la limite mémoire
NODE_OPTIONS="--max-old-space-size=512" npm run test:light -- --suite=tokens
```

### ❌ "Test timeout"
```bash
# Augmenter le timeout dans vitest.config.ts
# testTimeout: 30000 → 60000
```

### ❌ "Cannot find module"
```bash
# Réinstaller les dépendances
npm install
```

---

## 📈 Progression Recommandée

### Jour 1
```bash
npm run test:light -- --suite=tokens
```

### Jour 2
```bash
npm run test:light -- --suite=components
```

### Jour 3
```bash
npm run test:light -- --suite=visual
```

### Jour 4
```bash
npm run test:light  # Test complet
```

---

## 🎉 C'est Parti !

Lance ta première suite de tests maintenant :

```bash
npm run test:light -- --suite=tokens
```

Ça devrait prendre 2-3 minutes et te donner un rapport détaillé ! 🚀
