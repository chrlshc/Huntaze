# Design Document

## Overview

Cette solution implémente les APIs backend manquantes pour les pages Content, Analytics, Marketing et OnlyFans. L'architecture suit les patterns Next.js App Router avec des route handlers, utilise Prisma pour l'accès database, et implémente des middlewares pour l'authentification, la validation et le rate limiting.

## Architecture

### Structure des Dossiers

```
app/api/
├── content/
│   ├── route.ts                 # GET /api/content, POST /api/content
│   ├── [id]/
│   │   └── route.ts            # GET, PUT, DELETE /api/content/[id]
│   └── (existing subdirs...)
├── analytics/
│   ├── overview/
│   │   └── route.ts            # GET /api/analytics/overview
│   └── trends/
│       └── route.ts            # GET /api/analytics/trends
├── marketing/
│   └── campaigns/
│       ├── route.ts            # GET, POST /api/marketing/campaigns
│       └── [id]/
│           └── route.ts        # GET, PUT, DELETE /api/marketing/campaigns/[id]
└── onlyfans/
    ├── fans/
    │   └── route.ts            # GET /api/onlyfans/fans
    ├── stats/
    │   └── route.ts            # GET /api/onlyfans/stats
    └── content/
        └── route.ts            # GET /api/onlyfans/content

lib/
├── api/
│   ├── middleware/
│   │   ├── auth.ts             # Authentication middleware
│   │   ├── validation.ts       # Request validation
│   │   └── rate-limit.ts       # Rate limiting
│   ├── services/
│   │   ├── content.service.ts  # Content business logic
│   │   ├── analytics.service.ts # Analytics calculations
│   │   ├── marketing.service.ts # Marketing campaigns logic
│   │   └── onlyfans.service.ts  # OnlyFans integration
│   └── utils/
│       ├── response.ts         # Standardized API responses
│       ├── errors.ts           # Error handling
│       └── cache.ts            # Caching utilities
└── prisma/
    └── schema.prisma           # Database schema updates
```

## Components and Interfaces

### 1. API Response Format

Toutes les APIs suivent un format de réponse standardisé :

```typescript
// lib/api/utils/response.ts

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export function successResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}
```

### 2. Authentication Middleware

```typescript
// lib/api/middleware/auth.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { NextRequest } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    onboardingCompleted: boolean;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        errorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: session.user.id,
      email: session.user.email!,
      onboardingCompleted: session.user.onboardingCompleted || false,
    };

    return handler(req as AuthenticatedRequest);
  };
}

export async function withOnboarding(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user.onboardingCompleted) {
      return Response.json(
        errorResponse(
          'ONBOARDING_REQUIRED',
          'Please complete onboarding first'
        ),
        { status: 403 }
      );
    }

    return handler(req);
  });
}
```

### 3. Content Service

```typescript
// lib/api/services/content.service.ts

import { prisma } from '@/lib/db';

export interface ContentFilters {
  userId: string;
  status?: 'draft' | 'scheduled' | 'published';
  platform?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface CreateContentData {
  title: string;
  text?: string;
  type: 'image' | 'video' | 'text';
  platform: 'onlyfans' | 'fansly' | 'instagram' | 'tiktok';
  status: 'draft' | 'scheduled' | 'published';
  category?: string;
  tags?: string[];
  mediaIds?: string[];
  scheduledAt?: Date;
}

export class ContentService {
  async listContent(filters: ContentFilters) {
    const {
      userId,
      status,
      platform,
      type,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = { userId };

    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.content.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    };
  }

  async createContent(userId: string, data: CreateContentData) {
    return prisma.content.create({
      data: {
        ...data,
        userId,
        tags: data.tags || [],
        mediaIds: data.mediaIds || [],
      },
    });
  }

  async updateContent(
    userId: string,
    contentId: string,
    data: Partial<CreateContentData>
  ) {
    // Verify ownership
    const content = await prisma.content.findFirst({
      where: { id: contentId, userId },
    });

    if (!content) {
      throw new Error('Content not found or access denied');
    }

    return prisma.content.update({
      where: { id: contentId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteContent(userId: string, contentId: string) {
    // Verify ownership
    const content = await prisma.content.findFirst({
      where: { id: contentId, userId },
    });

    if (!content) {
      throw new Error('Content not found or access denied');
    }

    return prisma.content.delete({
      where: { id: contentId },
    });
  }

  async getContent(userId: string, contentId: string) {
    return prisma.content.findFirst({
      where: { id: contentId, userId },
    });
  }
}

export const contentService = new ContentService();
```

### 4. Analytics Service

```typescript
// lib/api/services/analytics.service.ts

import { prisma } from '@/lib/db';

export interface AnalyticsMetrics {
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value
  churnRate: number;
  activeSubscribers: number;
  totalRevenue: number;
  momGrowth: number; // Month over Month growth
}

export interface TrendData {
  date: string;
  value: number;
}

export class AnalyticsService {
  async getOverview(userId: string): Promise<AnalyticsMetrics> {
    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get revenue data
    const [currentRevenue, lastMonthRevenue, subscribers] = await Promise.all([
      this.getRevenueForPeriod(userId, startOfMonth, now),
      this.getRevenueForPeriod(userId, startOfLastMonth, endOfLastMonth),
      this.getActiveSubscribers(userId),
    ]);

    // Calculate metrics
    const arpu = subscribers > 0 ? currentRevenue / subscribers : 0;
    const ltv = arpu * 12; // Simplified: assume 12 month average lifetime
    const churnRate = await this.calculateChurnRate(userId);
    const momGrowth =
      lastMonthRevenue > 0
        ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    return {
      arpu,
      ltv,
      churnRate,
      activeSubscribers: subscribers,
      totalRevenue: currentRevenue,
      momGrowth,
    };
  }

  async getTrends(
    userId: string,
    metric: string,
    period: 'day' | 'week' | 'month' = 'day',
    days: number = 30
  ): Promise<TrendData[]> {
    // Implementation depends on your data structure
    // This is a simplified version
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query your database for trend data
    // Return formatted trend data
    return [];
  }

  private async getRevenueForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  private async getActiveSubscribers(userId: string): Promise<number> {
    return prisma.subscription.count({
      where: {
        userId,
        status: 'active',
      },
    });
  }

  private async calculateChurnRate(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [startCount, churnedCount] = await Promise.all([
      prisma.subscription.count({
        where: {
          userId,
          createdAt: { lt: startOfMonth },
        },
      }),
      prisma.subscription.count({
        where: {
          userId,
          status: 'cancelled',
          updatedAt: { gte: startOfMonth },
        },
      }),
    ]);

    return startCount > 0 ? (churnedCount / startCount) * 100 : 0;
  }
}

export const analyticsService = new AnalyticsService();
```

### 5. Content API Route

```typescript
// app/api/content/route.ts

import { NextRequest } from 'next/server';
import { withOnboarding } from '@/lib/api/middleware/auth';
import { contentService } from '@/lib/api/services/content.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export const GET = withOnboarding(async (req) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      userId: req.user.id,
      status: searchParams.get('status') as any,
      platform: searchParams.get('platform') || undefined,
      type: searchParams.get('type') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await contentService.listContent(filters);

    return Response.json(successResponse(result));
  } catch (error: any) {
    console.error('Content list error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
});

export const POST = withOnboarding(async (req) => {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.type || !body.platform) {
      return Response.json(
        errorResponse('VALIDATION_ERROR', 'Missing required fields'),
        { status: 400 }
      );
    }

    const content = await contentService.createContent(req.user.id, body);

    return Response.json(successResponse(content), { status: 201 });
  } catch (error: any) {
    console.error('Content create error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message),
      { status: 500 }
    );
  }
});
```

## Data Models

### Prisma Schema Updates

```prisma
// Add to prisma/schema.prisma

model Content {
  id          String   @id @default(cuid())
  userId      String
  title       String
  text        String?
  type        String   // 'image', 'video', 'text'
  platform    String   // 'onlyfans', 'fansly', 'instagram', 'tiktok'
  status      String   // 'draft', 'scheduled', 'published'
  category    String?
  tags        String[]
  mediaIds    String[]
  scheduledAt DateTime?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  metadata    Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, platform])
  @@index([userId, createdAt])
}

model MarketingCampaign {
  id          String   @id @default(cuid())
  userId      String
  name        String
  status      String   // 'draft', 'scheduled', 'active', 'paused', 'completed'
  channel     String   // 'email', 'dm', 'sms', 'push'
  goal        String   // 'engagement', 'conversion', 'retention'
  audienceSegment String
  audienceSize Int
  message     Json
  schedule    Json?
  stats       Json?    // { sent, opened, clicked, converted }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, channel])
}

model Transaction {
  id        String   @id @default(cuid())
  userId    String
  amount    Float
  currency  String   @default("USD")
  status    String   // 'pending', 'completed', 'failed'
  type      String   // 'subscription', 'tip', 'ppv', 'message'
  platform  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, createdAt])
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String
  fanId     String
  platform  String
  tier      String?
  amount    Float
  status    String   // 'active', 'cancelled', 'expired'
  startedAt DateTime
  endsAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, platform])
}
```

## Error Handling

### Error Codes

```typescript
// lib/api/utils/errors.ts

export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ONBOARDING_REQUIRED: 'ONBOARDING_REQUIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/services/content.service.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { contentService } from '@/lib/api/services/content.service';

describe('ContentService', () => {
  const mockUserId = 'user_123';

  it('should list content with filters', async () => {
    const result = await contentService.listContent({
      userId: mockUserId,
      status: 'published',
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should create content', async () => {
    const data = {
      title: 'Test Content',
      type: 'image' as const,
      platform: 'onlyfans' as const,
      status: 'draft' as const,
    };

    const content = await contentService.createContent(mockUserId, data);

    expect(content).toHaveProperty('id');
    expect(content.title).toBe(data.title);
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/content.test.ts

import { describe, it, expect } from 'vitest';

describe('Content API', () => {
  it('GET /api/content should return paginated content', async () => {
    const response = await fetch('/api/content?limit=10');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('items');
    expect(data.data).toHaveProperty('pagination');
  });

  it('POST /api/content should create content', async () => {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        type: 'image',
        platform: 'onlyfans',
        status: 'draft',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });
});
```

## Performance Considerations

### Caching Strategy

```typescript
// lib/api/utils/cache.ts

import { Redis } from '@upstash/redis';

const redis = process.env.REDIS_URL
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN!,
    })
  : null;

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  const cached = await redis.get(key);
  if (cached) {
    return cached as T;
  }

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Database Optimization

- Index sur userId + status/platform/createdAt pour les queries fréquentes
- Pagination avec limit/offset pour éviter de charger trop de données
- Aggregations avec Prisma pour les calculs analytics
- Connection pooling géré par Prisma

## Security Considerations

1. **Authentication**: Toutes les routes utilisent `withAuth` ou `withOnboarding`
2. **Authorization**: Vérification que l'utilisateur possède les ressources qu'il modifie
3. **Input Validation**: Validation des données d'entrée avant traitement
4. **Rate Limiting**: 100 requêtes/minute par utilisateur
5. **SQL Injection**: Protection via Prisma ORM
6. **CORS**: Configuré dans next.config.ts
7. **Logging**: Tous les erreurs sont loggées avec correlation IDs
