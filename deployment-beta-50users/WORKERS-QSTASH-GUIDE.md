# 🔧 Workers avec Upstash QStash - Guide Complet

**Problème**: ECS Fargate coûte $150-200/mois pour les workers  
**Solution**: Upstash QStash coûte $5-10/mois  
**Économie**: $140-190/mois (93% moins cher)

---

## 🎯 Pourquoi QStash ?

### Comparaison des Solutions

| Solution | Coût/mois | Complexité | Scalabilité | Maintenance |
|----------|-----------|------------|-------------|-------------|
| **ECS Fargate** | $150-200 | Élevée | Excellente | Élevée |
| **EC2 Spot** | $100-150 | Très élevée | Bonne | Très élevée |
| **Lambda** | $50-100 | Moyenne | Bonne | Faible |
| **QStash** ✅ | $5-10 | Faible | Excellente | Très faible |

### Avantages QStash

✅ **Coût ultra-faible**: $0.50 par million de messages  
✅ **Serverless**: Pas de serveurs à gérer  
✅ **Retry automatique**: Jusqu'à 3 tentatives  
✅ **Dead Letter Queue**: Gestion des échecs  
✅ **Scheduling**: Cron jobs intégrés  
✅ **Callbacks**: Webhooks de statut  
✅ **Délais**: Enqueue avec délai  

---

## 📊 Architecture Workers

### Workers Nécessaires

```
1. Video Processing Worker
   ├── Extraction keyframes (FFmpeg)
   ├── Génération composite grid
   ├── Upload S3
   └── Analyse Phi-4 Multimodal

2. Content Trends Worker
   ├── Scraping (Apify)
   ├── Détection tendances
   ├── Analyse viralité
   └── Génération recommandations

3. Data Processing Worker
   ├── Agrégation analytics
   ├── Calcul stats utilisateurs
   ├── Génération rapports
   └── Cleanup données

4. Alert Checker Worker
   ├── Vérification conditions
   ├── Envoi notifications
   └── Logging alertes
```

### Flux avec QStash

```
User Action
    ↓
Vercel API Route
    ↓
Enqueue QStash
    ↓
QStash (async)
    ↓
POST /api/workers/[worker-name]
    ↓
Vercel Background Function
    ↓
Process Job
    ↓
Update Database
    ↓
Callback (optional)
```

---

## 🚀 Implémentation

### 1. Setup Upstash QStash

#### Créer Compte
```bash
# 1. Aller sur https://upstash.com
# 2. Sign Up (gratuit)
# 3. Create QStash
# 4. Sélectionner région: US East (us-east-1)
```

#### Récupérer Credentials
```bash
# Dashboard QStash → Settings
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="qstash_xxx"
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"
QSTASH_NEXT_SIGNING_KEY="sig_xxx"
```

#### Ajouter à .env.production.local
```bash
# Upstash QStash
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="qstash_xxx"
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"
QSTASH_NEXT_SIGNING_KEY="sig_xxx"
```

### 2. Installer SDK

```bash
npm install @upstash/qstash
```

### 3. Créer Client QStash

```typescript
// lib/workers/qstash-client.ts
import { Client } from '@upstash/qstash';

if (!process.env.QSTASH_TOKEN) {
  throw new Error('QSTASH_TOKEN is required');
}

export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

/**
 * Enqueue a job to QStash
 */
export async function enqueueJob<T = any>(
  workerName: string,
  data: T,
  options?: {
    delay?: number; // seconds
    retries?: number; // default: 3
    callback?: string; // webhook URL
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
  const endpoint = `${baseUrl}/api/workers/${workerName}`;

  const result = await qstashClient.publishJSON({
    url: endpoint,
    body: data,
    retries: options?.retries ?? 3,
    delay: options?.delay,
    callback: options?.callback,
  });

  return {
    messageId: result.messageId,
    endpoint,
  };
}

/**
 * Schedule a recurring job (cron)
 */
export async function scheduleJob<T = any>(
  workerName: string,
  cron: string,
  data: T
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
  const endpoint = `${baseUrl}/api/workers/${workerName}`;

  const schedule = await qstashClient.schedules.create({
    destination: endpoint,
    cron,
    body: JSON.stringify(data),
  });

  return schedule;
}
```

### 4. Middleware de Vérification

```typescript
// lib/workers/qstash-middleware.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify QStash signature
 */
export function withQStashAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return verifySignatureAppRouter(handler);
}

/**
 * Alternative: Manual verification
 */
export async function verifyQStashSignature(req: NextRequest): Promise<boolean> {
  const signature = req.headers.get('upstash-signature');
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!signature || !currentKey) {
    return false;
  }

  // Verify with current or next key (for key rotation)
  const body = await req.text();
  const isValid = 
    verifySignature(body, signature, currentKey) ||
    (nextKey && verifySignature(body, signature, nextKey));

  return isValid;
}

function verifySignature(body: string, signature: string, key: string): boolean {
  // Implementation using crypto
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(body);
  const expected = hmac.digest('base64');
  return signature === expected;
}
```

---

## 🎬 Worker 1: Video Processing

### Enqueue Job

```typescript
// app/api/content/upload/route.ts
import { enqueueJob } from '@/lib/workers/qstash-client';

export async function POST(req: Request) {
  // ... upload video to S3 ...

  // Enqueue video processing
  const job = await enqueueJob('video-processing', {
    videoUrl: s3Url,
    videoId: video.id,
    userId: user.id,
    gridLayout: { rows: 3, cols: 3 },
    uploadToBlob: true,
  });

  return NextResponse.json({
    success: true,
    videoId: video.id,
    jobId: job.messageId,
  });
}
```

### Worker Endpoint

```typescript
// app/api/workers/video-processing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withQStashAuth } from '@/lib/workers/qstash-middleware';
import { VideoProcessor } from '@/lib/ai/content-trends/video-processor';
import { prisma } from '@/lib/prisma';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, videoId, userId, gridLayout, uploadToBlob } = body;

    console.log(`Processing video ${videoId} for user ${userId}`);

    // Initialize video processor
    const processor = new VideoProcessor();

    // Process video
    const result = await processor.processVideo(videoUrl, {
      gridLayout,
      uploadToBlob,
      sceneChangeThreshold: 0.3,
    });

    // Update database
    await prisma.contentTask.update({
      where: { id: videoId },
      data: {
        status: 'completed',
        result: {
          keyframes: result.keyframes.length,
          compositeUrl: result.compositeGridUrl,
          processingTime: result.processingTimeMs,
        },
      },
    });

    console.log(`Video ${videoId} processed successfully`);

    return NextResponse.json({
      success: true,
      videoId,
      keyframes: result.keyframes.length,
      compositeUrl: result.compositeGridUrl,
    });

  } catch (error) {
    console.error('Video processing failed:', error);

    // Update database with error
    if (body?.videoId) {
      await prisma.contentTask.update({
        where: { id: body.videoId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    // Return error (QStash will retry)
    return NextResponse.json(
      { error: 'Video processing failed' },
      { status: 500 }
    );
  }
}

// Export with QStash auth
export const POST = withQStashAuth(handler);
```

---

## 📈 Worker 2: Content Trends

### Enqueue Job

```typescript
// app/api/ai/content-trends/scrape/route.ts
import { enqueueJob } from '@/lib/workers/qstash-client';

export async function POST(req: Request) {
  const { platform, keywords } = await req.json();

  // Enqueue scraping job
  const job = await enqueueJob('content-trends', {
    platform,
    keywords,
    userId: user.id,
  });

  return NextResponse.json({
    success: true,
    jobId: job.messageId,
  });
}
```

### Worker Endpoint

```typescript
// app/api/workers/content-trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withQStashAuth } from '@/lib/workers/qstash-middleware';
import { ApifyClient } from '@/lib/ai/content-trends/apify/apify-client';
import { TrendDetector } from '@/lib/ai/content-trends/trend-detection/trend-detector';

async function handler(req: NextRequest) {
  try {
    const { platform, keywords, userId } = await req.json();

    console.log(`Scraping ${platform} for keywords: ${keywords}`);

    // Scrape content
    const apifyClient = new ApifyClient();
    const content = await apifyClient.scrapeContent(platform, keywords);

    // Detect trends
    const trendDetector = new TrendDetector();
    const trends = await trendDetector.detectTrends(content);

    // Save to database
    await prisma.contentTrend.createMany({
      data: trends.map(trend => ({
        platform,
        userId,
        ...trend,
      })),
    });

    console.log(`Found ${trends.length} trends for ${platform}`);

    return NextResponse.json({
      success: true,
      trendsCount: trends.length,
    });

  } catch (error) {
    console.error('Content trends scraping failed:', error);
    return NextResponse.json(
      { error: 'Scraping failed' },
      { status: 500 }
    );
  }
}

export const POST = withQStashAuth(handler);
```

---

## 📊 Worker 3: Data Processing

### Enqueue Job

```typescript
// Triggered by cron or manual
import { enqueueJob } from '@/lib/workers/qstash-client';

// Daily aggregation
await enqueueJob('data-processing', {
  action: 'aggregate-analytics',
  date: new Date().toISOString(),
});
```

### Worker Endpoint

```typescript
// app/api/workers/data-processing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withQStashAuth } from '@/lib/workers/qstash-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req: NextRequest) {
  try {
    const { action, date } = await req.json();

    console.log(`Data processing: ${action} for ${date}`);

    switch (action) {
      case 'aggregate-analytics':
        await aggregateAnalytics(date);
        break;

      case 'calculate-user-stats':
        await calculateUserStats(date);
        break;

      case 'cleanup-old-data':
        await cleanupOldData(date);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Data processing failed:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

async function aggregateAnalytics(date: string) {
  // Aggregate daily analytics
  const stats = await prisma.message.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 86400000),
      },
    },
    _count: true,
  });

  // Save aggregated stats
  await prisma.dailyStats.createMany({
    data: stats.map(stat => ({
      userId: stat.userId,
      date: new Date(date),
      messageCount: stat._count,
    })),
  });
}

async function calculateUserStats(date: string) {
  // Calculate user statistics
  // ...
}

async function cleanupOldData(date: string) {
  // Cleanup old data (> 90 days)
  const cutoffDate = new Date(new Date(date).getTime() - 90 * 86400000);

  await prisma.message.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      archived: true,
    },
  });
}

export const POST = withQStashAuth(handler);
```

---

## 🔔 Worker 4: Alert Checker

### Schedule Cron Job

```typescript
// scripts/setup-qstash-schedules.ts
import { scheduleJob } from '@/lib/workers/qstash-client';

// Check alerts every 5 minutes
await scheduleJob(
  'alert-checker',
  '*/5 * * * *', // Every 5 minutes
  { action: 'check-alerts' }
);
```

### Worker Endpoint

```typescript
// app/api/workers/alert-checker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withQStashAuth } from '@/lib/workers/qstash-middleware';
import { alertService } from '@/lib/services/alertService';

async function handler(req: NextRequest) {
  try {
    console.log('Checking alerts...');

    // Check all alert conditions
    const newAlerts = alertService.checkAlerts();

    if (newAlerts.length > 0) {
      console.log(`Triggered ${newAlerts.length} new alerts`);

      // Send notifications
      for (const alert of newAlerts) {
        await sendNotification(alert);
      }
    }

    return NextResponse.json({
      success: true,
      newAlerts: newAlerts.length,
    });

  } catch (error) {
    console.error('Alert checking failed:', error);
    return NextResponse.json(
      { error: 'Alert checking failed' },
      { status: 500 }
    );
  }
}

async function sendNotification(alert: any) {
  // Send email, Slack, etc.
  console.log(`Sending notification for alert: ${alert.name}`);
}

export const POST = withQStashAuth(handler);
```

---

## 🎯 Cron Jobs avec QStash

### Setup Schedules

```typescript
// scripts/setup-qstash-schedules.ts
import { scheduleJob } from '@/lib/workers/qstash-client';

async function setupSchedules() {
  // Alert checker - Every 5 minutes
  await scheduleJob(
    'alert-checker',
    '*/5 * * * *',
    { action: 'check-alerts' }
  );

  // Data aggregation - Daily at 2 AM
  await scheduleJob(
    'data-processing',
    '0 2 * * *',
    { action: 'aggregate-analytics' }
  );

  // Cleanup old data - Weekly on Sunday at 3 AM
  await scheduleJob(
    'data-processing',
    '0 3 * * 0',
    { action: 'cleanup-old-data' }
  );

  // Content trends - Every 6 hours
  await scheduleJob(
    'content-trends',
    '0 */6 * * *',
    { action: 'scrape-trends' }
  );

  console.log('QStash schedules created successfully');
}

setupSchedules();
```

### Run Setup

```bash
npx tsx scripts/setup-qstash-schedules.ts
```

---

## 📊 Monitoring

### QStash Dashboard

```
https://console.upstash.com/qstash

Metrics:
├── Messages sent
├── Messages delivered
├── Messages failed
├── Retry attempts
└── Dead letter queue
```

### CloudWatch Logs

```typescript
// lib/workers/logger.ts
import { logger } from '@/lib/utils/logger';

export function logWorkerStart(workerName: string, jobId: string) {
  logger.info(`Worker ${workerName} started`, { jobId });
}

export function logWorkerSuccess(workerName: string, jobId: string, duration: number) {
  logger.info(`Worker ${workerName} completed`, { jobId, duration });
}

export function logWorkerError(workerName: string, jobId: string, error: Error) {
  logger.error(`Worker ${workerName} failed`, error, { jobId });
}
```

---

## 💰 Coût Détaillé

### Calcul pour 50 Users

```
Video Processing:
├── 3,000 videos/mois
├── 3,000 messages QStash
└── $0.50/million = $0.0015

Content Trends:
├── 4 scrapes/jour × 30 jours = 120 scrapes/mois
├── 120 messages QStash
└── $0.50/million = $0.00006

Data Processing:
├── 1 aggregation/jour × 30 jours = 30/mois
├── 30 messages QStash
└── $0.50/million = $0.000015

Alert Checker:
├── 12 checks/heure × 24h × 30 jours = 8,640/mois
├── 8,640 messages QStash
└── $0.50/million = $0.00432

TOTAL: $0.0059/mois (arrondi à $5-10 avec marge)
```

### Comparaison

| Solution | Coût/mois | Économie |
|----------|-----------|----------|
| ECS Fargate | $150-200 | - |
| EC2 Spot | $100-150 | 25-33% |
| Lambda | $50-100 | 50-66% |
| **QStash** | **$5-10** | **93-97%** ✅ |

---

## ✅ Checklist Déploiement

### 1. Setup Upstash
- [ ] Créer compte Upstash
- [ ] Créer QStash (région US East)
- [ ] Copier credentials
- [ ] Ajouter à .env.production.local

### 2. Code
- [ ] Installer @upstash/qstash
- [ ] Créer qstash-client.ts
- [ ] Créer qstash-middleware.ts
- [ ] Créer workers endpoints

### 3. Workers
- [ ] Video processing worker
- [ ] Content trends worker
- [ ] Data processing worker
- [ ] Alert checker worker

### 4. Cron Jobs
- [ ] Setup schedules script
- [ ] Run setup script
- [ ] Vérifier dans dashboard

### 5. Monitoring
- [ ] CloudWatch logs
- [ ] QStash dashboard
- [ ] Alertes erreurs

---

## 🆘 Troubleshooting

### Worker ne se déclenche pas

```bash
# Vérifier signature
curl -X POST https://app.huntaze.com/api/workers/video-processing \
  -H "Content-Type: application/json" \
  -H "Upstash-Signature: xxx" \
  -d '{"test": true}'

# Vérifier logs Vercel
vercel logs --follow
```

### Messages en Dead Letter Queue

```typescript
// Récupérer DLQ messages
const dlq = await qstashClient.dlq.listMessages();

// Retry un message
await qstashClient.dlq.retryMessage(messageId);

// Delete un message
await qstashClient.dlq.deleteMessage(messageId);
```

### Coût trop élevé

```bash
# Vérifier usage
curl https://qstash.upstash.io/v2/usage \
  -H "Authorization: Bearer $QSTASH_TOKEN"

# Optimiser:
# - Réduire retry attempts
# - Augmenter delay entre retries
# - Batch processing
```

---

**Économie totale**: $140-190/mois (93% moins cher que ECS Fargate)  
**Complexité**: Très faible  
**Maintenance**: Quasi-nulle  

✅ **Solution recommandée pour beta 50 users**
