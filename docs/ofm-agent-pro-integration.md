# OFM Agent Pro → Huntaze.com Integration Plan (English)

This document specifies the scoped integration of OFM Agent Pro features into Huntaze, aligned with the current stack (Next.js frontend, huntaze-api with Prisma, cloud infra). It focuses on human-in-the-loop DM workflows, RFM segmentation, guardrails-first AI assistance, dynamic PPV recommendations, and compliance.

## Architecture
- Backend: `huntaze-api` (Express + Prisma)
- Frontend: Next.js operator UI (DM views)
- Data: Prisma models (users, platforms, conversations, messages, content, analytics)

New layers:
- RFM Service: automatic Whale/VIP/Casual/ChurnRisk segmentation + propensity & churn scores
- AI Personas & Guardrails: per-model persona, forbidden words, escalation triggers, frequency limits
- Recommendations: PPV price suggestions based on RFM + recent activity
- UI Extensions: AI Draft Panel in DM UI; dashboard extensions (RFM, anomalies, churn)

## Data Model (Prisma proposals)
Do not apply blindly; review and adapt to live DB state.

```prisma
model Fan {
  id               String       @id @default(cuid())
  userId           String
  platformType     PlatformType
  platformUserId   String
  username         String?
  totalSpent       Float        @default(0)
  lastActive       DateTime?
  messageCount     Int          @default(0)

  // RFM and ML
  rfmSegment       String?
  rfmRecency       Int?
  rfmFrequency     Int?
  rfmMonetary      Float?
  propensityScore  Float?
  churnRisk        Float?

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@unique([userId, platformType, platformUserId])
  @@index([userId, platformType])
}

model AiPersona {
  id           String   @id @default(cuid())
  userId       String
  name         String
  styleGuide   String   @db.Text
  toneKeywords String[]
  templates    Json     // {welcome, upsell, reactivation}
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([userId])
}

model AiGuardrails {
  id                 String   @id @default(cuid())
  userId             String
  forbiddenWords     String[]
  escalationTriggers String[]
  maxPerHour         Int      @default(3)
  cooldownMinutes    Int      @default(20)
  active             Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@unique([userId, active])
}

model AiDraft {
  id              String   @id @default(cuid())
  userId          String
  fanId           String?
  conversationId  String?
  personaId       String?
  guardrailsId    String?
  inputMessage    String   @db.Text
  draft           Json
  action          String   // DRAFT | ESCALATE
  confidence      Float?
  validated       Boolean  @default(false)
  validatedById   String?
  reason          String?  @db.Text
  createdAt       DateTime @default(now())
  @@index([userId, createdAt])
}

model PpvRecommendation {
  id             String   @id @default(cuid())
  userId         String
  fanId          String
  assetId        String?
  suggestedPrice Float
  rationale      String?  @db.Text
  accepted       Boolean?
  createdAt      DateTime @default(now())
  @@index([userId, createdAt])
}

model AiPerformanceMetric {
  id               String   @id @default(cuid())
  userId           String
  date             DateTime @db.Date
  validationRate   Float?
  avgResponseSec   Int?
  escalations      Int?
  revenueDeltaCents Int?
  createdAt        DateTime @default(now())
  @@unique([userId, date])
}
```

Optional link: add `fanId` to `Conversation` for easier joins (backfill needed).

## API Endpoints (to add under /api/ofm)
- POST `/ai/draft` — generate AI draft with guardrails pre-check; returns JSON with action DRAFT/ESCALATE. Logs to `AiDraft`.
- POST `/rfm/recompute` — recompute RFM and store on `Fan` + scores. Returns 202.
- GET `/personas` | POST `/personas` | PUT `/personas/:id` — manage `AiPersona`.
- GET `/guardrails` | PUT `/guardrails` — manage `AiGuardrails` for user.

## UI Extensions
- AI Draft Panel in DM: shows draft, confidence, reasons, upsell flag, recommended PPV; actions Accept/Edit/Escalate.
- Dashboard: segment distribution, PPV conversion by segment, anomaly alerts, churn 7/30d.

## Week 1 Priorities (from ops feedback)
1) Persona workshop (top creators) — tone, taboos, examples good/bad.
2) Guardrails list from real violations/complaints — forbidden words, escalation library, frequency caps.
3) Data pipeline for OnlyFans exports → datastore (authorized exports only). Define retention + access.

## Success Criteria & KPIs
- AI: draft validation rate, response time, escalation rate.
- Revenue: PPV CR by segment, ARPPU, MRR trend.
- Churn: 7/30d; winback lift.
- Compliance: violations auto-detected, operator overrules.

## Notes on Platform Compliance
- No aggressive scraping or auto-sending; human validation mandatory.
- Respect platform sending limits and content rules; full audit logs.
- Data minimization, encryption, role-based access, retention policy.

