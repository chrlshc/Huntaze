# 🚀 Huntaze OnlyFans - Guide de Déploiement

Guide complet pour déployer l'intégration OnlyFans sur AWS avec ECS Fargate + Playwright.

---

## 📋 Prérequis

### 1. Outils Requis

```bash
# Vérifier les installations
node --version    # v18+ requis
npm --version     # v9+ requis
aws --version     # AWS CLI v2+ requis
cdk --version     # AWS CDK v2+ requis
```

### 2. Credentials AWS

```bash
# Configurer AWS CLI
aws configure

# Ou exporter les variables d'environnement
export AWS_ACCESS_KEY_ID=xxxxx
export AWS_SECRET_ACCESS_KEY=xxxxx
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Permissions IAM Requises

Votre utilisateur AWS doit avoir les permissions suivantes :
- `AmazonECS_FullAccess`
- `AmazonDynamoDBFullAccess`
- `AWSLambda_FullAccess`
- `AWSKeyManagementServicePowerUser`
- `CloudWatchFullAccess`
- `IAMFullAccess` (pour créer les rôles)
- `AWSCloudFormationFullAccess`

---

## 🎯 Méthode 1 : Déploiement Automatique (Recommandé)

### Option A : Script Tout-en-Un

```bash
# Exécuter le script de déploiement automatique
./scripts/deploy-onlyfans.sh
```

Ce script va :
1. ✅ Vérifier les prérequis
2. ✅ Déployer le stack CDK
3. ✅ Récupérer les outputs
4. ✅ Déployer le Lambda
5. ✅ Créer le fichier `.env.production`
6. ✅ Lancer les tests d'intégration

**Durée estimée : 10-15 minutes**

---

## 🔧 Méthode 2 : Déploiement Manuel (Étape par Étape)

### Étape 1 : Déployer le Stack CDK (30 min)

```bash
# 1. Aller dans le répertoire CDK
cd infra/cdk

# 2. Installer les dépendances
npm install

# 3. Build le stack
npm run build

# 4. Bootstrap CDK (première fois seulement)
npx cdk bootstrap aws://317805897534/us-east-1

# 5. Déployer le stack
npx cdk deploy HuntazeOnlyFansStack --require-approval never
```

**Ressources créées :**
- ✅ VPC avec subnets publics/privés
- ✅ ECS Cluster Fargate
- ✅ Task Definition avec Playwright
- ✅ DynamoDB Tables (Sessions, Threads, Messages)
- ✅ KMS Key pour chiffrement
- ✅ CloudWatch Log Groups
- ✅ IAM Roles et Policies
- ✅ Security Groups

**Outputs attendus :**
```
HuntazeOnlyFansStack.ECSClusterArn = arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate
HuntazeOnlyFansStack.TaskDefinitionArn = arn:aws:ecs:us-east-1:317805897534:task-definition/...
HuntazeOnlyFansStack.SessionsTableName = HuntazeOfSessions
HuntazeOnlyFansStack.MessagesTableName = HuntazeOfMessages
HuntazeOnlyFansStack.KMSKeyId = arn:aws:kms:us-east-1:317805897534:key/...
```

### Étape 2 : Configurer les Variables d'Environnement (5 min)

Créer le fichier `.env.production` :

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=317805897534

# ECS Configuration (copier depuis les outputs CDK)
ECS_CLUSTER_ARN=arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate
ECS_TASK_DEFINITION=HuntazeOfStackBrowserWorkerTaskXXX:1
ECS_SUBNETS=subnet-xxxxx,subnet-yyyyy
ECS_SECURITY_GROUPS=sg-xxxxx

# DynamoDB Configuration
DYNAMODB_REGION=us-east-1
DYNAMODB_TABLE_SESSIONS=HuntazeOfSessions
DYNAMODB_TABLE_THREADS=HuntazeOfThreads
DYNAMODB_TABLE_MESSAGES=HuntazeOfMessages

# KMS Configuration
KMS_KEY_ID=arn:aws:kms:us-east-1:317805897534:key/c554a2c6-56e1-430c-b191-78e56502c0df

# Secrets Manager
SECRETS_MANAGER_SECRET=of/creds/huntaze

# Feature Flags
PLAYWRIGHT_ENABLED_PERCENT=10
ENVIRONMENT=production

# Monitoring
ENABLE_DETAILED_LOGS=true
ENABLE_METRICS=true
METRICS_INTERVAL=60000
```

### Étape 3 : Déployer le Lambda Orchestrator (20 min)

```bash
# 1. Aller dans le répertoire Lambda
cd infra/lambda/orchestrator

# 2. Installer les dépendances
npm install

# 3. Build le code TypeScript
npm run build

# 4. Packager la fonction
zip -r function.zip index.js node_modules/

# 5. Créer la fonction Lambda
aws lambda create-function \
  --function-name huntaze-of-orchestrator \
  --runtime nodejs18.x \
  --role arn:aws:iam::317805897534:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --region us-east-1 \
  --environment "Variables={
    ECS_CLUSTER_ARN=arn:aws:ecs:us-east-1:317805897534:cluster/huntaze-of-fargate,
    ECS_TASK_DEFINITION=HuntazeOfStackBrowserWorkerTaskXXX:1,
    DYNAMODB_TABLE_SESSIONS=HuntazeOfSessions,
    DYNAMODB_TABLE_MESSAGES=HuntazeOfMessages,
    KMS_KEY_ID=arn:aws:kms:us-east-1:317805897534:key/xxx
  }"

# Ou mettre à jour si elle existe déjà
aws lambda update-function-code \
  --function-name huntaze-of-orchestrator \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Étape 4 : Configurer les Secrets OnlyFans (10 min)

```bash
# Créer le secret dans AWS Secrets Manager
aws secretsmanager create-secret \
  --name of/creds/huntaze \
  --description "OnlyFans credentials for Huntaze" \
  --secret-string '{
    "username": "your-onlyfans-username",
    "password": "your-onlyfans-password",
    "cookies": {}
  }' \
  --region us-east-1
```

### Étape 5 : Tester l'Intégration (15 min)

```bash
# Retour à la racine du projet
cd ../../..

# Installer les dépendances de test
npm install

# Lancer les tests d'intégration
npm test -- tests/integration/playwright-ecs.integration.test.ts

# Lancer les tests de charge (optionnel)
npm run test:load
```

**Tests attendus :**
- ✅ Envoi de message via ECS Fargate
- ✅ Gestion du rate limiting
- ✅ Tâches concurrentes
- ✅ Limites par type de compte
- ✅ Gestion des erreurs

---

## 📊 Vérification du Déploiement

### 1. Vérifier le Stack CDK

```bash
# Lister les stacks
aws cloudformation list-stacks --region us-east-1

# Voir les détails du stack
aws cloudformation describe-stacks \
  --stack-name HuntazeOnlyFansStack \
  --region us-east-1
```

### 2. Vérifier l'ECS Cluster

```bash
# Lister les clusters
aws ecs list-clusters --region us-east-1

# Voir les détails du cluster
aws ecs describe-clusters \
  --clusters huntaze-of-fargate \
  --region us-east-1
```

### 3. Vérifier les Tables DynamoDB

```bash
# Lister les tables
aws dynamodb list-tables --region us-east-1

# Voir les détails d'une table
aws dynamodb describe-table \
  --table-name HuntazeOfSessions \
  --region us-east-1
```

### 4. Vérifier le Lambda

```bash
# Lister les fonctions
aws lambda list-functions --region us-east-1

# Voir les détails de la fonction
aws lambda get-function \
  --function-name huntaze-of-orchestrator \
  --region us-east-1
```

### 5. Tester Manuellement

```bash
# Invoquer le Lambda directement
aws lambda invoke \
  --function-name huntaze-of-orchestrator \
  --payload '{"action":"SEND_MESSAGE","userId":"test","data":{"recipientId":"fan-1","content":"Test","accountType":"established"}}' \
  --region us-east-1 \
  response.json

# Voir la réponse
cat response.json
```

---

## 🚀 Rollout Progressif

### Phase 1 : Beta (10% - Jour 1-2)

```bash
# Activer pour 10% des utilisateurs
echo "PLAYWRIGHT_ENABLED_PERCENT=10" >> .env.production

# Redéployer l'application
npm run deploy
```

**Monitoring :**
- Vérifier CloudWatch Logs toutes les 30 minutes
- P95 latency < 500ms ✅
- Success rate > 99% ✅
- Pas de rate limit hits > 10% ✅

### Phase 2 : Expansion (50% - Jour 3-4)

```bash
# Augmenter à 50%
echo "PLAYWRIGHT_ENABLED_PERCENT=50" >> .env.production
npm run deploy
```

**Validation :**
- Vérifier l'auto-scaling ECS
- Monitorer les coûts AWS
- Valider les métriques de performance

### Phase 3 : Production Complète (100% - Jour 5-7)

```bash
# Rollout complet
echo "PLAYWRIGHT_ENABLED_PERCENT=100" >> .env.production
npm run deploy
```

**Production stable :**
- Monitoring 24/7 actif
- Alertes configurées
- On-call prêt

---

## 📈 Monitoring et Alertes

### CloudWatch Dashboards

```bash
# Créer un dashboard personnalisé
aws cloudwatch put-dashboard \
  --dashboard-name HuntazeOnlyFans \
  --dashboard-body file://alerting/cloudwatch-dashboard.json \
  --region us-east-1
```

### Métriques Clés à Surveiller

1. **Performance**
   - P95 Latency : < 300ms
   - P99 Latency : < 500ms
   - Success Rate : > 99.5%
   - Error Rate : < 0.5%

2. **Business**
   - Messages envoyés/jour : ~12,500
   - Taux de conversion : > 95%
   - Rate limit hits : < 2%

3. **Infrastructure**
   - ECS tasks actives : 1-2 concurrent
   - DynamoDB write units : < 10/sec
   - Lambda invocations : ~500/jour
   - Coût total : $25-50/mois

### Alertes PagerDuty

```bash
# Configurer les alertes
kubectl apply -f alerting/onlyfans-alerts.yml
```

---

## 🔧 Troubleshooting

### Problème : CDK Deploy échoue

**Solution :**
```bash
# Vérifier les credentials
aws sts get-caller-identity

# Nettoyer et réessayer
cd infra/cdk
rm -rf node_modules cdk.out
npm install
npm run build
npx cdk deploy --require-approval never
```

### Problème : Lambda timeout

**Solution :**
```bash
# Augmenter le timeout
aws lambda update-function-configuration \
  --function-name huntaze-of-orchestrator \
  --timeout 120 \
  --region us-east-1
```

### Problème : ECS Task ne démarre pas

**Solution :**
```bash
# Vérifier les logs
aws logs tail /aws/ecs/huntaze-of-fargate --follow --region us-east-1

# Vérifier la task definition
aws ecs describe-task-definition \
  --task-definition HuntazeOfStackBrowserWorkerTask \
  --region us-east-1
```

### Problème : Rate limiting trop agressif

**Solution :**
```bash
# Ajuster les limites dans lib/features/flags.ts
# Puis redéployer
npm run deploy
```

---

## 📚 Ressources Utiles

### Documentation AWS
- [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Lambda](https://docs.aws.amazon.com/lambda/)
- [CDK](https://docs.aws.amazon.com/cdk/)

### Monitoring
- [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
- [ECS Console](https://console.aws.amazon.com/ecs/)
- [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)

### Support
- Slack: #huntaze-onlyfans
- Email: support@huntaze.com
- On-call: +1-XXX-XXX-XXXX

---

## ✅ Checklist Finale

Avant de lancer en production :

- [ ] CDK stack déployé avec succès
- [ ] Lambda orchestrator déployé
- [ ] Variables d'environnement configurées
- [ ] Secrets OnlyFans configurés dans AWS Secrets Manager
- [ ] Tests d'intégration passent (> 95%)
- [ ] Tests de charge validés
- [ ] CloudWatch dashboards créés
- [ ] Alertes PagerDuty configurées
- [ ] Documentation à jour
- [ ] Équipe on-call briefée
- [ ] Rollback plan documenté
- [ ] Feature flag à 10% pour beta

---

**🎉 Prêt pour le lancement !**

Une fois tous les éléments cochés, vous êtes prêt à lancer la beta avec 10% des utilisateurs, puis à augmenter progressivement jusqu'à 100%.

**Bonne chance ! 🚀**
