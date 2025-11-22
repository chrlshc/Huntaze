# Déploiement AI System sur AWS

## Architecture AWS

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud                             │
│                                                          │
│  ┌────────────────────┐      ┌──────────────────────┐  │
│  │  AWS Amplify       │      │  ElastiCache Redis   │  │
│  │  (Next.js App)     │◄────►│  huntaze-redis-prod  │  │
│  │                    │      │  Port: 6379          │  │
│  └────────────────────┘      └──────────────────────┘  │
│           │                                              │
│           ▼                                              │
│  ┌────────────────────┐      ┌──────────────────────┐  │
│  │  RDS PostgreSQL    │      │  CloudWatch          │  │
│  │  huntaze-postgres  │      │  Logs & Metrics      │  │
│  └────────────────────┘      └──────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Ressources AWS Existantes

### ✅ ElastiCache Redis
- **Cluster ID**: huntaze-redis-production
- **Endpoint**: huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
- **Port**: 6379
- **Engine**: Redis 7.1.0
- **Type**: cache.t3.micro
- **AZ**: us-east-1f

### ✅ RDS PostgreSQL
- **Endpoint**: huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: postgres

### ✅ S3 Bucket
- **Bucket**: huntaze-beta-assets
- **Region**: us-east-1

## Configuration Réseau

### VPC et Security Groups

Pour que l'application puisse communiquer avec ElastiCache:

1. **Vérifier le VPC d'ElastiCache**:
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --show-cache-node-info \
  --region us-east-1 \
  --query 'CacheClusters[0].CacheSubnetGroupName'
```

2. **Vérifier les Security Groups**:
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1 \
  --query 'CacheClusters[0].SecurityGroups'
```

3. **Autoriser le trafic depuis Amplify**:
   - Identifier le security group d'ElastiCache
   - Ajouter une règle inbound pour le port 6379
   - Source: Security group de votre application Amplify

### Commande pour mettre à jour le Security Group

```bash
# Récupérer le security group ID d'ElastiCache
SG_ID=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1 \
  --query 'CacheClusters[0].SecurityGroups[0].SecurityGroupId' \
  --output text)

# Ajouter une règle pour autoriser le trafic depuis votre app
# Remplacez SOURCE_SG_ID par le security group de votre application
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 6379 \
  --source-group SOURCE_SG_ID \
  --region us-east-1
```

## Variables d'Environnement

### Dans AWS Amplify Console

Ajoutez ces variables dans: **App Settings > Environment variables**

```bash
# Database
DATABASE_URL=postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/postgres

# Redis
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379

# AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash-exp

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=huntaze-beta-assets

# NextAuth
NEXTAUTH_URL=https://your-app.amplifyapp.com
NEXTAUTH_SECRET=your-secret-here
```

## Tests de Connectivité

### 1. Tester depuis votre machine locale (avec VPN/Bastion)

```bash
# Exporter les credentials AWS
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Tester la connexion Redis
npm run ts-node scripts/test-elasticache-connection.ts
```

### 2. Tester depuis Amplify

Créez un endpoint de test dans votre app:

```typescript
// app/api/test-redis/route.ts
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

export async function GET() {
  const redis = new Redis({
    host: process.env.ELASTICACHE_REDIS_HOST!,
    port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
  });

  try {
    const pong = await redis.ping();
    await redis.quit();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Redis connection successful',
      pong 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Puis visitez: `https://your-app.amplifyapp.com/api/test-redis`

## Déploiement

### 1. Commit et Push

```bash
git add .
git commit -m "feat: migrate rate limiting to AWS ElastiCache"
git push origin main
```

### 2. Amplify Build

Amplify détectera automatiquement le push et lancera un build.

### 3. Vérifier les Logs

Dans Amplify Console:
- **Build logs**: Vérifier que le build réussit
- **CloudWatch logs**: Vérifier les logs de l'application

## Monitoring

### CloudWatch Metrics

Créez des métriques personnalisées pour:
- Nombre de requêtes rate-limitées
- Latence des appels Redis
- Anomalies détectées

### Alarmes CloudWatch

```bash
# Créer une alarme pour les rate limits dépassés
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-ai-rate-limit-exceeded \
  --alarm-description "Alert when rate limits are frequently exceeded" \
  --metric-name RateLimitExceeded \
  --namespace Huntaze/AI \
  --statistic Sum \
  --period 300 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region us-east-1
```

## Troubleshooting

### Erreur: "Connection timeout"

**Cause**: L'application ne peut pas atteindre ElastiCache

**Solutions**:
1. Vérifier que l'app est dans le même VPC
2. Vérifier les security groups
3. Vérifier les route tables du VPC

### Erreur: "ECONNREFUSED"

**Cause**: Redis refuse la connexion

**Solutions**:
1. Vérifier que le port 6379 est ouvert
2. Vérifier l'endpoint ElastiCache
3. Vérifier que le cluster est "available"

### Erreur: "Authentication failed"

**Cause**: ElastiCache a AUTH activé

**Solution**: Ajouter le password dans la configuration:
```typescript
const redis = new Redis({
  host: process.env.ELASTICACHE_REDIS_HOST!,
  port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
  password: process.env.ELASTICACHE_REDIS_PASSWORD, // Si AUTH activé
});
```

## Coûts

### ElastiCache Redis (cache.t3.micro)
- **Prix**: ~$0.017/heure = ~$12.24/mois
- **Déjà provisionné**: ✅

### Trafic Redis
- Gratuit dans le même VPC
- Pas de frais de transfert de données

### Total Additionnel
- **$0/mois** (ressources déjà provisionnées)

## Sécurité

### Best Practices

1. **Encryption in Transit**: Activer TLS pour ElastiCache
2. **Encryption at Rest**: Activer le chiffrement des données
3. **AUTH**: Activer l'authentification Redis
4. **Network Isolation**: Garder ElastiCache dans un subnet privé
5. **Security Groups**: Principe du moindre privilège

### Activer AUTH sur ElastiCache

```bash
# Créer un nouveau parameter group avec AUTH
aws elasticache create-cache-parameter-group \
  --cache-parameter-group-name huntaze-redis-auth \
  --cache-parameter-group-family redis7 \
  --description "Redis with AUTH enabled"

# Modifier le parameter pour activer AUTH
aws elasticache modify-cache-parameter-group \
  --cache-parameter-group-name huntaze-redis-auth \
  --parameter-name-values "ParameterName=requirepass,ParameterValue=YOUR_STRONG_PASSWORD"
```

## Prochaines Étapes

1. ✅ Code migré vers ElastiCache
2. ⏳ Configurer les security groups
3. ⏳ Déployer sur Amplify
4. ⏳ Tester la connectivité
5. ⏳ Activer le monitoring
6. ⏳ Configurer les alarmes
