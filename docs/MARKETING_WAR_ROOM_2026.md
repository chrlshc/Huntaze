# Marketing War Room 2026 - API-First Architecture

**Design simple et robuste - Aucun scraping, 100% APIs officielles**

## Vue d'ensemble

Le Marketing War Room est un système de publication multi-plateforme qui respecte les APIs officielles de TikTok et Instagram. Aucun scraping, aucune automation grise.

### Architecture

```
Content Calendar → Job Queue → Multi-Platform Publishing
     (DB)           (BullMQ)      (TikTok + Instagram APIs)
```

**Composants principaux:**
1. **Content Calendar** (`content_items`) - Source of truth pour les posts planifiés
2. **Job Queue** (`publish_jobs`) - Queue durable avec idempotency
3. **Workers** - Executent les jobs avec retries exponentiels
4. **API Routes** - Backend Next.js pour le dashboard temps réel

## Flux de publication

### 1. Content Calendar (Source de vérité)

Table `content_items`:
- `id` - UUID unique
- `asset_id` - Référence vers ta vidéo master (S3/R2)
- `caption` - Texte du post
- `hashtags` - Array de hashtags
- `schedule_at` - Date/heure de publication
- `targets` - `{ tiktok: {...}, instagram: {...} }`
- `status` - `scheduled | in_progress | completed | failed | paused`

### 2. Scheduler

Le scheduler tourne périodiquement (cron ou interval) et:
1. Trouve les `content_items` où `schedule_at <= now`
2. Crée une `platform_publication` pour chaque plateforme cible
3. Enqueue un job idempotent par plateforme

```typescript
import { scheduleDueContent } from '@/lib/marketing-war-room';

// Run every minute
setInterval(() => {
  scheduleDueContent().catch(console.error);
}, 60000);
```

### 3. Workers

Les workers consomment les jobs de la queue avec:
- **Idempotency** - Même job ne s'exécute jamais deux fois
- **Retries** - Backoff exponentiel (max 8 tentatives)
- **Event logging** - Timeline pour le UI temps réel

```typescript
import { startWorker } from '@/lib/marketing-war-room';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
startWorker(redis);
```

### 4. Publishing

#### TikTok Direct Post

**Flow:**
1. `POST /v2/post/publish/init/` → Initialize upload
2. Upload video to TikTok servers
3. `POST /v2/post/publish/status/fetch/` → Poll status
4. Obtenir `video_id` quand status = `PUBLISH_COMPLETE`

**Prérequis:**
- App approuvée avec scope `video.publish`
- Authorization utilisateur OAuth 2.0
- Endpoint: `https://open.tiktokapis.com`

**Documentation:**
- [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)

#### Instagram Reels

**Flow:**
1. `POST /{ig-user-id}/media` → Create container (`media_type=REELS`)
2. `GET /{container-id}?fields=status_code` → Poll until `FINISHED`
3. `POST /{ig-user-id}/media_publish` → Publish container

**Prérequis:**
- Facebook App avec Instagram Graph API
- Scope: `instagram_content_publish`
- Access token pour IG User
- `video_url` doit être publiquement accessible

**Documentation:**
- [Instagram Graph API - Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)

## Base de données

### Tables principales

**social_accounts** - Comptes TikTok/Instagram connectés
```sql
id, user_id, platform, external_id, display_name, page_id
```

**oauth_tokens** - Tokens OAuth (à chiffrer!)
```sql
id, social_account_id, access_token, refresh_token, expires_at
```

**content_assets** - Vidéos master stockées (S3/R2)
```sql
id, owner_user_id, storage_url, checksum_sha256, duration_sec
```

**content_items** - Content calendar
```sql
id, asset_id, caption, hashtags, schedule_at, targets, status
```

**platform_publications** - Status par plateforme
```sql
id, content_item_id, platform, status, remote_media_id, posted_at
```

**publish_jobs** - Queue durable
```sql
id, kind, platform_publication_id, status, attempts, idempotency_key
```

**job_events** - Timeline pour UI temps réel
```sql
id, job_id, level, message, payload, at
```

**automations** - Feature flags
```sql
key, enabled, label, description, compliance
```

### Migration

```bash
psql -d your_database -f migrations/002_marketing_war_room_schema.sql
```

## API Routes

### GET /api/marketing-war-room/state

Retourne l'état complet du dashboard:
```json
{
  "queue": [...],
  "automations": {...},
  "health": {...},
  "trends": [...]
}
```

### POST /api/marketing-war-room/automations/:key

Toggle un feature flag:
```json
{ "enabled": true }
```

### GET /api/marketing-war-room/events

Server-Sent Events pour mises à jour temps réel.

**Types d'événements:**
- `STATE_PATCH` - Mise à jour partielle
- `QUEUE_UPDATED` - Array queue complet
- `HEALTH_UPDATED` - Status santé

## Dashboard React

### Composants

**Content Queue** - Timeline verticale avec statuts temps réel
- Scheduled → Uploading → Processing → Posted
- Steps par plateforme (TikTok, Instagram)
- Gestion des erreurs

**Bot Control Center** - Feature flags server-side
- Instagram Welcome DM (compliant)
- TikTok Warmup (cadence checks)
- Auto-Reposter (multi-platform)

**Account Health** - Jauges de santé
- Tokens valides
- Rate limits
- Taux d'échec 24h
- Cadence publishing

**Trend Radar** - Suggestions curées (pas de scraping)
- Alimenté par analytics internes
- Notes équipe
- TikTok Creative Center (manuel)

## Compliance & Best Practices

### ✅ Autorisé (API-only)

1. **Publishing via APIs officielles**
   - TikTok Content Posting API
   - Instagram Graph API

2. **DM Instagram (compliant)**
   - Messenger API for Instagram
   - Opt-in requis
   - Fenêtre 24h standard
   - Private replies aux commentaires

3. **Warmup "safe"**
   - Rampe de cadence progressive
   - Checks techniques (tokens, quotas)
   - Quality gates (format, durée, bitrate)

4. **Trend tracking (sans scraping)**
   - Tes propres analytics
   - TikTok Creative Center (manuel)
   - Curation équipe

### ❌ Interdit (risque de ban)

1. **Scraping**
   - Pas d'auto-scroll TikTok Discover
   - Pas d'extraction de trends par parsing
   - Pas de contournement APIs

2. **DM blast**
   - Pas de mass DM aux nouveaux followers
   - Pas de DM hors fenêtre 24h

3. **Automation grise**
   - Pas de bots de like/follow
   - Pas de faux engagement

## Sécurité

### Tokens

**⚠️ CRITIQUE: Chiffrer les tokens au repos**

```typescript
// Option 1: Encryption côté app
import { encrypt, decrypt } from '@/lib/crypto';

const encryptedToken = encrypt(accessToken, process.env.ENCRYPTION_KEY);
await db.query(`
  INSERT INTO oauth_tokens (social_account_id, access_token)
  VALUES ($1, $2)
`, [accountId, encryptedToken]);

// Option 2: AWS KMS
import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms';
```

### Token refresh

```typescript
async function getValidAccessToken(accountId: string) {
  const token = await db.query(`
    SELECT * FROM oauth_tokens 
    WHERE social_account_id = $1
  `, [accountId]);

  // Refresh si expire dans < 5 minutes
  if (token.expires_at < new Date(Date.now() + 5 * 60_000)) {
    return await refreshToken(token);
  }

  return token;
}
```

### Rate limiting

```typescript
// BullMQ limiter
const worker = new Worker('PUBLISH', processJob, {
  connection: redis,
  limiter: {
    max: 10,        // 10 jobs max
    duration: 1000, // par seconde
  },
});
```

## Déploiement

### Variables d'environnement

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (pour BullMQ)
REDIS_URL=redis://localhost:6379

# Storage
S3_BUCKET=your-bucket
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=REDACTED
AWS_SECRET_ACCESS_KEY=REDACTED

# Encryption
ENCRYPTION_KEY=your-32-byte-key

# TikTok API
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=yyy

# Instagram/Facebook API
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=yyy
```

### Serveur worker

```typescript
// worker.ts
import { startWorker, startScheduler } from '@/lib/marketing-war-room';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Start worker
startWorker(redis);

// Start scheduler
startScheduler(60000); // Every 60 seconds

console.log('Marketing War Room worker started');
```

```bash
# Production
pm2 start worker.ts --name marketing-worker
pm2 logs marketing-worker
```

### Alternative sans Redis (poll-based)

```typescript
import { startPollWorker, startScheduler } from '@/lib/marketing-war-room';

// Poll database every 5 seconds
startPollWorker(5000);

// Schedule jobs every minute
startScheduler(60000);
```

## Monitoring

### Métriques à surveiller

1. **Queue depth** - `SELECT COUNT(*) FROM publish_jobs WHERE status IN ('queued', 'retrying')`
2. **Error rate** - `SELECT COUNT(*) FROM publish_jobs WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'`
3. **Publishing latency** - `posted_at - schedule_at`
4. **Token expiry** - `SELECT COUNT(*) FROM oauth_tokens WHERE expires_at < NOW() + INTERVAL '1 day'`

### Alertes

```typescript
// Alert si queue > 100
if (queueDepth > 100) {
  await sendAlert('Queue depth critical', { queueDepth });
}

// Alert si error rate > 5%
const errorRate = failedJobs / totalJobs;
if (errorRate > 0.05) {
  await sendAlert('Error rate high', { errorRate });
}
```

## Tests

### Test du scheduler

```typescript
import { scheduleDueContent } from '@/lib/marketing-war-room';

test('schedules due content', async () => {
  // Insert test content_item
  const item = await db.insertContentItem({
    schedule_at: new Date(Date.now() - 1000),
    targets: { tiktok: {}, instagram: {} },
  });

  // Run scheduler
  const jobsCreated = await scheduleDueContent();

  expect(jobsCreated).toBe(2); // 1 job per platform
});
```

### Test du publisher

```typescript
import { publishInstagramReel } from '@/lib/marketing-war-room';

test('publishes to Instagram', async () => {
  const ctx = {
    platformPublicationId: 'test-pub-id',
    jobId: 'test-job-id',
  };

  await publishInstagramReel(ctx);

  const pub = await db.getPlatformPublication(ctx.platformPublicationId);
  expect(pub.status).toBe('posted');
  expect(pub.remote_media_id).toBeTruthy();
});
```

## Roadmap 2026

### Q1
- [ ] Auto-reposter multi-platform (TikTok + Reels)
- [ ] Health checks automatiques
- [ ] Dashboard analytics enrichi

### Q2
- [ ] YouTube Shorts support
- [ ] X (Twitter) video support
- [ ] A/B testing de captions

### Q3
- [ ] AI-powered caption generation
- [ ] Smart scheduling (optimal posting times)
- [ ] Cross-platform analytics

### Q4
- [ ] Advanced trend radar
- [ ] Team collaboration features
- [ ] White-label solution

## Support

**Questions?** Crée une issue dans le repo.

**Bugs?** Vérifie d'abord:
1. Les tokens sont valides
2. Les quotas API ne sont pas dépassés
3. Les logs du worker (`pm2 logs`)
4. La table `job_events` pour détails

**API Changes?** Surveille:
- [TikTok Developer Blog](https://developers.tiktok.com/blog)
- [Instagram Platform Changelog](https://developers.facebook.com/docs/instagram-platform/changelog)

---

**🔒 Rappel:** Ce système est conçu pour être 100% compliant avec les TOS des plateformes. Aucun scraping, aucune automation grise. Uniquement des APIs officielles.
