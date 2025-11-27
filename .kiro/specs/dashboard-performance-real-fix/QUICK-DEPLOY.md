# 🚀 Guide Rapide de Déploiement

## Déploiement en 3 Étapes

### ✅ Pré-requis
- Tous les tests passent (164/164) ✓
- Code commité sur Git ✓
- Variables d'environnement configurées dans AWS Amplify ✓

---

## 📦 Étape 1: Déployer sur Staging

```bash
# Exécuter le script de déploiement staging
./scripts/deploy-to-staging.sh
```

Ce script va:
1. ✓ Vérifier l'environnement
2. ✓ Exécuter tous les tests
3. ✓ Créer un build de production
4. ✓ Créer un tag de version
5. ✓ Pousser vers la branche staging

**Temps estimé:** 5-10 minutes

---

## 🔍 Étape 2: Vérifier Staging

Une fois le build Amplify terminé:

```bash
# Vérifier que staging fonctionne
./scripts/verify-deployment.sh https://staging.huntaze.com

# Tester les métriques
npm run aws:verify

# Tester les Web Vitals
npm run test:web-vitals
```

**Tests manuels à effectuer:**
- [ ] Connexion utilisateur
- [ ] Chargement du dashboard
- [ ] Navigation entre les pages
- [ ] Pas d'erreurs dans la console

**Temps estimé:** 10-15 minutes

---

## 🎯 Étape 3: Déployer en Production

Si staging est validé:

```bash
# Exécuter le script de déploiement production
./scripts/deploy-to-production.sh
```

Ce script va:
1. ✓ Vérifier que vous êtes sur staging
2. ✓ Exécuter tous les tests
3. ✓ Créer un tag de version production
4. ✓ Merger staging → main
5. ✓ Pousser vers production

**Temps estimé:** 5-10 minutes

---

## 📊 Post-Déploiement

Après le déploiement production:

```bash
# Vérifier que production fonctionne
./scripts/verify-deployment.sh https://app.huntaze.com

# Surveiller les métriques
npm run perf:monitor

# Générer un rapport
npm run perf:report
```

**Surveillance pendant 2 heures:**
- [ ] Pas d'erreurs critiques
- [ ] Performance conforme (LCP < 2.5s)
- [ ] Taux d'erreur < 0.1%
- [ ] Feedback utilisateurs positif

---

## 🆘 En Cas de Problème

### Rollback Rapide

**Via Amplify Console:**
1. Ouvrir https://console.aws.amazon.com/amplify/
2. Sélectionner l'application
3. Aller dans "Build history"
4. Cliquer sur "Redeploy this version" sur la version précédente

**Via Git:**
```bash
# Revenir à la version précédente
git revert HEAD
git push origin main

# Ou revenir à un tag spécifique
git checkout v0.9.0
git push origin main --force
```

### Logs et Diagnostics

```bash
# Voir les logs CloudWatch
# AWS Console > CloudWatch > Log groups > /aws/amplify/huntaze

# Diagnostics locaux
npm run diagnostic:baseline

# Vérifier l'infrastructure AWS
npm run audit:aws
```

---

## 📋 Checklist Complète

### Avant Déploiement
- [ ] Tous les tests passent (164/164)
- [ ] Build local réussi
- [ ] Variables d'environnement vérifiées
- [ ] Backup DB effectué
- [ ] Équipe notifiée

### Staging
- [ ] Déploiement staging réussi
- [ ] Tests automatiques passés
- [ ] Tests manuels effectués
- [ ] Performance validée
- [ ] Pas d'erreurs critiques

### Production
- [ ] Staging validé
- [ ] Tag de version créé
- [ ] Déploiement production réussi
- [ ] Tests de fumée passés
- [ ] Monitoring actif

### Post-Production
- [ ] Métriques surveillées (2h)
- [ ] Pas d'erreurs critiques
- [ ] Performance conforme
- [ ] Feedback utilisateurs OK
- [ ] Documentation mise à jour

---

## 🎉 Résultats Attendus

Après un déploiement réussi:

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Temps de chargement dashboard | 4-6s | 1.5-2s | **60-70%** |
| Requêtes N+1 | Présentes | Éliminées | **100%** |
| Cache hit rate | ~40% | >80% | **100%** |
| Erreurs 500 | Occasionnelles | <0.1% | **>90%** |
| Tests coverage | 0% | 100% | **∞** |

---

## 📞 Support

**Logs Amplify:**
https://console.aws.amazon.com/amplify/

**CloudWatch:**
https://console.aws.amazon.com/cloudwatch/

**Documentation complète:**
`.kiro/specs/dashboard-performance-real-fix/DEPLOYMENT-GUIDE.md`

---

## ⚡ Commandes Rapides

```bash
# Déployer staging
./scripts/deploy-to-staging.sh

# Vérifier staging
./scripts/verify-deployment.sh https://staging.huntaze.com

# Déployer production
./scripts/deploy-to-production.sh

# Vérifier production
./scripts/verify-deployment.sh https://app.huntaze.com

# Surveiller
npm run perf:monitor
```

**C'est tout! Bon déploiement! 🚀**
