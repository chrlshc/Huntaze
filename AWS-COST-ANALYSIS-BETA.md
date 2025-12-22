# 💰 Analyse des Coûts AWS - Huntaze Beta

**Date:** 19 Décembre 2025  
**Coût actuel:** ~$400/mois  
**Objectif:** Réduire à ~$50-100/mois pour la beta

## 🔍 Ressources Identifiées

### ❌ COÛTS ÉLEVÉS À ÉLIMINER

#### 1. **ECS Fargate - AI Router** (~$150-200/mois)
- **us-east-2:**
  - `huntaze-ai-router-production`: 2 tasks running
  - `huntaze-ai-router`: 1 task running
- **Coût:** ~$50/mois par task (512 CPU, 1024 MB)
- **Action:** Réduire à 1 seul task au total

#### 2. **Application Load Balancers** (~$32-48/mois)
- **us-east-2:**
  - `huntaze-ai-router-alb`
  - `huntaze-ai-router-production`
- **Coût:** ~$16/mois par ALB + data transfer
- **Action:** Garder 1 seul ALB ou utiliser CloudFront

#### 3. **CloudWatch Logs** (~$20-40/mois)
- `/ecs/huntaze-ai-router`: 43.8 MB stockés
- `/aws/ecs/containerinsights`: 3.2 MB
- **Coût:** Storage + ingestion
- **Action:** Réduire retention à 3-7 jours

#### 4. **Secrets Manager** (~$12-24/mois)
- **us-east-1:** 12 secrets
- **us-east-2:** 3 secrets
- **eu-west-1:** 2 secrets
- **Coût:** $0.40/secret/mois
- **Action:** Supprimer secrets inutilisés, migrer vers Parameter Store (gratuit)

#### 5. **Cluster ECS Inutilisé** (eu-west-1)
- `ai-team` cluster: 0 tasks running
- **Action:** Supprimer complètement

#### 6. **EventBridge Rules** (~$1-5/mois)
- `ai-insights-ready` (eu-west-1)
- Offers cron rules (us-east-1)
- **Action:** Garder uniquement les essentiels

### ✅ RESSOURCES À GARDER (Coûts Acceptables)

#### 1. **RDS PostgreSQL** (~$15-30/mois)
- Instance de production
- **Action:** Vérifier la taille, passer en t3.micro si possible

#### 2. **S3 Buckets** (~$5-10/mois)
- Storage des assets
- **Action:** Activer lifecycle policies

#### 3. **Lambda Functions** (~$0-5/mois)
- Pay-per-use, coût minimal
- **Action:** Garder

## 📊 Plan d'Action Immédiat

### Phase 1: Réductions Immédiates (Économie: ~$150-200/mois)

```bash
# 1. Réduire ECS tasks à 1 seul
aws ecs update-service \
  --cluster huntaze-ai-router-production \
  --service huntaze-ai-router \
  --desired-count 1 \
  --region us-east-2

# 2. Supprimer le cluster de test
aws ecs delete-service \
  --cluster huntaze-ai-router \
  --service hz-router-svc \
  --force \
  --region us-east-2

# 3. Supprimer le cluster eu-west-1
aws ecs delete-cluster \
  --cluster ai-team \
  --region eu-west-1

# 4. Réduire auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/huntaze-ai-router-production/huntaze-ai-router \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 2 \
  --region us-east-2
```

### Phase 2: Optimisation Logs (Économie: ~$20-30/mois)

```bash
# Réduire retention CloudWatch à 7 jours
aws logs put-retention-policy \
  --log-group-name /ecs/huntaze-ai-router \
  --retention-in-days 7 \
  --region us-east-2

aws logs put-retention-policy \
  --log-group-name /aws/ecs/containerinsights/huntaze-ai-router-production/performance \
  --retention-in-days 7 \
  --region us-east-2
```

### Phase 3: Nettoyage Secrets (Économie: ~$8-12/mois)

```bash
# Supprimer secrets inutilisés (OnlyFans test accounts)
aws secretsmanager delete-secret \
  --secret-id of/creds/test-user \
  --force-delete-without-recovery \
  --region us-east-1

aws secretsmanager delete-secret \
  --secret-id of/creds/login-final-1760229887 \
  --force-delete-without-recovery \
  --region us-east-1

aws secretsmanager delete-secret \
  --secret-id of/creds/huntcpro \
  --force-delete-without-recovery \
  --region us-east-1

aws secretsmanager delete-secret \
  --secret-id of/creds/charleshuntaze76100 \
  --force-delete-without-recovery \
  --region us-east-1

# Migrer vers Parameter Store (gratuit)
# Les secrets essentiels peuvent être migrés vers SSM Parameter Store
```

### Phase 4: Consolidation ALB (Économie: ~$16/mois)

```bash
# Option 1: Supprimer un ALB et router via CloudFront
# Option 2: Utiliser un seul ALB avec path-based routing

# Supprimer ALB de test
aws elbv2 delete-load-balancer \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-2:317805897534:loadbalancer/app/huntaze-ai-router-alb/aa115d1dc069e4cc \
  --region us-east-2
```

## 💡 Recommandations Supplémentaires

### 1. **Utiliser AWS Free Tier**
- RDS: t3.micro (750h/mois gratuit la 1ère année)
- Lambda: 1M requêtes/mois gratuit
- CloudWatch: 5GB logs gratuit

### 2. **Migrer vers Services Moins Chers**
- **ElastiCache → Upstash Redis** (gratuit jusqu'à 10k requêtes/jour)
- **Secrets Manager → SSM Parameter Store** (gratuit)
- **CloudWatch Logs → CloudWatch Logs Insights** (réduire retention)

### 3. **Optimiser l'Architecture**
- Utiliser **Fargate Spot** (70% moins cher)
- Passer en **ARM64** (Graviton2) pour ECS (20% moins cher)
- Activer **S3 Intelligent-Tiering**

### 4. **Monitoring des Coûts**
```bash
# Activer Cost Explorer
# Créer des budgets AWS
aws budgets create-budget \
  --account-id 317805897534 \
  --budget file://budget-beta.json
```

## 📈 Estimation des Économies

| Ressource | Coût Actuel | Coût Optimisé | Économie |
|-----------|-------------|---------------|----------|
| ECS Tasks (3→1) | $150 | $50 | **$100** |
| ALB (2→1) | $32 | $16 | **$16** |
| CloudWatch Logs | $30 | $5 | **$25** |
| Secrets Manager | $20 | $4 | **$16** |
| Cluster EU (delete) | $10 | $0 | **$10** |
| **TOTAL** | **$400** | **~$75-100** | **~$300** |

## ⚠️ Précautions

1. **Backup avant suppression**
   - Exporter les secrets avant de les supprimer
   - Sauvegarder les logs importants
   - Documenter la configuration actuelle

2. **Tester après chaque changement**
   - Vérifier que l'AI Router fonctionne avec 1 task
   - Tester les endpoints après suppression ALB
   - Monitorer les performances

3. **Rollback Plan**
   - Garder les scripts de déploiement
   - Documenter les ARNs supprimés
   - Pouvoir recréer rapidement si besoin

## 🚀 Commandes Rapides

```bash
# Audit complet
./scripts/aws-cost-audit-beta.sh

# Nettoyage automatique (avec confirmation)
./scripts/aws-cleanup-beta.sh

# Vérifier les coûts actuels
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-19 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

## 📞 Support

Si tu as des questions ou besoin d'aide:
1. Vérifie les logs: `cat aws-cost-audit-*.txt`
2. Consulte AWS Cost Explorer
3. Contacte le support AWS si nécessaire

---

**Note:** Ces changements sont réversibles. Tu peux toujours scale up si nécessaire pour la production.
