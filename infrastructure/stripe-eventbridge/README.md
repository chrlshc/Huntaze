# 🏗️ Huntaze Stripe EventBridge Infrastructure

Infrastructure AWS CDK pour l'intégration Stripe EventBridge de Huntaze, permettant de traiter les événements Stripe de manière scalable et résiliente.

## 📋 Vue d'ensemble

Cette infrastructure déploie :

- **EventBridge Partner Bus** : Intégration avec Stripe Event Destinations
- **Lambda Functions** : Traitement des événements de paiement et billing
- **SQS FIFO Queues** : File d'audit et DLQ pour la résilience
- **CloudWatch Monitoring** : Alarmes et dashboard pour l'observabilité
- **Archive EventBridge** : Capacité de replay des événements

## 🚀 Déploiement

### Prérequis

1. **AWS CLI** configuré avec les bonnes permissions
2. **Node.js 18+** installé
3. **Stripe Event Destination** configuré vers Amazon EventBridge

### Installation

```bash
# 1. Installer les dépendances
cd infrastructure/stripe-eventbridge
npm install

# 2. Bootstrap CDK (si première fois)
npx cdk bootstrap

# 3. Configurer Stripe Event Destination
# Dans Stripe Dashboard → Event Destinations → Amazon EventBridge
# Récupérer le "Partner event source name" (ex: aws.partner/stripe.com/123456789012/a1b2c3d4e5f6g7)
```

### Déploiement

```bash
# Déploiement en développement
npx cdk deploy \
  -c stripeEventSourceName="aws.partner/stripe.com/YOUR_ACCOUNT/YOUR_DESTINATION" \
  -c environment="dev"

# Déploiement en production
npx cdk deploy \
  -c stripeEventSourceName="aws.partner/stripe.com/YOUR_ACCOUNT/YOUR_DESTINATION" \
  -c environment="prod" \
  -c createKmsKey="true"
```

### Variables d'environnement

Configurez ces variables avant le déploiement :

```bash
export DATABASE_URL="postgresql://..."
export HUNTAZE_API_URL="https://api.huntaze.com"
export HUNTAZE_API_KEY="your-api-key"
export STRIPE_SECRET_KEY="sk_..."
```

## 🏗️ Architecture

### Composants principaux

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STRIPE        │    │   EVENTBRIDGE   │    │   LAMBDA        │
│   Events        │───►│   Partner Bus   │───►│   Handlers      │
│   Destination   │    │   + Rules       │    │   + DLQ         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   SQS FIFO      │
                       │   Audit Queue   │
                       │   + Archive     │
                       └─────────────────┘
```

### Flux des événements

1. **Stripe** → Event Destination → **EventBridge Partner Bus**
2. **EventBridge Rules** filtrent par type d'événement
3. **Lambda Functions** traitent les événements en temps réel
4. **SQS FIFO** stocke tous les événements pour audit
5. **Archive** permet le replay en cas de besoin

## 📊 Types d'événements traités

### Paiements (Lambda Payments)
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `charge.succeeded`
- `charge.failed`
- `checkout.session.completed`
- `checkout.session.expired`

### Billing/Abonnements (Lambda Billing)
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`
- `customer.created`
- `customer.updated`
- `customer.deleted`

## 🔧 Configuration

### Paramètres CDK

| Paramètre | Description | Défaut |
|-----------|-------------|---------|
| `stripeEventSourceName` | Nom de la partner event source Stripe | **Requis** |
| `environment` | Environnement (dev/prod) | `dev` |
| `createKmsKey` | Créer une clé KMS dédiée | `false` |

### Variables d'environnement Lambda

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de la base de données Huntaze |
| `HUNTAZE_API_URL` | URL de l'API Huntaze |
| `HUNTAZE_API_KEY` | Clé d'API pour authentification |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `POWERTOOLS_LOG_LEVEL` | Niveau de log (INFO/WARN/ERROR) |

## 📈 Monitoring

### Alarmes CloudWatch

- **Failed Invocations** : Échecs d'invocation EventBridge
- **Lambda Errors** : Erreurs dans les fonctions Lambda
- **DLQ Messages** : Messages dans les Dead Letter Queues
- **Queue Backlog** : Backlog dans la file d'audit

### Dashboard

Un dashboard CloudWatch est automatiquement créé avec :
- Métriques d'invocation EventBridge
- Erreurs Lambda
- État des files SQS
- Latence et throughput

### Logs

Les logs sont disponibles dans CloudWatch Logs :
- `/aws/lambda/huntaze-stripe-payments-{env}`
- `/aws/lambda/huntaze-stripe-billing-{env}`
- EventBridge bus logs (si activés)

## 🔄 Gestion des erreurs

### Stratégie de retry

1. **EventBridge** : Retry automatique jusqu'à 24h (~185 tentatives)
2. **Lambda DLQ** : Messages en échec après 3 tentatives
3. **SQS DLQ** : Messages en échec après 5 tentatives

### Idempotence

Les Lambda handlers implémentent l'idempotence basée sur l'ID d'événement Stripe pour éviter les traitements en double.

## 🎯 Replay d'événements

### Utiliser l'archive

```bash
# Lister les archives
aws events list-archives

# Créer un replay
aws events start-replay \
  --replay-name "huntaze-stripe-replay-$(date +%s)" \
  --event-source-arn "arn:aws:events:region:account:event-bus/aws.partner/stripe.com/..." \
  --event-start-time "2024-01-01T00:00:00Z" \
  --event-end-time "2024-01-02T00:00:00Z" \
  --destination '{
    "Arn": "arn:aws:events:region:account:rule/huntaze-stripe-payments-env",
    "RoleArn": "arn:aws:iam::account:role/service-role/EventBridgeRole"
  }'
```

## 🧪 Tests

### Tests locaux

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration
```

### Tests en environnement

1. **Stripe Dashboard** → Événements → Envoyer un événement test
2. Vérifier les logs CloudWatch
3. Contrôler les métriques dans le dashboard

## 🔒 Sécurité

### Chiffrement

- **KMS** : Chiffrement optionnel du bus EventBridge et archives
- **SQS** : Chiffrement en transit et au repos
- **Lambda** : Variables d'environnement chiffrées

### Permissions IAM

Les fonctions Lambda ont des permissions minimales :
- Lecture des secrets AWS Secrets Manager
- Écriture dans CloudWatch Logs
- Accès aux files SQS associées

## 📚 Ressources

- [Stripe Event Destinations](https://stripe.com/docs/webhooks/event-destinations)
- [AWS EventBridge Partner Events](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-saas.html)
- [EventBridge Archive and Replay](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-archive.html)

## 🆘 Dépannage

### Problèmes courants

1. **Partner event source non trouvée**
   - Vérifier le nom exact dans Stripe Dashboard
   - S'assurer que l'Event Destination est active

2. **Lambda timeouts**
   - Augmenter le timeout dans le stack CDK
   - Optimiser le code des handlers

3. **Messages en DLQ**
   - Vérifier les logs Lambda pour les erreurs
   - Contrôler la connectivité à l'API Huntaze

### Support

Pour toute question ou problème :
1. Vérifier les logs CloudWatch
2. Consulter les métriques du dashboard
3. Contacter l'équipe DevOps Huntaze