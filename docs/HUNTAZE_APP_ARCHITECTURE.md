# 🏗️ Architecture de l'App Huntaze

## 📋 Vue d'ensemble

Huntaze est une plateforme SaaS pour créateurs OnlyFans, construite avec **Next.js 16**, **React 19**, et **AWS**.

## 🎯 Concept Principal

L'app aide les créateurs OnlyFans à :
- 📊 Gérer leurs abonnés et revenus
- 💬 Automatiser les conversations (chatbot AI)
- 📸 Organiser leur contenu
- 📈 Analyser leurs performances
- 🎯 Créer des campagnes marketing

## 🏛️ Architecture Technique

### Stack Technologique

```
Frontend:
├─ Next.js 16 (App Router)
├─ React 19
├─ TypeScript
├─ Tailwind CSS 4
├─ Zustand (State Management)
└─ Framer Motion (Animations)

Backend:
├─ Next.js API Routes
├─ Auth.js v5 (Authentication)
├─ Prisma (ORM)
├─ PostgreSQL (Database)
└─ AWS Services

Infrastructure:
├─ AWS Amplify (Hosting)
├─ AWS SQS (Message Queue)
├─ AWS CloudWatch (Monitoring)
├─ AWS S3 (Storage)
└─ Terraform (IaC)
```

## 📁 Structure du Projet

```
huntaze/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Routes protégées
│   │   ├── dashboard/           # Page principale
│   │   ├── onlyfans/           # Section OnlyFans
│   │   ├── marketing/          # Section Marketing
│   │   ├── content/            # Section Content
│   │   ├── analytics/          # Section Analytics
│   │   ├── chatbot/            # Section Chatbot
│   │   └── settings/           # Section Settings
│   │
│   ├── (auth)/                  # Routes publiques
│   │   ├── login/
│   │   └── register/
│   │
│   └── api/                     # API Routes
│       ├── onlyfans/           # OnlyFans APIs
│       ├── marketing/          # Marketing APIs
│       ├── content/            # Content APIs
│       ├── analytics/          # Analytics APIs
│       ├── chatbot/            # Chatbot APIs
│       └── management/         # Management APIs
│
├── components/                  # Composants React
│   ├── auth/                   # Auth components
│   ├── dashboard/              # Dashboard components
│   ├── layout/                 # Layout components
│   └── ui/                     # UI primitives
│
├── hooks/                       # Custom React Hooks
│   └── api/                    # API hooks
│       ├── useOnlyFans.ts
│       ├── useMarketing.ts
│       ├── useContent.ts
│       ├── useAnalytics.ts
│       ├── useChatbot.ts
│       └── useManagement.ts
│
├── lib/                         # Utilities & Services
│   ├── services/               # Business logic
│   ├── utils/                  # Helper functions
│   └── config/                 # Configuration
│
├── prisma/                      # Database
│   └── schema.prisma           # DB Schema
│
├── infra/                       # Infrastructure
│   └── terraform/              # Terraform configs
│
└── tests/                       # Tests
    ├── unit/
    ├── integration/
    ├── e2e/
    └── regression/
```

## 🎨 Design Pattern: Feature-Based Architecture

### 6 Sections Principales

#### 1️⃣ OnlyFans Section
**But**: Gérer les abonnés et revenus

```
Composants:
├─ SubscribersList
├─ SubscriberCard
├─ EarningsChart
└─ TopSpenders

API Routes:
├─ /api/onlyfans/subscribers (GET, POST)
└─ /api/onlyfans/earnings (GET)

Hooks:
├─ useSubscribers()
└─ useEarnings()

Services:
└─ subscriber.service.ts
```

#### 2️⃣ Marketing Section
**But**: Créer des campagnes et segments

```
Composants:
├─ CampaignsList
├─ SegmentBuilder
├─ AutomationRules
└─ CampaignAnalytics

API Routes:
├─ /api/marketing/segments (GET, POST)
├─ /api/marketing/automation (GET, POST)
└─ /api/campaigns (GET, POST, PUT, DELETE)

Hooks:
├─ useSegments()
├─ useAutomations()
└─ useCampaigns()

Services:
├─ campaign.service.ts
├─ segmentation.service.ts
└─ automation.service.ts
```

#### 3️⃣ Content Section
**But**: Gérer et générer du contenu

```
Composants:
├─ ContentLibrary
├─ MediaUploader
├─ AIContentGenerator
└─ ContentScheduler

API Routes:
├─ /api/content/library (GET, POST)
└─ /api/content/ai-generate (POST)

Hooks:
├─ useContentLibrary()
└─ useAIGeneration()

Services:
├─ content-library.service.ts
├─ s3-storage.service.ts
└─ ai-generation.service.ts
```

#### 4️⃣ Analytics Section
**But**: Analyser les performances

```
Composants:
├─ AnalyticsDashboard
├─ RevenueChart
├─ EngagementMetrics
└─ TopContent

API Routes:
└─ /api/analytics/overview (GET)

Hooks:
└─ useAnalytics()

Services:
└─ analytics.service.ts
```

#### 5️⃣ Chatbot Section
**But**: Automatiser les conversations

```
Composants:
├─ ConversationsList
├─ ChatInterface
├─ AutoReplyRules
└─ ChatbotSettings

API Routes:
├─ /api/chatbot/conversations (GET, POST)
└─ /api/chatbot/auto-reply (GET, POST, PUT)

Hooks:
├─ useConversations()
└─ useAutoReplies()

Services:
├─ chatbot.service.ts
└─ websocket-connection.service.ts
```

#### 6️⃣ Management Section
**But**: Gérer le profil et paramètres

```
Composants:
├─ ProfileSettings
├─ NotificationSettings
├─ BillingSettings
└─ SecuritySettings

API Routes:
├─ /api/management/profile (GET, PUT)
└─ /api/management/settings (GET, PUT)

Hooks:
├─ useProfile()
└─ useSettings()

Services:
└─ user.service.ts
```

## 🔄 Flow de Données

### 1. User Interaction → Hook → API → Database

```typescript
// 1. User clicks button
<button onClick={handleAddSubscriber}>Add</button>

// 2. Component uses hook
const { addSubscriber } = useSubscribers();

// 3. Hook calls API
await addSubscriber({ username: 'john', email: 'john@example.com' });

// 4. API route processes
POST /api/onlyfans/subscribers
  → Auth check
  → Validation
  → Prisma query
  → Response

// 5. Database updated
prisma.subscriber.create({ ... })

// 6. Hook auto-refreshes
useEffect(() => fetchSubscribers(), [deps])

// 7. UI updates
{subscribers.map(sub => <Card key={sub.id} />)}
```

### 2. Real-time Updates (Chatbot)

```typescript
// WebSocket connection
const ws = new WebSocket('wss://...')

// Listen for messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  // Process auto-reply
  await processAutoReply(message)
  
  // Update UI
  setMessages(prev => [...prev, message])
}
```

## 🔐 Authentification Flow

```
1. User visits /login
   ↓
2. Enters credentials
   ↓
3. Auth.js v5 validates
   ↓
4. Session created
   ↓
5. Redirect to /dashboard
   ↓
6. Protected routes check session
   ↓
7. API routes verify auth()
```

## 📊 Database Schema (Prisma)

```prisma
model User {
  id                String         @id @default(cuid())
  email             String         @unique
  name              String?
  image             String?
  bio               String?
  onlyfansUsername  String?
  
  subscribers       Subscriber[]
  campaigns         Campaign[]
  media             Media[]
  conversations     Conversation[]
  segments          Segment[]
  automations       Automation[]
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Subscriber {
  id           String         @id @default(cuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id])
  
  username     String
  email        String
  tier         String         @default("free")
  isActive     Boolean        @default(true)
  onlyfansId   String?
  
  messages     Message[]
  transactions Transaction[]
  
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

model Campaign {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  name        String
  description String?
  status      String    @default("draft")
  type        String
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// ... autres modèles
```

## 🚀 Performance Optimizations

### 1. Next.js 16 Features

```typescript
// Parallel data fetching
const [data1, data2, data3] = await Promise.all([
  fetch('/api/subscribers'),
  fetch('/api/earnings'),
  fetch('/api/analytics')
])

// Streaming responses
export const runtime = 'nodejs'

// Type-safe routes
import { useRouter } from 'next/navigation'
```

### 2. React Hooks Optimizations

```typescript
// Auto-refresh with dependencies
useEffect(() => {
  fetchData()
}, [page, filters]) // Only refetch when these change

// Optimistic updates
const addSubscriber = async (data) => {
  // Update UI immediately
  setSubscribers(prev => [...prev, data])
  
  try {
    // Then sync with server
    await api.post('/subscribers', data)
  } catch (err) {
    // Rollback on error
    setSubscribers(prev => prev.filter(s => s.id !== data.id))
  }
}
```

### 3. Caching Strategy

```typescript
// API Routes with revalidation
export const revalidate = 60 // 60 seconds

// Client-side caching
const { data } = useSWR('/api/subscribers', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000
})
```

## 🔧 AWS Integration

### Rate Limiter (SQS)

```
User sends message
  ↓
API Route receives
  ↓
Add to SQS Queue
  ↓
Rate Limiter processes
  ↓
Send to OnlyFans API
  ↓
Update status in DB
```

### File Storage (S3)

```
User uploads media
  ↓
Upload to S3
  ↓
Get CloudFront URL
  ↓
Save URL in DB
  ↓
Display in UI
```

### Monitoring (CloudWatch)

```
API Route executes
  ↓
Log metrics
  ↓
CloudWatch collects
  ↓
Alarms trigger if needed
  ↓
Notify team
```

## 🎨 UI/UX Design Principles

### 1. Modern & Clean
- Tailwind CSS 4 pour styling
- Design system cohérent
- Dark mode support

### 2. Responsive
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly interfaces

### 3. Performant
- Lazy loading
- Code splitting
- Optimized images

### 4. Accessible
- ARIA labels
- Keyboard navigation
- Screen reader support

## 📈 Scalability

### Horizontal Scaling
- Stateless API routes
- Database connection pooling
- CDN for static assets

### Vertical Scaling
- Optimized queries
- Indexed database
- Caching layers

### Monitoring
- CloudWatch metrics
- Error tracking (Sentry)
- Performance monitoring

## 🔒 Security

### Authentication
- Auth.js v5 (secure sessions)
- JWT tokens
- CSRF protection

### Authorization
- Role-based access control
- API route protection
- Database-level permissions

### Data Protection
- Encrypted passwords (bcrypt)
- HTTPS only
- Input validation
- SQL injection prevention (Prisma)

## 🧪 Testing Strategy

### Unit Tests
- Components
- Hooks
- Services
- Utils

### Integration Tests
- API routes
- Database queries
- Auth flow

### E2E Tests
- User journeys
- Critical paths
- Cross-browser

### Regression Tests
- Performance baselines
- Memory leaks
- Breaking changes

## 📚 Documentation

### Code Documentation
- JSDoc comments
- TypeScript types
- README files

### API Documentation
- OpenAPI spec
- Integration guides
- Examples

### User Documentation
- Feature guides
- Tutorials
- FAQs

## 🎯 Best Practices Suivies

### Code Quality
✅ TypeScript strict mode
✅ ESLint + Prettier
✅ Git hooks (Husky)
✅ Code reviews

### Performance
✅ Lazy loading
✅ Code splitting
✅ Image optimization
✅ Bundle analysis

### Security
✅ Input validation
✅ XSS prevention
✅ CSRF tokens
✅ Rate limiting

### Maintainability
✅ Clean code
✅ DRY principle
✅ SOLID principles
✅ Documentation

## 🚀 Deployment

### CI/CD Pipeline

```
1. Push to GitHub
   ↓
2. Run tests
   ↓
3. Build app
   ↓
4. Deploy to AWS Amplify
   ↓
5. Run smoke tests
   ↓
6. Monitor metrics
```

### Environments
- **Development**: Local + Dev DB
- **Staging**: AWS Amplify + Staging DB
- **Production**: AWS Amplify + Production DB

## 📊 Monitoring & Analytics

### Application Metrics
- Response times
- Error rates
- User activity
- Feature usage

### Business Metrics
- Active users
- Revenue
- Conversion rates
- Retention

### Infrastructure Metrics
- CPU usage
- Memory usage
- Database performance
- API latency

---

**Architecture Version**: 2.0
**Last Updated**: 2025-01-30
**Status**: ✅ Production Ready
