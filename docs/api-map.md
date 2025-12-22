# API Map (UI → Internal APIs)

Objectif: cartographier chaque écran/feature qui consommait des mocks vers les routes internes existantes (Next.js `app/api/**`) et clarifier les états `loading/error/empty`.

## Conventions & Auth (constaté)

### Base URL
- Client: appels vers les routes internes via chemins `"/api/..."` (même origine).
- Config: `NEXT_PUBLIC_INTERNAL_API_BASE_URL` (client) par défaut sur `/api` via `lib/api/client/internal-api-client.ts` (apiClient).
- Config: `NEXT_PUBLIC_API_URL` est utilisé par certaines routes proxy et par des clients (ex: `app/api/schedule/*`).

### Auth
- Majorité des pages “app” sont protégées via NextAuth (`components/auth/ProtectedRoute.tsx`).
- Côté API, plusieurs patterns coexistent:
  - NextAuth session (`getServerSession()` / `auth()` / middleware `withAuth`)
  - Cookie token (`access_token` / `auth_token`) utilisé pour les routes proxy (ex: `app/api/schedule/route.ts`)
  - Header `x-user-id` pour certaines routes (ex: `app/api/content/templates/route.ts`) → à normaliser (TODO)

### Réponses
Les formats ne sont pas uniformes selon les endpoints:
- `successResponse(...)` → `{ success: true, data: ..., meta: ... }`
- `NextResponse.json({ success: true, data: ... })`
- Réponses “brutes” (ex: `/api/offers` → `{ offers, total }`)

## Features / Écrans

### Overview Dashboard
- UI: `app/(app)/overview/page.tsx`
- Entities:
  - `Campaign` (marketing)
  - `ContentItem`
- Endpoints:
  - GET `app/api/marketing/campaigns/route.ts` → `/api/marketing/campaigns?status&channel&limit&offset`
  - GET `app/api/content/route.ts` → `/api/content?status&platform&type&limit&offset`
- États:
  - loading: skeleton métriques
  - empty: “No campaigns yet” / “No content yet”
  - error: afficher un état non-bloquant (banner/empty) (TODO si absent)

### Marketing Campaigns
- UI: `app/(app)/marketing/campaigns/page.tsx`
- Entities: `Campaign` + `CampaignStats`
- Endpoints:
  - GET `app/api/marketing/campaigns/route.ts` → liste + filtres
  - POST `app/api/marketing/campaigns/route.ts` → créer
  - PUT/DELETE `app/api/marketing/campaigns/[id]/route.ts`
  - POST `app/api/marketing/campaigns/[id]/launch/route.ts` → “launch/schedule”
- États:
  - loading: “Loading...”
  - empty: “No campaigns found”
  - error: non-bloquant (TODO si absent)

### Marketing – Overview (War Room)
- UI: `app/(app)/marketing/page.tsx`
- Entities: `QueueItem`, `Automation`, `HealthCheck`
- Endpoints:
  - GET `app/api/marketing-war-room/state/route.ts` → `/api/marketing-war-room/state`
  - POST `app/api/warroom/schedule/route.ts` → `/api/warroom/schedule` (actions post/schedule/cancel)
- États:
  - loading: spinner/badge
  - empty: `EmptyState` “No queue items” + “No health data”
  - error: banner + retry
- TODO:
  - `marketing-war-room/state` retourne vide hors `API_MODE=mock` → brancher DB/monitoring

### Content Templates
- UI: `app/(app)/content/templates/page.tsx`
- Entities: `Template` (content template)
- Endpoints:
  - GET `app/api/content/templates/route.ts` → `/api/content/templates?category&search&limit&offset`
  - POST `app/api/content/templates/route.ts` → créer
  - POST `app/api/content/templates/[id]/use/route.ts` → incrémenter `usageCount`
- États:
  - loading: grille skeleton
  - empty: `EmptyState` (“No templates found”)
  - error: non-bloquant (TODO si absent)
- TODO:
  - Auth: endpoint dépend de `x-user-id` header (à aligner sur NextAuth/session)

### Automations
- UI: `app/(app)/automations/page.tsx`
- Entities:
  - `AutomationFlow`
  - Analytics: `ExecutionMetrics` / `AnalyticsSummary`
- Endpoints:
  - GET/POST `app/api/automations/route.ts` → `/api/automations`
  - GET/PUT/DELETE `app/api/automations/[id]/route.ts`
  - GET `app/api/automations/analytics/route.ts` → `/api/automations/analytics?type=summary|metrics|trends|compare|triggers`
- États:
  - loading: à ajouter (TODO si absent)
  - empty: “No automations yet”
  - error: non-bloquant (TODO si absent)

### Offers (List)
- UI: `app/(app)/offers/page.tsx`
- Entities: `Offer`
- Endpoints:
  - GET/POST `app/api/offers/route.ts` → `/api/offers?status&limit&offset`
  - GET/PUT/DELETE `app/api/offers/[id]/route.ts` → `/api/offers/:id`
  - POST `app/api/offers/[id]/duplicate/route.ts` → `/api/offers/:id/duplicate`
  - GET `app/api/offers/analytics/route.ts` (optionnel)
- États:
  - empty: écran “No offers yet”
  - error: non-bloquant (TODO si absent)

### Offers (Edit)
- UI: `app/(app)/offers/[id]/page.tsx`
- Entities: `Offer`, `UpdateOfferInput`
- Endpoints:
  - GET `app/api/offers/[id]/route.ts`
  - PUT `app/api/offers/[id]/route.ts`
- États:
  - loading: spinner
  - empty/not found: carte “Offer not found”
  - error: non-bloquant (TODO si absent)

### Marketing Calendar
- UI: `app/(app)/marketing/calendar/page.tsx`
- Entities: `ScheduleItem` (scheduled content)
- Endpoints (proxy):
  - GET/POST `app/api/schedule/route.ts` → `/api/schedule`
  - PUT/DELETE `app/api/schedule/[id]/route.ts` → `/api/schedule/:id`
- États:
  - loading: skeleton
  - empty: à définir (TODO)
  - error: non-bloquant (TODO)
- TODO:
  - Clarifier le DTO réel renvoyé par l’upstream (mapping vers le modèle UI)

### Content (Trends / Ideas / Recommendations)
- UI: `app/(app)/content/page.tsx`
- Entities:
  - Trends: `TrendItem`
  - Recommendations: `Recommendation`
  - Content ideas: `Idea`
- Endpoints:
  - GET `app/api/ai/content-trends/trends/route.ts` → `/api/ai/content-trends/trends?platform&timeframe&category`
  - GET/POST `app/api/ai/content-trends/recommendations/route.ts` → `/api/ai/content-trends/recommendations`
- États:
  - refresh/loading: spinner bouton refresh
  - empty: à définir (TODO)
  - error: non-bloquant (TODO)

### Schedule (Smart Scheduler)
- UI: `app/(app)/schedule/page.tsx`
- Entities: `ScheduleItem`, `QueueItem`, `LibraryItem`
- Endpoints:
  - GET/POST `/api/schedule` (proxy) (voir `app/api/schedule/route.ts`)
  - GET `/api/content` (library) (voir `app/api/content/route.ts`)
  - GET `/api/schedule/recommendations` (voir `app/api/schedule/recommendations/route.ts`)
- TODO:
  - Définir le mapping DTO upstream → UI (schedule + queue)

### Home – Recent Activity
- UI: `app/(app)/home/RecentActivity.tsx`
- Entities: `ActivityItem`
- Endpoints:
  - GET `app/api/dashboard/route.ts` → `/api/dashboard` (inclut `data.recentActivity`)
- États:
  - loading: skeleton
  - empty: “No recent activity”
  - error: `EmptyState` variant error

### Home – Priority Actions & Integrations
- UI: `app/(app)/home/page.tsx`
- Entities: `DashboardSummary`, `AutomationFlow`, `QueueItem`
- Endpoints:
  - GET `app/api/dashboard/route.ts` → `/api/dashboard` (summary + integrations)
  - GET `app/api/automations/route.ts` → `/api/automations`
  - GET `app/api/marketing-war-room/state/route.ts` → `/api/marketing-war-room/state` (queue)
- États:
  - loading: placeholder texte (no-data)
  - empty: actions à 0 / listes vides
  - error: silencieux (fallback à 0)

### Analytics – Pricing
- UI: `app/(app)/analytics/pricing/page.tsx`
- Entities: `PricingRecommendation` (voir `app/api/revenue/pricing/route.ts`)
- Endpoints:
  - GET `app/api/revenue/pricing/route.ts` → `/api/revenue/pricing?creatorId=...`
- TODO:
  - Le endpoint renvoie vide hors `API_MODE=mock` (placeholder) → à remplacer par service réel

### OnlyFans – Fans (List)
- UI: `app/(app)/onlyfans/fans/page.tsx`
- Entities: `OnlyFansFan` (mapped vers UI `Fan`)
- Endpoints:
  - GET `app/api/onlyfans/fans/route.ts` → `/api/onlyfans/fans?limit&offset`
- États:
  - loading: `EmptyState` “Loading fans…”
  - empty: “Connect OnlyFans…”
  - error: `EmptyState` variant error + retry
- Mapping:
  - `subscriptionAmount` → ARPU
  - `totalSpent` → LTV
  - `lastMessageAt` / `subscribedAt` → “Last Active”

### OnlyFans – Fan Profile
- UI: `app/(app)/onlyfans/fans/[id]/page.tsx`
- Entities: `OnlyFansFan` (détail partiel)
- Endpoints:
  - GET `app/api/onlyfans/fans/route.ts` → `/api/onlyfans/fans?limit&offset` (filtrage client)
- États:
  - loading: `EmptyState` “Loading fan profile…”
  - empty: “No fan data yet”
  - error: `EmptyState` variant error + retry
- TODO:
  - Endpoint dédié `/api/onlyfans/fans/:id` pour éviter le filtrage client + achats récents

### OnlyFans – Analytics
- UI: `app/(app)/of-analytics/page.tsx`
- Entities: `FanAnalytics`, segments
- Endpoints (partiels):
  - GET `app/api/onlyfans/stats/route.ts` → `/api/onlyfans/stats` (retourne `stats: null` tant que non branché)
  - GET `app/api/onlyfans/dashboard/route.ts` → `/api/onlyfans/dashboard?accountId=...` (summary cards, pas de métriques détaillées)
- États:
  - loading: “Loading analytics...”
  - empty: stats null → empty state
  - error: EmptyState variant error
- TODO:
  - Aucun endpoint `FanAnalytics` (period, segments, conversion rates) n’existe dans le code → à créer/brancher.

### OnlyFans – Smart Messages
- UI: `app/(app)/onlyfans/smart-messages/page.tsx`
- Entities: message templates + automation rules + auto-reply config
- Endpoints existants (à confirmer/mapper):
  - GET/POST `app/api/ai/quick-replies/route.ts` → `/api/ai/quick-replies` (templates)
  - GET `app/api/automations/route.ts` → `/api/automations` (rules, à mapper)
- TODO:
  - Endpoints dédiés “auto-reply config” / “rules” si besoin

### OnlyFans – Mass Messaging
- UI: `app/(app)/onlyfans/messages/mass/page.tsx`
- Entities: audiences/segments + scheduled + sent + templates
- Endpoints existants (partiels):
  - POST `app/api/messages/bulk/route.ts` → `/api/messages/bulk` (bulk send via `recipientIds`)
  - GET `app/api/crm/fans/route.ts` → `/api/crm/fans` (source possible pour segments)
- TODO:
  - Endpoints de lecture (segments, scheduled, sent, templates) non identifiés dans le code actuel

### OnlyFans – Messages (Inbox)
- UI: `app/(app)/onlyfans/messages/page.tsx` + `components/messages/MessagingInterface.tsx`
- Entities: conversations + messages + fan context
- Endpoints existants (partiels):
  - GET `app/api/messages/unified/route.ts` → `/api/messages/unified?creatorId&platform&filter`
  - GET `app/api/messages/[threadId]/route.ts`
  - POST `app/api/messages/[threadId]/send/route.ts`
- TODO:
  - `messages/unified` renvoie actuellement des mocks → brancher service réel
  - Adapter `MessagingInterface` aux DTO réels

### OnlyFans – PPV Create
- UI: `app/(app)/onlyfans/ppv/create/create-ppv-client.tsx`
- Entities: campaign + audience segments
- Endpoints existants (partiels):
  - POST `app/api/of/campaigns/route.ts` → `/api/of/campaigns`
- TODO:
  - Endpoints segments + upload media + stats (non identifiés)

### OnlyFans – Settings (Templates & Recommendations)
- UI: `app/(app)/onlyfans/settings/page.tsx`
- Endpoints:
  - GET `app/api/onlyfans/connection/route.ts`
  - GET `app/api/ai/quota/route.ts`
  - GET/PUT `app/api/user/preferences/route.ts`
- TODO:
  - Templates & recommandations encore en mock UI

### OnlyFans – Welcome Messages
- UI: `app/(app)/onlyfans/settings/welcome/page.tsx`
- Entities: welcome templates + automation state
- TODO:
  - Endpoints CRUD non identifiés (demo only)

### Onboarding – Huntaze Demo
- UI: `app/(app)/onboarding/huntaze/page.tsx`
- Entities: setup guide + completion nudge
- TODO:
  - Démo uniquement (mocks locaux), endpoints non branchés
