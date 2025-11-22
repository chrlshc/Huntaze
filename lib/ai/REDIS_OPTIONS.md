# Redis Options for AI Rate Limiting

Vous avez deux options pour implémenter le rate limiting AI:

## Option 1: Upstash Redis (Implémentation actuelle - `rate-limit.ts`)

### Avantages
✅ **Serverless** - Pas de gestion d'infrastructure
✅ **Edge-ready** - Fonctionne avec Vercel Edge, Cloudflare Workers, etc.
✅ **API REST** - Pas besoin de connexions persistantes
✅ **Gratuit** - 10,000 commandes/jour gratuites
✅ **Global** - Réplication multi-régions disponible
✅ **Facile à configurer** - 2 variables d'environnement

### Inconvénients
❌ Service externe (pas sur votre AWS)
❌ Coûts après le tier gratuit

### Configuration
1. Créer un compte sur [Upstash Console](https://console.upstash.com/)
2. Créer une base Redis
3. Ajouter à `.env`:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Utilisation
```typescript
import { checkCreatorRateLimit } from './lib/ai/rate-limit';
```

---

## Option 2: AWS ElastiCache Redis (Alternative - `rate-limit-elasticache.ts`)

### Avantages
✅ **Déjà configuré** - Vous avez `huntaze-redis-production`
✅ **Sur votre AWS** - Contrôle total
✅ **Performant** - Latence ultra-faible dans votre VPC
✅ **Pas de coûts supplémentaires** - Déjà payé

### Inconvénients
❌ **VPC only** - Nécessite que votre app soit dans le même VPC
❌ **Connexions persistantes** - Pas idéal pour serverless
❌ **Configuration réseau** - Security groups, subnets, etc.
❌ **Pas edge-ready** - Ne fonctionne pas avec edge functions

### Configuration

#### 1. Installer ioredis
```bash
npm install ioredis
npm install -D @types/ioredis
```

#### 2. Configurer les variables d'environnement
```bash
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379
```

#### 3. Vérifier la configuration réseau
Votre application doit être dans le même VPC que ElastiCache, ou avoir accès via:
- VPC Peering
- AWS PrivateLink
- VPN/Direct Connect

#### 4. Vérifier les Security Groups
Le security group d'ElastiCache doit autoriser le trafic depuis votre application sur le port 6379.

### Utilisation
```typescript
import { checkCreatorRateLimit } from './lib/ai/rate-limit-elasticache';
```

---

## Recommandation

### Pour Production sur AWS (Amplify, EC2, ECS, Lambda dans VPC)
➡️ **Option 2: ElastiCache** - Vous l'avez déjà, autant l'utiliser!

### Pour Serverless Edge (Vercel Edge, Cloudflare Workers)
➡️ **Option 1: Upstash** - Seule option compatible

### Pour Développement Local
➡️ **Option 1: Upstash** - Plus simple à configurer

---

## Migration entre les deux

Les deux implémentations ont la même interface:

```typescript
// Même signature pour les deux
await checkCreatorRateLimit(creatorId, 'pro');
```

Pour changer, il suffit de modifier l'import:

```typescript
// Avant
import { checkCreatorRateLimit } from './lib/ai/rate-limit';

// Après
import { checkCreatorRateLimit } from './lib/ai/rate-limit-elasticache';
```

Ou créer un fichier de configuration:

```typescript
// lib/ai/rate-limit-config.ts
const USE_ELASTICACHE = process.env.USE_ELASTICACHE === 'true';

export const { checkCreatorRateLimit, getRateLimitStatus, RateLimitError } = 
  USE_ELASTICACHE 
    ? require('./rate-limit-elasticache')
    : require('./rate-limit');
```

---

## Tests

### Upstash
Les tests actuels fonctionnent avec Upstash (nécessite credentials valides).

### ElastiCache
Pour tester avec ElastiCache, vous devez:
1. Être dans le même VPC ou avoir accès réseau
2. Mettre à jour les imports dans les tests
3. Configurer les variables d'environnement

---

## Votre Situation Actuelle

Vous avez:
- ✅ ElastiCache Redis: `huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379`
- ✅ AWS credentials configurées
- ❓ Upstash: Non configuré

**Action recommandée:**
1. Si votre app tourne sur AWS Amplify/EC2/ECS → Utilisez ElastiCache
2. Si vous avez besoin d'edge functions → Créez un compte Upstash (gratuit)
3. Pour tester maintenant → Créez un compte Upstash (5 minutes)
