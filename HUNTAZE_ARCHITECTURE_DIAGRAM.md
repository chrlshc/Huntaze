# 🏗️ Architecture Huntaze - Diagrammes Visuels

## 📊 Vue d'Ensemble Complète

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UTILISATEURS                                 │
│  Créateurs OnlyFans • Fans • Administrateurs                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFRONT CDN (Global)                           │
│  • Cache statique (images, CSS, JS)                                 │
│  • SSL/TLS termination                                               │
│  • DDoS protection                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NEXT.JS APPLICATION (Vercel/AWS Amplify)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Frontend   │  │  API Routes  │  │ Edge Functions│             │
│  │  • React 18  │  │  • REST API  │  │  • Middleware │             │
│  │  • SSR/SSG   │  │  • GraphQL   │  │  • Auth       │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ AZURE OPENAI │    │  POSTGRESQL  │    │    STRIPE    │
│              │    │  (Supabase)  │    │              │
│ • GPT-4o     │    │              │    │ • Payments   │
│ • GPT-4o-mini│    │ • Users      │    │ • Subs       │
│ • Routing    │    │ • Content    │    │ • Webhooks   │
│ • Caching    │    │ • Analytics  │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        │                    ▼                    │
        │           ┌──────────────┐             │
        │           │   AWS S3     │             │
        │           │              │             │
        │           │ • Media      │             │
        │           │ • Backups    │             │
        │           │ • Artifacts  │             │
        │           └──────────────┘             │
        │                                        │
        ▼                                        ▼
┌──────────────┐                        ┌──────────────┐
│ AZURE AI     │                        │  MONITORING  │
│ TEAM         │                        │              │
│              │                        │ • Sentry     │
│ • Multi-     │                        │ • DataDog    │
│   Agents     │                        │ • CloudWatch │
│ • Workflows  │                        │ • Analytics  │
└──────────────┘                        └──────────────┘
```

## 🔄 Flux de Données

### 1. Requête Utilisateur Standard

```
User Request
    │
    ▼
CloudFront CDN
    │
    ├─→ Cache Hit? → Return Cached Response
    │
    ▼ Cache Miss
Next.js App
    │
    ├─→ Static Page? → SSG → Return HTML
    │
    ├─→ Dynamic Page? → SSR → Fetch Data → Render → Return HTML
    │
    └─→ API Call? → API Route
                        │
                        ├─→ Database Query → PostgreSQL
                        │
                        ├─→ AI Request → Azure OpenAI → AI Router
                        │                                    │
                        │                                    ├─→ 90% → GPT-4o-mini
                        │                                    └─→ 10% → GPT-4o
                        │
                        └─→ Payment → Stripe API
```

### 2. Génération de Contenu AI

```
User: "Créer un post Instagram"
    │
    ▼
API Route: /api/content/generate
    │
    ├─→ Validate User (Auth)
    │
    ├─→ Check Subscription (Stripe)
    │
    ├─→ AI Router
    │       │
    │       ├─→ Task Type: marketing_template
    │       ├─→ Complexity: 3/10
    │       ├─→ Critical: false
    │       └─→ Decision: GPT-4o-mini
    │
    ├─→ Build Cached Prompt
    │       │
    │       ├─→ System (cached): "Tu es l'assistant Huntaze..."
    │       └─→ User (dynamic): "Créer post sur {topic}"
    │
    ├─→ Azure OpenAI API
    │       │
    │       └─→ GPT-4o-mini Response
    │
    ├─→ Save to Database
    │       │
    │       └─→ PostgreSQL: content table
    │
    ├─→ Track Analytics
    │       │
    │       └─→ PostgreSQL: analytics table
    │
    └─→ Return Response
            │
            └─→ User: Generated Content
```

### 3. Paiement Stripe

```
User: "Subscribe to Pro"
    │
    ▼
Frontend: Stripe Checkout
    │
    ├─→ Create Checkout Session
    │       │
    │       └─→ API: /api/stripe/create-checkout
    │               │
    │               └─→ Stripe API: Create Session
    │
    ├─→ Redirect to Stripe
    │
    ├─→ User Completes Payment
    │
    └─→ Stripe Webhook
            │
            ▼
API: /api/webhooks/stripe
    │
    ├─→ Verify Signature
    │
    ├─→ Handle Event
    │       │
    │       ├─→ subscription.created
    │       │       └─→ Update Database
    │       │
    │       ├─→ invoice.payment_succeeded
    │       │       └─→ Activate Subscription
    │       │
    │       └─→ subscription.deleted
    │               └─→ Deactivate Subscription
    │
    └─→ Return 200 OK
```

## 🔐 Sécurité et Authentification

```
┌─────────────────────────────────────────────────────────┐
│                    User Login                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NextAuth.js Middleware                      │
│  • Email/Password                                        │
│  • OAuth (Google, GitHub)                                │
│  • Magic Links                                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─→ Create Session
                     │       │
                     │       └─→ JWT Token (httpOnly cookie)
                     │
                     ├─→ Store in Database
                     │       │
                     │       └─→ PostgreSQL: sessions table
                     │
                     └─→ Return to User
                             │
                             └─→ Authenticated

┌─────────────────────────────────────────────────────────┐
│              Protected API Route                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Auth Middleware                             │
│  1. Extract JWT from cookie                              │
│  2. Verify signature                                     │
│  3. Check expiration                                     │
│  4. Load user from database                              │
│  5. Attach to request                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─→ Valid? → Continue to Handler
                     │
                     └─→ Invalid? → Return 401 Unauthorized
```

## 🧪 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────┐
│              Developer Push Code                         │
│              git push origin main                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub / CodeCommit                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─→ Trigger GitHub Actions
                     │       │
                     │       ├─→ Checkout Code
                     │       ├─→ Install Dependencies
                     │       ├─→ Type Check
                     │       ├─→ Lint
                     │       ├─→ Run Tests
                     │       └─→ Build
                     │
                     └─→ Trigger AWS CodeBuild
                             │
                             ├─→ Install Phase
                             │       └─→ Node.js 20 + npm ci
                             │
                             ├─→ Pre-Build Phase
                             │       ├─→ Fetch Secrets
                             │       ├─→ Start PostgreSQL (Docker)
                             │       ├─→ Start Stripe Mock (Docker)
                             │       └─→ Run Migrations
                             │
                             ├─→ Build Phase
                             │       ├─→ TypeScript Check
                             │       ├─→ Run Tests
                             │       └─→ Generate Coverage
                             │
                             └─→ Post-Build Phase
                                     ├─→ Cleanup Containers
                                     ├─→ Upload Artifacts to S3
                                     └─→ Send Notifications
                                             │
                                             ├─→ Success → Deploy
                                             │       │
                                             │       └─→ Vercel/AWS Amplify
                                             │
                                             └─→ Failure → Alert Team
                                                     │
                                                     ├─→ Slack
                                                     ├─→ Email
                                                     └─→ PagerDuty
```

## 💾 Architecture Base de Données

```
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                            │
│                    (Supabase)                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  users   │  │ content  │  │analytics │  │  subs    │
│          │  │          │  │          │  │          │
│ • id     │  │ • id     │  │ • id     │  │ • id     │
│ • email  │  │ • user_id│  │ • user_id│  │ • user_id│
│ • name   │  │ • title  │  │ • event  │  │ • stripe │
│ • tier   │  │ • body   │  │ • data   │  │ • status │
│ • created│  │ • type   │  │ • created│  │ • plan   │
└────┬─────┘  └────┬─────┘  └──────────┘  └────┬─────┘
     │             │                            │
     └─────────────┴────────────────────────────┘
                   │
                   ▼
           ┌──────────────┐
           │   Indexes    │
           │              │
           │ • user_id    │
           │ • email      │
           │ • created_at │
           │ • status     │
           └──────────────┘
```

## 🤖 Système de Routage AI

```
┌─────────────────────────────────────────────────────────┐
│              AI Request                                  │
│  taskType: 'chatbot'                                     │
│  prompt: 'Comment augmenter engagement?'                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AI Router                                   │
│  1. Analyze Request                                      │
│     • Task Type: chatbot                                 │
│     • Complexity: 3/10                                   │
│     • Critical: false                                    │
│     • Output Length: short                               │
│                                                          │
│  2. Decision Matrix                                      │
│     ┌──────────────────────────────────┐               │
│     │ Critical? → YES → GPT-4o         │               │
│     │           → NO  → Check Complexity│               │
│     │                   │                │               │
│     │                   ├─→ >7 → GPT-4o │               │
│     │                   └─→ <7 → mini   │               │
│     └──────────────────────────────────┘               │
│                                                          │
│  3. Selected Model: GPT-4o-mini                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Prompt Builder                              │
│  ┌────────────────────────────────────────────┐        │
│  │ STATIC (Cached 90% savings)                │        │
│  │ "Tu es l'assistant Huntaze..."             │        │
│  │ [1000 tokens]                              │        │
│  └────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────┐        │
│  │ DYNAMIC (Not cached)                       │        │
│  │ "User: {name}, Tier: {tier}"               │        │
│  │ "Query: {prompt}"                          │        │
│  │ [100 tokens]                               │        │
│  └────────────────────────────────────────────┘        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Azure OpenAI API                            │
│  Model: gpt-4o-mini                                      │
│  Tokens: 1100 (900 cached)                               │
│  Cost: $0.002                                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Response                                    │
│  • Content: AI generated text                            │
│  • Model: gpt-4o-mini                                    │
│  • Tokens: {input: 1100, output: 150, cached: 900}      │
│  • Latency: 234ms                                        │
│  • Cost: $0.002                                          │
└─────────────────────────────────────────────────────────┘
```

## 📊 Monitoring et Observabilité

```
┌─────────────────────────────────────────────────────────┐
│              Application Metrics                         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Sentry  │  │ DataDog  │  │CloudWatch│  │ Analytics│
│          │  │          │  │          │  │          │
│ • Errors │  │ • APM    │  │ • Logs   │  │ • Events │
│ • Traces │  │ • Metrics│  │ • Alarms │  │ • Users  │
│ • Issues │  │ • Traces │  │ • Metrics│  │ • Revenue│
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     └─────────────┴─────────────┴─────────────┘
                   │
                   ▼
           ┌──────────────┐
           │  Dashboard   │
           │              │
           │ • Uptime     │
           │ • Latency    │
           │ • Errors     │
           │ • AI Costs   │
           │ • Revenue    │
           └──────────────┘
```

---

**🎯 Architecture optimisée pour:**
- ✅ Performance (< 200ms p95)
- ✅ Scalabilité (millions d'utilisateurs)
- ✅ Coûts (98% économies AI)
- ✅ Sécurité (GDPR compliant)
- ✅ Disponibilité (99.9% uptime)
