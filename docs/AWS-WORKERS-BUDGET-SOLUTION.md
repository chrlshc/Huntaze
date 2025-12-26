# Huntaze Beta - Solution Workers Budget
**Date**: 2025-12-22  
**Objectif**: Gérer les workers asynchrones sans exploser le budget

---

## 🎯 Problème

Tu as besoin de workers pour :
1. **Video Processing** (analyse vidéo TikTok/Instagram)
2. **Content Trends** (scraping + AI analysis)
3. **Data Processing** (analytics aggregation)
4. **Alert Checker** (monitoring)

**Coût ECS Fargate** : $30-50/mois par worker = **$120-200/mois** ❌ TROP CHER

---

## 💡 Solution Budget : **Vercel Background Functions + Upstash QStash**

### Architecture Optimisée

```
User Upload → S3
         ↓
    Vercel API → QStash (queue)
                     ↓
              Vercel Background Function
                     ↓
              Azure AI Analysis
                     ↓
              Save to PostgreSQL
```

**Coût total** : **$5-15/mois** ✅

---

## 📦 Option 1: Vercel Background Functions (Recommandé)

### Qu'est-ce que c'est ?
- Fonctions serverless qui tournent **jusqu'à 5 minutes**
- Pas de cold starts
- Intégré à Vercel
- **Gratuit** jusqu'à 100 heures/mois

### Configuration

```typescript
// app/api/workers/video-processing/route.ts
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { videoUrl, userId } = await req.json();
  
  // 1. Download video from S3
  const video = await downloadFromS3(videoUrl);
  
  // 2. Extract frames
  const frames = await extractFrames(video);
  
  // 3. Analyze with Azure Phi-4 Multimodal
  const analysis = await analyzeWithAzure(frames);
  
  // 4. Save to database
  await saveAnalysis(userId, analysis);
  
  return Response.json({ success: true });
}
```

**Déclenchement** :
```typescript
// app/api/content/upload/route.ts
export async function POST(req: Request) {
  const { file } = await req.json();
  
  // Upload to S3
  const videoUrl = await uploadToS3(file);
  
  // Trigger background worker (async)
  await fetch('https://app.huntaze.com/api/workers/video-processing', {
    method: 'POST',
    body: JSON.stringify({ videoUrl, userId }),
  });
  
  return Response.json({ status: 'processing' });
}
```

**Coût** : **Gratuit** (inclus dans Vercel Hobby $20/mois)

---

## 📦 Option 2: Upstash QStash (Queue Serverless)

### Qu'est-ce que c'est ?
- Queue serverless (comme SQS mais moins cher)
- Retry automatique
- Dead Letter Queue
- **$0.50/million de messages**

### Configuration

```typescript
// lib/queue/qstash-client.ts
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function enqueueVideoProcessing(videoUrl: string, userId: string) {
  await qstash.publishJSON({
    url: 'https://app.huntaze.com/api/workers/video-processing',
    body: { videoUrl, userId },
    retries: 3,
    delay: 0,
  });
}
```

**Déclenchement** :
```typescript
// app/api/content/upload/route.ts
export async function POST(req: Request) {
  const { file } = await req.json();
  
  // Upload to S3
  const videoUrl = await uploadToS3(file);
  
  // Enqueue (async)
  await enqueueVideoProcessing(videoUrl, userId);
  
  return Response.json({ status: 'queued' });
}
```

**Worker** :
```typescript
// app/api/workers/video-processing/route.ts
import { verifySignature } from '@upstash/qstash/nextjs';

async function handler(req: Request) {
  const { videoUrl, userId } = await req.json();
  
  // Process video...
  
  return Response.json({ success: true });
}

export const POST = verifySignature(handler);
```

**Coût** : **$0.50/million messages** (~$2-5/mois pour beta)

---

## 📦 Option 3: AWS Lambda (Pay-per-use)

### Configuration

```typescript
// lambda/video-processor/index.ts
export const handler = async (event: any) => {
  const { videoUrl, userId } = JSON.parse(event.body);
  
  // Process video...
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
```

**Déploiement** :
```bash
# Créer fonction Lambda
aws lambda create-function \
  --function-name huntaze-video-processor \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://lambda.zip \
  --timeout 300 \
  --memory-size 1024 \
  --region us-east-2
```

**Déclenchement via SQS** :
```bash
# Créer SQS queue
aws sqs create-queue \
  --queue-name huntaze-video-queue \
  --region us-east-2

# Connecter Lambda à SQS
aws lambda create-event-source-mapping \
  --function-name huntaze-video-processor \
  --event-source-arn arn:aws:sqs:us-east-2:317805897534:huntaze-video-queue \
  --batch-size 1
```

**Coût** : **$0.20/million invocations** + **$0.0000166667/GB-sec**
- 1000 videos/mois × 30s × 1GB = **$0.50/mois**
- SQS : **$0.40/million requests** = **$0.40/mois**
- **Total** : **~$1-2/mois**

---

## 🔄 Comparaison des Options

| Solution | Coût/mois | Durée max | Retry | DLQ | Complexité |
|----------|-----------|-----------|-------|-----|------------|
| **Vercel Background** | $0 (inclus) | 5 min | ❌ | ❌ | ⭐ Facile |
| **Upstash QStash** | $2-5 | 15 min | ✅ | ✅ | ⭐⭐ Moyen |
| **AWS Lambda + SQS** | $1-2 | 15 min | ✅ | ✅ | ⭐⭐⭐ Complexe |
| **ECS Fargate** | $30-50 | ∞ | ✅ | ✅ | ⭐⭐⭐⭐ Très complexe |

---

## 🎯 Recommandation : **Hybride Vercel + QStash**

### Pour les tâches rapides (< 5 min)
✅ **Vercel Background Functions** (gratuit)
- Content trends scraping
- Data processing
- Alert checker

### Pour les tâches longues (> 5 min)
✅ **Upstash QStash** ($2-5/mois)
- Video processing (analyse complète)
- Batch operations
- Heavy AI analysis

### Architecture Finale

```typescript
// lib/workers/dispatcher.ts
export async function dispatchWorker(
  task: 'video' | 'trends' | 'data' | 'alerts',
  payload: any
) {
  const estimatedDuration = estimateDuration(task, payload);
  
  if (estimatedDuration < 300) {
    // < 5 min → Vercel Background Function
    return await fetch(`/api/workers/${task}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } else {
    // > 5 min → QStash
    return await qstash.publishJSON({
      url: `https://app.huntaze.com/api/workers/${task}`,
      body: payload,
      retries: 3,
    });
  }
}
```

---

## 📊 Coût Total Révisé

### Architecture Budget Initiale
| Service | Coût/mois |
|---------|-----------|
| Vercel (Hobby) | $20 |
| RDS (db.t4g.micro) | $15 |
| ElastiCache (cache.t4g.micro) | $12 |
| S3 (10 GB) | $3 |
| Lambda (Cron jobs) | $2 |
| Azure AI Foundry | $10-30 |
| **Subtotal** | **$62-82/mois** |

### + Workers (Hybride)
| Service | Coût/mois |
|---------|-----------|
| Vercel Background (inclus) | $0 |
| Upstash QStash | $2-5 |
| **TOTAL FINAL** | **$64-87/mois** ✅

**Économie vs ECS** : **$120-200/mois** → **$2-5/mois** = **95% moins cher**

---

## 🚀 Implémentation Rapide

### 1. Installer Upstash QStash
```bash
npm install @upstash/qstash
```

### 2. Créer compte Upstash
- Aller sur https://upstash.com
- Créer un compte (gratuit)
- Créer un QStash token
- Ajouter à `.env.local` :
```bash
QSTASH_TOKEN="your-token-here"
QSTASH_CURRENT_SIGNING_KEY="your-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"
```

### 3. Créer Worker Video Processing
```typescript
// app/api/workers/video-processing/route.ts
import { verifySignature } from '@upstash/qstash/nextjs';

async function handler(req: Request) {
  const { videoUrl, userId } = await req.json();
  
  console.log(`Processing video for user ${userId}: ${videoUrl}`);
  
  try {
    // 1. Download from S3
    const video = await downloadFromS3(videoUrl);
    
    // 2. Extract frames (every 1 second)
    const frames = await extractFrames(video, { interval: 1 });
    
    // 3. Analyze with Azure Phi-4 Multimodal
    const analysis = await analyzeFrames(frames);
    
    // 4. Save to database
    await prisma.contentTask.update({
      where: { id: videoUrl },
      data: {
        status: 'POSTED',
        analysis: analysis,
      },
    });
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Video processing failed:', error);
    
    // Will be retried by QStash
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const POST = verifySignature(handler);
export const maxDuration = 300; // 5 minutes
```

### 4. Dispatcher
```typescript
// lib/workers/video-queue.ts
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function enqueueVideoProcessing(
  videoUrl: string,
  userId: string
) {
  await qstash.publishJSON({
    url: 'https://app.huntaze.com/api/workers/video-processing',
    body: { videoUrl, userId },
    retries: 3,
    delay: 0, // Immediate
  });
}

// Usage
await enqueueVideoProcessing('s3://bucket/video.mp4', 'user-123');
```

### 5. Monitoring
```typescript
// app/api/workers/status/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('messageId');
  
  // Check QStash message status
  const status = await qstash.messages.get(messageId);
  
  return Response.json(status);
}
```

---

## 🔍 Monitoring & Debugging

### QStash Dashboard
- https://console.upstash.com/qstash
- Voir tous les messages
- Retry failed messages
- Dead Letter Queue

### Vercel Logs
```bash
vercel logs --follow
```

### CloudWatch (Lambda)
```bash
aws logs tail /aws/lambda/huntaze-video-processor --follow
```

---

## ✅ Checklist Workers

### Setup
- [ ] Créer compte Upstash
- [ ] Installer `@upstash/qstash`
- [ ] Configurer env vars (QSTASH_TOKEN)
- [ ] Créer worker video processing
- [ ] Créer worker content trends
- [ ] Créer worker data processing
- [ ] Créer worker alert checker

### Testing
- [ ] Test video upload → processing
- [ ] Test retry on failure
- [ ] Test DLQ
- [ ] Test monitoring dashboard

### Production
- [ ] Configurer alertes (Slack/Email)
- [ ] Documenter runbooks
- [ ] Setup backup workers (Lambda fallback)

---

## 🎯 Prochaines Étapes

1. **Créer compte Upstash** (5 min)
2. **Implémenter video worker** (30 min)
3. **Tester end-to-end** (15 min)
4. **Déployer sur Vercel** (10 min)

**Temps total** : ~1 heure

---

---

## 🤖 Bonus: AI Router Python (FastAPI)

### Problème
Tu as un **AI Router Python** (`lib/ai/router/`) qui route les requêtes vers Azure AI Foundry.

**Coût ECS Fargate** : $30-50/mois ❌ TROP CHER

### Solution: **AWS Lambda (Python)**

#### Pourquoi Lambda au lieu d'ECS ?
- ✅ **Pay-per-use** (pas de coût fixe)
- ✅ **$0.20/million invocations**
- ✅ **Auto-scaling** (0 → 1000 instances)
- ✅ **Pas de serveurs à gérer**

#### Configuration

**1. Adapter le code FastAPI pour Lambda**
```python
# lib/ai/router/lambda_handler.py
from mangum import Mangum
from main import app  # Ton FastAPI app

# Wrapper Lambda
handler = Mangum(app, lifespan="off")
```

**2. Créer requirements.txt**
```txt
fastapi==0.109.0
mangum==0.17.0
httpx==0.26.0
pydantic==2.5.3
```

**3. Déployer sur Lambda**
```bash
# Installer dépendances
pip install -r requirements.txt -t package/

# Copier code
cp -r lib/ai/router/*.py package/

# Créer ZIP
cd package && zip -r ../lambda.zip . && cd ..

# Créer fonction Lambda
aws lambda create-function \
  --function-name huntaze-ai-router \
  --runtime python3.11 \
  --handler lambda_handler.handler \
  --zip-file fileb://lambda.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{AZURE_AI_CHAT_ENDPOINT=$AZURE_ENDPOINT,AZURE_AI_CHAT_KEY=$AZURE_KEY}" \
  --region us-east-2
```

**4. Créer API Gateway (HTTP API)**
```bash
# Créer API Gateway
aws apigatewayv2 create-api \
  --name huntaze-ai-router \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-2:317805897534:function:huntaze-ai-router

# Récupérer URL
aws apigatewayv2 get-apis --query 'Items[?Name==`huntaze-ai-router`].ApiEndpoint' --output text
```

**5. Utiliser dans ton app**
```typescript
// lib/ai/service.ts
const AI_ROUTER_URL = process.env.AI_ROUTER_URL || 
  'https://xxx.execute-api.us-east-2.amazonaws.com';

export async function routeAIRequest(prompt: string, type: string) {
  const response = await fetch(`${AI_ROUTER_URL}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, type }),
  });
  
  return response.json();
}
```

#### Coût AI Router (Lambda)
- **Invocations** : $0.20/million
- **Compute** : $0.0000166667/GB-sec
- **Exemple** : 10K requêtes/mois × 500ms × 512MB
  - Invocations : $0.002
  - Compute : $0.42
  - **Total** : **~$0.50/mois** ✅

**Économie vs ECS** : $30-50/mois → $0.50/mois = **98% moins cher**

---

## 📊 Coût Total FINAL (avec AI Router)

### Architecture Complète Budget

| Service | Coût/mois |
|---------|-----------|
| **Frontend** | |
| Vercel (Hobby) | $20 |
| **Backend AWS** | |
| RDS PostgreSQL (db.t4g.micro) | $15 |
| ElastiCache Redis (cache.t4g.micro) | $12 |
| S3 (10 GB) | $3 |
| **Workers** | |
| Lambda (Cron jobs) | $2 |
| Upstash QStash (Video/Trends) | $2-5 |
| **AI** | |
| Lambda AI Router (Python) | $0.50 |
| Azure AI Foundry (DeepSeek + Phi-4) | $10-30 |
| **Monitoring** | |
| CloudWatch (gratuit tier) | $0 |
| **TOTAL** | **$64.50-87.50/mois** ✅ |

**Économie totale** : $383-568/mois → $64-87/mois = **83% moins cher** 🎉

---

## 🚀 Alternative: Modal.com (Encore Plus Simple)

Si tu veux **encore plus simple** que Lambda, utilise **Modal.com** :

### Qu'est-ce que Modal ?
- Plateforme serverless pour Python
- Deploy en 1 commande
- Pay-per-use
- **$0.30/GPU-hour** (si besoin GPU)

### Configuration Modal
```python
# lib/ai/router/modal_app.py
import modal

app = modal.App("huntaze-ai-router")

@app.function()
@modal.web_endpoint(method="POST")
def route_request(request: dict):
    prompt = request["prompt"]
    type = request["type"]
    
    # Route vers Azure AI Foundry
    if type == "reasoning":
        return call_deepseek_r1(prompt)
    elif type == "generation":
        return call_deepseek_v3(prompt)
    else:
        return call_phi4(prompt)
```

**Déploiement** :
```bash
pip install modal
modal deploy lib/ai/router/modal_app.py
```

**Coût Modal** : ~$1-3/mois (beta)

---

**Rapport généré le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Coût Workers + AI Router**: ✅ $3-6/mois (au lieu de $150-250/mois)
