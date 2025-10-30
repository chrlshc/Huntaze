# 🚀 DÉPLOIEMENT HUNTAZE - GUIDE RAPIDE

## ⚡ DÉMARRAGE RAPIDE (20 minutes)

### Étape 1: Configure AWS Credentials (2 min)

```bash
# Option A: Credentials permanentes
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."

# Option B: Credentials temporaires (SSO)
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Vérifie que ça marche
aws sts get-caller-identity
```

**Où trouver tes credentials:**
- AWS Console > IAM > Security Credentials
- Ou: `aws configure` si tu as AWS CLI configuré
- Ou: AWS SSO login

### Étape 2: Lance le Script Ultime (5 min)

```bash
./scripts/deploy-huntaze-hybrid.sh
```

**Ce que le script fait automatiquement:**
1. ✅ Vérifie tes credentials AWS
2. ✅ Crée les 5 ressources AWS manquantes:
   - DynamoDB: huntaze-ai-costs-production
   - DynamoDB: huntaze-cost-alerts-production
   - SQS: huntaze-hybrid-workflows
   - SQS: huntaze-rate-limiter-queue
   - SNS: huntaze-cost-alerts
3. ✅ Génère `amplify-env-vars.txt` avec toutes les variables
4. ✅ Vérifie ton git status
5. ✅ Génère `deployment-summary.md`
6. ✅ Te donne les instructions finales

### Étape 3: Configure Amplify (10 min)

1. **Ouvre Amplify Console:**
   ```
   https://console.aws.amazon.com/amplify/home?region=us-east-1
   ```

2. **Va dans:** App Settings > Environment variables

3. **Copie les variables depuis:** `amplify-env-vars.txt`

**Variables critiques à configurer:**
```bash
# AWS Services
DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production
DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production
SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows
COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts

# Feature Flags
HYBRID_ORCHESTRATOR_ENABLED=true
COST_MONITORING_ENABLED=true
RATE_LIMITER_ENABLED=true

# AI Providers (remplace avec tes vraies clés)
AZURE_OPENAI_API_KEY=YOUR_AZURE_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY
```

### Étape 4: Deploy! (2 min)

```bash
# Option A: Auto-deploy (si configuré)
git push origin main

# Option B: Manual deploy
# Amplify Console > Deployments > Redeploy this version
```

### Étape 5: Vérifie (3 min)

```bash
# Health check
curl https://YOUR-AMPLIFY-URL/api/health/hybrid-orchestrator

# Test cost monitoring
curl https://YOUR-AMPLIFY-URL/api/v2/costs/stats

# Test orchestrator
curl -X POST https://YOUR-AMPLIFY-URL/api/v2/campaigns/hybrid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"content_planning","platforms":["instagram"],"data":{"theme":"fitness"}}'
```

---

## 📋 CHECKLIST RAPIDE

- [ ] Configure AWS credentials
- [ ] Lance `./scripts/deploy-huntaze-hybrid.sh`
- [ ] Copie les env vars dans Amplify Console
- [ ] Push to main (ou redeploy manual)
- [ ] Test les endpoints
- [ ] 🎉 PROFIT!

---

## 🆘 TROUBLESHOOTING

### "AWS credentials not configured"
```bash
# Vérifie que tu as bien exporté les variables
echo $AWS_ACCESS_KEY_ID
aws sts get-caller-identity
```

### "Permission denied"
```bash
chmod +x scripts/deploy-huntaze-hybrid.sh
```

### "Resource already exists"
C'est OK ! Le script continue avec les ressources existantes.

### Build Amplify échoue
1. Vérifie que toutes les env vars sont configurées
2. Check les logs dans Amplify Console
3. Vérifie que `amplify.yml` est correct

---

## 💰 COÛTS ESTIMÉS

| Service | Coût/mois |
|---------|-----------|
| Amplify Hosting | $5-10 |
| DynamoDB (2 tables) | $5 |
| SQS (2 queues) | $1 |
| SNS (1 topic) | $1 |
| Azure OpenAI | $20 |
| OpenAI (backup) | $10 |
| **TOTAL** | **~$70-75** |

---

## 📚 DOCUMENTATION COMPLÈTE

- `TODO_DEPLOYMENT.md` - Checklist détaillée
- `AMPLIFY_QUICK_START.md` - Guide Amplify
- `HUNTAZE_COMPLETE_ARCHITECTURE.md` - Architecture complète
- `amplify-env-vars.txt` - Variables d'environnement (généré par le script)
- `deployment-summary.md` - Résumé du déploiement (généré par le script)

---

## 🎯 TU ES PRÊT!

Tout le code est prêt, l'architecture est solide, la doc est complète.

**Il te reste juste:**
1. Exporter tes AWS credentials (2 min)
2. Lancer le script (5 min)
3. Configurer Amplify (10 min)
4. Deploy (2 min)

**Total: 20 minutes jusqu'en production! 🚀**

---

**Généré:** $(date)
**Status:** ✅ Ready to deploy
