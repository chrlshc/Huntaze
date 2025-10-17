# Huntaze Production Deployment Guide

Ce guide détaille le déploiement complet de l'authentification Huntaze en production avec AWS Cognito.

## 📋 Pré-requis

- AWS CLI configuré avec les permissions nécessaires
- Node.js 18+ installé
- Domaine vérifié dans SES
- Accès aux secrets (Vercel/GitHub Actions)

## 🚀 Déploiement Cognito (15 min)

### 1. Déployer le stack CloudFormation

```bash
# Variables à configurer
export AWS_REGION="eu-west-1"
export STACK_NAME="huntaze-auth-prod"
export DOMAIN_NAME="app.huntaze.com"

# Déploiement
aws cloudformation deploy \
  --region $AWS_REGION \
  --stack-name $STACK_NAME \
  --template-file infrastructure/cognito.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment=prod \
    DomainName=$DOMAIN_NAME \
    PasswordMinLength=14 \
    MfaConfiguration=OPTIONAL
```

### 2. Récupérer les outputs

```bash
# User Pool ID
export USER_POOL_ID=$(aws cloudformation describe-stacks \
  --region $AWS_REGION \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

# Client ID
export CLIENT_ID=$(aws cloudformation describe-stacks \
  --region $AWS_REGION \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

# Domain
export COGNITO_DOMAIN=$(aws cloudformation describe-stacks \
  --region $AWS_REGION \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomain`].OutputValue' \
  --output text)

echo "USER_POOL_ID: $USER_POOL_ID"
echo "CLIENT_ID: $CLIENT_ID"
echo "COGNITO_DOMAIN: $COGNITO_DOMAIN"
```

## 📧 Configuration SES (10 min)

### 1. Vérifier le domaine

```bash
# Vérifier le statut du domaine
aws ses get-identity-verification-attributes \
  --region $AWS_REGION \
  --identities $DOMAIN_NAME

# Si non vérifié, initier la vérification
aws ses verify-domain-identity \
  --region $AWS_REGION \
  --domain $DOMAIN_NAME
```

### 2. Configurer DKIM

```bash
# Activer DKIM
aws ses put-identity-dkim-attributes \
  --region $AWS_REGION \
  --identity $DOMAIN_NAME \
  --dkim-enabled

# Récupérer les enregistrements DKIM à ajouter dans votre DNS
aws ses get-identity-dkim-attributes \
  --region $AWS_REGION \
  --identities $DOMAIN_NAME
```

### 3. Sortir du sandbox

```bash
# Créer la demande (via console AWS recommandé)
# Ou utiliser le support AWS CLI
aws support create-case \
  --subject "SES Sandbox Removal Request" \
  --service-code "amazon-ses" \
  --category-code "service-limit-increase" \
  --communication-body "Production use case: Transactional authentication emails for Huntaze platform"
```

## 🔐 Variables d'environnement

### 1. Générer JWT_SECRET

```bash
# Générer un secret fort
export JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_SECRET"
```

### 2. Configurer Vercel

```bash
# Ajouter les variables
vercel env add NEXT_PUBLIC_AWS_REGION production
vercel env add NEXT_PUBLIC_USER_POOL_ID production  
vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID production
vercel env add JWT_SECRET production

# Optionnel
vercel env add SENTRY_DSN production
vercel env add HEALTH_CHECK_TOKEN production
```

### 3. Configurer GitHub Actions

Ajouter dans Settings → Secrets and variables → Actions :
- `JWT_SECRET`
- `AWS_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

## ✅ Validation Pre-Production

### 1. Exécuter le script de validation

```bash
# En local
export BASE_URL=http://localhost:3000
./scripts/pre-prod-validation.sh

# En staging
export BASE_URL=https://staging.huntaze.com
./scripts/pre-prod-validation.sh
```

### 2. Tests manuels essentiels

1. **Signup** → Email reçu → Confirmation OK ✓
2. **Login** → Redirection dashboard ✓
3. **Session** → Refresh page → Session persiste ✓
4. **Logout** → Cookies purgés ✓
5. **Forgot Password** → Email reçu → Reset OK ✓
6. **Rate Limiting** → 6 tentatives = bloqué ✓
7. **Delete Account** → Compte supprimé ✓

### 3. Vérifier la sécurité

```bash
# Headers de sécurité
curl -I https://app.huntaze.com | grep -E "Strict-Transport|X-Frame|Content-Security"

# Test CSP
# Vérifier la console du navigateur pour les violations CSP
# Si OK, passer de Content-Security-Policy-Report-Only à Content-Security-Policy
```

## 🚨 Monitoring & Alertes

### 1. CloudWatch Alarms

```bash
# Créer une alarme pour les échecs d'authentification
aws cloudwatch put-metric-alarm \
  --alarm-name "Huntaze-Auth-Failures" \
  --alarm-description "High authentication failure rate" \
  --metric-name UserAuthenticationFailures \
  --namespace AWS/Cognito \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### 2. Sentry (si utilisé)

```javascript
// Vérifier l'intégration
Sentry.captureMessage("Deployment test", "info");
```

## 📝 Checklist Finale

- [ ] **Cognito**
  - [ ] User Pool déployé
  - [ ] Client configuré
  - [ ] Domaine personnalisé (optionnel)
  - [ ] Callbacks prod & staging

- [ ] **SES**
  - [ ] Domaine vérifié
  - [ ] DKIM configuré
  - [ ] Hors sandbox
  - [ ] Templates email (optionnel)

- [ ] **Sécurité**
  - [ ] JWT_SECRET roté et sécurisé
  - [ ] CSP en mode strict
  - [ ] HTTPS forcé
  - [ ] Headers de sécurité actifs

- [ ] **Tests**
  - [ ] Validation script ✓
  - [ ] E2E Playwright ✓
  - [ ] Tests manuels ✓
  - [ ] Monitoring actif

- [ ] **GDPR**
  - [ ] Delete account fonctionnel
  - [ ] Privacy policy accessible
  - [ ] Data retention configurée

## 🔧 Commandes Utiles

```bash
# Vérifier le User Pool
aws cognito-idp describe-user-pool \
  --region $AWS_REGION \
  --user-pool-id $USER_POOL_ID

# Lister les utilisateurs
aws cognito-idp list-users \
  --region $AWS_REGION \
  --user-pool-id $USER_POOL_ID

# Forcer la rotation du JWT_SECRET
vercel env rm JWT_SECRET production
vercel env add JWT_SECRET production

# Rollback CloudFormation si nécessaire
aws cloudformation cancel-update-stack \
  --region $AWS_REGION \
  --stack-name $STACK_NAME
```

## 🆘 Troubleshooting

### "Invalid JWT issuer"
- Vérifier `NEXT_PUBLIC_AWS_REGION` et `NEXT_PUBLIC_USER_POOL_ID`
- L'issuer doit être : `https://cognito-idp.{region}.amazonaws.com/{poolId}`

### "SES emails not received"
- Vérifier le statut de vérification du domaine
- Consulter les métriques SES dans CloudWatch
- Vérifier les bounces/complaints

### "Rate limiting trop strict"
- Ajuster dans `/lib/rate-limit.ts`
- Considérer Redis pour la production

### "CSP violations"
- Commencer avec `Content-Security-Policy-Report-Only`
- Analyser les violations
- Ajuster la policy dans `next.config.mjs`

## 🎉 Go Live!

Une fois tous les checks passés :

1. Déployer en production : `vercel --prod`
2. Exécuter validation finale : `BASE_URL=https://app.huntaze.com ./scripts/pre-prod-validation.sh`
3. Monitorer les premières heures
4. Célébrer ! 🚀

---

Pour toute question : support@huntaze.com