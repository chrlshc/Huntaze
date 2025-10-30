# 🔄 Workflow de Déploiement Huntaze

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    ÉTAT ACTUEL                              │
│                    ✅ READY TO DEPLOY                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: Vérification Pré-Déploiement (30 secondes)       │
│  ./scripts/pre-deployment-check.sh                          │
│                                                             │
│  Vérifie:                                                   │
│  ✅ Core services (5 fichiers)                             │
│  ✅ API endpoints (16 routes)                              │
│  ✅ Documentation (12 fichiers)                            │
│  ✅ Scripts (4 fichiers)                                   │
│  ✅ Tests (15+ fichiers)                                   │
│  ✅ Configuration (amplify.yml, package.json, etc.)        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: Configuration AWS (2 minutes)                     │
│                                                             │
│  export AWS_ACCESS_KEY_ID="AKIA..."                        │
│  export AWS_SECRET_ACCESS_KEY="..."                        │
│  export AWS_SESSION_TOKEN="..."  # si SSO                  │
│                                                             │
│  Vérifie: aws sts get-caller-identity                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: Déploiement Infrastructure (5 minutes)            │
│  ./scripts/deploy-huntaze-hybrid.sh                         │
│                                                             │
│  Le script fait automatiquement:                            │
│  1. ✅ Vérifie AWS credentials                             │
│  2. ✅ Crée DynamoDB: huntaze-ai-costs-production          │
│  3. ✅ Crée DynamoDB: huntaze-cost-alerts-production       │
│  4. ✅ Crée SQS: huntaze-hybrid-workflows                  │
│  5. ✅ Crée SQS: huntaze-rate-limiter-queue                │
│  6. ✅ Crée SNS: huntaze-cost-alerts                       │
│  7. ✅ Génère amplify-env-vars.txt                         │
│  8. ✅ Génère deployment-summary.md                        │
│  9. ✅ Vérifie git status                                  │
│  10. ✅ Affiche les instructions finales                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4: Configuration Amplify (10 minutes)                │
│                                                             │
│  1. Ouvre Amplify Console:                                  │
│     https://console.aws.amazon.com/amplify                  │
│                                                             │
│  2. Va dans: App Settings > Environment variables           │
│                                                             │
│  3. Copie les variables depuis: amplify-env-vars.txt        │
│                                                             │
│  Variables critiques:                                       │
│  • DYNAMODB_COSTS_TABLE                                    │
│  • DYNAMODB_ALERTS_TABLE                                   │
│  • SQS_WORKFLOW_QUEUE                                      │
│  • SQS_RATE_LIMITER_QUEUE                                  │
│  • COST_ALERTS_SNS_TOPIC                                   │
│  • HYBRID_ORCHESTRATOR_ENABLED=true                        │
│  • COST_MONITORING_ENABLED=true                            │
│  • RATE_LIMITER_ENABLED=true                               │
│  • AZURE_OPENAI_API_KEY (ta vraie clé)                    │
│  • OPENAI_API_KEY (ta vraie clé)                          │
│  • DATABASE_URL (ton RDS)                                  │
│  • REDIS_URL (ton ElastiCache)                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 5: Déploiement Application (2 minutes)               │
│                                                             │
│  Option A - Auto Deploy (recommandé):                       │
│  git add .                                                  │
│  git commit -m "feat: hybrid orchestrator production"      │
│  git push origin main                                       │
│                                                             │
│  Option B - Manual Deploy:                                  │
│  Amplify Console > Deployments > Redeploy this version      │
│                                                             │
│  Amplify va automatiquement:                                │
│  1. ✅ Pull le code                                        │
│  2. ✅ Install dependencies (npm install)                  │
│  3. ✅ Build (npm run build)                               │
│  4. ✅ Deploy                                              │
│  5. ✅ Invalidate CloudFront cache                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 6: Vérification Post-Déploiement (3 minutes)         │
│  ./scripts/verify-deployment.sh                             │
│                                                             │
│  Tests manuels:                                             │
│                                                             │
│  1. Health Check:                                           │
│     curl https://YOUR-URL/api/health/hybrid-orchestrator   │
│     Attendu: {"status":"healthy","orchestrator":"v2"}      │
│                                                             │
│  2. Cost Stats:                                             │
│     curl https://YOUR-URL/api/v2/costs/stats               │
│     Attendu: {"daily":0,"monthly":0,"providers":{}}        │
│                                                             │
│  3. Feature Flags:                                          │
│     curl https://YOUR-URL/api/admin/feature-flags          │
│     Attendu: {"hybridOrchestrator":true,...}               │
│                                                             │
│  4. Test Campaign (avec auth):                              │
│     curl -X POST https://YOUR-URL/api/v2/campaigns/hybrid  │
│       -H "Authorization: Bearer YOUR_TOKEN"                │
│       -H "Content-Type: application/json"                  │
│       -d '{"type":"content_planning",...}'                 │
│     Attendu: {"id":"...","status":"processing"}            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    ✅ DÉPLOIEMENT RÉUSSI!                   │
│                                                             │
│  Ton application est maintenant en production avec:         │
│  ✅ Hybrid orchestrator (Azure + OpenAI)                   │
│  ✅ Cost monitoring en temps réel                          │
│  ✅ Rate limiting OnlyFans (10 msg/min)                    │
│  ✅ 16 API endpoints opérationnels                         │
│  ✅ Alertes automatiques configurées                       │
│                                                             │
│  Monitoring:                                                │
│  • Amplify Console: Logs & metrics                         │
│  • CloudWatch: Logs détaillés                              │
│  • DynamoDB: Cost tracking data                            │
│  • SNS: Email/Slack alerts                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Timeline Détaillé

| Étape | Durée | Action | Output |
|-------|-------|--------|--------|
| 1 | 30s | `./scripts/pre-deployment-check.sh` | ✅ READY |
| 2 | 2min | Configure AWS credentials | ✅ Credentials OK |
| 3 | 5min | `./scripts/deploy-huntaze-hybrid.sh` | ✅ AWS resources + env vars |
| 4 | 10min | Configure Amplify env vars | ✅ Env vars configured |
| 5 | 2min | `git push origin main` | ✅ Deployed |
| 6 | 3min | `./scripts/verify-deployment.sh` | ✅ All tests pass |
| **TOTAL** | **~20min** | **Production ready!** | **🎉** |

---

## 🔄 Workflow Visuel Simplifié

```
START
  ↓
[Pre-Check] ✅ Everything ready?
  ↓ YES
[AWS Config] 🔐 Export credentials
  ↓
[Deploy Script] 🚀 Create AWS resources
  ↓
[Amplify Config] ⚙️ Copy env vars
  ↓
[Git Push] 📤 Deploy to production
  ↓
[Verify] ✅ Test endpoints
  ↓
PRODUCTION! 🎉
```

---

## 📋 Checklist Interactive

Coche au fur et à mesure:

### Pré-Déploiement
- [ ] Code reviewed et testé
- [ ] Documentation lue (`START_HERE.md`)
- [ ] Pre-deployment check passé (`./scripts/pre-deployment-check.sh`)

### Configuration AWS
- [ ] AWS credentials exportées
- [ ] `aws sts get-caller-identity` fonctionne
- [ ] Account ID confirmé: 317805897534
- [ ] Region confirmée: us-east-1

### Déploiement Infrastructure
- [ ] Script lancé: `./scripts/deploy-huntaze-hybrid.sh`
- [ ] DynamoDB tables créées (2)
- [ ] SQS queues créées (2)
- [ ] SNS topic créé (1)
- [ ] `amplify-env-vars.txt` généré
- [ ] `deployment-summary.md` généré

### Configuration Amplify
- [ ] Amplify Console ouverte
- [ ] Environment variables page ouverte
- [ ] Variables critiques copiées:
  - [ ] DYNAMODB_COSTS_TABLE
  - [ ] DYNAMODB_ALERTS_TABLE
  - [ ] SQS_WORKFLOW_QUEUE
  - [ ] SQS_RATE_LIMITER_QUEUE
  - [ ] COST_ALERTS_SNS_TOPIC
  - [ ] HYBRID_ORCHESTRATOR_ENABLED
  - [ ] COST_MONITORING_ENABLED
  - [ ] RATE_LIMITER_ENABLED
  - [ ] AZURE_OPENAI_API_KEY
  - [ ] OPENAI_API_KEY
  - [ ] DATABASE_URL
  - [ ] REDIS_URL
- [ ] Variables sauvegardées

### Déploiement Application
- [ ] Code commité
- [ ] Pushed to main
- [ ] Amplify build started
- [ ] Build succeeded
- [ ] Deployment succeeded

### Vérification
- [ ] Health check OK
- [ ] Cost stats OK
- [ ] Feature flags OK
- [ ] Test campaign OK (si auth configuré)
- [ ] Logs CloudWatch OK
- [ ] Monitoring OK

### Post-Déploiement
- [ ] Documentation mise à jour
- [ ] Team notifiée
- [ ] Monitoring configuré
- [ ] Alertes testées
- [ ] 🎉 PROFIT!

---

## 🆘 Troubleshooting par Étape

### Étape 1: Pre-Check échoue
**Problème:** Fichiers manquants
**Solution:** Vérifie que tu es dans le bon répertoire

### Étape 2: AWS credentials invalides
**Problème:** `aws sts get-caller-identity` échoue
**Solution:** 
- Vérifie tes credentials
- Essaie `aws configure`
- Ou utilise AWS SSO

### Étape 3: Script échoue
**Problème:** Ressources déjà existantes
**Solution:** C'est OK! Le script continue

**Problème:** Permissions insuffisantes
**Solution:** Vérifie tes IAM permissions

### Étape 4: Amplify env vars
**Problème:** Trop de variables à copier
**Solution:** Copie d'abord les critiques, le reste peut attendre

### Étape 5: Build Amplify échoue
**Problème:** Missing env vars
**Solution:** Vérifie que toutes les variables critiques sont configurées

**Problème:** TypeScript errors
**Solution:** Check les logs, fix les erreurs

### Étape 6: Tests échouent
**Problème:** 404 errors
**Solution:** Vérifie que le déploiement est terminé

**Problème:** 500 errors
**Solution:** Check CloudWatch logs

---

## 📊 Métriques de Succès

Après déploiement, tu devrais voir:

### Amplify Console
- ✅ Build status: Succeeded
- ✅ Deployment status: Succeeded
- ✅ Domain: Active

### CloudWatch
- ✅ Logs: API requests
- ✅ Metrics: Response times
- ✅ Alarms: Configured

### DynamoDB
- ✅ Tables: Created
- ✅ Items: Cost tracking data

### SQS
- ✅ Queues: Created
- ✅ Messages: Processing

### SNS
- ✅ Topic: Created
- ✅ Subscriptions: Email configured

---

## 🎯 Next Steps Après Déploiement

1. **Monitor les premiers jours:**
   - Check CloudWatch logs
   - Monitor DynamoDB costs
   - Vérifie les alertes

2. **Optimise si nécessaire:**
   - Ajuste les thresholds
   - Tune le rate limiter
   - Optimise les coûts AI

3. **Scale progressivement:**
   - Commence avec low traffic
   - Monitor les performances
   - Scale up si nécessaire

---

**Tu es prêt! Lance `./scripts/pre-deployment-check.sh` pour commencer! 🚀**
