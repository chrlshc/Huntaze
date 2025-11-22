# Migration Upstash → AWS ElastiCache Redis

## ✅ Migration Complétée

Le système de rate limiting AI a été migré de Upstash Redis vers AWS ElastiCache Redis.

## Changements Effectués

### 1. Code Principal (`lib/ai/rate-limit.ts`)

**Avant** (Upstash):
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const rateLimiters = {
  starter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
  }),
  // ...
};
```

**Après** (ElastiCache):
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.ELASTICACHE_REDIS_HOST,
  port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
});

// Implémentation manuelle du sliding window avec Redis sorted sets
async function slidingWindowRateLimit(key, limit, windowMs) {
  // Utilise ZADD, ZREMRANGEBYSCORE, ZCARD pour le sliding window
}
```

### 2. Tests

Tous les tests ont été mis à jour pour utiliser `ioredis` au lieu de `@upstash/redis`:

- ✅ `tests/unit/ai/rate-limit-enforcement.property.test.ts`
- ✅ `tests/unit/ai/rate-limit-plan-based.property.test.ts`
- ✅ `tests/unit/ai/rate-limit-reset.property.test.ts`

### 3. Variables d'Environnement

**Avant**:
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Après**:
```bash
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379
```

### 4. Documentation

- ✅ `lib/ai/RATE_LIMIT_SETUP.md` - Mis à jour pour ElastiCache
- ✅ `lib/ai/AWS_DEPLOYMENT.md` - Nouveau guide de déploiement AWS
- ✅ `lib/ai/REDIS_OPTIONS.md` - Comparaison Upstash vs ElastiCache
- ✅ `.env.example` - Variables mises à jour
- ✅ `.env.test` - Variables mises à jour

## Avantages de la Migration

### ✅ Déjà Provisionné
- ElastiCache Redis existe déjà dans votre compte AWS
- Pas de coûts supplémentaires
- Pas de nouveau service à gérer

### ✅ Intégration AWS Native
- Même VPC que votre application
- Latence ultra-faible
- Sécurité via Security Groups

### ✅ Contrôle Total
- Accès complet à la configuration Redis
- Monitoring via CloudWatch
- Backups automatiques

## Implémentation Technique

### Sliding Window Algorithm

L'algorithme de sliding window est implémenté avec Redis Sorted Sets:

```typescript
// 1. Supprimer les entrées hors de la fenêtre
ZREMRANGEBYSCORE key 0 (now - windowMs)

// 2. Compter les entrées dans la fenêtre
ZCARD key

// 3. Ajouter la requête actuelle
ZADD key now "unique-id"

// 4. Définir l'expiration
EXPIRE key (windowMs / 1000)
```

Cette approche garantit:
- ✅ Précision du sliding window
- ✅ Atomicité via Redis pipeline
- ✅ Nettoyage automatique via EXPIRE
- ✅ Performance O(log N) pour toutes les opérations

### Anomaly Detection

Détection d'anomalies avec compteurs Redis:

```typescript
// Incrémenter le compteur
INCR ai:anomaly:{creatorId}

// Définir l'expiration (5 minutes)
EXPIRE ai:anomaly:{creatorId} 300

// Si compteur > 2× limite du plan → Logger l'anomalie
```

## Compatibilité

### Interface Identique

L'API publique reste **100% identique**:

```typescript
// Même signature qu'avant
await checkCreatorRateLimit(creatorId, 'pro');

// Même erreur qu'avant
catch (error) {
  if (error instanceof RateLimitError) {
    // error.retryAfter, error.limit, error.remaining
  }
}
```

### Pas de Breaking Changes

Aucun code utilisant le rate limiting n'a besoin d'être modifié.

## Prochaines Étapes

### 1. Configuration Réseau ⏳

Vérifier que votre application Amplify peut atteindre ElastiCache:

```bash
# Vérifier le security group
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-redis-production \
  --region us-east-1
```

### 2. Variables d'Environnement ⏳

Ajouter dans Amplify Console:
```bash
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379
```

### 3. Déploiement ⏳

```bash
git add .
git commit -m "feat: migrate AI rate limiting to AWS ElastiCache"
git push origin main
```

### 4. Tests de Connectivité ⏳

Créer un endpoint de test:
```typescript
// app/api/test-redis/route.ts
export async function GET() {
  const redis = new Redis({
    host: process.env.ELASTICACHE_REDIS_HOST!,
    port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
  });
  
  const pong = await redis.ping();
  return NextResponse.json({ success: true, pong });
}
```

### 5. Monitoring ⏳

Configurer CloudWatch pour surveiller:
- Latence Redis
- Taux de rate limiting
- Anomalies détectées

## Rollback (si nécessaire)

Si vous devez revenir à Upstash:

1. Restaurer les anciennes variables d'environnement
2. Restaurer le code depuis Git:
```bash
git revert HEAD
```

3. Réinstaller les dépendances Upstash:
```bash
npm install @upstash/redis @upstash/ratelimit
```

## Support

Pour toute question:
1. Consulter `lib/ai/AWS_DEPLOYMENT.md` pour le troubleshooting
2. Vérifier les logs CloudWatch
3. Tester la connectivité avec `scripts/test-elasticache-connection.ts`

## Résumé

✅ **Code migré** - Utilise maintenant ioredis + ElastiCache  
✅ **Tests mis à jour** - Tous les tests property-based fonctionnent  
✅ **Documentation complète** - Guides de déploiement et troubleshooting  
✅ **Pas de breaking changes** - API publique identique  
✅ **Prêt pour production** - Nécessite seulement la configuration réseau  

**Coût additionnel**: $0 (ressources déjà provisionnées)
