# 🚀 Huntaze Hybrid Orchestrator - Deployment Guide

## ✅ Ce qui est PRÊT

Ton infrastructure AWS est déjà en place :
- ✅ RDS PostgreSQL (huntaze-postgres-production)
- ✅ ECS Fargate clusters (huntaze-cluster, huntaze-of-fargate, ai-team)
- ✅ 10 DynamoDB tables existantes
- ✅ 11 SQS queues existantes
- ✅ Code complet de l'orchestrateur hybride

## ⚠️ Ce qui MANQUE (5 min de setup)

```bash
# 2 tables DynamoDB
huntaze-ai-costs-production       → Cost tracking
huntaze-cost-alerts-production    → Alert history

# 2 queues SQS
huntaze-hybrid-workflows          → Workflow orchestration
huntaze-rate-limiter-queue        → Rate-limited requests

# 1 topic SNS
huntaze-cost-alerts               → Email/Slack notifications
```

## 🎯 DÉPLOIEMENT EN 3 ÉTAPES

### Étape 1: Créer les ressources AWS (5 min)

```bash
# Exporter tes credentials AWS
export AWS_ACCESS_KEY_ID="ASIAUT7VVE47PYZWW2XS"
export AWS_SECRET_ACCESS_KEY="IFE4qHAxwe/lCpO3N/d4YnF6RODxYm/lOuvJigK4"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEAsaCXVzLWVhc3QtMSJHMEUCIQDXgz5W9PVXpDooKGEymu/v3Uh3z67zOY+nmYXEB+Gr1gIgR/3a2jOec38Q+QxxUKeJptFYVJYJLuh852UiJ/Fi5Zcq9wIIw///////////ARAAGgwzMTc4MDU4OTc1MzQiDEdB+7eXB9DXeBzoCirLAhby641hh2OBgbE0yrkRSl0yTFrQLB8lnB4ujC2smsJYAlyoHe3YBC4JwhrCcIZ7CTikTs7XjfxabacjX0SzPD3EpUsH685AWma5VZFfQfav/Gm4ROKOaqx4BMP7Kn2voKPaPAMebCgaJ+JpApGGznk0R5lBJ0S8L0Kp5/RzT9q8UJcqwbV3soGD4GSNYWuGIywvN5swZUsQbohOzYcHY71/dYMaH96yfdCPYIkREuNpFKWpU6OLSn19dTnxFWE+OUxnJApBTinea/ueWKD1sRI3Mqh266nJ/xOm9dhyhqTHM3IGO9fqrT4LhJfjH/TvPfhRG06zt2nI6+BQ7BGFI2b33OQ4XvRIuhQ2taxwpcVPzxX8BRjAh7fLluTZmveALfVquhQ0D3olitYTA0qyOTTeBoJLyk8LuLSF2fKltOFWdWggyZ+D8t7ZLpow/o6EyAY6pQEZyBH19OGP+MVy79/frbH2jPQz/pta7zVWLt8ba7gFljbQqvJqJWaqwSkbW/dUFMVfm/1wQA/bWirqhXUGbMpaa2AjhlfJjLi2f1vrrvUIBomcVWKBOUHN1l5EH1pbto8pt7Q9qELyEJlttAXzG+yYfya6VpHAyl/HJYOeNfHGYnqoCQEDQafFbRTb2qSEBIMUodRkWGCgbC9iXM2B8qxiZmEAeps="

# Lancer le script de setup
./scripts/setup-aws-infrastructure.sh

# Subscribe ton email aux alertes
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --protocol email \
  --notification-endpoint admin@huntaze.com \
  --region us-east-1
```

### Étape 2: Configurer les variables d'environnement (2 min)

Ajoute à ton `.env` ou ECS task definition :

```bash
# AWS Resources (nouvelles)
DYNAMODB_COSTS_TABLE="huntaze-ai-costs-production"
DYNAMODB_ALERTS_TABLE="huntaze-cost-alerts-production"
SQS_WORKFLOW_QUEUE="https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows"
SQS_RATE_LIMITER_QUEUE="https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue"
COST_ALERTS_SNS_TOPIC="arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts"

# Alerting
COST_ALERT_EMAIL="admin@huntaze.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Cost Thresholds (optionnel, defaults dans le code)
DAILY_COST_THRESHOLD="50"    # $50/jour
MONTHLY_COST_THRESHOLD="1000" # $1000/mois
```

### Étape 3: Déployer sur ECS (10 min)

```bash
# Build
npm run build

# Docker
docker build -t huntaze-api:latest .

# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  317805897534.dkr.ecr.us-east-1.amazonaws.com

docker tag huntaze-api:latest \
  317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-api:latest

docker push 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-api:latest

# Deploy
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-api \
  --force-new-deployment \
  --region us-east-1

# Wait for deployment
aws ecs wait services-stable \
  --cluster huntaze-cluster \
  --services huntaze-api \
  --region us-east-1

echo "✅ Deployment complete!"
```

## 🧪 VÉRIFICATION

### 1. Health Check
```bash
curl https://api.huntaze.com/api/health/hybrid-orchestrator

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "orchestrator": { "status": "healthy" },
    "azureProvider": { "status": "healthy" },
    "openaiProvider": { "status": "healthy" }
  }
}
```

### 2. Test Campaign Creation
```bash
curl -X POST https://api.huntaze.com/api/v2/campaigns/hybrid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "content_planning",
    "platforms": ["instagram"],
    "data": {
      "theme": "fitness",
      "tone": "motivational"
    }
  }'

# Expected response:
{
  "success": true,
  "data": {
    "workflowId": "wf_xxx",
    "content": "Generated content...",
    "provider": "azure",
    "status": "completed"
  },
  "metrics": {
    "duration": 1250,
    "cost": { "tokens": 2500, "cost": 0.025 }
  }
}
```

### 3. Check Costs
```bash
curl https://api.huntaze.com/api/v2/costs/stats

# Expected response:
{
  "success": true,
  "data": {
    "todayTotal": 2.50,
    "thisHourTotal": 0.15,
    "providerBreakdown": {
      "azure": 1.80,
      "openai": 0.70
    }
  }
}
```

## 📊 MONITORING

### CloudWatch Dashboard

Crée un dashboard pour surveiller :

```bash
aws cloudwatch put-dashboard \
  --dashboard-name Huntaze-Hybrid-Orchestrator \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region us-east-1
```

### Alarms recommandés

```bash
# Daily cost > $50
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-daily-cost-high \
  --metric-name AIProviderCost \
  --namespace Huntaze/AI/Costs \
  --statistic Sum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --region us-east-1

# Error rate > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-error-rate-high \
  --metric-name Errors \
  --namespace AWS/ECS \
  --dimensions Name=ServiceName,Value=huntaze-api \
  --statistic Average \
  --period 300 \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --region us-east-1
```

## 🐛 TROUBLESHOOTING

### Logs
```bash
# View real-time logs
aws logs tail /aws/ecs/huntaze-cluster --follow --region us-east-1

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/ecs/huntaze-cluster \
  --filter-pattern "ERROR" \
  --region us-east-1
```

### Rollback
```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix huntaze-api \
  --region us-east-1

# Rollback to previous version
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-api \
  --task-definition huntaze-api:PREVIOUS_VERSION \
  --region us-east-1
```

## 💰 COÛTS ESTIMÉS

| Service | Monthly Cost |
|---------|--------------|
| RDS db.t3.micro | ~$15 |
| ECS Fargate (0.25 vCPU) | ~$10 |
| DynamoDB (On-Demand) | ~$1.25 |
| SQS | ~$0.40 |
| CloudWatch | ~$5 |
| **AWS Total** | **~$32** |
| | |
| Azure OpenAI (1M tokens) | ~$30 |
| OpenAI (1M tokens) | ~$2 |
| **AI Total** | **~$32** |
| | |
| **TOTAL** | **~$64/month** |

## 📚 DOCUMENTATION

- **Architecture complète:** `HUNTAZE_COMPLETE_ARCHITECTURE.md`
- **Quick Reference:** `HUNTAZE_QUICK_REFERENCE.md`
- **MVP Roadmap:** `HUNTAZE_MVP_VS_FUTURE_ROADMAP.md`

## 🆘 SUPPORT

**AWS Account:** 317805897534  
**Region:** us-east-1  
**Environment:** Production  

**En cas de problème:**
1. Check health: `curl https://api.huntaze.com/api/health/hybrid-orchestrator`
2. Check logs: `aws logs tail /aws/ecs/huntaze-cluster --follow`
3. Check costs: `curl https://api.huntaze.com/api/v2/costs/stats`
4. Rollback si nécessaire

---

**Ready to deploy? Run:** `./scripts/setup-aws-infrastructure.sh` 🚀
