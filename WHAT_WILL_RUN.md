# 🔍 Ce Qui Sera Lancé - Détails Complets

## 📋 Vue d'Ensemble

Quand tu lances `./QUICK_DEPLOY.sh` ou `./scripts/deploy-huntaze-hybrid.sh`, voici EXACTEMENT ce qui se passe :

---

## 🚀 Étape par Étape

### 1️⃣ Vérification des Credentials AWS

```bash
aws sts get-caller-identity
```

**Ce que ça fait:**
- Vérifie que tes credentials AWS sont valides
- Affiche ton User ARN
- Vérifie que tu as accès au compte 317805897534

**Si ça échoue:**
- Le script s'arrête
- Tu dois exporter tes credentials AWS

---

### 2️⃣ Création des Ressources AWS

Le script lance `scripts/setup-aws-infrastructure.sh` qui crée **5 ressources** :

#### A. DynamoDB Tables (2 tables)

**Table 1: huntaze-ai-costs-production**
```bash
aws dynamodb create-table \
  --table-name huntaze-ai-costs-production \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Ce que ça fait:**
- Crée une table DynamoDB pour tracker les coûts AI
- Partition key: `id` (string)
- Sort key: `timestamp` (string)
- Billing: Pay-per-request (pas de coût fixe)
- Coût: ~$1.25/million de requêtes

**Données stockées:**
```json
{
  "id": "2024-10-28-azure",
  "timestamp": "2024-10-28T10:30:00Z",
  "provider": "azure",
  "model": "gpt-4-turbo",
  "tokens": 1500,
  "cost": 0.045,
  "requests": 1
}
```

---

**Table 2: huntaze-cost-alerts-production**
```bash
aws dynamodb create-table \
  --table-name huntaze-cost-alerts-production \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Ce que ça fait:**
- Crée une table pour l'historique des alertes
- Partition key: `id` (string)
- Pas de sort key
- Billing: Pay-per-request
- Coût: ~$1.25/million de requêtes

**Données stockées:**
```json
{
  "id": "alert-2024-10-28-001",
  "timestamp": "2024-10-28T10:30:00Z",
  "severity": "warning",
  "message": "Daily cost threshold exceeded: $52.30",
  "threshold": 50,
  "currentCost": 52.30
}
```

---

#### B. SQS Queues (2 queues)

**Queue 1: huntaze-hybrid-workflows**
```bash
aws sqs create-queue \
  --queue-name huntaze-hybrid-workflows \
  --region us-east-1
```

**Ce que ça fait:**
- Crée une queue SQS pour orchestrer les workflows
- Visibility timeout: 30s (default)
- Message retention: 4 days (default)
- Coût: $0.40/million de requêtes

**Messages envoyés:**
```json
{
  "workflowId": "wf-123",
  "type": "content_planning",
  "campaignId": "camp-456",
  "status": "pending",
  "data": {
    "platforms": ["instagram"],
    "theme": "fitness"
  }
}
```

---

**Queue 2: huntaze-rate-limiter-queue**
```bash
aws sqs create-queue \
  --queue-name huntaze-rate-limiter-queue \
  --region us-east-1
```

**Ce que ça fait:**
- Crée une queue pour les events du rate limiter
- Utilisée pour tracker les rate limits OnlyFans
- Coût: $0.40/million de requêtes

**Messages envoyés:**
```json
{
  "userId": "user-123",
  "action": "message_sent",
  "timestamp": "2024-10-28T10:30:00Z",
  "platform": "onlyfans",
  "remaining": 9
}
```

---

#### C. SNS Topics (1 topic)

**Topic: huntaze-cost-alerts**
```bash
aws sns create-topic \
  --name huntaze-cost-alerts \
  --region us-east-1
```

**Ce que ça fait:**
- Crée un topic SNS pour les notifications d'alertes
- Tu pourras t'y abonner par email ou Slack
- Coût: $0.50/million de notifications

**Notifications envoyées:**
```json
{
  "Subject": "⚠️ Huntaze Cost Alert: Daily Threshold Exceeded",
  "Message": "Your daily AI costs have exceeded $50. Current: $52.30",
  "Timestamp": "2024-10-28T10:30:00Z",
  "Severity": "warning"
}
```

---

### 3️⃣ Génération du Fichier amplify-env-vars.txt

Le script crée un fichier `amplify-env-vars.txt` avec **~15 variables d'environnement** :

```bash
cat > amplify-env-vars.txt << 'EOF'
# AWS Services
DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production
DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production
SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts

# Feature Flags
HYBRID_ORCHESTRATOR_ENABLED=true
COST_MONITORING_ENABLED=true
RATE_LIMITER_ENABLED=true

# AI Providers
AZURE_OPENAI_API_KEY=YOUR_AZURE_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
EOF
```

**Ce que ça fait:**
- Génère un fichier avec toutes les variables nécessaires
- Tu devras copier ces variables dans Amplify Console
- Remplacer les valeurs YOUR_* par tes vraies clés

---

### 4️⃣ Vérification Git Status

```bash
git status --porcelain
```

**Ce que ça fait:**
- Vérifie s'il y a des changements non commités
- Te demande si tu veux les commiter
- Si oui, fait un `git add .` et `git commit`

---

### 5️⃣ Génération du Résumé de Déploiement

Le script crée un fichier `deployment-summary.md` avec :
- Liste des ressources créées
- Instructions pour configurer Amplify
- Commandes de vérification
- Coûts estimés

---

## 💰 Coûts des Ressources Créées

| Ressource | Coût/mois | Détails |
|-----------|-----------|---------|
| **DynamoDB (2 tables)** | ~$5 | Pay-per-request, ~1M requests |
| **SQS (2 queues)** | ~$1 | $0.40/M requests, ~2.5M requests |
| **SNS (1 topic)** | ~$1 | $0.50/M notifications, ~2K notifications |
| **TOTAL** | **~$7** | Nouveaux coûts mensuels |

**Note:** Ces coûts sont en plus de ton infrastructure existante (~$65/mois)

---

## 🔒 Permissions AWS Requises

Le script a besoin des permissions suivantes :

### DynamoDB
- `dynamodb:CreateTable`
- `dynamodb:DescribeTable`

### SQS
- `sqs:CreateQueue`
- `sqs:GetQueueUrl`

### SNS
- `sns:CreateTopic`
- `sns:GetTopicAttributes`

### STS
- `sts:GetCallerIdentity`

---

## ⚠️ Ce Qui N'Est PAS Lancé

Le script **NE FAIT PAS** :

❌ **Modifier ton code existant**
- Aucun fichier de code n'est modifié
- Seules les ressources AWS sont créées

❌ **Déployer sur Amplify**
- Tu dois faire `git push origin main` manuellement
- Ou redeploy depuis Amplify Console

❌ **Configurer les env vars Amplify**
- Tu dois les copier manuellement depuis `amplify-env-vars.txt`

❌ **Supprimer des ressources**
- Aucune ressource n'est supprimée
- Seules les nouvelles sont créées

❌ **Modifier ta base de données**
- RDS PostgreSQL n'est pas touché
- ElastiCache Redis n'est pas touché

---

## 🔄 Workflow Complet

```
START
  ↓
[1] Vérifie AWS credentials
  ↓
[2] Crée DynamoDB: huntaze-ai-costs-production
  ↓
[3] Crée DynamoDB: huntaze-cost-alerts-production
  ↓
[4] Crée SQS: huntaze-hybrid-workflows
  ↓
[5] Crée SQS: huntaze-rate-limiter-queue
  ↓
[6] Crée SNS: huntaze-cost-alerts
  ↓
[7] Génère amplify-env-vars.txt
  ↓
[8] Vérifie git status
  ↓
[9] Génère deployment-summary.md
  ↓
[10] Affiche les instructions finales
  ↓
END
```

**Durée totale:** ~5 minutes

---

## 📊 Après le Script

### Fichiers Générés

1. **amplify-env-vars.txt**
   - Variables d'environnement à copier dans Amplify
   - ~15 variables

2. **deployment-summary.md**
   - Résumé complet du déploiement
   - Instructions pour la suite

### Ressources AWS Créées

1. **DynamoDB Tables (2)**
   - huntaze-ai-costs-production
   - huntaze-cost-alerts-production

2. **SQS Queues (2)**
   - huntaze-hybrid-workflows
   - huntaze-rate-limiter-queue

3. **SNS Topics (1)**
   - huntaze-cost-alerts

---

## 🎯 Prochaines Étapes Manuelles

Après le script, tu dois :

### 1. Configurer Amplify (10 min)
```bash
# Ouvre Amplify Console
open https://console.aws.amazon.com/amplify

# Va dans: App Settings > Environment variables
# Copie les variables depuis: amplify-env-vars.txt
```

### 2. Déployer (2 min)
```bash
git push origin main
```

### 3. Vérifier (3 min)
```bash
curl https://YOUR-URL/api/health/hybrid-orchestrator
```

---

## 🆘 Si Quelque Chose Échoue

### "Table already exists"
✅ **C'est OK !** Le script continue avec les ressources existantes.

### "Queue already exists"
✅ **C'est OK !** Le script continue avec les ressources existantes.

### "Permission denied"
❌ **Problème !** Vérifie tes permissions IAM.

### "Credentials not configured"
❌ **Problème !** Exporte tes AWS credentials.

---

## 🔍 Commandes pour Vérifier

Après le script, tu peux vérifier que tout est créé :

```bash
# Vérifier les tables DynamoDB
aws dynamodb list-tables --region us-east-1 | grep huntaze

# Vérifier les queues SQS
aws sqs list-queues --region us-east-1 | grep huntaze

# Vérifier les topics SNS
aws sns list-topics --region us-east-1 | grep huntaze
```

---

## 🎉 Résumé

**Le script crée 5 ressources AWS en ~5 minutes:**
- 2 tables DynamoDB (~$5/mois)
- 2 queues SQS (~$1/mois)
- 1 topic SNS (~$1/mois)

**Total: ~$7/mois de nouveaux coûts**

**Aucun code n'est modifié, aucune ressource n'est supprimée.**

**Tu dois ensuite configurer Amplify manuellement et push to main.**

---

**Ready?** Lance `./scripts/deploy-huntaze-hybrid.sh` quand tu veux ! 🚀
