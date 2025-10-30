# 🚀 Huntaze OnlyFans - Quick Start

**Déploiement en 5 minutes** ⏱️

---

## ⚡ Déploiement Ultra-Rapide

### Option 1 : Script Automatique (Recommandé)

```bash
# 1. Configurer AWS credentials
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# 2. Lancer le déploiement automatique
./scripts/deploy-onlyfans.sh
```

**C'est tout ! ✅**

Le script va :
- ✅ Installer toutes les dépendances
- ✅ Déployer le stack CDK
- ✅ Déployer le Lambda
- ✅ Créer le fichier `.env.production`
- ✅ Lancer les tests

**Durée** : 10-15 minutes

---

## 🔧 Option 2 : Déploiement Manuel

### Étape 1 : CDK (5 min)

```bash
cd infra/cdk
npm install
npm run build
npx cdk bootstrap aws://317805897534/us-east-1
npx cdk deploy HuntazeOnlyFansStack --require-approval never
```

### Étape 2 : Lambda (3 min)

```bash
cd ../lambda/orchestrator
npm install
npm run build
npm run package
aws lambda create-function \
  --function-name huntaze-of-orchestrator \
  --runtime nodejs18.x \
  --role arn:aws:iam::317805897534:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512
```

### Étape 3 : Tests (2 min)

```bash
cd ../../..
npm test -- tests/integration/playwright-ecs.integration.test.ts
```

---

## 📊 Vérification

```bash
# Vérifier le stack CDK
aws cloudformation describe-stacks --stack-name HuntazeOnlyFansStack

# Vérifier le Lambda
aws lambda get-function --function-name huntaze-of-orchestrator

# Vérifier les tables DynamoDB
aws dynamodb list-tables

# Vérifier l'ECS cluster
aws ecs describe-clusters --clusters huntaze-of-fargate
```

---

## 🎯 Rollout Progressif

### Beta (10%)

```bash
export PLAYWRIGHT_ENABLED_PERCENT=10
npm run deploy
```

### Expansion (50%)

```bash
export PLAYWRIGHT_ENABLED_PERCENT=50
npm run deploy
```

### Production (100%)

```bash
export PLAYWRIGHT_ENABLED_PERCENT=100
npm run deploy
```

---

## 📈 Monitoring

```bash
# Logs en temps réel
aws logs tail /aws/ecs/huntaze-of-fargate --follow

# Métriques CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=huntaze-of-fargate \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## 🆘 Problèmes ?

### CDK échoue

```bash
cd infra/cdk
rm -rf node_modules cdk.out
npm install
npm run build
npx cdk deploy
```

### Lambda timeout

```bash
aws lambda update-function-configuration \
  --function-name huntaze-of-orchestrator \
  --timeout 120
```

### ECS Task ne démarre pas

```bash
aws logs tail /aws/ecs/huntaze-of-fargate --follow
```

---

## 📚 Documentation Complète

- **Guide Complet** : `docs/DEPLOYMENT_GUIDE.md`
- **Architecture** : `docs/ONLYFANS_AWS_DEPLOYMENT.md`
- **Production** : `docs/ONLYFANS_PRODUCTION_READINESS.md`
- **CDK** : `infra/cdk/README.md`

---

## ✅ Checklist

- [ ] AWS credentials configurés
- [ ] Script de déploiement lancé
- [ ] Stack CDK déployé
- [ ] Lambda déployé
- [ ] Tests passent
- [ ] Beta lancée (10%)

---

**🎉 Prêt en 10 minutes !**

*Questions ? Slack: #huntaze-onlyfans*
