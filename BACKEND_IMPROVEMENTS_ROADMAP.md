# 🔧 Roadmap d'Améliorations Backend Huntaze

## 📋 État Actuel du Backend

### ✅ Ce Qui Existe Déjà

**Services Implémentés:**
1. **AI Service** (`ai-service.ts`) - Service AI unifié avec OpenAI/Azure/Claude
2. **AI Router** (`ai-router.ts`) - Routage intelligent mini vs full (98% économies)
3. **User Service** (`simple-user-service.ts`) - Gestion utilisateurs basique
4. **Billing Service** (`simple-billing-service.ts`) - Intégration Stripe
5. **Content Service** (`ai-content-service.ts`) - Génération de contenu AI

**Infrastructure:**
- Next.js 14 API Routes
- TypeScript
- Tests unitaires et intégration
- CI/CD avec AWS CodeBuild
- Azure OpenAI configuré

### ❌ Ce Qui Manque (Critique)

1. **Base de données réelle** - Actuellement mock en mémoire
2. **Authentication système** - Pas de NextAuth configuré
3. **API Routes complètes** - Endpoints manquants
4. **Webhooks Stripe** - Non implémentés
5. **File upload** - Pas de gestion S3
6. **Real-time features** - Pas de WebSocket/SSE
7. **Caching layer** - Pas de Redis
8. **Rate limiting** - Non implémenté
9. **Monitoring** - Pas de Sentry/DataDog
10. **Email service** - Pas de SendGrid/SES

---

## 🎯 Plan d'Action Prioritaire

### Phase 1: Fondations Critiques (Semaine 1-2)

#### 1.1 Base de Données PostgreSQL avec Prisma

**Pourquoi:** Les mocks en mémoire ne sont pas production-ready

**Actions:**
```bash
# Installation
npm install @prisma/client prisma

# Initialisation
npx prisma init
```

**Schema Prisma (`prisma/schema.prisma`):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String         @id @default(uuid())
  email             String         @unique
  name              String
  avatar            String?
  subscription      Subscription   @default(FREE)
  stripeCustomerId  String?        @unique
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?
  
  // Relations
  subscriptions     UserSubscription[]
  content           Content[]
  analytics         Analytics[]
  
  @@index([email])
  @@index([stripeCustomerId])
}

model UserSubscription {
  id                    String              @id @default(uuid())
  userId                String
  planId                String
  status                SubscriptionStatus  @default(ACTIVE)
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  stripeSubscriptionId  String?             @unique
  stripeCustomerId      String?
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  user                  User                @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([stripeSubscriptionId])
}

model Content {
  id          String        @id @default(uuid())
  userId      String
  title       String
  body        Text
  type        ContentType
  status      ContentStatus @default(DRAFT)
  aiGenerated Boolean       @default(false)
  metadata    Json?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  user        User          @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([type])
  @@index([status])
}

model Analytics {
  id          String   @id @default(uuid())
  userId      String
  eventType   String
  eventData   Json
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}

enum Subscription {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}

enum ContentType {
  POST
  STORY
  CAPTION
  MESSAGE
  IDEA
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**Migration:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Service Update (`lib/services/database-user-service.ts`):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseUserService {
  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: true,
        content: true
      }
    });
  }

  async createUser(data: CreateUserData) {
    return await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        subscription: 'FREE'
      }
    });
  }

  // ... autres méthodes
}
```

#### 1.2 Authentication avec NextAuth.js

**Installation:**
```bash
npm install next-auth @auth/prisma-adapter
```

**Configuration (`app/api/auth/[...nextauth]/route.ts`):**
```typescript
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.subscription = user.subscription;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 1.3 API Routes Complètes

**Structure:**
```
app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── users/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── [id]/stats/route.ts
├── content/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── generate/route.ts (POST)
├── billing/
│   ├── checkout/route.ts (POST)
│   ├── portal/route.ts (POST)
│   └── webhooks/route.ts (POST)
├── ai/
│   ├── generate/route.ts (POST)
│   ├── chat/route.ts (POST)
│   └── ideas/route.ts (POST)
└── analytics/
    ├── events/route.ts (POST)
    └── stats/route.ts (GET)
```

**Exemple: Content API (`app/api/content/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateContentSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1),
  type: z.enum(['POST', 'STORY', 'CAPTION', 'MESSAGE', 'IDEA']),
  aiGenerated: z.boolean().optional(),
});

// GET /api/content - List user's content
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const type = searchParams.get('type');

  const where = {
    userId: session.user.id,
    ...(type && { type }),
  };

  const [content, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.content.count({ where }),
  ]);

  return NextResponse.json({
    content,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

// POST /api/content - Create content
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = CreateContentSchema.parse(body);

    const content = await prisma.content.create({
      data: {
        ...data,
        userId: session.user.id,
        status: 'DRAFT',
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Phase 2: Intégrations Essentielles (Semaine 3-4)

#### 2.1 Webhooks Stripe Réels

**Endpoint (`app/api/billing/webhooks/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Update or create subscription
  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    create: {
      userId: user.id,
      planId: getPlanIdFromPriceId(subscription.items.data[0].price.id),
      status: subscription.status.toUpperCase() as any,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Update user subscription tier
  const planId = getPlanIdFromPriceId(subscription.items.data[0].price.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { subscription: planId.toUpperCase() as any },
  });
}

function getPlanIdFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'PRO',
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]: 'PRO',
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!]: 'ENTERPRISE',
    [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!]: 'ENTERPRISE',
  };

  return priceMap[priceId] || 'FREE';
}
```

#### 2.2 File Upload avec AWS S3

**Installation:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Service (`lib/services/storage-service.ts`):**
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class StorageService {
  private bucket = process.env.AWS_S3_BUCKET!;

  async uploadFile(
    file: File,
    userId: string,
    folder: 'avatars' | 'content' | 'media'
  ): Promise<{ url: string; key: string }> {
    const key = `${folder}/${userId}/${Date.now()}-${file.name}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { url, key };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

export const storageService = new StorageService();
```

**API Route (`app/api/upload/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { storageService } from '@/lib/services/storage-service';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'media';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const result = await storageService.uploadFile(
      file,
      session.user.id,
      folder as any
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

#### 2.3 Redis Caching

**Installation:**
```bash
npm install ioredis
```

**Service (`lib/services/cache-service.ts`):**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const cacheService = new CacheService();
```

---

### Phase 3: Features Avancées (Semaine 5-6)

#### 3.1 Real-time avec Server-Sent Events

**API Route (`app/api/ai/generate/stream/route.ts`):**
```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { AIContentService } from '@/lib/services/ai-content-service';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  
  const stream = await AIContentService.generateContentStream(body);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### 3.2 Rate Limiting

**Middleware (`middleware.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### 3.3 Email Service

**Installation:**
```bash
npm install @sendgrid/mail
```

**Service (`lib/services/email-service.ts`):**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailService {
  async sendWelcomeEmail(email: string, name: string) {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: 'Bienvenue sur Huntaze!',
      html: `<h1>Bienvenue ${name}!</h1><p>Merci de rejoindre Huntaze.</p>`,
    });
  }

  async sendSubscriptionConfirmation(email: string, plan: string) {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM!,
      subject: `Abonnement ${plan} confirmé`,
      html: `<h1>Abonnement confirmé!</h1><p>Votre abonnement ${plan} est maintenant actif.</p>`,
    });
  }
}

export const emailService = new EmailService();
```

---

## 📊 Résumé des Priorités

### 🔴 Critique (Semaine 1-2)
1. ✅ PostgreSQL + Prisma
2. ✅ NextAuth.js
3. ✅ API Routes complètes

### 🟡 Important (Semaine 3-4)
4. ✅ Webhooks Stripe
5. ✅ File Upload S3
6. ✅ Redis Caching

### 🟢 Nice-to-Have (Semaine 5-6)
7. ✅ Real-time SSE
8. ✅ Rate Limiting
9. ✅ Email Service

---

**🎯 Avec ces améliorations, le backend Huntaze sera 100% production-ready !**
