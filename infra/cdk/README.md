# Huntaze OnlyFans - AWS CDK Infrastructure

Infrastructure as Code pour l'intégration OnlyFans avec ECS Fargate + Playwright.

## 📋 Vue d'Ensemble

Ce stack CDK déploie l'infrastructure complète nécessaire pour exécuter des tâches Playwright dans des conteneurs ECS Fargate isolés.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC                                 │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Public Subnet   │         │  Private Subnet  │         │
│  │                  │         │                  │         │
│  │  NAT Gateway     │────────▶│  ECS Tasks       │         │
│  │                  │         │  (Playwright)    │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   DynamoDB Tables     │
        │  - Sessions           │
        │  - Threads            │
        │  - Messages           │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   KMS Key             │
        │  (Encryption)         │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   CloudWatch Logs     │
        │  (Monitoring)         │
        └───────────────────────┘
```

## 🚀 Déploiement Rapide

```bash
# Installer les dépendances
npm install

# Build le stack
npm run build

# Bootstrap CDK (première fois seulement)
npx cdk bootstrap aws://ACCOUNT_ID/REGION

# Déployer
npm run deploy
```

## 📦 Ressources Créées

### 1. VPC et Networking
- **VPC** : Réseau isolé avec CIDR 10.0.0.0/16
- **Subnets** : 2 publics + 2 privés (multi-AZ)
- **NAT Gateway** : Pour accès internet depuis subnets privés
- **Internet Gateway** : Pour subnets publics
- **Route Tables** : Configuration du routage

### 2. ECS Fargate
- **Cluster** : `huntaze-of-fargate`
- **Task Definition** : 
  - Image : `mcr.microsoft.com/playwright:v1.56.0-jammy`
  - CPU : 1024 (1 vCPU)
  - Memory : 2048 MB (2 GB)
  - Networking : awsvpc mode
- **Security Group** : Règles de sécurité pour les tasks

### 3. DynamoDB Tables

#### Sessions Table
```typescript
{
  partitionKey: 'userId',
  sortKey: 'sessionId',
  billingMode: PAY_PER_REQUEST,
  encryption: AWS_MANAGED,
  pointInTimeRecovery: true
}
```

#### Threads Table
```typescript
{
  partitionKey: 'userId',
  sortKey: 'threadId',
  billingMode: PAY_PER_REQUEST,
  encryption: AWS_MANAGED,
  pointInTimeRecovery: true
}
```

#### Messages Table
```typescript
{
  partitionKey: 'taskId',
  billingMode: PAY_PER_REQUEST,
  encryption: AWS_MANAGED,
  pointInTimeRecovery: true,
  ttl: 'expiresAt' // 7 jours
}
```

### 4. KMS
- **Key** : Clé de chiffrement pour les données sensibles
- **Alias** : `alias/huntaze-of-encryption`
- **Rotation** : Activée (automatique tous les ans)

### 5. CloudWatch
- **Log Group** : `/aws/ecs/huntaze-of-fargate`
- **Retention** : 30 jours
- **Métriques** : Automatiques pour ECS et DynamoDB

### 6. IAM Roles

#### Task Execution Role
Permissions pour :
- Récupérer l'image Docker
- Écrire dans CloudWatch Logs
- Accéder aux secrets

#### Task Role
Permissions pour :
- Lire/écrire dans DynamoDB
- Utiliser la clé KMS
- Accéder aux secrets OnlyFans

## 🔧 Configuration

### Variables d'Environnement

```bash
# Account et région
export CDK_DEFAULT_ACCOUNT=317805897534
export CDK_DEFAULT_REGION=us-east-1

# Environment
export ENVIRONMENT=production
```

### Personnalisation

Modifier `lib/huntaze-of-stack.ts` pour ajuster :
- Taille des tasks ECS (CPU/Memory)
- Configuration VPC (CIDR, nombre de subnets)
- Capacité DynamoDB
- Rétention des logs

## 📊 Outputs

Après déploiement, le stack expose ces outputs :

```typescript
{
  ECSClusterArn: string,           // ARN du cluster ECS
  TaskDefinitionArn: string,       // ARN de la task definition
  SessionsTableName: string,       // Nom de la table Sessions
  ThreadsTableName: string,        // Nom de la table Threads
  MessagesTableName: string,       // Nom de la table Messages
  KMSKeyId: string,                // ID de la clé KMS
  VPCId: string,                   // ID du VPC
  PrivateSubnetIds: string[],      // IDs des subnets privés
  SecurityGroupId: string          // ID du security group
}
```

Récupérer les outputs :

```bash
aws cloudformation describe-stacks \
  --stack-name HuntazeOnlyFansStack \
  --query 'Stacks[0].Outputs'
```

## 🧪 Tests

```bash
# Lancer les tests unitaires
npm test

# Synthétiser le stack (vérifier la génération CloudFormation)
npm run synth

# Voir les différences avant déploiement
npm run diff
```

## 💰 Coûts Estimés

### Par Mois (50 utilisateurs, 250 messages/jour chacun)

| Service | Usage | Coût |
|---------|-------|------|
| ECS Fargate | ~1-2 tasks concurrent, 30s/task | $15-20 |
| DynamoDB | ~375k writes, ~750k reads | $5-8 |
| NAT Gateway | ~100 MB/jour | $3-5 |
| CloudWatch Logs | ~1 GB/mois | $1-2 |
| KMS | ~10k requests | $1 |
| **Total** | | **$25-36/mois** |

### Optimisations de Coûts

1. **ECS Fargate Spot** : Réduction de 70% (non recommandé pour prod)
2. **DynamoDB On-Demand** : Déjà optimal pour ce volume
3. **CloudWatch Logs** : Réduire la rétention à 7 jours
4. **NAT Gateway** : Utiliser VPC Endpoints pour DynamoDB (économie $3-5)

## 🔒 Sécurité

### Best Practices Implémentées

- ✅ **Encryption at rest** : DynamoDB + KMS
- ✅ **Encryption in transit** : TLS pour toutes les communications
- ✅ **Least privilege** : IAM roles avec permissions minimales
- ✅ **Network isolation** : Tasks dans subnets privés
- ✅ **Secrets management** : AWS Secrets Manager
- ✅ **Audit logging** : CloudWatch Logs
- ✅ **Key rotation** : KMS automatique

### Recommandations Additionnelles

1. Activer AWS GuardDuty pour détection de menaces
2. Configurer AWS Config pour compliance
3. Utiliser AWS WAF si exposition publique
4. Activer VPC Flow Logs pour audit réseau

## 📈 Monitoring

### Métriques CloudWatch

```bash
# CPU Utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=huntaze-of-fargate \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average

# DynamoDB Consumed Capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=HuntazeOfSessions \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Alarmes Recommandées

1. **ECS Task Failed** : > 5 échecs en 5 minutes
2. **DynamoDB Throttling** : > 10 throttles en 1 minute
3. **Lambda Errors** : > 5% error rate
4. **High Latency** : P95 > 500ms

## 🔄 Mise à Jour

```bash
# Mettre à jour le code
git pull

# Rebuild
npm run build

# Voir les changements
npm run diff

# Déployer les changements
npm run deploy
```

## 🗑️ Suppression

```bash
# Supprimer le stack (ATTENTION : irréversible)
npm run destroy

# Ou via AWS CLI
aws cloudformation delete-stack \
  --stack-name HuntazeOnlyFansStack \
  --region us-east-1
```

**⚠️ Attention** : Cela supprimera toutes les ressources, y compris les données DynamoDB !

## 📚 Ressources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [ECS Fargate Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Playwright Documentation](https://playwright.dev/)

## 🆘 Support

- **Issues** : Ouvrir un ticket sur GitHub
- **Slack** : #huntaze-infrastructure
- **Email** : devops@huntaze.com

---

**Maintenu par l'équipe Huntaze DevOps** 🚀
