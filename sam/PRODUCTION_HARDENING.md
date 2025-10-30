# 🔧 Production Hardening - Post-Cutover

**Status:** Migration 100% réussie ✅  
**Next:** Durcir la prod, optimiser perfs/coûts  

---

## 🛡️ 1. Verrouiller & Nettoyer

### Kill-Switch Conservé
- ✅ Feature flag AppConfig (toujours ON)
- ✅ Rollback auto sur alarme (jusqu'à J+7)
- ✅ AppConfig revient automatiquement à version précédente si ALARM

### Canary Stabilisé
- ✅ Lambda weighted alias + CodeDeploy (même à 100%)
- ✅ Rollback automatique pour futures updates
- ✅ Configuration maintenue pour sécurité

### Code Mock
- 🔄 **TODO:** Planifier retrait après période stabilité
- 🔄 **TODO:** Garder flag comme coupe-circuit documenté

---

## 🗄️ 2. Base de Données & Prisma

### RDS Proxy (À éviter)
- ❌ **Éviter RDS Proxy avec Prisma**
- **Raison:** Prepared statements → session pinning → bénéfice limité
- **Source:** [Prisma Documentation](https://prisma.io)

### Prisma Accelerate (Recommandé)
- 🔄 **TODO:** Activer Prisma Accelerate
- **Bénéfice:** Connection pooling pour lisser pics Lambda
- **Source:** [Prisma Accelerate](https://prisma.io)

### Performance Monitoring
- 🔄 **TODO:** Activer RDS Performance Insights
- **Objectif:** Traquer top SQL/waits, corriger (index, N+1, sur-fetch)
- **Source:** [AWS Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html)

### Query Optimization
- 🔄 **TODO:** Prisma Optimize / EXPLAIN ANALYZE sur requêtes lourdes
- **Source:** [Prisma Optimize](https://prisma.io)

---

## 🔐 3. Sécurité & Secrets

### Rotation Automatique
- 🔄 **TODO:** AWS Secrets Manager rotation auto
- **Modèles:** single-user ou alternating users
- **Fonctions Lambda:** Prêtes à l'emploi
- **Source:** [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

---

## 📊 4. Observabilité & Coûts

### Alarmes Metric Math
- 🔄 **TODO:** Error rate = Errors / Invocations via CloudWatch Metric Math
- **Dashboard + Alarme**
- **Source:** [CloudWatch Metric Math](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-metric-math.html)

### X-Ray Bout-en-Bout
- ✅ **Actif:** API Gateway + Lambda
- **Objectif:** Visualiser chemin, diagnostiquer outliers
- **Source:** [X-Ray Tracing](https://v3.cicd.serverlessworkshops.io)

### Logs Insights
- ✅ **Actif:** filter / stats pour shadow-diff résiduels
- **Objectif:** Affiner alertes
- **Source:** [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)

### Log Retention
- 🔄 **TODO:** Régler rétention logs CloudWatch
- **Objectif:** Éviter surprises côté coût

---

## 🎯 5. SLO Recommandés

### Erreur (5 min glissantes)
- **Seuil:** ≤ 2% (rollback auto)
- **Source:** [AWS Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)

### P95 Lambda
- **Seuil:** Stable ±10-15% vs Mock (semaine consolidation)

### DB Load
- **Seuil:** Sous plafond Performance Insights
- **Surveillance:** Top waits/SQL
- **Source:** [RDS Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html)

---

## 📋 Checklist Post-Cutover

### Immédiat (J+0)
- [ ] Déployer Metric Math alarm
- [ ] Configurer log retention (30 jours)
- [ ] Activer RDS Performance Insights
- [ ] Documenter feature flag comme kill-switch

### Court terme (J+1 à J+3)
- [ ] Implémenter Prisma Accelerate
- [ ] Configurer secrets rotation
- [ ] Optimiser requêtes lourdes (EXPLAIN ANALYZE)
- [ ] Créer runbook incident response

### Moyen terme (J+7)
- [ ] Analyser coûts vs prévisions
- [ ] Planifier retrait code Mock
- [ ] Évaluer performance vs SLO
- [ ] Documenter learnings

### Long terme (J+30)
- [ ] Supprimer code Mock (si stable)
- [ ] Optimiser further (caching, indexes)
- [ ] Préparer prochaine migration
- [ ] Post-mortem & amélioration continue

---

**Status:** ✅ MIGRATION COMPLETE  
**Next:** Production hardening en cours  
**Timeline:** J+7 pour stabilisation complète
