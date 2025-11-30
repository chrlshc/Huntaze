# 🧪 Guide de Test - Design System Unification

## 🎯 Pour Commencer (5GB RAM)

### Commande la Plus Simple

```bash
npm run test:light -- --suite=tokens
```

**Pourquoi cette commande ?**
- ⚡ Rapide (2-3 min)
- 💾 Peu gourmand en RAM
- ✅ Valide les fondations
- 📊 Rapport clair

---

## 📚 Toutes les Commandes

### Par Suite (RECOMMANDÉ)

```bash
# 1. Tokens (2-3 min)
npm run test:light -- --suite=tokens

# 2. Visuels (2-3 min)
npm run test:light -- --suite=visual

# 3. Composants (3-4 min)
npm run test:light -- --suite=components

# 4. Animations (2-3 min)
npm run test:light -- --suite=animations

# 5. Responsive (1-2 min)
npm run test:light -- --suite=responsive

# 6. Qualité (1-2 min)
npm run test:light -- --suite=quality
```

### Test Complet

```bash
# Tous les tests (~15-20 min)
npm run test:light
```

### Aide

```bash
# Voir toutes les options
npm run test:light -- --help
```

---

## 🎨 Que Teste Chaque Suite ?

### 1. Design Tokens 🎨
**Tests:** 3 fichiers  
**Temps:** 2-3 min  
**Vérifie:**
- ✅ Utilisation des tokens de couleur
- ✅ Tokens de typographie
- ✅ Tokens d'effets (ombres, etc.)

```bash
npm run test:light -- --suite=tokens
```

---

### 2. Visual Consistency 👁️
**Tests:** ~4 fichiers  
**Temps:** 2-3 min  
**Vérifie:**
- ✅ Cohérence des backgrounds
- ✅ Couleurs de bordures
- ✅ Palette de couleurs
- ✅ Effets visuels

```bash
npm run test:light -- --suite=visual
```

---

### 3. Components 🧩
**Tests:** ~4 fichiers  
**Temps:** 3-4 min  
**Vérifie:**
- ✅ Utilisation des composants Button
- ✅ Utilisation des composants Input
- ✅ Utilisation des composants Select
- ✅ Utilisation des composants Card

```bash
npm run test:light -- --suite=components
```

---

### 4. Animations ✨
**Tests:** ~4 fichiers  
**Temps:** 2-3 min  
**Vérifie:**
- ✅ Animations fade-in
- ✅ Transitions hover
- ✅ États de loading
- ✅ Timing des animations

```bash
npm run test:light -- --suite=animations
```

---

### 5. Responsive 📱
**Tests:** ~2 fichiers  
**Temps:** 1-2 min  
**Vérifie:**
- ✅ Breakpoints mobiles
- ✅ Tailles des touch targets
- ✅ Cohérence responsive

```bash
npm run test:light -- --suite=responsive
```

---

### 6. Code Quality 🔍
**Tests:** ~3 fichiers  
**Temps:** 1-2 min  
**Vérifie:**
- ✅ Imports CSS uniques
- ✅ Pas de fichiers backup
- ✅ Tailwind-first approach
- ✅ Pas de CSS dupliqué

```bash
npm run test:light -- --suite=quality
```

---

## 📊 Tableau Récapitulatif

| Suite | Temps | Tests | Priorité | Commande |
|-------|-------|-------|----------|----------|
| Tokens | 2-3 min | 3 | 🔥 Haute | `--suite=tokens` |
| Visual | 2-3 min | 4 | 🔥 Haute | `--suite=visual` |
| Components | 3-4 min | 4 | ⚡ Moyenne | `--suite=components` |
| Animations | 2-3 min | 4 | ⚡ Moyenne | `--suite=animations` |
| Responsive | 1-2 min | 2 | ✅ Basse | `--suite=responsive` |
| Quality | 1-2 min | 3 | ✅ Basse | `--suite=quality` |

---

## 🚀 Stratégies de Test

### 🏃 Rapide (5 min)
```bash
npm run test:light -- --suite=tokens
npm run test:light -- --suite=quality
```

### ⚡ Standard (10 min)
```bash
npm run test:light -- --suite=tokens
npm run test:light -- --suite=visual
npm run test:light -- --suite=components
```

### 🎯 Complet (20 min)
```bash
npm run test:light
```

---

## 💡 Conseils Pratiques

### Avant de Tester
1. ✅ Ferme les apps gourmandes (Chrome, etc.)
2. ✅ Vérifie la RAM disponible
3. ✅ Commence par une suite légère

### Pendant les Tests
1. ⏸️ Ne lance pas d'autres apps lourdes
2. 📊 Observe le rapport de progression
3. ⏱️ Sois patient (tests séquentiels)

### Après les Tests
1. 📋 Note les tests échoués
2. 🔍 Investigue les échecs un par un
3. ✅ Corrige progressivement

---

## 🔧 Dépannage

### ❌ "Out of memory"
```bash
# Réduire la limite mémoire
NODE_OPTIONS="--max-old-space-size=512" npm run test:light -- --suite=tokens
```

### ❌ Test échoue
```bash
# Voir les détails
npm test tests/unit/properties/[nom-du-test].test.ts -- --run
```

### ❌ Trop lent
```bash
# Tester une suite plus petite
npm run test:light -- --suite=responsive
```

---

## 📈 Progression Recommandée

### Semaine 1
```bash
# Jour 1
npm run test:light -- --suite=tokens

# Jour 2
npm run test:light -- --suite=visual

# Jour 3
npm run test:light -- --suite=components
```

### Semaine 2
```bash
# Jour 1
npm run test:light -- --suite=animations

# Jour 2
npm run test:light -- --suite=responsive

# Jour 3
npm run test:light -- --suite=quality
```

### Semaine 3
```bash
# Test complet
npm run test:light
```

---

## 🎯 Objectifs

### Court Terme (Cette Semaine)
- [ ] Tester la suite tokens
- [ ] Tester la suite visual
- [ ] Identifier les tests échoués

### Moyen Terme (Ce Mois)
- [ ] Tester toutes les suites
- [ ] Corriger les tests échoués
- [ ] Atteindre 80%+ de réussite

### Long Terme (Ce Trimestre)
- [ ] 100% des tests passent
- [ ] Tests automatisés en CI/CD
- [ ] Documentation à jour

---

## 📚 Documentation Complète

- **Guide Rapide:** `QUICK-START-TESTING.md`
- **Rapport d'Exécution:** `EXECUTION-REPORT.md`
- **Résumé Steps 1-2:** `STEPS-1-2-COMPLETE.md`
- **Nettoyage:** `CLEANUP-COMPLETE.md`

---

## 🎉 Prêt à Commencer ?

Lance ton premier test maintenant :

```bash
npm run test:light -- --suite=tokens
```

**Temps estimé:** 2-3 minutes  
**Mémoire utilisée:** < 1GB  
**Difficulté:** ⭐ Facile

Bonne chance ! 🚀
