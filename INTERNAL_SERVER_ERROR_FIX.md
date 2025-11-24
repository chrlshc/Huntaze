# Fix: Internal Server Error - Production Ready Branch

## Problème Identifié

L'application retournait une **Internal Server Error** sur la branche `production-ready` d'Amplify.

## Causes Racines

### 1. Variables d'environnement manquantes
La branche `production-ready` n'avait pas les variables critiques configurées:
- ❌ `DATABASE_URL` - Connexion PostgreSQL manquante
- ❌ `REDIS_HOST` - Connexion Redis manquante
- ❌ `NEXTAUTH_SECRET` - Secret d'authentification manquant
- ❌ `CSRF_SECRET` - Protection CSRF manquante

### 2. Client Redis incompatible
Le fichier `lib/redis-client.ts` utilisait `@upstash/redis` alors que l'infrastructure utilise **AWS ElastiCache** avec `ioredis`.

```typescript
// ❌ Avant (Upstash uniquement)
import { Redis } from '@upstash/redis';
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// ✅ Après (ElastiCache + Upstash fallback)
import Redis from 'ioredis';
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
```

## Solutions Appliquées

### 1. Configuration des variables d'environnement ✅

```bash
aws amplify update-branch \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --environment-variables '{
    "DATABASE_URL": "postgresql://huntazeadmin:***@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require",
    "REDIS_HOST": "huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com",
    "REDIS_PORT": "6379",
    "NEXTAUTH_SECRET": "***",
    "NEXTAUTH_URL": "https://production-ready.d33l77zi1h78ce.amplifyapp.com",
    "NODE_ENV": "production",
    "AUTH_TRUST_HOST": "true",
    "CSRF_SECRET": "***"
  }'
```

### 2. Mise à jour du client Redis ✅

**Fichier modifié:** `lib/redis-client.ts`

Changements:
- ✅ Support d'AWS ElastiCache avec `ioredis`
- ✅ Configuration via `REDIS_HOST` et `REDIS_PORT`
- ✅ Fallback vers Upstash si ElastiCache non configuré
- ✅ Gestion d'erreurs améliorée avec retry strategy
- ✅ Vérification du statut de connexion

```typescript
// Configuration ElastiCache
redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});
```

### 3. Déclenchement d'un nouveau build ✅

```bash
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-type RELEASE
```

**Job ID:** 22  
**Status:** RUNNING

## Vérification

### Variables configurées
```bash
✅ DATABASE_URL - PostgreSQL RDS encrypted
✅ REDIS_HOST - ElastiCache endpoint
✅ REDIS_PORT - 6379
✅ NEXTAUTH_SECRET - Auth secret
✅ NEXTAUTH_URL - App URL
✅ CSRF_SECRET - CSRF protection
✅ NODE_ENV - production
✅ AUTH_TRUST_HOST - true
```

### Ressources AWS vérifiées
```bash
✅ RDS: huntaze-postgres-production-encrypted (PostgreSQL 17.4)
✅ ElastiCache: huntaze-redis-production (Redis 7.1.0)
✅ Amplify App: d33l77zi1h78ce
✅ Branch: production-ready
```

## Scripts Créés

### 1. `scripts/check-amplify-deployment.sh`
Script pour vérifier rapidement l'état du déploiement:
```bash
./scripts/check-amplify-deployment.sh
```

### 2. `scripts/push-env-to-amplify.sh`
Script pour pousser les variables d'environnement depuis `.env.production`:
```bash
./scripts/push-env-to-amplify.sh
```

## Prochaines Étapes

1. ⏳ Attendre la fin du build (Job #22)
2. 🧪 Tester l'URL: https://production-ready.d33l77zi1h78ce.amplifyapp.com
3. 📊 Vérifier les logs CloudWatch si nécessaire
4. ✅ Confirmer que l'erreur est résolue

## Commits

1. **d5f42a284** - feat: add production environment setup files
2. **96b18e8ea** - fix: update Redis client to support AWS ElastiCache with ioredis

## Notes Importantes

- ⚠️ Les credentials temporaires AWS expirent après quelques heures
- 🔐 Les secrets ne sont jamais committés dans Git
- 📝 La documentation complète est dans `docs/ENVIRONMENT_VARIABLES.md`
- 🔄 Le client Redis supporte maintenant ElastiCache ET Upstash

## Résolution Estimée

**Temps total:** ~10 minutes (build Amplify)  
**Status:** En cours de déploiement
