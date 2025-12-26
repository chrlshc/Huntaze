# Upstash QStash - Guide de Configuration
**Date**: 2025-12-22  
**Coût**: $0.50/million messages (~$2-5/mois pour beta)

---

## 🎯 Qu'est-ce que QStash ?

QStash est une **queue serverless** pour gérer les workers asynchrones sans infrastructure.

**Avantages**:
- ✅ Pas de serveurs à gérer
- ✅ Retry automatique (jusqu'à 3 fois)
- ✅ Dead Letter Queue (DLQ)
- ✅ Webhooks sécurisés (signature HMAC)
- ✅ Pay-per-use ($0.50/million messages)

**Cas d'usage Huntaze**:
- Video processing (> 5 min)
- Content trends scraping
- Batch operations
- Heavy AI analysis

---

## 🚀 Étape 1: Créer un Compte (5 min)

### 1.1 Inscription

1. Aller sur https://upstash.com
2. Cliquer "Sign Up"
3. Choisir "Continue with GitHub" ou email
4. Vérifier email

### 1.2 Créer un QStash

1. Dans le dashboard, cliquer "QStash"
2. Cliquer "Create QStash"
3. Sélectionner région: **US East (N. Virginia)**
4. Cliquer "Create"

### 1.3 Récupérer les Credentials

1. Dans QStash dashboard, aller dans "Settings"
2. Copier:
   - **QSTASH_TOKEN** (pour publier des messages)
   - **QSTASH_CURRENT_SIGNING_KEY** (pour vérifier signatures)
   - **QSTASH_NEXT_SIGNING_KEY** (pour rotation)

3. Ajouter à `.env.production.local`:

```bash
QSTASH_TOKEN="qstash_xxx"
QSTASH_CURRENT_SIGNING_KEY="sig_xxx"
QSTASH_NEXT_SIGNING_KEY="sig_xxx"
```

---

## 📦 Étape 2: Installer le Package (2 min)

```bash
cd ~/huntaze
npm install @upstash/qstash
```

---

## 🔧 Étape 3: Créer un Worker (10 min)

### 3.1 Worker Video Processing

Créer `app/api/workers/video-processing/route.ts`:

```typescript
import { verifySignature } from '@upstash/qstash/nextjs';
import { VideoProcessor } from '@/lib/ai/content-trends/video-processor';

async function handler(req: Request) {
  const { videoUrl, userId } = await req.json();
  
  console.log(`[Worker] Processing video for user ${userId}: ${videoUrl}`);
  
  try {
    // 1. Process video
    const processor = new VideoProcessor();
    const result = await processor.processVideo(videoUrl);
    
    // 2. Save to database
    await prisma.contentTask.update({
      where: { id: videoUrl },
      data: {
        status: 'POSTED',
        analysis: result,
      },
    });
    
    console.log(`[Worker] Video processed: ${result.keyframes.length} keyframes`);
    
    return Response.json({ 
      success: true,
      keyframes: result.keyframes.length,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (error) {
    console.error('[Worker] Video processing failed:', error);
    
    // Return 500 to trigger retry
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Verify QStash signature
export const POST = verifySignature(handler);

// Allow up to 5 minutes
export const maxDuration = 300;
```

### 3.2 Dispatcher (Enqueue Jobs)

Créer `lib/workers/video-queue.ts`:

```typescript
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function enqueueVideoProcessing(
  videoUrl: string,
  userId: string
) {
  const messageId = await qstash.publishJSON({
    url: 'https://app.huntaze.com/api/workers/video-processing',
    body: { videoUrl, userId },
    retries: 3,
    delay: 0, // Immediate
  });
  
  console.log(`[Queue] Video enqueued: ${messageId}`);
  
  return messageId;
}
```

### 3.3 Utiliser dans l'API

Modifier `app/api/content/upload/route.ts`:

```typescript
import { enqueueVideoProcessing } from '@/lib/workers/video-queue';

export async function POST(req: Request) {
  const { file, userId } = await req.json();
  
  // 1. Upload to S3
  const videoUrl = await uploadToS3(file);
  
  // 2. Create task in database
  const task = await prisma.contentTask.create({
    data: {
      userId,
      platform: 'TIKTOK',
      status: 'PENDING',
      sourceType: 'URL',
      sourceUrl: videoUrl,
    },
  });
  
  // 3. Enqueue for processing (async)
  await enqueueVideoProcessing(videoUrl, userId);
  
  return Response.json({
    taskId: task.id,
    status: 'queued',
    message: 'Video queued for processing',
  });
}
```

---

## 🔍 Étape 4: Monitoring (5 min)

### 4.1 Dashboard QStash

1. Aller sur https://console.upstash.com/qstash
2. Voir tous les messages:
   - **Pending**: En attente
   - **Delivered**: Livrés avec succès
   - **Failed**: Échoués (après 3 retries)
   - **Dead Letter Queue**: Messages définitivement échoués

### 4.2 Retry Failed Messages

1. Dans QStash dashboard, aller dans "Messages"
2. Filtrer par "Failed"
3. Cliquer sur un message
4. Cliquer "Retry"

### 4.3 Dead Letter Queue

1. Dans QStash dashboard, aller dans "DLQ"
2. Voir tous les messages échoués
3. Analyser les erreurs
4. Retry manuellement si nécessaire

---

## 📊 Étape 5: Monitoring Avancé (10 min)

### 5.1 Créer API de Status

Créer `app/api/workers/status/route.ts`:

```typescript
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');
  
  if (!messageId) {
    return Response.json({ error: 'messageId required' }, { status: 400 });
  }
  
  try {
    const message = await qstash.messages.get(messageId);
    
    return Response.json({
      messageId: message.messageId,
      state: message.state, // PENDING, DELIVERED, FAILED
      url: message.url,
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt,
      error: message.error,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### 5.2 Utiliser dans le Frontend

```typescript
// components/content/VideoUploadStatus.tsx
export function VideoUploadStatus({ messageId }: { messageId: string }) {
  const [status, setStatus] = useState<'pending' | 'delivered' | 'failed'>('pending');
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/workers/status?messageId=${messageId}`);
      const data = await res.json();
      
      setStatus(data.state.toLowerCase());
      
      if (data.state !== 'PENDING') {
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [messageId]);
  
  return (
    <div>
      {status === 'pending' && <Spinner />}
      {status === 'delivered' && <CheckIcon />}
      {status === 'failed' && <ErrorIcon />}
    </div>
  );
}
```

---

## 🔒 Sécurité

### Vérifier les Signatures

QStash signe tous les webhooks avec HMAC-SHA256. Le package `@upstash/qstash` vérifie automatiquement les signatures avec `verifySignature()`.

**Ne jamais** accepter de requêtes non signées:

```typescript
// ❌ MAUVAIS (pas de vérification)
export async function POST(req: Request) {
  // N'importe qui peut appeler cette API
}

// ✅ BON (avec vérification)
export const POST = verifySignature(handler);
```

---

## 💰 Coûts

### Pricing

- **$0.50/million messages**
- **Gratuit**: 500 messages/jour (15K/mois)

### Estimation Huntaze Beta

| Scénario | Messages/mois | Coût |
|----------|---------------|------|
| **Light** (10 videos/jour) | 300 | $0 (gratuit) |
| **Medium** (50 videos/jour) | 1,500 | $0 (gratuit) |
| **Heavy** (200 videos/jour) | 6,000 | $0 (gratuit) |
| **Very Heavy** (1000 videos/jour) | 30,000 | $1.50 |

**Conclusion**: Pour la beta, tu resteras dans le tier gratuit (< 15K messages/mois).

---

## 🔧 Troubleshooting

### Worker ne reçoit pas les messages

1. **Vérifier l'URL**:
   ```bash
   curl https://app.huntaze.com/api/workers/video-processing
   ```

2. **Vérifier les logs Vercel**:
   ```bash
   vercel logs --follow
   ```

3. **Vérifier QStash Dashboard**:
   - Aller dans "Messages"
   - Voir les erreurs

### Messages échouent après 3 retries

1. **Analyser l'erreur** dans QStash Dashboard
2. **Augmenter le timeout** dans Vercel:
   ```typescript
   export const maxDuration = 300; // 5 minutes
   ```

3. **Vérifier les variables d'environnement**:
   ```bash
   vercel env ls
   ```

### Signature invalide

1. **Vérifier les signing keys**:
   ```bash
   echo $QSTASH_CURRENT_SIGNING_KEY
   echo $QSTASH_NEXT_SIGNING_KEY
   ```

2. **Re-déployer** avec les bonnes keys:
   ```bash
   vercel env add QSTASH_CURRENT_SIGNING_KEY production
   vercel --prod
   ```

---

## 📚 Ressources

- **Documentation**: https://upstash.com/docs/qstash
- **Dashboard**: https://console.upstash.com/qstash
- **Pricing**: https://upstash.com/pricing/qstash
- **GitHub**: https://github.com/upstash/qstash-js

---

## ✅ Checklist

- [ ] Compte Upstash créé
- [ ] QStash créé (région US East)
- [ ] Credentials copiés dans `.env.production.local`
- [ ] Package `@upstash/qstash` installé
- [ ] Worker video processing créé
- [ ] Dispatcher créé
- [ ] API upload modifiée
- [ ] Tests effectués
- [ ] Monitoring configuré

---

**Guide créé le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Coût**: $0-5/mois (gratuit pour beta)
