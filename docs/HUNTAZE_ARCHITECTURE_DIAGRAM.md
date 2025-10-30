# 🎨 Huntaze - Diagrammes d'Architecture

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │OnlyFans  │  │Marketing │  │ Content  │  │Analytics │      │
│  │          │  │          │  │          │  │          │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │             │             │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐      │
│  │ Chatbot  │  │Management│  │          │  │          │      │
│  │          │  │          │  │          │  │          │      │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘      │
│       │             │                                          │
└───────┼─────────────┼──────────────────────────────────────────┘
        │             │
        ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REACT HOOKS LAYER                          │
│                                                                 │
│  useSubscribers  useSegments  useContent  useAnalytics         │
│  useEarnings     useAutomations  useAIGen  useChatbot          │
│  useSettings     useProfile                                     │
│                                                                 │
└───────┬─────────────┬───────────────────────────────────────────┘
        │             │
        ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
│                                                                 │
│  /api/onlyfans/*    /api/marketing/*    /api/content/*        │
│  /api/analytics/*   /api/chatbot/*      /api/management/*     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Auth.js v5 Middleware (Session Validation)          │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└───────┬─────────────┬───────────────────────────────────────────┘
        │             │
        ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Campaign    │  │  Content     │  │  Chatbot     │        │
│  │  Service     │  │  Service     │  │  Service     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Segmentation │  │  Analytics   │  │  Automation  │        │
│  │  Service     │  │  Service     │  │  Service     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
└───────┬─────────────┬───────────────────────────────────────────┘
        │             │
        ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    PRISMA ORM                           │   │
│  │  (Type-safe database queries & migrations)             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└───────┬─────────────┬───────────────────────────────────────────┘
        │             │
        ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                        │   │
│  │                                                         │   │
│  │  Users  Subscribers  Campaigns  Media  Messages        │   │
│  │  Segments  Automations  Conversations  Transactions    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow - Exemple: Ajouter un Abonné

```
┌──────────────┐
│   USER       │
│  clicks      │
│  "Add Sub"   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Component                           │
│  const { addSubscriber } =           │
│    useSubscribers()                  │
│                                      │
│  await addSubscriber({               │
│    username: 'john',                 │
│    email: 'john@example.com'         │
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Hook: useSubscribers()              │
│                                      │
│  1. Set loading = true               │
│  2. Call API                         │
│  3. Handle response                  │
│  4. Refresh list                     │
│  5. Set loading = false              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  API Route                           │
│  POST /api/onlyfans/subscribers      │
│                                      │
│  1. Check auth()                     │
│  2. Validate input                   │
│  3. Call Prisma                      │
│  4. Return response                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Prisma ORM                          │
│                                      │
│  prisma.subscriber.create({          │
│    data: {                           │
│      userId,                         │
│      username,                       │
│      email,                          │
│      tier: 'free'                    │
│    }                                 │
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│                                      │
│  INSERT INTO subscribers             │
│  VALUES (...)                        │
│                                      │
│  RETURNING *                         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Response flows back up              │
│                                      │
│  Database → Prisma → API → Hook     │
│  → Component → UI Update             │
└──────────────────────────────────────┘
```

## 🏗️ Component Architecture

```
app/
├── (dashboard)/
│   ├── layout.tsx                    ← Layout avec Sidebar
│   │   ├── <Sidebar />
│   │   ├── <Header />
│   │   └── {children}
│   │
│   ├── dashboard/
│   │   └── page.tsx                  ← Dashboard principal
│   │       ├── <MetricCards />
│   │       ├── <RevenueChart />
│   │       ├── <RecentActivity />
│   │       └── <QuickActions />
│   │
│   ├── onlyfans/
│   │   ├── subscribers/
│   │   │   └── page.tsx              ← Liste abonnés
│   │   │       ├── <SubscribersList />
│   │   │       ├── <SubscriberCard />
│   │   │       └── <AddSubscriberModal />
│   │   │
│   │   └── earnings/
│   │       └── page.tsx              ← Revenus
│   │           ├── <EarningsChart />
│   │           ├── <TopSpenders />
│   │           └── <EarningsBreakdown />
│   │
│   ├── marketing/
│   │   ├── campaigns/
│   │   │   └── page.tsx              ← Campagnes
│   │   │       ├── <CampaignsList />
│   │   │       ├── <CampaignCard />
│   │   │       └── <CreateCampaignModal />
│   │   │
│   │   ├── segments/
│   │   │   └── page.tsx              ← Segments
│   │   │       ├── <SegmentsList />
│   │   │       └── <SegmentBuilder />
│   │   │
│   │   └── automation/
│   │       └── page.tsx              ← Automation
│   │           ├── <AutomationRules />
│   │           └── <RuleBuilder />
│   │
│   ├── content/
│   │   ├── library/
│   │   │   └── page.tsx              ← Bibliothèque
│   │   │       ├── <ContentGrid />
│   │   │       ├── <MediaCard />
│   │   │       └── <UploadModal />
│   │   │
│   │   └── ai-generate/
│   │       └── page.tsx              ← Génération AI
│   │           ├── <AIGenerator />
│   │           └── <GeneratedContent />
│   │
│   ├── analytics/
│   │   └── page.tsx                  ← Analytics
│   │       ├── <AnalyticsOverview />
│   │       ├── <PerformanceCharts />
│   │       └── <TopContent />
│   │
│   ├── chatbot/
│   │   ├── conversations/
│   │   │   └── page.tsx              ← Conversations
│   │   │       ├── <ConversationsList />
│   │   │       └── <ChatInterface />
│   │   │
│   │   └── auto-reply/
│   │       └── page.tsx              ← Auto-réponses
│   │           ├── <AutoReplyRules />
│   │           └── <RuleEditor />
│   │
│   └── settings/
│       └── page.tsx                  ← Paramètres
│           ├── <ProfileSettings />
│           ├── <NotificationSettings />
│           └── <BillingSettings />
│
└── (auth)/
    ├── login/
    │   └── page.tsx                  ← Login
    │       └── <LoginForm />
    │
    └── register/
        └── page.tsx                  ← Register
            └── <RegisterForm />
```

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Authentication                      │
└─────────────────────────────────────────────────────────────┘

1. User visits /login
   │
   ▼
2. Enters credentials
   │
   ▼
3. Form submits to Auth.js
   │
   ▼
4. Auth.js validates credentials
   │
   ├─ Valid ──────────────┐
   │                      │
   │                      ▼
   │              5. Create session
   │                      │
   │                      ▼
   │              6. Set cookie
   │                      │
   │                      ▼
   │              7. Redirect to /dashboard
   │
   └─ Invalid ────────────┐
                          │
                          ▼
                  Show error message


Protected Route Access:
┌─────────────────────────────────────────────────────────────┐
│  User visits /dashboard                                     │
│         │                                                   │
│         ▼                                                   │
│  Middleware checks session                                  │
│         │                                                   │
│         ├─ Valid session ──────► Allow access              │
│         │                                                   │
│         └─ No session ──────────► Redirect to /login       │
└─────────────────────────────────────────────────────────────┘


API Route Protection:
┌─────────────────────────────────────────────────────────────┐
│  Request to /api/onlyfans/subscribers                       │
│         │                                                   │
│         ▼                                                   │
│  const session = await auth()                               │
│         │                                                   │
│         ├─ session?.user ──────► Process request           │
│         │                                                   │
│         └─ No session ──────────► Return 401 Unauthorized  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 AWS Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HUNTAZE APPLICATION                      │
│                    (AWS Amplify)                            │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────┐
             │                                          │
             ▼                                          ▼
┌────────────────────────┐              ┌────────────────────────┐
│    AWS SQS Queue       │              │      AWS S3            │
│  (Message Rate Limit)  │              │  (Media Storage)       │
│                        │              │                        │
│  ┌──────────────────┐ │              │  ┌──────────────────┐ │
│  │ Message Queue    │ │              │  │ Images/Videos    │ │
│  │ (FIFO)           │ │              │  │                  │ │
│  └──────────────────┘ │              │  └──────────────────┘ │
│                        │              │                        │
│  Rate: 2 msg/sec       │              │  CDN: CloudFront      │
└────────┬───────────────┘              └────────┬───────────────┘
         │                                       │
         ▼                                       ▼
┌────────────────────────┐              ┌────────────────────────┐
│  OnlyFans API          │              │  Users download        │
│  (External)            │              │  media                 │
└────────────────────────┘              └────────────────────────┘

             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS CloudWatch                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Metrics    │  │    Logs      │  │   Alarms     │    │
│  │              │  │              │  │              │    │
│  │ - API calls  │  │ - Errors     │  │ - High error │    │
│  │ - Latency    │  │ - Requests   │  │ - Slow API   │    │
│  │ - Errors     │  │ - Events     │  │ - Queue full │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📊 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    ZUSTAND STORES                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐
│   UI Store       │    │   User Store     │
│                  │    │                  │
│ - sidebarOpen    │    │ - currentUser    │
│ - theme          │    │ - preferences    │
│ - notifications  │    │ - settings       │
└──────────────────┘    └──────────────────┘

         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   React Components    │
         │                       │
         │  const { user } =     │
         │    useUserStore()     │
         └───────────────────────┘


Server State (React Hooks):
┌─────────────────────────────────────────────────────────────┐
│  useSubscribers()  →  Fetches from /api/onlyfans/subscribers│
│  useEarnings()     →  Fetches from /api/onlyfans/earnings   │
│  useAnalytics()    →  Fetches from /api/analytics/overview  │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

**Version**: 2.0
**Last Updated**: 2025-01-30
**Status**: ✅ Production Ready
