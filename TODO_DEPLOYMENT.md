# ✅ Huntaze - TODO Deployment

## 🎯 TU ES ICI

Ton app est **déjà sur Amplify** avec auto-deploy configuré ! 🎉

Le code de l'orchestrateur hybride est **prêt** et **testé**.

Il reste juste 3 petites étapes pour activer le système complet.

---

## 📋 TODO (20 min total)

### ☐ 1. Créer les ressources AWS (5 min)

```bash
# Avec des credentials AWS valides
./scripts/setup-aws-infrastructure.sh
```

**Ce que ça crée:**
- 2 tables DynamoDB (costs, alerts)
- 2 queues SQS (workflows, rate-limiter)
- 1 topic SNS (cost-alerts)

---

### ☐ 2. Ajouter env vars dans Amplify (10 min)

**Où:** Amplify Console > App Settings > Environment variables

**Quoi ajouter:**

```bash
# DynamoDB
DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production
DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production

# SQS
SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue

# SNS
COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts

# Monitoring
COST_ALERT_EMAIL=admin@huntaze.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
DAILY_COST_THRESHOLD=50
MONTHLY_COST_THRESHOLD=1000

# Feature Flags
HYBRID_ORCHESTRATOR_ENABLED=true
COST_MONITORING_ENABLED=true
RATE_LIMITER_ENABLED=true

# OpenAI (si pas déjà là)
OPENAI_API_KEY=sk-***
OPENAI_ORG_ID=org-***
```

**Liste complète:** Voir `AMPLIFY_DEPLOYMENT_GUIDE.md`

---

### ☐ 3. Redeploy (2 min)

**Option A - Auto (recommandé):**
```bash
git add .
git commit -m "feat: hybrid orchestrator ready"
git push origin main
```

**Option B - Manual:**
Amplify Console > Deployments > Redeploy this version

---

## ✅ VÉRIFICATION

Une fois déployé, teste:

```bash
# Health check
curl https://YOUR-AMPLIFY-URL/api/health/hybrid-orchestrator

# Devrait retourner: { "status": "healthy", ... }
```

---

## 📚 DOCS

**Start here:**
- `AMPLIFY_QUICK_START.md` - Guide rapide (5 min)
- `HUNTAZE_FINAL_SUMMARY.md` - Résumé complet

**Deep dive:**
- `AMPLIFY_DEPLOYMENT_GUIDE.md` - Guide Amplify complet
- `HUNTAZE_COMPLETE_ARCHITECTURE.md` - Architecture technique
- `HUNTAZE_QUICK_REFERENCE.md` - Commandes & troubleshooting

---

## 💰 COÛTS

~$70-75/month:
- Amplify: ~$5-10
- AWS: ~$32
- AI: ~$32

---

## 🆘 BESOIN D'AIDE?

**Problème de build:**
→ Lis `AMPLIFY_DEPLOYMENT_GUIDE.md` section "Troubleshooting"

**Erreurs runtime:**
→ Check CloudWatch logs: `aws logs tail /aws/amplify/huntaze --follow`

**Questions architecture:**
→ Lis `HUNTAZE_COMPLETE_ARCHITECTURE.md`

---

## 🎉 C'EST TOUT !

Le code est prêt. L'architecture est documentée. Il reste juste à:
1. Créer les ressources AWS (5 min)
2. Config Amplify (10 min)
3. Deploy (2 min)

**Tu peux déployer demain !** 🚀

---

**Account:** 317805897534  
**Region:** us-east-1  
**Amplify:** Déjà configuré ✅
