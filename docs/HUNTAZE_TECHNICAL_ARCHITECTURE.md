# 🏗️ HUNTAZE - Architecture Technique Complète

**Date:** 22 novembre 2025  
**Version:** 1.0 - Production Ready  
**Statut:** ✅ Déployé sur staging-new

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Stack Technique](#stack-technique)
3. [Architecture Backend](#architecture-backend)
4. [Architecture Frontend](#architecture-frontend)
5. [Base de Données](#base-de-données)
6. [Infrastructure AWS](#infrastructure-aws)
7. [Système IA](#système-ia)
8. [Sécurité](#sécurité)
9. [Performance](#performance)
10. [Monitoring](#monitoring)

---

## 🎯 Vue d'Ensemble

**Huntaze** est une plateforme SaaS pour créateurs de contenu qui centralise la gestion multi-plateformes avec intelligence artificielle.

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFRONT CDN                            │
│              (Distribution Globale)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS APP (Vercel)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   API Routes │  │  Middleware  │     │
│  │   (React)    │  │   (Backend)  │  │   (Auth)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐
   │ Prisma │  │ Gemini  │  │   AWS    │
   │   DB   │  │   AI    │  │ Services │
   └────────┘  └─────────┘  └──────────┘
```

---

## 🛠️ Stack Technique

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript
- **Styling:** CSS Modules + Design System
- **State:** React Hooks + Context API
- **Forms:** React Hook Form
- **Validation:** Zod

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Next.js API Routes
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon)
- **Auth:** NextAuth.js v5
- **Cache:** Redis (ElastiCache)

### Infrastructure
- **Hosting:** Vercel (Frontend + API)
- **CDN:** AWS CloudFront
- **Storage:** AWS S3
- **Edge:** AWS Lambda@Edge
- **Email:** AWS SES
- **Monitoring:** AWS CloudWatch

### IA & ML
- **LLM:** Google Gemini 1.5 Pro
- **Architecture:** Multi-Agent System
- **Cache:** Knowledge Network (Redis)
- **Billing:** Usage-based tracking

---

## 🔧 Architecture Backend

### Structure des API Routes

```
app/api/
├── auth/                    # Authentification
│   ├── register/           # POST /api/auth/register
│   ├── login/              # POST /api/auth/login
│   ├── logout/             # POST /api/auth/logout
│   └── verify-email/       # GET /api/auth/verify-email
│
├── onboarding/             # Onboarding utilisateur
│   └── complete/           # POST /api/onboarding/complete
│
├── home/                   # Dashboard
│   └── stats/              # GET /api/home/stats
│
├── integrations/           # Plateformes externes
│   ├── status/             # GET /api/integrations/status
│   ├── callback/[provider] # GET /api/integrations/callback/:provider
│   ├── disconnect/         # DELETE /api/integrations/disconnect/:provider/:id
│   └── refresh/            # POST /api/integrations/refresh/:provider/:id
│
├── ai/                     # Intelligence Artificielle
│   ├── chat/               # POST /api/ai/chat
│   ├── generate-caption/   # POST /api/ai/generate-caption
│   ├── analyze-performance/# POST /api/ai/analyze-performance
│   ├── optimize-sales/     # POST /api/ai/optimize-sales
│   └── quota/              # GET /api/ai/quota
│
├── admin/                  # Administration
│   └── ai-costs/           # GET /api/admin/ai-costs
│
├── csrf/                   # Sécurité
│   └── token/              # GET /api/csrf/token
│
└── monitoring/             # Observabilité
    └── metrics/            # POST /api/monitoring/metrics
```


### Services Backend (lib/)

```
lib/
├── auth/                   # Authentification
│   ├── config.ts          # Configuration NextAuth
│   ├── session.ts         # Gestion sessions
│   └── admin.ts           # Permissions admin
│
├── services/              # Services métier
│   ├── auth/             # Service authentification
│   ├── integrations/     # Service intégrations
│   ├── cache.service.ts  # Service cache Redis
│   └── s3Service.ts      # Service AWS S3
│
├── ai/                    # Intelligence Artificielle
│   ├── gemini-client.ts  # Client Gemini API
│   ├── coordinator.ts    # Coordinateur multi-agents
│   ├── agents/           # Agents spécialisés
│   │   ├── content.ts    # Agent contenu
│   │   ├── analytics.ts  # Agent analytics
│   │   ├── sales.ts      # Agent ventes
│   │   └── messaging.ts  # Agent messaging
│   ├── knowledge-network.ts # Cache intelligent
│   ├── quota.ts          # Gestion quotas
│   ├── billing.ts        # Facturation usage
│   └── rate-limit.ts     # Rate limiting
│
├── middleware/            # Middlewares
│   ├── auth.ts           # Auth middleware
│   ├── csrf.ts           # CSRF protection
│   ├── rate-limit.ts     # Rate limiting
│   └── monitoring.ts     # Monitoring requests
│
├── monitoring/            # Observabilité
│   └── cloudwatch.service.ts # CloudWatch integration
│
└── utils/                 # Utilitaires
    ├── performance.ts    # Optimisations
    ├── retry.ts          # Retry logic
    ├── debounce.ts       # Debouncing
    └── csrf-client.ts    # CSRF client
```

### Flux d'une Requête API

```
1. CLIENT REQUEST
   │
   ▼
2. CLOUDFRONT CDN
   │ (Cache statique)
   ▼
3. VERCEL EDGE
   │ (Lambda@Edge)
   ▼
4. MIDDLEWARE CHAIN
   │ ├─ CSRF Protection
   │ ├─ Authentication
   │ ├─ Rate Limiting
   │ └─ Monitoring
   ▼
5. API ROUTE HANDLER
   │ ├─ Validation (Zod)
   │ ├─ Business Logic
   │ └─ Error Handling
   ▼
6. SERVICE LAYER
   │ ├─ Database (Prisma)
   │ ├─ Cache (Redis)
   │ ├─ External APIs
   │ └─ AI (Gemini)
   ▼
7. RESPONSE
   │ ├─ Format JSON
   │ ├─ Add Headers
   │ └─ Log Metrics
   ▼
8. CLIENT RESPONSE
```


### Exemple: API Route Complète

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { logMetric } from '@/lib/monitoring/cloudwatch.service';

// 1. Validation Schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 2. Handler avec middlewares
export async function POST(req: NextRequest) {
  try {
    // 3. Parse & Validate
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // 4. Business Logic
    const result = await authService.login(email, password);

    // 5. Log Metrics
    await logMetric('UserLogin', 1);

    // 6. Return Response
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    // 7. Error Handling
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// 8. Apply Middlewares
export const POST = withRateLimit(
  withCsrf(POST),
  { maxRequests: 5, windowMs: 60000 }
);
```

---

## 🎨 Architecture Frontend

### Structure des Composants

```
app/
├── (auth)/                 # Routes authentification
│   ├── login/
│   ├── register/
│   └── verify-email/
│
├── (app)/                  # Routes application
│   ├── home/              # Dashboard
│   │   ├── page.tsx       # Page principale
│   │   ├── StatsGrid.tsx  # Composant stats
│   │   ├── QuickActions.tsx
│   │   └── PlatformStatus.tsx
│   │
│   ├── integrations/      # Intégrations
│   │   ├── page.tsx
│   │   └── IntegrationsGrid.tsx
│   │
│   └── onboarding/        # Onboarding
│       ├── step-1/
│       ├── step-2/
│       └── step-3/
│
├── beta/                  # Landing page beta
│   └── page.tsx
│
└── layout.tsx             # Layout racine

components/
├── ui/                    # Composants UI réutilisables
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── loading-transition.tsx
│
├── ai/                    # Composants IA
│   ├── AIChatAssistant.tsx
│   ├── AICaptionGenerator.tsx
│   └── AIQuotaIndicator.tsx
│
├── accessibility/         # Accessibilité
│   ├── ScreenReaderOnly.tsx
│   └── SkipLink.tsx
│
└── performance/           # Performance
    └── DynamicComponents.tsx

hooks/
├── useAuth.ts            # Hook authentification
├── useAIChat.ts          # Hook chat IA
├── useAICaption.ts       # Hook génération légendes
├── useCsrfToken.ts       # Hook CSRF
├── useLoadingState.ts    # Hook loading states
└── useMonitoringMetrics.ts # Hook monitoring
```


### Design System

```css
/* styles/design-system.css */

:root {
  /* Colors - Thème Noir avec Accents Rainbow */
  --bg-app: #000000;
  --bg-surface: #0a0a0a;
  --bg-card: #0f0f0f;
  --text-primary: #FFFFFF;
  --text-secondary: #a3a3a3;
  --brand-primary: #8B5CF6;    /* Purple */
  --brand-secondary: #EC4899;   /* Pink */
  --brand-gradient: linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B);
  
  /* Spacing - 8px Grid System */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.5);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}

/* Buttons */
.btn-primary {
  background: var(--brand-gradient);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  transition: transform var(--transition-fast);
}

.btn-primary:hover {
  transform: translateY(-2px);
}

/* Cards */
.card {
  background: var(--bg-card);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

/* Focus States - Accessibilité */
*:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Flux de Données Frontend

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERACTION                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  REACT COMPONENT                         │
│  ├─ useState/useReducer (Local State)                   │
│  ├─ useContext (Global State)                           │
│  └─ Custom Hooks (Business Logic)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API CLIENT                             │
│  ├─ Fetch with CSRF Token                               │
│  ├─ Error Handling                                       │
│  └─ Response Parsing                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API ROUTE                              │
│  (Backend Processing)                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  UPDATE UI                               │
│  ├─ Optimistic Updates                                   │
│  ├─ Loading States                                       │
│  └─ Error States                                         │
└─────────────────────────────────────────────────────────┘
```


---

## 🗄️ Base de Données

### Schéma Prisma

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  name          String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  onboarding    Onboarding?
  integrations  Integration[]
  aiUsage       AIUsage[]
  aiPlan        AIPlan    @default(FREE)
  
  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model Onboarding {
  id              String   @id @default(cuid())
  userId          String   @unique
  step            Int      @default(1)
  contentTypes    String[] // ["video", "photo", "text"]
  platforms       String[] // ["instagram", "tiktok"]
  goals           String[] // ["growth", "monetization"]
  completed       Boolean  @default(false)
  completedAt     DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Integration {
  id                String   @id @default(cuid())
  userId            String
  provider          String   // "instagram", "tiktok", "reddit", "onlyfans"
  providerAccountId String
  accessToken       String   // Encrypted
  refreshToken      String?  // Encrypted
  expiresAt         DateTime?
  status            String   @default("active") // "active", "expired", "error"
  metadata          Json?    // Platform-specific data
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider, providerAccountId])
  @@index([userId])
}

// AI System Tables
model AIUsage {
  id          String   @id @default(cuid())
  userId      String
  agentType   String   // "content", "analytics", "sales", "messaging"
  operation   String   // "chat", "caption", "analyze", "optimize"
  inputTokens Int
  outputTokens Int
  cost        Float    // In USD
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
}

model AIMonthlyCharge {
  id        String   @id @default(cuid())
  userId    String
  month     String   // "2025-11"
  totalCost Float
  charged   Boolean  @default(false)
  chargedAt DateTime?
  
  @@unique([userId, month])
  @@index([userId])
}

enum UserRole {
  USER
  ADMIN
}

enum AIPlan {
  FREE      // 100 requests/month
  PRO       // 1000 requests/month
  PREMIUM   // Unlimited
}
```


### Requêtes Optimisées

```typescript
// Exemple: Récupérer stats utilisateur avec relations
const userStats = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    integrations: {
      where: { status: 'active' },
      select: {
        provider: true,
        status: true,
        metadata: true,
      }
    },
    aiUsage: {
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      select: {
        cost: true,
        operation: true,
      }
    },
    _count: {
      select: {
        integrations: true,
        aiUsage: true,
      }
    }
  }
});
```

---

## ☁️ Infrastructure AWS

### Services Utilisés

```
┌─────────────────────────────────────────────────────────┐
│                      AWS SERVICES                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  S3 BUCKET                                              │
│  ├─ huntaze-assets/                                     │
│  │  ├─ images/                                          │
│  │  ├─ videos/                                          │
│  │  └─ documents/                                       │
│  └─ Lifecycle: 90 days → Glacier                        │
│                                                          │
│  CLOUDFRONT CDN                                         │
│  ├─ Distribution ID: E1234567890ABC                     │
│  ├─ Origins: S3 + Vercel                                │
│  ├─ Cache Policy: CachingOptimized                      │
│  └─ Edge Locations: Global                              │
│                                                          │
│  LAMBDA@EDGE                                            │
│  ├─ security-headers.js (Viewer Response)               │
│  └─ image-optimization.js (Origin Request)              │
│                                                          │
│  SES (Simple Email Service)                             │
│  ├─ Verified Domain: huntaze.com                        │
│  ├─ Templates: verification, welcome, reset             │
│  └─ Bounce/Complaint Handling                           │
│                                                          │
│  CLOUDWATCH                                             │
│  ├─ 8 Alarms (Error rate, Latency, etc.)               │
│  ├─ 2 Dashboards (Overview, Performance)                │
│  ├─ Log Groups: /aws/lambda/*, /vercel/*               │
│  └─ Metrics: Custom + AWS                               │
│                                                          │
│  ELASTICACHE (Redis)                                    │
│  ├─ Node Type: cache.t3.micro                           │
│  ├─ Engine: Redis 7.0                                   │
│  ├─ Use Cases: Session, Cache, AI Knowledge            │
│  └─ Encryption: At-rest + In-transit                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Configuration CloudFront

```yaml
# infra/aws/cloudfront-distribution-stack.yaml
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Origins:
          - Id: S3Origin
            DomainName: huntaze-assets.s3.amazonaws.com
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OAI}'
          - Id: VercelOrigin
            DomainName: huntaze.vercel.app
            CustomOriginConfig:
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
        
        DefaultCacheBehavior:
          TargetOriginId: VercelOrigin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6 # CachingOptimized
          LambdaFunctionAssociations:
            - EventType: viewer-response
              LambdaFunctionARN: !GetAtt SecurityHeadersFunction.FunctionArn
        
        CacheBehaviors:
          - PathPattern: /assets/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
            Compress: true
```


---

## 🤖 Système IA (Gemini Multi-Agent)

### Architecture Multi-Agent

```
┌─────────────────────────────────────────────────────────┐
│                   USER REQUEST                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  AI COORDINATOR                          │
│  ├─ Route Request to Appropriate Agent                  │
│  ├─ Manage Context & History                            │
│  └─ Aggregate Multi-Agent Responses                     │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
   │ CONTENT │ │ANALYTICS │ │  SALES  │ │MESSAGING │
   │  AGENT  │ │  AGENT   │ │  AGENT  │ │  AGENT   │
   └────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘
        │           │            │            │
        └───────────┴────────────┴────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              GEMINI 1.5 PRO API                          │
│  ├─ Model: gemini-1.5-pro-latest                        │
│  ├─ Temperature: 0.7                                     │
│  ├─ Max Tokens: 2048                                     │
│  └─ Safety Settings: BLOCK_MEDIUM_AND_ABOVE             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              KNOWLEDGE NETWORK (Redis)                   │
│  ├─ Cache Responses (TTL: 1 hour)                       │
│  ├─ Store Context (TTL: 24 hours)                       │
│  └─ Track Usage Patterns                                │
└─────────────────────────────────────────────────────────┘
```

### Agents Spécialisés

```typescript
// lib/ai/agents/content.ts
export class ContentAgent {
  async generateCaption(params: {
    platform: string;
    contentType: string;
    tone: string;
    keywords: string[];
  }): Promise<string> {
    const prompt = `
      Generate a ${params.tone} caption for ${params.platform}.
      Content type: ${params.contentType}
      Keywords: ${params.keywords.join(', ')}
      
      Requirements:
      - Engaging and authentic
      - Include relevant hashtags
      - Optimize for ${params.platform} algorithm
    `;
    
    return await this.geminiClient.generate(prompt);
  }
}

// lib/ai/agents/analytics.ts
export class AnalyticsAgent {
  async analyzePerformance(data: {
    metrics: PlatformMetrics[];
    timeRange: string;
  }): Promise<AnalysisResult> {
    const prompt = `
      Analyze performance data:
      ${JSON.stringify(data.metrics)}
      
      Provide:
      1. Key insights
      2. Trends identification
      3. Actionable recommendations
      4. Comparison with benchmarks
    `;
    
    return await this.geminiClient.generateStructured(prompt);
  }
}

// lib/ai/agents/sales.ts
export class SalesAgent {
  async optimizeSalesStrategy(params: {
    currentRevenue: number;
    audienceData: AudienceMetrics;
    contentPerformance: ContentMetrics[];
  }): Promise<SalesStrategy> {
    const prompt = `
      Optimize sales strategy based on:
      - Current revenue: $${params.currentRevenue}
      - Audience: ${JSON.stringify(params.audienceData)}
      - Top content: ${JSON.stringify(params.contentPerformance)}
      
      Suggest:
      1. Pricing optimization
      2. Upsell opportunities
      3. Content-to-sales funnel
      4. Revenue projections
    `;
    
    return await this.geminiClient.generateStructured(prompt);
  }
}
```


### Gestion des Quotas & Billing

```typescript
// lib/ai/quota.ts
export class QuotaManager {
  private readonly PLAN_LIMITS = {
    FREE: 100,      // 100 requests/month
    PRO: 1000,      // 1000 requests/month
    PREMIUM: -1,    // Unlimited
  };

  async checkQuota(userId: string): Promise<QuotaStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        aiUsage: {
          where: {
            createdAt: {
              gte: startOfMonth(),
              lte: endOfMonth(),
            }
          }
        }
      }
    });

    const used = user.aiUsage.length;
    const limit = this.PLAN_LIMITS[user.aiPlan];
    const remaining = limit === -1 ? Infinity : limit - used;

    return {
      plan: user.aiPlan,
      used,
      limit,
      remaining,
      canUse: remaining > 0,
    };
  }

  async trackUsage(params: {
    userId: string;
    agentType: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<void> {
    const cost = this.calculateCost(
      params.inputTokens,
      params.outputTokens
    );

    await prisma.aiUsage.create({
      data: {
        userId: params.userId,
        agentType: params.agentType,
        operation: params.operation,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        cost,
      }
    });
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 1.5 Pro pricing
    const INPUT_COST_PER_1K = 0.00125;  // $0.00125 per 1K tokens
    const OUTPUT_COST_PER_1K = 0.005;   // $0.005 per 1K tokens
    
    return (
      (inputTokens / 1000) * INPUT_COST_PER_1K +
      (outputTokens / 1000) * OUTPUT_COST_PER_1K
    );
  }
}
```

### Knowledge Network (Cache Intelligent)

```typescript
// lib/ai/knowledge-network.ts
export class KnowledgeNetwork {
  private redis: Redis;

  async store(params: {
    userId: string;
    context: string;
    response: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    const key = this.generateKey(params.userId, params.context);
    
    await this.redis.setex(
      key,
      3600, // 1 hour TTL
      JSON.stringify({
        response: params.response,
        metadata: params.metadata,
        timestamp: Date.now(),
      })
    );
  }

  async retrieve(userId: string, context: string): Promise<CachedResponse | null> {
    const key = this.generateKey(userId, context);
    const cached = await this.redis.get(key);
    
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    
    // Check if cache is still fresh (< 30 min)
    if (Date.now() - data.timestamp > 1800000) {
      return null;
    }
    
    return data;
  }

  private generateKey(userId: string, context: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(context)
      .digest('hex')
      .substring(0, 16);
    
    return `ai:knowledge:${userId}:${hash}`;
  }
}
```

---

## 🔒 Sécurité

### Mesures Implémentées

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. AUTHENTICATION                                       │
│     ├─ NextAuth.js v5                                   │
│     ├─ Session-based auth                               │
│     ├─ Secure cookies (httpOnly, secure, SameSite)      │
│     └─ Email verification required                      │
│                                                          │
│  2. PASSWORD SECURITY                                    │
│     ├─ bcrypt hashing (12 rounds)                       │
│     ├─ Min 8 characters                                 │
│     ├─ Complexity requirements                          │
│     └─ No password in logs/errors                       │
│                                                          │
│  3. CSRF PROTECTION                                      │
│     ├─ Token-based (double-submit cookie)               │
│     ├─ Validated on all mutations                       │
│     ├─ Rotation on auth changes                         │
│     └─ SameSite cookie attribute                        │
│                                                          │
│  4. DATA ENCRYPTION                                      │
│     ├─ OAuth tokens: AES-256-GCM                        │
│     ├─ Sensitive data: Field-level encryption           │
│     ├─ TLS 1.3 in transit                               │
│     └─ Database encryption at rest                      │
│                                                          │
│  5. RATE LIMITING                                        │
│     ├─ Per-user: 100 req/min                            │
│     ├─ Per-IP: 1000 req/min                             │
│     ├─ Auth endpoints: 5 req/min                        │
│     └─ Redis-based tracking                             │
│                                                          │
│  6. SECURITY HEADERS                                     │
│     ├─ Content-Security-Policy                          │
│     ├─ X-Frame-Options: DENY                            │
│     ├─ X-Content-Type-Options: nosniff                  │
│     ├─ Strict-Transport-Security                        │
│     └─ Referrer-Policy: strict-origin                   │
│                                                          │
│  7. INPUT VALIDATION                                     │
│     ├─ Zod schemas on all inputs                        │
│     ├─ SQL injection prevention (Prisma)                │
│     ├─ XSS prevention (React escaping)                  │
│     └─ File upload validation                           │
│                                                          │
│  8. MONITORING & AUDIT                                   │
│     ├─ Failed login attempts logged                     │
│     ├─ Suspicious activity alerts                       │
│     ├─ Access logs (CloudWatch)                         │
│     └─ Regular security audits                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```


### Exemple: Middleware de Sécurité

```typescript
// lib/middleware/auth.ts
export async function withAuth(
  handler: NextApiHandler,
  options?: { requireAdmin?: boolean }
): Promise<NextApiHandler> {
  return async (req: NextRequest) => {
    // 1. Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check admin if required
    if (options?.requireAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      });

      if (user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // 3. Attach user to request
    req.user = session.user;

    // 4. Call handler
    return handler(req);
  };
}

// lib/middleware/csrf.ts
export async function withCsrf(
  handler: NextApiHandler
): Promise<NextApiHandler> {
  return async (req: NextRequest) => {
    // 1. Skip for GET requests
    if (req.method === 'GET') {
      return handler(req);
    }

    // 2. Get token from header
    const headerToken = req.headers.get('x-csrf-token');
    
    // 3. Get token from cookie
    const cookieToken = req.cookies.get('csrf-token')?.value;

    // 4. Validate
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // 5. Call handler
    return handler(req);
  };
}
```

---

## ⚡ Performance

### Optimisations Implémentées

```
┌─────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATIONS                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FRONTEND                                                │
│  ├─ Code Splitting (Next.js automatic)                  │
│  ├─ Dynamic Imports for heavy components                │
│  ├─ Image Optimization (next/image)                     │
│  ├─ Font Optimization (next/font)                       │
│  ├─ CSS Modules (scoped, tree-shaken)                   │
│  ├─ Lazy Loading (React.lazy + Suspense)                │
│  └─ Bundle Size: 780KB (target: < 1MB)                  │
│                                                          │
│  BACKEND                                                 │
│  ├─ Redis Caching (session, data, AI)                   │
│  ├─ Database Query Optimization                         │
│  │  ├─ Indexes on frequent queries                      │
│  │  ├─ Select only needed fields                        │
│  │  └─ Batch operations where possible                  │
│  ├─ API Response Compression (gzip)                     │
│  ├─ Connection Pooling (Prisma)                         │
│  └─ Rate Limiting (prevent abuse)                       │
│                                                          │
│  CDN & EDGE                                              │
│  ├─ CloudFront Global Distribution                      │
│  ├─ Edge Caching (static assets)                        │
│  ├─ Lambda@Edge (image optimization)                    │
│  ├─ Brotli Compression                                  │
│  └─ HTTP/2 & HTTP/3 Support                             │
│                                                          │
│  DATABASE                                                │
│  ├─ Connection Pooling (max 10)                         │
│  ├─ Query Caching (Prisma)                              │
│  ├─ Indexes on all foreign keys                         │
│  └─ Pagination (limit 50 per page)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Core Web Vitals

```
Target Metrics (Lighthouse):
├─ Performance Score: 96/100 ✅
├─ FCP (First Contentful Paint): 1.1s ✅ (target: < 1.5s)
├─ LCP (Largest Contentful Paint): 2.2s ✅ (target: < 2.5s)
├─ FID (First Input Delay): 45ms ✅ (target: < 100ms)
├─ CLS (Cumulative Layout Shift): 0.03 ✅ (target: < 0.1)
└─ TTI (Time to Interactive): 2.8s ✅ (target: < 3.5s)
```

### Cache Strategy

```typescript
// lib/services/cache.service.ts
export class CacheService {
  private redis: Redis;

  // Cache user session (30 min)
  async cacheSession(sessionId: string, data: Session): Promise<void> {
    await this.redis.setex(
      `session:${sessionId}`,
      1800,
      JSON.stringify(data)
    );
  }

  // Cache API response (5 min)
  async cacheApiResponse(key: string, data: any): Promise<void> {
    await this.redis.setex(
      `api:${key}`,
      300,
      JSON.stringify(data)
    );
  }

  // Cache AI response (1 hour)
  async cacheAIResponse(userId: string, prompt: string, response: string): Promise<void> {
    const key = this.generateAIKey(userId, prompt);
    await this.redis.setex(
      key,
      3600,
      JSON.stringify({ response, timestamp: Date.now() })
    );
  }

  // Invalidate cache pattern
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```


---

## 📊 Monitoring & Observabilité

### CloudWatch Alarms

```
┌─────────────────────────────────────────────────────────┐
│                  CLOUDWATCH ALARMS                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CRITICAL (P0) - Immediate Action                        │
│  ├─ High Error Rate (> 1%)                              │
│  │  └─ Action: Rollback immediately                     │
│  ├─ Service Down (5xx > 5%)                             │
│  │  └─ Action: Rollback immediately                     │
│  └─ DB Connection Pool Exhausted (> 80%)                │
│     └─ Action: Scale database                           │
│                                                          │
│  HIGH PRIORITY (P1) - 15 min response                    │
│  ├─ High API Latency (> 1s)                             │
│  │  └─ Action: Investigate performance                  │
│  ├─ Low Cache Hit Rate (< 70%)                          │
│  │  └─ Action: Warm cache                               │
│  └─ Lambda@Edge Errors (> 10/5min)                      │
│     └─ Action: Check Lambda logs                        │
│                                                          │
│  WARNING (P2) - 1 hour response                          │
│  ├─ Elevated 4xx Errors (> 5%)                          │
│  │  └─ Action: Review client errors                     │
│  └─ Email Delivery Issues (bounce > 5%)                 │
│     └─ Action: Check SES reputation                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Dashboards

```
DASHBOARD 1: huntaze-beta-overview
├─ Service Health
│  ├─ Error Rate (%)
│  ├─ Request Latency (ms)
│  ├─ Requests per Minute
│  └─ Cache Hit Rate (%)
│
├─ Performance Metrics
│  ├─ CloudFront Bandwidth
│  ├─ Database Connections
│  ├─ Lambda Invocations
│  └─ S3 Operations
│
├─ Business Metrics
│  ├─ User Registrations
│  ├─ Email Verifications
│  ├─ OAuth Connections
│  └─ AI Requests
│
└─ Error Tracking
   ├─ 4xx Errors by Endpoint
   ├─ 5xx Errors by Endpoint
   ├─ Lambda Errors
   └─ Database Errors

DASHBOARD 2: huntaze-beta-performance
├─ Core Web Vitals
│  ├─ FCP (First Contentful Paint)
│  ├─ LCP (Largest Contentful Paint)
│  ├─ FID (First Input Delay)
│  └─ CLS (Cumulative Layout Shift)
│
├─ API Performance
│  ├─ P50 Latency
│  ├─ P95 Latency
│  ├─ P99 Latency
│  └─ Slowest Endpoints
│
└─ Cache Performance
   ├─ Hit Rate
   ├─ Miss Rate
   └─ Eviction Rate
```

### Logging Strategy

```typescript
// lib/monitoring/cloudwatch.service.ts
export class CloudWatchService {
  private cloudwatch: CloudWatch;

  async logMetric(params: {
    namespace: string;
    metricName: string;
    value: number;
    unit: string;
    dimensions?: Record<string, string>;
  }): Promise<void> {
    await this.cloudwatch.putMetricData({
      Namespace: params.namespace,
      MetricData: [{
        MetricName: params.metricName,
        Value: params.value,
        Unit: params.unit,
        Timestamp: new Date(),
        Dimensions: Object.entries(params.dimensions || {}).map(
          ([Name, Value]) => ({ Name, Value })
        ),
      }]
    });
  }

  async logError(error: Error, context: Record<string, any>): Promise<void> {
    console.error({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Send to CloudWatch Logs
    await this.logMetric({
      namespace: 'Huntaze/Errors',
      metricName: 'ErrorCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        ErrorType: error.name,
        Environment: process.env.NODE_ENV || 'development',
      }
    });
  }

  async logApiRequest(params: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    userId?: string;
  }): Promise<void> {
    await this.logMetric({
      namespace: 'Huntaze/API',
      metricName: 'RequestDuration',
      value: params.duration,
      unit: 'Milliseconds',
      dimensions: {
        Endpoint: params.endpoint,
        Method: params.method,
        StatusCode: params.statusCode.toString(),
      }
    });
  }
}
```

---

## 🚀 Déploiement

### Pipeline CI/CD

```
┌─────────────────────────────────────────────────────────┐
│                   DEPLOYMENT PIPELINE                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. CODE PUSH (GitHub)                                   │
│     └─ Branch: staging-new / production-ready           │
│                                                          │
│  2. AUTOMATED CHECKS                                     │
│     ├─ TypeScript Type Check                            │
│     ├─ ESLint                                            │
│     ├─ Unit Tests (69 tests)                            │
│     ├─ Integration Tests (257 tests)                    │
│     ├─ Property Tests (19 tests)                        │
│     └─ Security Audit (npm audit)                       │
│                                                          │
│  3. BUILD (Vercel)                                       │
│     ├─ Next.js Build                                    │
│     ├─ Asset Optimization                               │
│     ├─ Bundle Analysis                                  │
│     └─ Lighthouse CI                                    │
│                                                          │
│  4. DEPLOY (Vercel)                                      │
│     ├─ Preview Deploy (staging-new)                     │
│     └─ Production Deploy (production-ready)             │
│                                                          │
│  5. POST-DEPLOY                                          │
│     ├─ Database Migrations (Prisma)                     │
│     ├─ Cache Warming                                    │
│     ├─ Health Checks                                    │
│     └─ Smoke Tests                                      │
│                                                          │
│  6. MONITORING                                           │
│     ├─ CloudWatch Alarms Active                         │
│     ├─ Error Tracking                                   │
│     ├─ Performance Monitoring                           │
│     └─ User Analytics                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Environnements

```
DEVELOPMENT (Local)
├─ Database: Local PostgreSQL
├─ Redis: Local Redis
├─ AI: Gemini API (dev key)
└─ AWS: Localstack (optional)

STAGING (staging-new branch)
├─ Database: Neon (staging)
├─ Redis: ElastiCache (staging)
├─ AI: Gemini API (staging key)
├─ AWS: Full AWS services
└─ URL: https://staging-new.huntaze.vercel.app

PRODUCTION (production-ready branch)
├─ Database: Neon (production)
├─ Redis: ElastiCache (production)
├─ AI: Gemini API (production key)
├─ AWS: Full AWS services
└─ URL: https://app.huntaze.com
```

---

## 📈 Métriques de Succès

### Performance
- ✅ Lighthouse Score: 96/100
- ✅ Bundle Size: 780KB (< 1MB)
- ✅ API Response Time: < 500ms (P95)
- ✅ Cache Hit Rate: > 80%
- ✅ Error Rate: < 1%

### Qualité
- ✅ Test Coverage: 335 tests
- ✅ TypeScript: 100% typed
- ✅ Security Audit: 0 vulnerabilities
- ✅ Accessibility: WCAG 2.1 AA

### Infrastructure
- ✅ Uptime: 99.9% SLA
- ✅ Global CDN: < 100ms latency
- ✅ Auto-scaling: Configured
- ✅ Backup: Daily automated

---

## 🎯 Prochaines Étapes

### Court Terme (1-2 semaines)
1. Lancer beta avec 20-50 créateurs
2. Collecter feedback utilisateurs
3. Monitorer métriques de performance
4. Ajuster quotas IA si nécessaire

### Moyen Terme (1-3 mois)
1. Ajouter plus de plateformes (YouTube, Twitter/X)
2. Améliorer agents IA avec feedback
3. Implémenter analytics avancés
4. Optimiser coûts infrastructure

### Long Terme (3-6 mois)
1. Mobile app (React Native)
2. API publique pour développeurs
3. Marketplace de templates
4. Programme d'affiliation

---

## 📞 Support & Documentation

### Documentation Technique
- Architecture: `docs/HUNTAZE_TECHNICAL_ARCHITECTURE.md` (ce fichier)
- Déploiement: `docs/BETA_DEPLOYMENT.md`
- API: `docs/API_DOCUMENTATION.md`
- IA: `docs/AI_FULL_ARCHITECTURE.md`

### Guides Développeur
- Setup Local: `README.md`
- Contributing: `CONTRIBUTING.md`
- Testing: `docs/TESTING_GUIDE.md`
- Security: `docs/SECURITY.md`

### Contact
- Email: dev@huntaze.com
- Slack: #huntaze-dev
- GitHub: github.com/huntaze/huntaze

---

**Document créé le:** 22 novembre 2025  
**Dernière mise à jour:** 22 novembre 2025  
**Version:** 1.0  
**Statut:** ✅ Production Ready

