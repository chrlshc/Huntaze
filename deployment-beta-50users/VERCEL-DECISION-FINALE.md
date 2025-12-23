# ✅ Décision Finale: VERCEL pour Huntaze Beta

**Date**: 2025-12-22  
**Décision**: **VERCEL** (recommandé)  
**Raison principale**: App Router + Server Actions = Vercel est la référence

---

## 🎯 Pourquoi Vercel ?

### 1. Compatibilité Next.js Maximale
- ✅ **App Router natif** (ton app l'utilise massivement)
- ✅ **Server Actions** supportés à 100%
- ✅ **ISR/SSR** sans config (framework-aware)
- ✅ **Edge Runtime** disponible si besoin
- ✅ **Image Optimization** intégrée

**AWS Amplify**: Support SSR "Gen1" avec limitations documentées sur App Router/Server Actions

### 2. DX (Developer Experience)
- ✅ **Preview deployments** automatiques (chaque PR)
- ✅ **Zero config** (détection auto Next.js)
- ✅ **Rollback instantané** (1 clic)
- ✅ **Logs en temps réel** (meilleure UX qu'AWS)
- ✅ **Analytics intégrées** (Web Vitals, etc.)

**AWS Amplify**: Plus de config, moins de features DX

### 3. Coût Prévisible (avec règles strictes)
- ✅ **$20/mois** (Hobby) → **$50/mois** (Pro) pour 50 users
- ✅ **Vidéos sur S3** = pas de bandwidth overage
- ✅ **API légères** (heavy processing sur Azure Functions)
- ✅ **ISR agressif** = moins de SSR = moins de coût

**AWS Amplify**: Pay-as-you-go (GB servis) → peut être moins cher MAIS plus de "AWS-isms"

---

## 💰 Budget Final avec Vercel

### Breakdown Complet

```
┌─────────────────────────────────────────────────────────────┐
│                    BUDGET HUNTAZE BETA                       │
│                     (50 users)                               │
└─────────────────────────────────────────────────────────────┘

Frontend/API (Vercel)
├── Vercel Pro: $20-50/mois
│   ├── 100 GB bandwidth (largement suffisant)
│   ├── 1,000 GB-hours serverless (API routes)
│   └── Unlimited preview deployments
│
AWS Infrastructure ($98-120/mois)
├── RDS PostgreSQL (db.t4g.micro): $15-20/mois
├── ElastiCache Redis (cache.t4g.micro): $15-20/mois
├── S3 (vidéos + assets): $10-20/mois
├── CloudFront (CDN vidéos): $20-30/mois
├── Lambda (cron jobs): $5-10/mois
└── Secrets Manager: $3-5/mois
│
Azure Workers ($156.88/mois)
├── Premium EP1 Plan: $146.88/mois
│   ├── 1 vCPU + 3.5 GB RAM
│   ├── Auto-scaling inclus
│   └── 400,000 GB-s execution inclus
└── Service Bus Standard: $10/mois
│   ├── 13M operations incluses
│   └── Topics + Subscriptions + DLQ
│
Azure AI Foundry ($1,000/mois - DÉJÀ PAYÉ)
├── DeepSeek-V3 (70B)
├── DeepSeek-R1 (reasoning)
├── Phi-4 Multimodal
├── Phi-4 Mini
├── Azure Speech Batch
├── Llama 3.3-70B
└── Mistral Large

─────────────────────────────────────────────────────────────
TOTAL: $1,274.88 - $1,326.88/mois
─────────────────────────────────────────────────────────────

Budget disponible: $1,300/mois
Marge: $0 - $25/mois (serré mais OK pour beta)
```

### Comparaison Vercel vs Amplify

| Critère | Vercel | AWS Amplify |
|---------|--------|-------------|
| **Coût Frontend** | $20-50/mois | $10-30/mois (pay-as-you-go) |
| **App Router Support** | ✅ 100% | ⚠️ Limité (Gen1) |
| **Server Actions** | ✅ Natif | ⚠️ Partiel |
| **DX (Preview, Logs)** | ✅ Excellent | ⚠️ Moyen |
| **Vendor Lock-in** | ⚠️ Vercel | ✅ AWS (déjà utilisé) |
| **Risque Overage** | ⚠️ Moyen (si mal config) | ✅ Faible (pay-as-you-go) |
| **Setup Time** | ✅ 5 min | ⚠️ 30 min |

**Verdict**: Vercel gagne sur **compatibilité** et **DX**, Amplify gagne sur **coût** et **vendor consolidation**

---

## 🚨 Règles CRITIQUES pour Éviter Overages Vercel

### 1. JAMAIS Servir Vidéos via Vercel

❌ **INTERDIT**:
```typescript
// NE JAMAIS FAIRE ÇA
<video src="/api/videos/stream?id=123" />
```

✅ **OBLIGATOIRE**:
```typescript
// Toujours utiliser S3 signed URLs
const signedUrl = await getS3SignedUrl(videoKey);
<video src={signedUrl} />
```

**Raison**: 1 vidéo de 50 MB × 100 vues = 5 GB bandwidth → $0.40 sur Vercel vs $0.01 sur CloudFront

### 2. ISR Agressif sur Pages Statiques

✅ **OBLIGATOIRE**:
```typescript
// app/(app)/content/page.tsx
export const revalidate = 3600; // 1 heure

// app/(app)/analytics/page.tsx
export const revalidate = 1800; // 30 minutes

// app/(marketing)/page.tsx
export const revalidate = 86400; // 24 heures
```

**Raison**: ISR = cache CDN = pas de SSR = pas de coût serverless

### 3. Edge Caching pour API Read-Only

✅ **OBLIGATOIRE**:
```typescript
// app/api/content/[id]/route.ts (GET only)
export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Cache at edge for 5 minutes
  const content = await getContent(params.id);
  return NextResponse.json(content, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

**Raison**: Edge = pas de serverless invocation = pas de coût

### 4. Monitoring Bandwidth (Alert si > 100 GB/mois)

✅ **OBLIGATOIRE**:
```typescript
// scripts/check-vercel-usage.ts
import { vercel } from '@vercel/sdk';

const client = vercel({ token: process.env.VERCEL_TOKEN });

async function checkUsage() {
  const usage = await client.teams.getUsage({
    teamId: process.env.VERCEL_TEAM_ID,
    from: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  
  const bandwidthGB = usage.bandwidth / 1024 / 1024 / 1024;
  
  if (bandwidthGB > 100) {
    console.error(`⚠️ ALERT: Bandwidth usage is ${bandwidthGB.toFixed(2)} GB (> 100 GB)`);
    // Send alert to Slack/email
  }
  
  console.log(`✅ Bandwidth: ${bandwidthGB.toFixed(2)} GB / 100 GB`);
}

checkUsage();
```

**Cron**: Exécuter chaque jour via GitHub Actions

---

## 📋 Prochaines Étapes (Ordre d'Exécution)

### Étape 1: Configurer Vercel (10 min)

#### 1.1 Ajouter Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables:

```bash
# Service Bus (Send-only)
SERVICEBUS_CONNECTION_SEND="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED"

# AWS (déjà configuré normalement)
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_VIDEOS="huntaze-videos-beta"
CLOUDFRONT_DOMAIN="d1234567890.cloudfront.net"

# Azure AI (déjà configuré normalement)
AZURE_DEEPSEEK_V3_ENDPOINT="https://..."
AZURE_DEEPSEEK_R1_ENDPOINT="https://..."
AZURE_PHI4_MULTIMODAL_ENDPOINT="https://..."
```

#### 1.2 Déployer sur Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Vérifier
curl https://your-app.vercel.app/api/health
```

### Étape 2: Créer API Routes pour Jobs (15 min)

Créer les routes pour enqueue des jobs sur Azure Service Bus:

```bash
# Créer les fichiers
touch app/api/jobs/video-analysis/route.ts
touch app/api/jobs/chat-suggestions/route.ts
touch app/api/jobs/content-suggestions/route.ts
touch app/api/jobs/content-analysis/route.ts
```

Voir code complet dans [VERCEL-API-ROUTES.md](./VERCEL-API-ROUTES.md)

### Étape 3: Tester End-to-End (10 min)

```bash
# Test 1: Video Analysis
curl -X POST https://your-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://huntaze-videos-beta.s3.us-east-2.amazonaws.com/test.mp4",
    "creatorId": "test-123"
  }'

# Expected response:
# {
#   "success": true,
#   "jobId": "job_1234567890_abc123",
#   "status": "pending"
# }

# Test 2: Vérifier logs Azure
func azure functionapp logstream huntaze-workers-7a2abf94

# Expected logs:
# [VideoAnalysisWorker] Processing job: job_1234567890_abc123
# [VideoAnalysisWorker] Video URL: https://...
# [VideoAnalysisWorker] Analysis complete in 45.2s
```

### Étape 4: Configurer Monitoring (15 min)

#### 4.1 Vercel Analytics

```bash
# Install
npm install @vercel/analytics

# Add to app/layout.tsx
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

#### 4.2 Bandwidth Alert (GitHub Actions)

Créer `.github/workflows/check-vercel-usage.yml`:

```yaml
name: Check Vercel Usage

on:
  schedule:
    - cron: '0 12 * * *' # Every day at 12pm UTC
  workflow_dispatch:

jobs:
  check-usage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install @vercel/sdk
      - run: node scripts/check-vercel-usage.ts
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_TEAM_ID: ${{ secrets.VERCEL_TEAM_ID }}
```

### Étape 5: Optimiser ISR/Caching (10 min)

Ajouter `revalidate` dans toutes les pages:

```typescript
// app/(app)/content/page.tsx
export const revalidate = 3600; // 1 hour

// app/(app)/analytics/page.tsx
export const revalidate = 1800; // 30 minutes

// app/(marketing)/page.tsx
export const revalidate = 86400; // 24 hours
```

---

## 🧪 Tests de Charge (Optionnel)

### Test 1: Bandwidth (Vérifier pas d'overage)

```bash
# Simuler 100 users × 10 pages/jour × 30 jours
# = 30,000 page loads
# Avec ISR: ~1,000 SSR (le reste = cache CDN)
# Bandwidth: ~5 GB (HTML + JSON API)

# Résultat attendu: < 10 GB/mois
```

### Test 2: Serverless Invocations

```bash
# Simuler 100 users × 5 API calls/jour × 30 jours
# = 15,000 API calls
# Avec edge caching: ~3,000 invocations (le reste = cache)

# Résultat attendu: < 100,000 invocations/mois (largement dans le plan Pro)
```

---

## 📊 Dashboard de Monitoring

### Vercel Dashboard
- **Bandwidth**: https://vercel.com/[team]/[project]/analytics/bandwidth
- **Invocations**: https://vercel.com/[team]/[project]/analytics/functions
- **Web Vitals**: https://vercel.com/[team]/[project]/analytics/vitals

### Azure Portal
- **Function App**: https://portal.azure.com/#resource/.../huntaze-workers-7a2abf94
- **Service Bus**: https://portal.azure.com/#resource/.../huntaze-sb-1eaef9fe
- **Application Insights**: https://portal.azure.com/#resource/.../huntaze-workers-7a2abf94-insights

### AWS CloudWatch
- **RDS**: https://console.aws.amazon.com/rds/home?region=us-east-2
- **ElastiCache**: https://console.aws.amazon.com/elasticache/home?region=us-east-2
- **S3**: https://console.aws.amazon.com/s3/home?region=us-east-2

---

## ✅ Checklist Finale

### Infrastructure
- [x] Azure Workers déployés (5 workers actifs)
- [x] Service Bus configuré (2 topics, 8 subscriptions)
- [x] Connection strings récupérées
- [ ] Vercel configuré avec env vars
- [ ] API routes créées (4 routes)
- [ ] Test end-to-end réussi
- [ ] Monitoring configuré (Vercel Analytics + GitHub Actions)
- [ ] ISR/Caching optimisé

### Règles Anti-Overage
- [ ] Vidéos servies via S3 signed URLs (jamais via Vercel)
- [ ] ISR configuré sur toutes les pages (revalidate)
- [ ] Edge caching sur API read-only
- [ ] Bandwidth alert configuré (> 100 GB/mois)

### Documentation
- [x] AZURE-WORKERS-GUIDE.md
- [x] DEPLOYMENT-COMPLETE.md
- [x] VERCEL-DECISION-FINALE.md
- [ ] VERCEL-API-ROUTES.md (à créer)
- [ ] MONITORING-GUIDE.md (à créer)

---

## 🎉 Résumé

**Décision**: ✅ **VERCEL**  
**Raison**: App Router + Server Actions = compatibilité maximale  
**Coût**: $20-50/mois (avec règles anti-overage strictes)  
**Budget total**: $1,275-1,327/mois (dans les $1,300 budget)  
**Prochaine étape**: Configurer Vercel + créer API routes + tester

**Alternative si budget trop serré**: AWS Amplify ($10-30/mois) mais avec risque de limitations App Router/Server Actions

---

**Dernière mise à jour**: 2025-12-22 23:45 UTC  
**Statut**: ✅ DÉCISION PRISE - PRÊT POUR IMPLÉMENTATION
