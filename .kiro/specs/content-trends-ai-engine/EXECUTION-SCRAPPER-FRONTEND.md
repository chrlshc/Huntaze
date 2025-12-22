# Content Trends - Scrapper & Frontend Execution Plan

## État Actuel ✅
- Apify Client complet (`lib/ai/content-trends/apify/apify-client.ts`)
- Actor configs pour TikTok, Instagram, YouTube, Twitter
- Webhook controller avec sécurité HMAC
- Dashboard basique existant
- Page Content mockée avec design Shopify Polaris

## Implémenté ✅

### 1. API Routes Scrapper
- ✅ `POST /api/ai/content-trends/scrape` - Déclencher scraping
- ✅ `GET /api/ai/content-trends/scrape?runId=xxx` - Status d'un job
- ✅ `POST /api/ai/content-trends/webhook` - Recevoir données Apify
- ✅ `GET /api/ai/content-trends/jobs` - Status des jobs par plateforme
- ✅ `GET/POST /api/ai/content-trends/recommendations` - Recommandations IA

### 2. Frontend Content Trends
- ✅ `TrendsScraper.tsx` - Interface pour lancer le scraping multi-plateforme
- ✅ `PlatformTrendsView.tsx` - Vue des tendances par plateforme avec filtres
- ✅ `AIRecommendations.tsx` - Recommandations IA et génération d'idées
- ✅ Page `/content-trends` avec navigation par onglets

### 3. Page Content Mockée (`/content`)
- ✅ Design Shopify Polaris complet
- ✅ Stats overview (tendances actives, score viral, idées générées)
- ✅ Filtres par plateforme (TikTok, Instagram, YouTube)
- ✅ Onglets: Tendances, Idées IA, Recommandations
- ✅ Cards de tendances avec viral score, engagement, hashtags
- ✅ Idées de contenu générées par l'IA
- ✅ Recommandations personnalisées (timing, hashtags, format)
- ✅ Actions rapides

### 4. Backend Engine
- ✅ `ContentTrendsEngine` - Classe wrapper haute-niveau pour l'API

### 5. Configuration
- ✅ `APIFY_API_TOKEN` documenté dans `.env.example`

## Architecture

```
/app/(app)/content/page.tsx     # Page Content mockée (Shopify Polaris)
/app/(app)/content-trends/      # Dashboard Content Trends

/api/ai/content-trends/
├── scrape/route.ts      # Déclencher Apify actors
├── webhook/route.ts     # Recevoir données scrapées
├── jobs/route.ts        # Status des jobs
├── trends/route.ts      # Récupérer tendances
├── recommendations/     # Recommandations IA
└── analyze/route.ts     # Analyse virale

/components/content-trends/
├── ContentTrendsDashboard.tsx  # Dashboard principal
├── TrendsScraper.tsx           # Interface scraping
├── PlatformTrendsView.tsx      # Vue par plateforme
└── AIRecommendations.tsx       # Recommandations IA

/lib/ai/content-trends/
├── content-trends-engine.ts    # Engine wrapper
├── apify/apify-client.ts       # Client Apify
└── apify/actor-configs.ts      # Configs actors
```

## Prochaines étapes (optionnel)
- Intégrer stockage DB pour les données scrapées
- Ajouter cron jobs pour scraping automatique
- Connecter les données réelles Apify à la page Content
- Remplacer les mock data par les vraies tendances
