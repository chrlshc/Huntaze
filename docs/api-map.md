# API Map (UI -> Routes internes)

Objectif: cartographier les ecrans/features vers les routes internes, les donnees attendues, et les etats UI.
TODO = endpoint absent dans le repo (ne pas inventer).

Conventions:
- Entities: types/objets utilises par l'UI.
- Endpoints: methodes + chemins.
- Etats: loading / error / empty.

Statut endpoints:
- ✅ real (connected to database)
- 🔄 real (returns empty/defaults when no data)
- ⏳ not implemented (NOT_IMPLEMENTED; UI should hide/flag)

---
## RECABLAGE STATUS (2024-12-24)

### Fichiers recâblés (mocks → DB):
- `src/lib/of/analytics-manager.ts` - ✅ Utilise Prisma (subscriptions, transactions, user_stats)
- `src/lib/of/session-manager.ts` - ✅ Utilise Prisma (users.of_cookies, of_linked_at)
- `app/api/onboarding/mock-ingest/route.ts` - ✅ Utilise Prisma (transactions, subscriptions, oauth_accounts)
- `src/lib/onboarding/autoCalibrate.ts` - ✅ Appelle la vraie API
- `src/lib/of/shoutout-marketplace.ts` - ✅ Utilise Prisma (users, user_stats, AIInsight pour deals)
- `src/lib/of/smart-relance.ts` - ✅ Utilise Prisma (subscriptions, transactions, AIInsight pour tracking)

### Fichiers avec mocks restants (dev-only):
- `src/services/content-moderation.ts` - mockMode flag (vision API integration TODO)

---

## Home / Dashboard
### Home (/home)
- Entities: DashboardData (summary, trends, recentActivity, quickActions, connectedIntegrations)
- Endpoints:
  - ✅ GET /api/dashboard?range=...&include=content,marketing
  - ✅ GET /api/automations
  - 🧪 GET /api/marketing-war-room/state (ENABLE_MOCK_DATA=1; real => empty)
- Etats: loading / error / empty

### Overview (/overview)
- Entities: ContentItem, ContentResponse
- Endpoints:
  - ✅ GET /api/content?status=...
- Etats: loading / error / empty

## OnlyFans
### Dashboard (/onlyfans)
- Entities: OnlyFansStatsResponse (messages, fans, ppv, connection)
- Endpoints:
  - ✅ GET /api/onlyfans/stats (stats null si non connecte)
- Etats: loading / error / empty (stats null si non connecte)

### Messages (/onlyfans/messages)
- Entities: UnifiedMessagesResponse, MessageThread, Message, Fan
- Endpoints:
  - ✅ GET /api/messages/unified?creatorId=...
  - ✅ GET /api/messages/[threadId]
  - ✅ PATCH /api/messages/[threadId]/read
  - ✅ POST /api/messages/[threadId]/send
  - ✅ GET /api/crm/fans
- Etats: loading / error / empty

### Mass Messages (/onlyfans/messages/mass)
- Entities: Fan, BulkMessageResult
- Endpoints:
  - ✅ GET /api/crm/fans
  - ✅ POST /api/messages/bulk
- Etats: loading / error / empty

### Fans (/onlyfans/fans, /onlyfans/fans/[id])
- Entities: OnlyFansFan, pagination
- Endpoints:
  - ✅ GET /api/onlyfans/fans?limit=...&offset=...
- Etats: loading / error / empty

### PPV (/onlyfans/ppv, /onlyfans/ppv/create)
- Entities: PPVTemplate, PPVCampaign
- Endpoints:
  - ✅ GET /api/integrations/status
  - ✅ GET /api/ppv/templates - List PPV templates
  - ✅ POST /api/ppv/templates - Create PPV template
  - ✅ GET /api/ppv/templates/[id] - Get single template
  - ✅ PUT /api/ppv/templates/[id] - Update template
  - ✅ DELETE /api/ppv/templates/[id] - Delete template
  - ✅ GET /api/ppv/campaigns - List campaigns
  - ✅ POST /api/ppv/campaigns - Create/send campaign
- Etats: loading / error / empty

### Settings (/onlyfans/settings, /onlyfans/settings/welcome, /onlyfans/smart-messages)
- Entities: IntegrationStatus, AiQuota, UserProfile
- Endpoints:
  - ✅ GET /api/integrations/status
  - 🧪 GET /api/ai/quota (ENABLE_MOCK_DATA=1; real => quota null)
  - ✅ GET/PATCH /api/users/profile
  - ⏳ TODO: welcome messages endpoints — missing in repo; UI should hide until ready
  - ⏳ TODO: smart messages/automations endpoints — missing in repo; UI should hide until ready
- Etats: loading / error / empty

### OnlyFans Analytics (/of-analytics)
- Entities: FanAnalytics, segments
- Endpoints:
  - ✅ GET /api/integrations/onlyfans/analytics?period=... (placeholder zeros)
- Etats: loading / error / empty

## Analytics
### Overview (/analytics)
- Entities: OverviewResponse, FinanceResponse, AcquisitionResponse
- Endpoints:
  - ✅ GET /api/dashboard/overview (real; some fields empty when no data)
  - ✅ GET /api/dashboard/finance (real; some fields empty when no data)
  - ✅ GET /api/dashboard/acquisition (real; some fields empty when no data)
- Etats: loading / error / empty

### Finance (/analytics/finance, /analytics/revenue, /analytics/fans)
- Entities: FinanceResponse (breakdown, whales, aiMetrics, messagingKpis)
- Endpoints:
  - ✅ GET /api/dashboard/finance (real; some fields empty when no data)
- Etats: loading / error / empty

### Acquisition (/analytics/acquisition, /analytics/platforms, /analytics/funnel, /analytics/content)
- Entities: AcquisitionResponse (funnel, platformMetrics, topContent)
- Endpoints:
  - ✅ GET /api/dashboard/acquisition (real; some fields empty when no data)
- Etats: loading / error / empty

### Churn (/analytics/churn)
- Entities: ChurnRiskResponse
- Endpoints:
  - ✅ GET /api/revenue/churn?creatorId=...
  - ✅ POST /api/revenue/churn/reengage
- Etats: loading / error / empty

### Pricing (/analytics/pricing)
- Entities: PricingRecommendation
- Endpoints:
  - ✅ GET /api/revenue/pricing?creatorId=...
  - ⏳ POST /api/revenue/pricing/apply (NOT_IMPLEMENTED; hook unused in UI)
- Etats: loading / error / empty

### Forecast (/analytics/forecast)
- Entities: RevenueForecastResponse
- Endpoints:
  - ✅ GET /api/revenue/forecast?creatorId=...&months=...
  - ⏳ POST /api/revenue/forecast/goal (NOT_IMPLEMENTED; hook unused in UI)
  - ⏳ POST /api/revenue/forecast/scenario (NOT_IMPLEMENTED; hook unused in UI)
- Etats: loading / error / empty

### Upsells (/analytics/upsells)
- Entities: UpsellOpportunitiesResponse
- UI: placeholder page only (no API calls yet)
- Endpoints:
  - ✅ GET /api/revenue/upsells (returns empty when no data)
  - ⏳ POST /api/revenue/upsells/send (NOT_IMPLEMENTED; page placeholder only)
  - ⏳ POST /api/revenue/upsells/dismiss (NOT_IMPLEMENTED; page placeholder only)
  - ⏳ GET/POST /api/revenue/upsells/automation (NOT_IMPLEMENTED; page placeholder only)
- Etats: loading / error / empty

### Payouts (/analytics/payouts)
- Entities: PayoutScheduleResponse
- UI: placeholder page only (no API calls yet)
- Endpoints:
  - ⏳ GET /api/revenue/payouts (NOT_IMPLEMENTED; page placeholder only)
  - ⏳ GET /api/revenue/payouts/export (NOT_IMPLEMENTED; page placeholder only)
  - ⏳ POST /api/revenue/payouts/sync (NOT_IMPLEMENTED; page placeholder only)
  - ⏳ POST /api/revenue/payouts/tax-rate (NOT_IMPLEMENTED; page placeholder only)
- Etats: loading / error / empty

## Content
### Overview (/content)
- Entities: TrendItem, Recommendations
- Endpoints:
  - ✅ GET /api/ai/content-trends/trends
  - ✅ GET /api/ai/content-trends/recommendations
- Etats: loading / error / empty

### Content Factory (/content/factory)
- Entities: Idea, ScriptVariant, ProductionJob, PlannedDraft
- Endpoints:
  - ✅ POST /api/content-factory/ideas (real returns empty unless ENABLE_MOCK_DATA=1)
  - ✅ POST /api/content-factory/script (real returns empty unless ENABLE_MOCK_DATA=1)
  - ✅ POST /api/content-factory/produce
  - ✅ POST /api/content-factory/planned-drafts (real returns empty unless ENABLE_MOCK_DATA=1)
  - ✅ GET /api/content-factory/jobs/[jobId]
  - 🧪/⏳ Legacy demo: /api/content/factory, /api/content/factory/[id] (ENABLE_MOCK_DATA=1; real => NOT_IMPLEMENTED)
- Etats: loading / error / empty

### Schedule (/content/schedule)
- Entities: ContentItem
- Endpoints:
  - ✅ GET /api/content?status=scheduled
- Etats: loading / error / empty

### Templates (/content/templates)
- Entities: ContentTemplate
- Endpoints:
  - ✅ GET /api/content/templates
  - ✅ POST /api/content/templates/[id]/use
- Etats: loading / error / empty

### Editor (/content/editor), Generator (/content/generator)
- Entities: ContentDraft, GeneratedContent
- Endpoints:
  - ✅ GET /api/content/editor - List drafts
  - ✅ POST /api/content/editor - Create draft
  - ✅ PUT /api/content/editor - Update draft
  - ✅ GET /api/content/generator - Get generation types
  - ✅ POST /api/content/generator - Generate content (placeholder AI)
- Etats: loading / error / empty

### Trends (/content-trends)
- Entities: TrendItem, TrendAnalysis, TrendRecommendations
- Endpoints:
  - ✅ GET /api/ai/content-trends/trends
  - ✅ POST /api/ai/content-trends/analyze
  - ✅ POST /api/ai/content-trends/scrape
  - ✅ GET /api/ai/content-trends/recommendations
- Etats: loading / error / empty

## Marketing
### War Room (/marketing)
- Entities: WarRoomState (queue, automations, health, trends)
- Endpoints:
  - 🧪 GET /api/marketing-war-room/state (ENABLE_MOCK_DATA=1; real => empty)
  - ✅ GET /api/marketing-war-room/automations/[key]
  - ✅ GET/POST /api/warroom/schedule
- Etats: loading / error / empty

### Campaigns (/marketing/campaigns, /marketing/campaigns/new, /marketing/campaigns/[id])
- Entities: MarketingCampaign, CampaignStats
- Endpoints:
  - ✅ GET /api/marketing/campaigns
  - ✅ POST /api/marketing/campaigns
  - ✅ GET/PUT/DELETE /api/marketing/campaigns/[id]
  - ✅ POST /api/marketing/campaigns/[id]/launch
- Etats: loading / error / empty

### Calendar (/marketing/calendar)
- Entities: ContentItem
- Endpoints:
  - ✅ GET /api/content?status=...
- Etats: loading / error / empty

### Content Detail (/marketing/content/[id])
- Entities: ContentItem
- Endpoints:
  - 🧪 GET /api/marketing-war-room/content/[id] (ENABLE_MOCK_DATA=1; real => MOCK_DISABLED)
- Etats: loading / error / empty

## Automations
### Overview (/automations, /automations/flows)
- Entities: AutomationFlow, AutomationStep, AutomationComparison
- Endpoints:
  - ✅ GET /api/automations
  - ✅ GET /api/automations/analytics?type=compare
- Etats: loading / error / empty

### Automation Detail (/automations/[id])
- Entities: AutomationFlow
- Endpoints:
  - ✅ GET /api/automations/[id]
  - ✅ PUT /api/automations/[id]
  - ✅ DELETE /api/automations/[id]
- Etats: loading / error / empty

### Automation Create (/automations/new)
- Entities: AutomationFlow, AiAutomationDraft
- Endpoints:
  - ✅ POST /api/ai/automation-builder
  - ✅ POST /api/automations
- Etats: loading / error / empty

### Automation Analytics (/automations/analytics)
- Entities: AnalyticsSummary, ExecutionMetrics, trends, triggerBreakdown
- Endpoints:
  - ✅ GET /api/automations/analytics?type=summary&startDate=...&endDate=...
  - ✅ GET /api/automations/analytics?type=compare
- Etats: loading / error / empty

### Templates (/automations/templates)
- Entities: AutomationTemplate
- Endpoints:
  - ✅ GET /api/automations/templates - List pre-built templates
  - ✅ POST /api/automations/templates - Use template to create automation
- Etats: loading / error / empty

## Offers
### Overview (/offers)
- Entities: Offer
- Endpoints:
  - ✅ GET /api/offers?limit=...&offset=...
  - ✅ PUT /api/offers/[id]
  - ✅ POST /api/offers/[id]/duplicate
  - ✅ DELETE /api/offers/[id]
- Etats: loading / error / empty

### Create (/offers/new)
- Entities: Offer
- Endpoints:
  - ✅ POST /api/offers
- Etats: loading / error / empty

### Edit (/offers/[id])
- Entities: Offer
- Endpoints:
  - ✅ GET /api/offers/[id]
  - ✅ PUT /api/offers/[id]
- Etats: loading / error / empty

### Analytics (/offers/analytics)
- Entities: RedemptionMetrics, OfferComparison, trends
- Endpoints:
  - ✅ GET /api/offers/analytics?type=metrics|trends|compare
  - ✅ POST /api/offers/analytics/export
  - ✅ GET /api/offers (offer names)
- Etats: loading / error / empty

## Integrations
### Overview (/integrations)
- Entities: IntegrationStatus, ConnectedAccount
- Endpoints:
  - ✅ GET /api/integrations/status
  - ✅ POST /api/integrations/connect/[provider]
  - ✅ DELETE /api/integrations/disconnect/[provider]/[accountId]
  - ✅ GET /api/csrf/token (CSRF)
- Etats: loading / error / empty

## Settings
### Settings (/settings)
- Entities: UserProfile, OFStatus
- Endpoints:
  - ✅ GET /api/users/profile
  - ✅ POST/PUT /api/users/profile
  - ✅ GET /api/of/status
- Etats: loading / error / empty

### Billing (/billing)
- Entities: PricingPlan
- Endpoints:
  - ⏳ TODO: billing endpoints (static for now)
- Etats: static

### Profile (/profile)
- Entities: UserProfile
- Endpoints:
  - ✅ GET /api/users/profile (if wired)
- Etats: loading / error / empty
