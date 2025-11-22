# Migration ElastiCache Redis - État Actuel

## ✅ Ce qui est Fait

### 1. Code Migré
- ✅ `lib/ai/rate-limit.ts` utilise maintenant `ioredis`
- ✅ Implémentation du sliding window avec Redis Sorted Sets
- ✅ Détection d'anomalies avec compteurs Redis
- ✅ Interface publique identique (pas de breaking changes)

### 2. Tests Mis à Jour
- ✅ `tests/unit/ai/rate-limit-enforcement.property.test.ts`
- ✅ `tests/unit/ai/rate-limit-plan-based.property.test.ts`
- ✅ `tests/unit/ai/rate-limit-reset.property.test.ts`

### 3. Configuration
- ✅ `.env.example` avec variables ElastiCache
- ✅ `.env.test` avec configuration de test
- ✅ Endpoint de test: `app/api/test-redis/route.ts`

### 4. Documentation
- ✅ `lib/ai/RATE_LIMIT_SETUP.md` - Guide de setup
- ✅ `lib/ai/AWS_DEPLOYMENT.md` - Guide de déploiement AWS
- ✅ `lib/ai/MIGRATION_TO_ELASTICACHE.md` - Documentation de migration
- ✅ `lib/ai/REDIS_OPTIONS.md` - Comparaison des options
- ✅ `docs/ELASTICACHE_DEPLOYMENT_GUIDE.md` - Guide complet de déploiement

### 5. Scripts
- ✅ `scripts/check-elasticache-security.sh` - Vérification security groups
- ✅ `scripts/test-elasticache-connection.ts` - Test de connexion
- ✅ `scripts/verify-elasticache-setup.sh` - Vérification complète

## 📊 Infrastructure AWS Vérifiée

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
- **VPC**: `vpc-033be7e71ec9548d2` ✅ (même VPC que Redis)
- **Security Group**: `sg-0b7cd6003e324a3bc`

## ⏳ Ce qui Reste à Faire

### 1. Configuration Réseau (CRITIQUE)

**Problème**: ElastiCache est dans un VPC privé. Amplify ne peut pas y accéder directement.

**Solutions possibles**:

#### Option A: VPC Access (Recommandé)
Configurer Amplify pour accéder au VPC privé.

**Étapes**:
1. Créer un Security Group pour Amplify
2. Autoriser le trafic depuis Amplify vers Redis (port 6379)
3. Activer VPC access dans Amplify Console
4. Sélectionner le VPC et les subnets

**Avantages**:
- ✅ Sécurité maximale
- ✅ Latence minimale
- ✅ Pas d'exposition publique

**Inconvénients**:
- ⚠️ Configuration plus complexe
- ⚠️ Coûts additionnels (NAT Gateway ~$32/mois)

#### Option B: Redis Proxy Public
Créer un proxy public (Lambda ou EC2) qui redirige vers ElastiCache.

**Avantages**:
- ✅ Configuration simple
- ✅ Fonctionne immédiatement

**Inconvénients**:
- ⚠️ Latence plus élevée
- ⚠️ Coûts additionnels
- ⚠️ Point de défaillance supplémentaire

### 2. Variables d'Environnement Amplify

Ajouter dans Amplify Console > Environment variables:
```bash
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379
```

### 3. Tests de Connectivité

Après configuration réseau:
```bash
# Test local (si VPN vers VPC)
curl http://localhost:3000/api/test-redis

# Test production
curl https://votre-app.amplifyapp.com/api/test-redis
```

Résultat attendu:
```json
{
  "success": true,
  "connection": {
    "host": "huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com",
    "port": "6379",
    "redisVersion": "7.1.0"
  },
  "tests": {
    "ping": { "result": "PONG", "duration": "5ms" },
    "set": { "duration": "3ms" },
    "get": { "value": "success", "duration": "2ms" },
    "delete": { "duration": "2ms" }
  }
}
```

### 4. Monitoring CloudWatch

Configurer des alarmes pour:
- CPUUtilization > 75%
- NetworkBytesIn/Out anomalies
- CurrConnections > 80% de la limite
- Evictions > 0

### 5. Documentation Opérationnelle

Créer des runbooks pour:
- Procédure de rollback
- Gestion des incidents
- Scaling du cluster
- Backup et restore

## 🚀 Plan d'Action Recommandé

### Phase 1: Configuration Réseau (1-2 heures)
1. Exécuter `scripts/verify-elasticache-setup.sh` pour vérifier l'état actuel
2. Créer un Security Group pour Amplify
3. Autoriser le trafic depuis Amplify vers Redis
4. Activer VPC access dans Amplify

### Phase 2: Déploiement (30 minutes)
1. Ajouter les variables d'environnement dans Amplify
2. Déployer l'application
3. Tester avec `/api/test-redis`

### Phase 3: Validation (1 heure)
1. Tester le rate limiting AI
2. Vérifier les logs CloudWatch
3. Valider les métriques

### Phase 4: Monitoring (30 minutes)
1. Configurer les alarmes CloudWatch
2. Tester les alertes
3. Documenter les procédures

## 📝 Commandes Utiles

### Vérifier l'état du cluster
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --show-cache-node-info \
  --region us-east-1
```

### Vérifier les Security Groups
```bash
aws ec2 describe-security-groups \
  --group-ids <REDIS_SG> \
  --region us-east-1
```

### Tester la connexion (depuis un EC2 dans le VPC)
```bash
redis-cli -h huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com -p 6379 PING
```

### Voir les métriques CloudWatch
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=CacheClusterId,Value=huntaze-redis-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

## 💰 Coûts Estimés

- **ElastiCache t3.micro**: ~$12/mois (déjà provisionné ✅)
- **NAT Gateway** (si VPC access): ~$32/mois
- **Data Transfer**: ~$5-10/mois (selon usage)

**Total estimé**: $44-54/mois

**Économies vs Upstash**: 
- Upstash Pro: $80/mois
- **Économie**: ~$26-36/mois

## 🎯 Critères de Succès

- [ ] Application Amplify peut se connecter à ElastiCache
- [ ] `/api/test-redis` retourne `success: true`
- [ ] Rate limiting AI fonctionne correctement
- [ ] Latence < 10ms pour les opérations Redis
- [ ] Aucune erreur dans les logs CloudWatch
- [ ] Métriques CloudWatch normales
- [ ] Tests property-based passent

## 📚 Ressources

- [Guide de déploiement complet](../docs/ELASTICACHE_DEPLOYMENT_GUIDE.md)
- [Documentation AWS ElastiCache](https://docs.aws.amazon.com/elasticache/)
- [Amplify VPC Access](https://docs.aws.amazon.com/amplify/latest/userguide/vpc-access.html)
- [ioredis Documentation](https://github.com/redis/ioredis)

## 🆘 Support

En cas de problème:
1. Consulter `docs/ELASTICACHE_DEPLOYMENT_GUIDE.md` section Troubleshooting
2. Exécuter `scripts/verify-elasticache-setup.sh`
3. Vérifier les logs CloudWatch
4. Tester avec `/api/test-redis`

## ✅ Conclusion

La migration du code est **100% complète**. Il ne reste que la configuration réseau pour permettre à Amplify d'accéder à ElastiCache. Une fois cette étape terminée, le système sera opérationnel sans coûts additionnels significatifs.
