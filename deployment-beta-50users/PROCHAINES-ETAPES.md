# 🎯 Prochaines Étapes - Huntaze Beta Deployment

**Date**: 2025-12-22  
**Statut Actuel**: ✅ Infrastructure Azure déployée, Workers actifs, Décision Vercel prise  
**Temps estimé**: 30-45 minutes

---

## ✅ Ce qui est FAIT

### Infrastructure Azure (100% Opérationnel)
- ✅ Resource Group: `huntaze-beta-rg`
- ✅ Service Bus Namespace: `huntaze-sb-1eaef9fe`
- ✅ Topics: `huntaze-jobs`, `huntaze-events`
- ✅ Subscriptions: 8 créées (4 jobs + 4 events)
- ✅ SQL Filters: configurés pour routing automatique
- ✅ Function App: `huntaze-workers-7a2abf94`
- ✅ Premium Plan EP1: actif
- ✅ 5 Workers déployés et actifs:
  - VideoAnalysisWorker
  - ChatSuggestionsWorker
  - ContentSuggestionsWorker
  - ContentAnalysisWorker
  - SignalRNotificationWorker

### Connection Strings Récupérées
```bash
# Pour Vercel (Send-only)
SERVICEBUS_CONNECTION_SEND="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED"

# Pour Functions (Listen + Send)
SERVICEBUS_CONNECTION="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=functions-rw;SharedAccessKey=REDACTED"
```

### Décision Prise
- ✅ **VERCEL** choisi pour le frontend (vs AWS Amplify)
- ✅ Budget final calculé: $1,274.88-1,326.88/mois
- ✅ Règles anti-overage définies

---

## 🚀 Ce qu'il RESTE à Faire

### Étape 1: Configurer Vercel (10 min)

#### 1.1 Ajouter Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables:

```bash
# Service Bus (OBLIGATOIRE)
SERVICEBUS_CONNECTION_SEND="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED"

# AWS (si pas déjà configuré)
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_VIDEOS="huntaze-videos-beta"
CLOUDFRONT_DOMAIN="d1234567890.cloudfront.net"

# Azure AI (si pas déjà configuré)
AZURE_DEEPSEEK_V3_ENDPOINT="https://..."
AZURE_DEEPSEEK_R1_ENDPOINT="https://..."
AZURE_PHI4_MULTIMODAL_ENDPOINT="https://..."
```

#### 1.2 Déployer sur Vercel

```bash
# Si pas encore fait
npm i -g vercel
vercel login
vercel --prod
```

---

### Étape 2: Créer API Routes (15 min)

#### 2.1 Installer Dépendances

```bash
npm install @azure/service-bus
```

#### 2.2 Créer les Routes

Créer ces 4 fichiers (code complet dans [VERCEL-API-ROUTES.md](./VERCEL-API-ROUTES.md)):

```bash
app/api/jobs/video-analysis/route.ts
app/api/jobs/chat-suggestions/route.ts
app/api/jobs/content-suggestions/route.ts
app/api/jobs/content-analysis/route.ts
```

**Code minimal pour `app/api/jobs/video-analysis/route.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_SEND!);

export async function POST(req: NextRequest) {
  const { videoUrl, creatorId } = await req.json();
  
  if (!videoUrl || !creatorId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sender = client.createSender('huntaze-jobs');
  
  await sender.sendMessages({
    body: {
      jobId,
      jobType: 'video.analysis',
      creatorId,
      payload: { videoUrl },
      createdAt: new Date().toISOString(),
    },
    contentType: 'application/json',
    applicationProperties: { jobType: 'video.analysis' },
  });
  
  await sender.close();
  
  return NextResponse.json({ success: true, jobId });
}
```

Répéter pour les 3 autres routes (voir [VERCEL-API-ROUTES.md](./VERCEL-API-ROUTES.md) pour le code complet).

#### 2.3 Déployer

```bash
git add .
git commit -m "Add Azure Service Bus API routes"
git push
vercel --prod
```

---

### Étape 3: Tester End-to-End (10 min)

#### 3.1 Test Video Analysis

```bash
curl -X POST https://your-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://huntaze-videos-beta.s3.us-east-2.amazonaws.com/test.mp4",
    "creatorId": "test-123"
  }'
```

**Réponse attendue**:
```json
{
  "success": true,
  "jobId": "job_1703260800000_abc123",
  "status": "pending"
}
```

#### 3.2 Vérifier Logs Azure

```bash
# Logs en temps réel
func azure functionapp logstream huntaze-workers-7a2abf94

# Ou via Azure Portal
# https://portal.azure.com/#resource/.../huntaze-workers-7a2abf94/logs
```

**Logs attendus**:
```
[VideoAnalysisWorker] Processing job: job_1703260800000_abc123
[VideoAnalysisWorker] Video URL: https://...
[VideoAnalysisWorker] Analysis complete in 45.2s
```

#### 3.3 Tester les 3 Autres Routes

```bash
# Chat Suggestions
curl -X POST https://your-app.vercel.app/api/jobs/chat-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "fanMessage": "Hey! Love your content 😍",
    "creatorId": "test-123"
  }'

# Content Suggestions
curl -X POST https://your-app.vercel.app/api/jobs/content-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "onlyfans",
    "contentType": "post",
    "creatorId": "test-123"
  }'

# Content Analysis
curl -X POST https://your-app.vercel.app/api/jobs/content-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "contentUrl": "https://...",
    "contentType": "image",
    "creatorId": "test-123"
  }'
```

---

### Étape 4: Ajouter Job Tracking (Optionnel, 10 min)

#### 4.1 Ajouter Modèle Prisma

Ajouter dans `prisma/schema.prisma`:

```prisma
model Job {
  id          String   @id @default(cuid())
  type        String   // 'video.analysis', 'chat.suggest', etc.
  status      String   @default("pending") // 'pending', 'processing', 'completed', 'failed'
  creatorId   String
  payload     Json
  result      Json?
  error       String?
  attempts    Int      @default(0)
  createdAt   DateTime @default(now())
  completedAt DateTime?
  
  @@index([creatorId])
  @@index([status])
  @@index([type])
}
```

#### 4.2 Exécuter Migration

```bash
npx prisma migrate dev --name add_job_tracking
```

#### 4.3 Créer Route Status

Créer `app/api/jobs/status/[jobId]/route.ts` (code dans [VERCEL-API-ROUTES.md](./VERCEL-API-ROUTES.md))

---

### Étape 5: Configurer Monitoring (15 min)

#### 5.1 Vercel Analytics

```bash
npm install @vercel/analytics
```

Dans `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### 5.2 Bandwidth Alert (GitHub Actions)

Créer `.github/workflows/check-vercel-usage.yml`:

```yaml
name: Check Vercel Usage

on:
  schedule:
    - cron: '0 12 * * *' # Every day at 12pm UTC

jobs:
  check-usage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install @vercel/sdk
      - run: node scripts/check-vercel-usage.ts
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

#### 5.3 Azure Alerts

```bash
# Alert: DLQ > 10 messages
az monitor metrics alert create \
  --resource-group huntaze-beta-rg \
  --name "huntaze-dlq-high" \
  --description "DLQ messages > 10" \
  --scopes "/subscriptions/.../huntaze-sb-1eaef9fe" \
  --condition "avg DeadletteredMessages > 10" \
  --window-size 5m
```

---

### Étape 6: Optimiser ISR/Caching (10 min)

Ajouter `revalidate` dans toutes les pages:

```typescript
// app/(app)/content/page.tsx
export const revalidate = 3600; // 1 hour

// app/(app)/analytics/page.tsx
export const revalidate = 1800; // 30 minutes

// app/(marketing)/page.tsx
export const revalidate = 86400; // 24 hours
```

Pour les API routes read-only:

```typescript
// app/api/content/[id]/route.ts
export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

export async function GET(req: Request) {
  // ...
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

---

## ✅ Checklist Finale

### Infrastructure
- [x] Azure Workers déployés (5 workers actifs)
- [x] Service Bus configuré (2 topics, 8 subscriptions)
- [x] Connection strings récupérées
- [ ] Vercel configuré avec `SERVICEBUS_CONNECTION_SEND`
- [ ] API routes créées (4 routes)
- [ ] Test end-to-end réussi
- [ ] Monitoring configuré

### Règles Anti-Overage
- [ ] Vidéos servies via S3 signed URLs (jamais via Vercel)
- [ ] ISR configuré sur toutes les pages
- [ ] Edge caching sur API read-only
- [ ] Bandwidth alert configuré

### Optionnel
- [ ] Job tracking avec Prisma
- [ ] Dashboard de monitoring
- [ ] Rate limiting
- [ ] DLQ triage automatique

---

## 📚 Documentation de Référence

### Guides Principaux
1. **[VERCEL-DECISION-FINALE.md](./VERCEL-DECISION-FINALE.md)** - Décision Vercel vs Amplify + Budget complet
2. **[VERCEL-API-ROUTES.md](./VERCEL-API-ROUTES.md)** - Code complet des API routes
3. **[DEPLOYMENT-COMPLETE.md](./DEPLOYMENT-COMPLETE.md)** - Statut déploiement Azure
4. **[AZURE-WORKERS-GUIDE.md](./AZURE-WORKERS-GUIDE.md)** - Guide complet Azure Functions

### Scripts
- **[scripts/deploy-azure-workers.sh](./scripts/deploy-azure-workers.sh)** - Déploiement Azure
- **[scripts/test-workers.sh](./scripts/test-workers.sh)** - Tests d'intégration

### Index
- **[INDEX-V2.md](./INDEX-V2.md)** - Index complet de tous les documents

---

## 🎯 Résumé

**Infrastructure Azure**: ✅ 100% déployée et opérationnelle  
**Workers**: ✅ 5 workers actifs  
**Décision Frontend**: ✅ Vercel choisi  
**Budget**: ✅ $1,275-1,327/mois (dans les $1,300)

**Prochaine étape immédiate**: Configurer Vercel + créer API routes (25 minutes)

---

## 💡 Besoin d'Aide ?

### Questions Fréquentes

**Q: Puis-je utiliser AWS Amplify au lieu de Vercel ?**  
R: Oui, mais avec risque de limitations sur App Router/Server Actions. Voir [VERCEL-DECISION-FINALE.md](./VERCEL-DECISION-FINALE.md) pour comparaison détaillée.

**Q: Le budget est trop serré, des alternatives ?**  
R: Oui, utiliser Azure Functions Consumption Plan ($15-20/mois) au lieu de Premium EP1 pour la beta. Voir [AZURE-WORKERS-GUIDE.md](./AZURE-WORKERS-GUIDE.md) section "Alternative Budget".

**Q: Comment tester localement ?**  
R: Voir [AZURE-WORKERS-GUIDE.md](./AZURE-WORKERS-GUIDE.md) section "Local Development Setup".

**Q: Comment monitorer les coûts ?**  
R: Azure Cost Management + Vercel Dashboard + GitHub Actions alert. Voir [VERCEL-DECISION-FINALE.md](./VERCEL-DECISION-FINALE.md) section "Monitoring".

---

**Dernière mise à jour**: 2025-12-22 23:55 UTC  
**Statut**: ✅ PRÊT POUR IMPLÉMENTATION VERCEL
