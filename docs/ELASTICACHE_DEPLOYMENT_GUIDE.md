# Guide de Déploiement ElastiCache Redis

## 🎯 Objectif

Connecter votre application Amplify à ElastiCache Redis pour le rate limiting AI.

## 📊 Infrastructure Actuelle

### ElastiCache Redis
- **Cluster ID**: `huntaze-redis-production`
- **Endpoint**: `huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379`
- **Type**: cache.t3.micro
- **Engine**: Redis 7.1.0
- **Status**: ✅ Available
- **VPC**: `vpc-033be7e71ec9548d2`
- **Subnets**: 
  - `subnet-0e48ea131e6267bea` (us-east-1f)
  - `subnet-003088e522e36eaa8` (us-east-1e)

### RDS PostgreSQL
- **Instance**: `huntaze-postgres-production`
- **VPC**: `vpc-033be7e71ec9548d2` ✅ (même VPC)
- **Security Group**: `sg-0b7cd6003e324a3bc`

## ⚠️ Point Critique: Configuration Réseau

ElastiCache Redis est dans un VPC privé. Pour que votre application Amplify puisse s'y connecter, vous avez **2 options**:

### Option 1: VPC Access (Recommandé pour Production)

Configurer Amplify pour accéder au VPC privé.

**Avantages:**
- ✅ Sécurité maximale
- ✅ Latence minimale
- ✅ Pas d'exposition publique

**Inconvénients:**
- ⚠️ Configuration plus complexe
- ⚠️ Coûts additionnels (NAT Gateway)

### Option 2: Redis Proxy Public (Plus Simple)

Créer un proxy public qui redirige vers ElastiCache.

**Avantages:**
- ✅ Configuration simple
- ✅ Fonctionne immédiatement avec Amplify

**Inconvénients:**
- ⚠️ Latence légèrement plus élevée
- ⚠️ Nécessite un proxy (Lambda ou EC2)

## 🚀 Déploiement Recommandé: Option 1 (VPC Access)

### Étape 1: Vérifier le Security Group d'ElastiCache

```bash
# Obtenir le security group d'ElastiCache
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1 \
  --query 'CacheClusters[0].SecurityGroups[*].SecurityGroupId' \
  --output text
```

### Étape 2: Créer un Security Group pour Amplify

```bash
# Créer un security group pour Amplify
aws ec2 create-security-group \
  --group-name huntaze-amplify-sg \
  --description "Security group for Amplify to access ElastiCache" \
  --vpc-id vpc-033be7e71ec9548d2 \
  --region us-east-1
```

### Étape 3: Autoriser Amplify à Accéder à Redis

```bash
# Obtenir l'ID du security group ElastiCache
REDIS_SG=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1 \
  --query 'CacheClusters[0].SecurityGroups[0].SecurityGroupId' \
  --output text)

# Obtenir l'ID du security group Amplify (créé à l'étape 2)
AMPLIFY_SG="<ID_DU_SG_AMPLIFY>"

# Autoriser le trafic depuis Amplify vers Redis
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --source-group $AMPLIFY_SG \
  --region us-east-1
```

### Étape 4: Configurer Amplify pour Utiliser le VPC

Dans la console Amplify:

1. Aller dans **App settings** > **Environment variables**
2. Ajouter les variables:
   ```
   ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
   ELASTICACHE_REDIS_PORT=6379
   ```

3. Aller dans **App settings** > **VPC**
4. Activer **VPC access**
5. Sélectionner:
   - VPC: `vpc-033be7e71ec9548d2`
   - Subnets: `subnet-0e48ea131e6267bea`, `subnet-003088e522e36eaa8`
   - Security Group: Le SG créé à l'étape 2

### Étape 5: Redéployer l'Application

```bash
git add .
git commit -m "feat: configure ElastiCache Redis connection"
git push origin main
```

## 🧪 Tests de Connectivité

### Test 1: Créer un Endpoint de Test

Créez `app/api/test-redis/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

export async function GET() {
  try {
    const redis = new Redis({
      host: process.env.ELASTICACHE_REDIS_HOST!,
      port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
      connectTimeout: 5000,
    });

    // Test PING
    const pong = await redis.ping();
    
    // Test SET/GET
    await redis.set('test:connection', 'success', 'EX', 60);
    const value = await redis.get('test:connection');
    
    await redis.quit();

    return NextResponse.json({
      success: true,
      ping: pong,
      testValue: value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### Test 2: Appeler l'Endpoint

Après le déploiement:

```bash
curl https://votre-app.amplifyapp.com/api/test-redis
```

Résultat attendu:
```json
{
  "success": true,
  "ping": "PONG",
  "testValue": "success",
  "timestamp": "2025-01-21T..."
}
```

## 🔍 Troubleshooting

### Erreur: "Connection timeout"

**Cause**: Le security group ne permet pas la connexion.

**Solution**:
```bash
# Vérifier les règles du security group Redis
aws ec2 describe-security-groups \
  --group-ids $REDIS_SG \
  --region us-east-1
```

### Erreur: "ENOTFOUND"

**Cause**: Le DNS ne résout pas l'endpoint ElastiCache.

**Solution**: Vérifier que l'application est bien dans le VPC.

### Erreur: "Authentication required"

**Cause**: ElastiCache a l'authentification activée.

**Solution**:
```bash
# Vérifier si AUTH est requis
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1 \
  --query 'CacheClusters[0].AuthTokenEnabled'
```

Si `true`, ajouter le token dans le code:
```typescript
const redis = new Redis({
  host: process.env.ELASTICACHE_REDIS_HOST!,
  port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
  password: process.env.ELASTICACHE_REDIS_AUTH_TOKEN,
});
```

## 📊 Monitoring

### CloudWatch Metrics

Surveillez ces métriques dans CloudWatch:

1. **CPUUtilization** - Utilisation CPU du cluster
2. **NetworkBytesIn/Out** - Trafic réseau
3. **CurrConnections** - Connexions actives
4. **CacheHits/Misses** - Performance du cache
5. **Evictions** - Évictions de clés

### Logs d'Application

Ajoutez des logs dans votre code:

```typescript
redis.on('connect', () => {
  console.log('[Redis] Connected to ElastiCache');
});

redis.on('error', (error) => {
  console.error('[Redis] Connection error:', error);
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});
```

## 🎯 Checklist de Déploiement

- [ ] Security Group créé pour Amplify
- [ ] Règle d'ingress ajoutée au SG Redis
- [ ] Variables d'environnement configurées dans Amplify
- [ ] VPC access activé dans Amplify
- [ ] Application redéployée
- [ ] Endpoint de test créé
- [ ] Test de connectivité réussi
- [ ] Monitoring CloudWatch configuré
- [ ] Logs d'application vérifiés

## 💰 Coûts Estimés

- **ElastiCache t3.micro**: ~$12/mois (déjà provisionné)
- **NAT Gateway** (si nécessaire): ~$32/mois
- **Data Transfer**: Variable selon l'usage

**Total estimé**: $44/mois (si NAT Gateway requis)

## 🔄 Rollback

Si vous rencontrez des problèmes:

1. Désactiver VPC access dans Amplify
2. Supprimer les variables ELASTICACHE_*
3. L'application utilisera le fallback (pas de rate limiting)

## 📚 Ressources

- [AWS ElastiCache Documentation](https://docs.aws.amazon.com/elasticache/)
- [Amplify VPC Access](https://docs.aws.amazon.com/amplify/latest/userguide/vpc-access.html)
- [ioredis Documentation](https://github.com/redis/ioredis)

## ✅ Prochaines Étapes

Une fois la connexion établie:

1. Tester le rate limiting AI
2. Configurer les alertes CloudWatch
3. Optimiser les paramètres Redis si nécessaire
4. Documenter les procédures opérationnelles
