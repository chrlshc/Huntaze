# 📚 Huntaze - Documentation de Déploiement

Bienvenue dans la documentation complète du déploiement Huntaze Beta.

---

## 🚀 Quick Start

**Temps**: 1h30 | **Budget**: $64-87/mois

```bash
# Déploiement automatique
./scripts/deploy-beta-complete.sh

# Vérification
./scripts/verify-deployment.sh
```

👉 **Guide complet**: [QUICK-START-DEPLOYMENT.md](../QUICK-START-DEPLOYMENT.md)

---

## 📖 Documentation

### 🎯 Guides Principaux

| Document | Description | Durée |
|----------|-------------|-------|
| [QUICK-START-DEPLOYMENT.md](../QUICK-START-DEPLOYMENT.md) | Guide rapide avec commandes essentielles | 5 min |
| [DEPLOYMENT-GUIDE-EXECUTION.md](DEPLOYMENT-GUIDE-EXECUTION.md) | Guide pas-à-pas complet | 30 min |
| [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) | Résumé et checklist | 10 min |

### 🏗️ Architecture

| Document | Description |
|----------|-------------|
| [AWS-BETA-BUDGET-DEPLOYMENT.md](AWS-BETA-BUDGET-DEPLOYMENT.md) | Architecture budget-optimisée ($64-87/mois) |
| [AWS-WORKERS-BUDGET-SOLUTION.md](AWS-WORKERS-BUDGET-SOLUTION.md) | Solution workers serverless (Upstash QStash) |
| [AWS-APP-INFRASTRUCTURE-SCAN.md](AWS-APP-INFRASTRUCTURE-SCAN.md) | Scan complet de l'application |

### 🔧 Configuration

| Document | Description |
|----------|-------------|
| [UPSTASH-QSTASH-SETUP.md](UPSTASH-QSTASH-SETUP.md) | Configuration Upstash QStash (workers) |

### 📜 Historique

| Document | Description |
|----------|-------------|
| [AWS-TABLE-RASE-COMPLETE.md](AWS-TABLE-RASE-COMPLETE.md) | Nettoyage complet AWS (table rase) |
| [AWS-CLEANUP-FINAL-REPORT.md](AWS-CLEANUP-FINAL-REPORT.md) | Rapport final du nettoyage |

---

## 🛠️ Scripts

### Déploiement

```bash
# Déploiement automatique AWS
./scripts/deploy-beta-complete.sh

# Vérification post-déploiement
./scripts/verify-deployment.sh
```

### Monitoring

```bash
# Logs AWS Lambda
aws logs tail /aws/lambda/huntaze-beta-ai-router --follow

# Logs Vercel
vercel logs --follow

# Coûts AWS
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 📊 Architecture Finale

```
Vercel ($20/mois)
├── Frontend Next.js 16
├── API Routes
└── Background Functions

AWS ($42-52/mois)
├── RDS PostgreSQL (db.t4g.micro) - $15
├── ElastiCache Redis (cache.t4g.micro) - $12
├── S3 (assets) - $3
├── Lambda (AI Router) - $0.50
├── Lambda (Cron jobs) - $2
└── API Gateway - $1

Upstash QStash ($2-5/mois)
└── Workers (video, trends, data)

Azure AI Foundry ($10-30/mois)
├── DeepSeek-R1 (reasoning)
├── DeepSeek-V3 (generation)
└── Phi-4 Multimodal (vision)
```

**Total**: $64-87/mois ✅

---

## ✅ Checklist

### Pré-requis
- [ ] Compte AWS (317805897534)
- [ ] Compte Vercel
- [ ] Compte Upstash
- [ ] Compte Azure AI Foundry
- [ ] AWS CLI configuré
- [ ] Vercel CLI installé

### Déploiement
- [ ] Infrastructure AWS créée
- [ ] Upstash QStash configuré
- [ ] Vercel déployé
- [ ] Variables d'environnement configurées
- [ ] Migrations database appliquées

### Tests
- [ ] Health checks OK
- [ ] Login flow OK
- [ ] OnlyFans messages OK
- [ ] Content upload OK
- [ ] Analytics OK

---

## 🆘 Support

### Problèmes Courants

**RDS Connection Failed**
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

**Redis Connection Failed**
```bash
redis-cli -h $REDIS_ENDPOINT ping
```

**Vercel Build Failed**
```bash
vercel logs
vercel --prod --force
```

**QStash Messages Failed**
```bash
# Dashboard: https://console.upstash.com/qstash
curl https://app.huntaze.com/api/workers/video-processing
```

---

## 📈 Monitoring

### Dashboards
- **AWS Cost Explorer**: https://console.aws.amazon.com/cost-management/
- **Vercel Analytics**: https://vercel.com/analytics
- **Upstash QStash**: https://console.upstash.com/qstash
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/

### Alertes Configurées
- ✅ RDS CPU > 80%
- ✅ Redis Memory > 90%
- ✅ Lambda Errors > 5
- ✅ AWS Budget > $100/mois

---

## 💰 Coûts

### Estimation Mensuelle

| Service | Coût |
|---------|------|
| Vercel | $20 |
| RDS | $15 |
| Redis | $12 |
| S3 | $3 |
| Lambda | $2.50 |
| Upstash | $2-5 |
| Azure AI | $10-30 |
| **TOTAL** | **$64-87** |

### Économies

**Avant**: $383-568/mois  
**Après**: $64-87/mois  
**Économies**: **83%** 🎉

---

## 🎯 Prochaines Étapes

1. **Déployer**: `./scripts/deploy-beta-complete.sh`
2. **Vérifier**: `./scripts/verify-deployment.sh`
3. **Tester**: https://app.huntaze.com
4. **Monitorer**: AWS Cost Explorer + Vercel Analytics

---

## 📚 Ressources Externes

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Vercel Documentation**: https://vercel.com/docs
- **Upstash Documentation**: https://upstash.com/docs
- **Azure AI Foundry**: https://ai.azure.com/
- **Prisma Documentation**: https://www.prisma.io/docs

---

**Documentation créée le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Statut**: ✅ COMPLET
