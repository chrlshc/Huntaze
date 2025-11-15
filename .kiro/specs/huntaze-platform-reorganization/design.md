# Design Document - Huntaze Platform Reorganization

**Date:** 13 Novembre 2025  
**Version:** 1.0  
**Status:** Draft

---

## 1. Overview

Ce document décrit l'architecture technique pour la réorganisation complète de la plateforme Huntaze. L'objectif est de créer une structure claire avec 6 sections principales, en connectant les backends existants (85% déjà codés) aux UIs, et en utilisant **uniquement des vraies données**.

### Objectifs Principaux

1. **Unifier l'architecture** - 6 sections claires au lieu de 50+ routes dispersées
2. **Connecter l'existant** - 85% du backend est prêt, il faut juste les UIs
3. **Vraies données partout** - Éliminer tout mock data
4. **UX cohérente** - Navigation unifiée, design system, dark mode
5. **Performance** - Loading states, caching, lazy loading

### Principes de Design

- **Backend First** - Utiliser les APIs existantes en priorité
- **Progressive Enhancement** - Commencer simple, améliorer progressivement
- **Real Data Only** - Pas de mock, toujours fetch depuis les APIs
- **Error Resilience** - Fallbacks gracieux, retry logic
- **Mobile First** - Responsive design partout

---

## 2. Architecture

### 2.1 Structure Globale

```
Huntaze Platform
│
├── App Shell (Layout)
│   ├── Header (Navigation principale)
│   ├── Sidebar (Navigation secondaire)
│   └── Main Content Area
│
├── 6 Sections Principales
│   ├── 1. Dashboard
│   ├── 2. Content
│   ├── 3. Analytics
│   ├── 4. Marketing & Social
│   ├── 5. OnlyFans
│   └── 6. Messages
│
└── Infrastructure
    ├── API Layer (BFF Pattern)
    ├── Services Layer
    ├── Hooks Layer
    └── Components Library
```

### 2.2 Routing Structure

```
app/
├── (app)/                          # Authenticated app shell
│   ├── layout.tsx                  # Main layout avec sidebar
│   ├── dashboard/
│   │   └── page.tsx                # ✅ Existe déjà
│   ├── content/
│   │   ├── page.tsx                # ✅ Existe déjà
│   │   ├── create/
│   │   │   └── page.tsx            # Nouveau
│   │   └── [id]/
│   │       └── page.tsx            # Nouveau (détails)
│   ├── analytics/
│   │   ├── page.tsx                # ✅ Existe déjà
│   │   ├── pricing/
│   │   │   └── page.tsx            # Nouveau
│   │   ├── churn/
│   │   │   └── page.tsx            # Nouveau
│   │   ├── upsells/
│   │   │   └── page.tsx            # Nouveau
│   │   ├── forecast/
│   │   │   └── page.tsx            # Nouveau
│   │   └── payouts/
│   │       └── page.tsx            # Nouveau
│   ├── marketing/
│   │   ├── page.tsx                # ⚠️ Existe (placeholder)
│   │   ├── campaigns/
│   │   │   ├── page.tsx            # Nouveau
│   │   │   └── new/
│   │   │       └── page.tsx        # Nouveau
│   │   ├── social/
│   │   │   ├── page.tsx            # Nouveau (multi-platform)
│   │   │   ├── instagram/
│   │   │   │   └── page.tsx        # Nouveau
│   │   │   ├── tiktok/
│   │   │   │   └── page.tsx        # Nouveau
│   │   │   └── reddit/
│   │   │       └── page.tsx        # Nouveau
│   │   └── calendar/
│   │       └── page.tsx            # Nouveau
│   ├── onlyfans/
│   │   ├── page.tsx                # ✅ Existe déjà
│   │   ├── messages/
│   │   │   └── page.tsx            # ✅ Existe déjà
│   │   ├── fans/
│   │   │   └── page.tsx            # Nouveau
│   │   └── ppv/
│   │       └── page.tsx            # Nouveau
│   └── messages/
│       ├── page.tsx                # Nouveau (unified inbox)
│       └── [platform]/
│           └── [threadId]/
│               └── page.tsx        # Nouveau (conversation)
│
└── api/                            # API Routes
    ├── dashboard/
    │   └── route.ts                # ✅ Existe déjà (BFF)
    ├── content/
    │   └── ...                     # ✅ Existe déjà (6 routes)
    ├── revenue/
    │   └── ...                     # ✅ Existe déjà (15 routes)
    ├── marketing/
    │   ├── campaigns/
    │   │   └── route.ts            # Nouveau
    │   └── social/
    │       └── route.ts            # Nouveau
    ├── onlyfans/
    │   └── ...                     # ✅ Existe déjà
    └── messages/
        └── unified/
            └── route.ts            # Nouveau
```

---

## 3. Components & Interfaces

### 3.1 App Shell

#### Layout Component

```typescript
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar sections={MAIN_SECTIONS} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Navigation Structure

```typescript
const MAIN_SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'FileText',
    href: '/content',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    href: '/analytics',
    subSections: [
      { label: 'Overview', href: '/analytics' },
      { label: 'Pricing', href: '/analytics/pricing' },
      { label: 'Churn', href: '/analytics/churn' },
      { label: 'Upsells', href: '/analytics/upsells' },
      { label: 'Forecast', href: '/analytics/forecast' },
      { label: 'Payouts', href: '/analytics/payouts' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Social',
    icon: 'Megaphone',
    href: '/marketing',
    subSections: [
      { label: 'Campaigns', href: '/marketing/campaigns' },
      { label: 'Social Media', href: '/marketing/social' },
      { label: 'Calendar', href: '/marketing/calendar' },
    ],
  },
  {
    id: 'onlyfans',
    label: 'OnlyFans',
    icon: 'Heart',
    href: '/onlyfans',
    subSections: [
      { label: 'Dashboard', href: '/onlyfans' },
      { label: 'Messages', href: '/onlyfans/messages' },
      { label: 'Fans', href: '/onlyfans/fans' },
      { label: 'PPV', href: '/onlyfans/ppv' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: 'MessageSquare',
    href: '/messages',
    badge: 'unreadCount', // Dynamic badge
  },
];
```

---

## 4. Data Models

### 4.1 Dashboard

```typescript
interface DashboardData {
  summary: {
    totalRevenue: {
      value: number;
      currency: string;
      change: number; // Percentage
    };
    activeFans: {
      value: number;
      change: number;
    };
    messages: {
      total: number;
      unread: number;
    };
    engagement: {
      value: number; // 0-1
      change: number;
    };
  };
  trends: {
    revenue: Array<{ date: string; value: number }>;
    fans: Array<{ date: string; value: number }>;
  };
  recentActivity: Array<{
    id: string;
    type: 'content_published' | 'campaign_sent' | 'fan_subscribed' | 'message_received';
    title: string;
    createdAt: string;
    source: 'content' | 'marketing' | 'onlyfans' | 'messages';
    meta?: Record<string, any>;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
  }>;
}
```

### 4.2 Content

```typescript
interface ContentItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'text';
  platform: 'onlyfans' | 'instagram' | 'tiktok' | 'fansly';
  status: 'draft' | 'scheduled' | 'published';
  content?: string;
  mediaIds?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Marketing Campaign

```typescript
interface Campaign {
  id: string;
  name: string;
  goal: 'retention' | 'upsell' | 'reactivation';
  channel: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  
  // Audience
  audienceType: 'segment' | 'rfm' | 'custom';
  audienceId?: string;
  targetCount: number;
  
  // Message
  messageTemplate?: string;
  messageContent?: string;
  
  // Scheduling
  scheduledAt?: string;
  launchedAt?: string;
  completedAt?: string;
  
  // Stats (Real Data)
  sentCount: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  revenue?: number;
  
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Unified Message

```typescript
interface UnifiedMessage {
  id: string;
  platform: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit';
  threadId: string;
  fanId: string;
  fanName: string;
  fanAvatar?: string;
  
  // Message
  content: string;
  mediaUrls?: string[];
  type: 'text' | 'image' | 'video' | 'audio';
  
  // Status
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'normal' | 'high';
  
  // AI
  aiSuggestions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  
  // Timestamps
  sentAt: string;
  readAt?: string;
  
  createdAt: string;
}
```

---

## 5. API Layer (BFF Pattern)

### 5.1 Dashboard API

**Endpoint:** `GET /api/dashboard`

**Query Params:**
- `range`: '7d' | '30d' | '90d' | 'custom'
- `from`: ISO date (optional)
- `to`: ISO date (optional)

**Implementation:**

```typescript
// app/api/dashboard/route.ts (✅ Existe déjà)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '30d';
  
  // Parallel API calls to existing backends
  const [analytics, fans, messages, content] = await Promise.all([
    fetch(`/api/analytics/overview?range=${range}`).then(r => r.json()),
    fetch('/api/fans/metrics').then(r => r.json()),
    fetch('/api/messages/unread-count').then(r => r.json()),
    fetch('/api/content?limit=10').then(r => r.json()),
  ]);
  
  // Aggregate and normalize
  return NextResponse.json({
    summary: {
      totalRevenue: {
        value: analytics.totalRevenue || 0,
        currency: 'USD',
        change: analytics.revenueChange || 0,
      },
      // ... rest of aggregation
    },
  });
}
```

### 5.2 Marketing Campaigns API

**Endpoints:**

```typescript
// app/api/marketing/campaigns/route.ts (Nouveau)
GET  /api/marketing/campaigns          // List campaigns
POST /api/marketing/campaigns          // Create campaign

// app/api/marketing/campaigns/[id]/route.ts (Nouveau)
GET    /api/marketing/campaigns/[id]   // Get campaign
PUT    /api/marketing/campaigns/[id]   // Update campaign
DELETE /api/marketing/campaigns/[id]   // Delete campaign

// app/api/marketing/campaigns/[id]/launch/route.ts (Nouveau)
POST /api/marketing/campaigns/[id]/launch  // Launch campaign
```

**Implementation:**

```typescript
// app/api/marketing/campaigns/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const campaigns = await db.query(`
    SELECT * FROM campaigns
    WHERE creator_id = $1
    ORDER BY created_at DESC
  `, [session.user.id]);
  
  return NextResponse.json({ data: campaigns.rows });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await request.json();
  
  // Validate
  const schema = z.object({
    name: z.string().min(1),
    goal: z.enum(['retention', 'upsell', 'reactivation']),
    channel: z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit']),
    audienceType: z.enum(['segment', 'rfm', 'custom']),
    messageContent: z.string().min(1),
  });
  
  const validated = schema.parse(body);
  
  // Create campaign
  const campaign = await db.query(`
    INSERT INTO campaigns (creator_id, name, goal, channel, audience_type, message_content, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'draft')
    RETURNING *
  `, [session.user.id, validated.name, validated.goal, validated.channel, validated.audienceType, validated.messageContent]);
  
  return NextResponse.json({ data: campaign.rows[0] });
}
```

### 5.3 Unified Messages API

**Endpoint:** `GET /api/messages/unified`

**Query Params:**
- `platform`: 'all' | 'onlyfans' | 'instagram' | 'tiktok' | 'reddit'
- `filter`: 'all' | 'unread' | 'starred' | 'priority'
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Implementation:**

```typescript
// app/api/messages/unified/route.ts (Nouveau)
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform') || 'all';
  const filter = searchParams.get('filter') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  // Fetch from multiple sources in parallel
  const sources = [];
  
  if (platform === 'all' || platform === 'onlyfans') {
    sources.push(
      fetch('/api/of-messages').then(r => r.json())
        .then(data => data.map((msg: any) => ({ ...msg, platform: 'onlyfans' })))
    );
  }
  
  if (platform === 'all' || platform === 'instagram') {
    sources.push(
      fetch('/api/instagram/messages').then(r => r.json())
        .then(data => data.map((msg: any) => ({ ...msg, platform: 'instagram' })))
    );
  }
  
  // ... other platforms
  
  const allMessages = (await Promise.all(sources)).flat();
  
  // Filter
  let filtered = allMessages;
  if (filter === 'unread') {
    filtered = allMessages.filter(msg => !msg.isRead);
  } else if (filter === 'starred') {
    filtered = allMessages.filter(msg => msg.isStarred);
  } else if (filter === 'priority') {
    filtered = allMessages.filter(msg => msg.priority === 'high');
  }
  
  // Sort by date (most recent first)
  filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  
  // Paginate
  const paginated = filtered.slice(offset, offset + limit);
  
  return NextResponse.json({
    data: paginated,
    meta: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    },
  });
}
```

---

## 6. Hooks Layer

### 6.1 Dashboard Hook

```typescript
// hooks/useDashboard.ts (✅ Existe déjà)
export function useDashboard(options: {
  range?: string;
  refetchInterval?: number;
}) {
  return useSWR(
    `/api/dashboard?range=${options.range || '30d'}`,
    fetcher,
    {
      refreshInterval: options.refetchInterval || 60000,
      revalidateOnFocus: true,
    }
  );
}
```

### 6.2 Marketing Campaigns Hook

```typescript
// hooks/useMarketingCampaigns.ts (Nouveau)
export function useMarketingCampaigns() {
  const { data, error, mutate } = useSWR('/api/marketing/campaigns', fetcher);
  
  const createCampaign = async (campaign: Partial<Campaign>) => {
    const res = await fetch('/api/marketing/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });
    
    if (!res.ok) throw new Error('Failed to create campaign');
    
    mutate(); // Refresh list
    return res.json();
  };
  
  const launchCampaign = async (id: string) => {
    const res = await fetch(`/api/marketing/campaigns/${id}/launch`, {
      method: 'POST',
    });
    
    if (!res.ok) throw new Error('Failed to launch campaign');
    
    mutate(); // Refresh list
    return res.json();
  };
  
  return {
    campaigns: data?.data || [],
    isLoading: !error && !data,
    error,
    createCampaign,
    launchCampaign,
    mutate,
  };
}
```

### 6.3 Unified Messages Hook

```typescript
// hooks/useUnifiedMessages.ts (Nouveau)
export function useUnifiedMessages(options: {
  platform?: string;
  filter?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({
    platform: options.platform || 'all',
    filter: options.filter || 'all',
    limit: String(options.limit || 50),
  });
  
  const { data, error, mutate } = useSWR(
    `/api/messages/unified?${params}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
    }
  );
  
  const markAsRead = async (messageId: string) => {
    await fetch(`/api/messages/${messageId}/read`, { method: 'POST' });
    mutate();
  };
  
  const sendReply = async (threadId: string, content: string) => {
    const res = await fetch(`/api/messages/${threadId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    
    if (!res.ok) throw new Error('Failed to send reply');
    
    mutate();
    return res.json();
  };
  
  return {
    messages: data?.data || [],
    meta: data?.meta,
    isLoading: !error && !data,
    error,
    markAsRead,
    sendReply,
    mutate,
  };
}
```

---

## 7. Error Handling

### 7.1 API Error Handling

```typescript
// lib/errors/api-error.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) return error;
  
  if (error instanceof Error) {
    return new APIError(500, error.message);
  }
  
  return new APIError(500, 'An unknown error occurred');
}
```

### 7.2 UI Error Boundaries

```typescript
// components/shared/ErrorBoundary.tsx (✅ Existe déjà)
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={({ error, resetErrorBoundary }) => (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">
            {error.message}
          </p>
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

### 7.3 Loading States

```typescript
// components/shared/LoadingState.tsx (✅ Existe déjà)
export function LoadingState({ variant = 'spinner', count = 1 }: {
  variant?: 'spinner' | 'skeleton' | 'card';
  count?: number;
}) {
  if (variant === 'spinner') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }
  
  if (variant === 'skeleton') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  
  // Card variant
  return (
    <div className="grid gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

- **Hooks:** Test data fetching, mutations, error handling
- **Components:** Test rendering, interactions, edge cases
- **Services:** Test business logic, data transformations
- **Utils:** Test formatters, validators, helpers

### 8.2 Integration Tests

- **API Routes:** Test endpoints with real database
- **Workflows:** Test complete user flows (create campaign, send message)
- **Error Scenarios:** Test error handling, retries, fallbacks

### 8.3 E2E Tests

- **Critical Paths:** Dashboard load, content creation, campaign launch
- **Cross-Platform:** Test unified inbox with multiple platforms
- **Performance:** Test loading times, caching, lazy loading

---

## 9. Performance Optimization

### 9.1 Caching Strategy

```typescript
// Redis caching for expensive queries
const CACHE_TTL = {
  dashboard: 5 * 60,      // 5 minutes
  analytics: 10 * 60,     // 10 minutes
  campaigns: 2 * 60,      // 2 minutes
  messages: 30,           // 30 seconds
};

// Example: Dashboard caching
export async function GET(request: NextRequest) {
  const cacheKey = `dashboard:${userId}:${range}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));
  
  // Fetch fresh data
  const data = await fetchDashboardData(userId, range);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, CACHE_TTL.dashboard, JSON.stringify(data));
  
  return NextResponse.json(data);
}
```

### 9.2 Lazy Loading

```typescript
// Lazy load heavy components
const TrendChart = dynamic(() => import('@/components/dashboard/TrendChart'), {
  loading: () => <LoadingState variant="card" />,
  ssr: false,
});

const RevenueForecastChart = dynamic(() => import('@/components/revenue/forecast/RevenueForecastChart'), {
  loading: () => <LoadingState variant="card" />,
  ssr: false,
});
```

### 9.3 Pagination

```typescript
// Paginate large lists
const ITEMS_PER_PAGE = 20;

export function useMarketingCampaigns(page: number = 1) {
  return useSWR(
    `/api/marketing/campaigns?page=${page}&limit=${ITEMS_PER_PAGE}`,
    fetcher
  );
}
```

---

## 10. Migration Plan

### Phase 1: Foundation (Semaine 1)

1. **Créer le nouveau layout** avec sidebar 6 sections
2. **Migrer Dashboard** (déjà fait ✅)
3. **Migrer Content** (déjà fait ✅)
4. **Migrer Analytics** (overview déjà fait ✅)

### Phase 2: Marketing & Social (Semaine 2-3)

1. **Créer Marketing Campaigns API** (nouveau)
2. **Créer Marketing Campaigns UI** (nouveau)
3. **Créer Social Media Hub** (connecter OAuth existant)
4. **Créer Content Calendar** (nouveau)

### Phase 3: Messages & OnlyFans (Semaine 4)

1. **Créer Unified Inbox API** (nouveau)
2. **Créer Unified Inbox UI** (nouveau)
3. **Améliorer OnlyFans Suite** (connecter features existantes)
4. **Intégrer CIN AI partout**

### Phase 4: Polish & Optimization (Semaine 5-6)

1. **Ajouter pages détaillées Analytics** (Pricing, Churn, Upsells, Forecast, Payouts)
2. **Optimiser performance** (caching, lazy loading)
3. **Tests d'intégration**
4. **Documentation**

---

## 11. Success Metrics

### Technical Metrics

- **API Response Time:** < 200ms (p95)
- **Page Load Time:** < 2s (p95)
- **Error Rate:** < 1%
- **Cache Hit Rate:** > 80%
- **Test Coverage:** > 70%

### User Metrics

- **Navigation Clarity:** Users find features in < 3 clicks
- **Data Freshness:** Real data everywhere, no mock
- **Error Recovery:** Graceful fallbacks, clear error messages
- **Mobile Experience:** Fully responsive, touch-friendly

---

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| APIs retournent erreurs | 🔴 High | Fallbacks, retry logic, error boundaries |
| Performance agrégation | 🟡 Medium | Redis caching, pagination, lazy loading |
| Complexité unified inbox | 🟡 Medium | Start simple, iterate progressively |
| Migration breaking changes | 🟡 Medium | Feature flags, gradual rollout |

---

## 13. Next Steps

1. **Review ce design** avec l'équipe
2. **Créer les tasks** dans tasks.md
3. **Commencer Phase 1** (Foundation)
4. **Itérer progressivement**

---

**Document créé par:** Kiro AI Assistant  
**Date:** 13 Novembre 2025  
**Version:** 1.0
