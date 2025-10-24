# 🏗️ ARCHITECTURE HUNTAZE SIMPLIFIÉE - CRÉATEURS INDIVIDUELS

## 📋 SOMMAIRE

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Stack Technique](#2-stack-technique)
3. [Architecture Frontend](#3-architecture-frontend)
4. [Architecture Backend](#4-architecture-backend)
5. [Services de Résilience](#5-services-de-résilience)
6. [Monitoring & Observabilité](#6-monitoring--observabilité)
7. [Sécurité & Authentification](#7-sécurité--authentification)
8. [Base de Données Simplifiée](#8-base-de-données-simplifiée)
9. [Billing Simple avec Stripe](#9-billing-simple-avec-stripe)
10. [Testing Strategy](#10-testing-strategy)

---

# 1. VUE D'ENSEMBLE

## 🎯 Architecture Générale Simplifiée

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   API ROUTES    │    │   SERVICES      │
│   Next.js 14    │◄──►│   /api/*        │◄──►│   AI/Content    │
│   React 18      │    │   Auth Simple   │    │   Stripe Simple │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STATE MGMT    │    │   MONITORING    │    │   DATABASE      │
│   Zustand       │    │   Simple Logs   │    │   PostgreSQL    │
│   React Query   │    │   Basic Metrics │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏛️ Principes Architecturaux Simplifiés

### Single-User Focus
- Un créateur = un compte = un abonnement
- Pas de complexité multi-tenant
- Isolation simple par userId

### Simple & Fast
- Architecture directe sans sur-engineering
- Focus sur les features core
- Maintenance facile

---

# 2. STACK TECHNIQUE

## 💻 Frontend Stack (Inchangé)

### Core Framework
```json
{
  "next": "14.2.32",
  "react": "18.2.0",
  "typescript": "5.3.0"
}
```

### Styling & UI
```json
{
  "tailwindcss": "3.4.0",
  "@headlessui/react": "1.7.0",
  "framer-motion": "10.0.0",
  "lucide-react": "0.263.0"
}
```

### State Management
```json
{
  "zustand": "4.4.0",
  "@tanstack/react-query": "5.0.0",
  "react-hook-form": "7.45.0"
}
```

## ⚙️ Backend Stack Simplifié

### API & Server
```json
{
  "next": "14.2.32",        // API Routes uniquement
  "zod": "3.22.0",          // Schema validation
  "jose": "5.0.0"           // JWT simple
}
```

### Database & Cache
```json
{
  "prisma": "5.0.0",        // ORM simple
  "postgresql": "15.0",     // Base de données
  "redis": "7.0.0"          // Cache simple
}
```

### External Services
```json
{
  "openai": "4.0.0",        // IA
  "stripe": "13.0.0",       // Paiements simples
  "@aws-sdk/client-s3": "3.0.0", // Stockage
  "nodemailer": "6.9.0"     // Emails
}
```

---

# 3. ARCHITECTURE FRONTEND (Inchangée)

Garde la même structure frontend mais simplifie les stores et hooks.

---

# 4. ARCHITECTURE BACKEND SIMPLIFIÉE

## 📁 Structure API Simplifiée

```
app/api/
├── auth/                    # Authentification simple
│   ├── signin/route.ts     # POST /api/auth/signin
│   ├── signup/route.ts     # POST /api/auth/signup
│   └── signout/route.ts    # POST /api/auth/signout
│
├── user/                   # Gestion utilisateur
│   ├── profile/route.ts    # GET/PUT /api/user/profile
│   └── subscription/route.ts # GET/PUT /api/user/subscription
│
├── billing/                # Billing simple
│   ├── checkout/route.ts   # POST /api/billing/checkout
│   ├── portal/route.ts     # GET /api/billing/portal
│   └── webhook/route.ts    # POST /api/billing/webhook
│
├── content/                # Génération de contenu
│   ├── generate/route.ts   # POST /api/content/generate
│   ├── ideas/route.ts      # GET/POST /api/content/ideas
│   └── history/route.ts    # GET /api/content/history
│
└── health/route.ts         # Health check
```

## 🔧 Services Simplifiés

### User Service
```typescript
// lib/services/user-service.ts
export class UserService {
  static async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
      include: { subscription: true }
    });
  }

  static async deleteUser(userId: string): Promise<void> {
    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });
  }
}
```

### Billing Service Simplifié
```typescript
// lib/services/billing-service.ts
export class BillingService {
  static async createCheckoutSession(
    userId: string, 
    priceId: string
  ): Promise<string> {
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: { userId }
    });

    return session.url!;
  }

  static async createPortalSession(userId: string): Promise<string> {
    const user = await UserService.getUserById(userId);
    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`
    });

    return session.url;
  }

  static async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: session.customer as string,
        subscription: {
          upsert: {
            create: {
              stripeSubscriptionId: session.subscription as string,
              status: 'active',
              plan: this.getPlanFromPriceId(session.line_items?.data[0]?.price?.id)
            },
            update: {
              stripeSubscriptionId: session.subscription as string,
              status: 'active'
            }
          }
        }
      }
    });
  }

  private static getPlanFromPriceId(priceId?: string): 'free' | 'pro' | 'enterprise' {
    // Map Stripe price IDs to plans
    const priceMap: Record<string, 'free' | 'pro' | 'enterprise'> = {
      'price_pro_monthly': 'pro',
      'price_pro_yearly': 'pro',
      'price_enterprise_monthly': 'enterprise',
      'price_enterprise_yearly': 'enterprise'
    };
    return priceMap[priceId || ''] || 'free';
  }
}
```

---

# 5. SERVICES DE RÉSILIENCE (Simplifiés)

Garde les mêmes patterns mais sans la complexité multi-tenant.

---

# 6. MONITORING & OBSERVABILITÉ (Simplifié)

Monitoring basique sans métriques par tenant.

---

# 7. SÉCURITÉ & AUTHENTIFICATION

## 🔐 Authentification Simplifiée

### JWT Simple
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}
```

### User Model Simplifié
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  role: 'creator' | 'admin'; // Simple role
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
}

// Feature access basé sur l'abonnement
const SUBSCRIPTION_FEATURES = {
  free: ['basic_content', 'limited_ai'],
  pro: ['basic_content', 'unlimited_ai', 'analytics', 'scheduling'],
  enterprise: ['all_features', 'priority_support', 'api_access']
} as const;
```

## 🛡️ Sécurité des Données

### Isolation par Utilisateur
```typescript
// Toujours filtrer par userId
class UserDataRepository<T> {
  constructor(private userId: string) {}

  async find(conditions: any): Promise<T[]> {
    return db.find({
      ...conditions,
      userId: this.userId // Isolation automatique
    });
  }

  async create(data: any): Promise<T> {
    return db.create({
      ...data,
      userId: this.userId // Toujours associer à l'utilisateur
    });
  }
}
```

### Middleware d'Authentification
```typescript
// lib/middleware/auth.ts
export async function authMiddleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Vérifier que l'utilisateur existe et est actif
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Ajouter les infos utilisateur à la requête
    req.headers.set('x-user-id', payload.userId);
    req.headers.set('x-user-subscription', payload.subscription);
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

### Feature Gates Simples
```typescript
// lib/utils/feature-gates.ts
export function hasFeature(
  subscription: 'free' | 'pro' | 'enterprise',
  feature: string
): boolean {
  const features = SUBSCRIPTION_FEATURES[subscription];
  return features.includes(feature as any) || features.includes('all_features');
}

export function requireFeature(
  subscription: 'free' | 'pro' | 'enterprise',
  feature: string
) {
  if (!hasFeature(subscription, feature)) {
    throw new Error(`Feature ${feature} requires ${getRequiredPlan(feature)} subscription`);
  }
}

function getRequiredPlan(feature: string): string {
  if (SUBSCRIPTION_FEATURES.free.includes(feature as any)) return 'free';
  if (SUBSCRIPTION_FEATURES.pro.includes(feature as any)) return 'pro';
  return 'enterprise';
}
```

---

# 8. BASE DE DONNÉES SIMPLIFIÉE

## 📊 Schéma Prisma Simplifié

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String
  avatar            String?
  passwordHash      String
  subscription      Subscription @default(FREE)
  stripeCustomerId  String?   @unique
  role              Role      @default(CREATOR)
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime? // Soft delete
  
  // Relations
  contentAssets     ContentAsset[]
  apiKeys           ApiKey[]
  subscriptionRecord SubscriptionRecord?
  
  @@map("users")
}

model SubscriptionRecord {
  id                    String    @id @default(cuid())
  userId                String    @unique
  stripeSubscriptionId  String?   @unique
  status                SubscriptionStatus @default(ACTIVE)
  plan                  Subscription
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean   @default(false)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("subscription_records")
}

model ContentAsset {
  id          String      @id @default(cuid())
  userId      String      // Toujours lié à un utilisateur
  title       String
  content     String
  type        ContentType
  category    String?
  tags        String[]
  metadata    Json?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("content_assets")
}

model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  name        String
  keyHash     String    @unique
  permissions String[]
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("api_keys")
}

// Enums
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

enum Role {
  CREATOR
  ADMIN
}

enum ContentType {
  POST
  STORY
  VIDEO
  IMAGE
  CAPTION
}
```

## 🔍 Requêtes Simplifiées

```typescript
// lib/db/queries.ts

// Toujours filtrer par userId
export async function getUserContent(userId: string) {
  return prisma.contentAsset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createContent(userId: string, data: CreateContentData) {
  return prisma.contentAsset.create({
    data: {
      ...data,
      userId // Toujours associer à l'utilisateur
    }
  });
}

export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptionRecord: true }
  });
  
  return user?.subscriptionRecord;
}
```

---

# 9. BILLING SIMPLE AVEC STRIPE

## 💳 Configuration Stripe Simplifiée

### Plans de Prix
```typescript
// lib/config/pricing.ts
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 AI generations/month', 'Basic templates', 'Community support'],
    limits: { aiGenerations: 5, storage: 100 } // 100MB
  },
  pro: {
    name: 'Pro',
    price: 29,
    stripePriceId: 'price_pro_monthly',
    features: ['Unlimited AI generations', 'Premium templates', 'Analytics', 'Priority support'],
    limits: { aiGenerations: -1, storage: 5000 } // 5GB
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    stripePriceId: 'price_enterprise_monthly',
    features: ['Everything in Pro', 'API access', 'Custom integrations', 'Dedicated support'],
    limits: { aiGenerations: -1, storage: 50000 } // 50GB
  }
} as const;
```

### Endpoints Billing
```typescript
// app/api/billing/checkout/route.ts
export async function POST(req: NextRequest) {
  const { userId, priceId } = await req.json();
  
  try {
    const checkoutUrl = await BillingService.createCheckoutSession(userId, priceId);
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// app/api/billing/portal/route.ts
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const portalUrl = await BillingService.createPortalSession(userId);
    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

// app/api/billing/webhook/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await BillingService.handleWebhook(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}
```

---

# 10. TESTING STRATEGY (Simplifiée)

## 🧪 Tests Simplifiés

### Tests Unitaires
- Tests des services sans complexité multi-tenant
- Tests de validation des données utilisateur
- Tests de logique métier simple

### Tests d'Intégration
- Tests des endpoints API
- Tests Stripe avec webhooks
- Tests de génération de contenu

### Tests E2E
- Parcours utilisateur complets
- Tests de billing et abonnements
- Tests de génération de contenu

---

## 🎯 RÉSUMÉ DES SIMPLIFICATIONS

### ❌ Supprimé (Complexité inutile)
- Architecture multi-tenant complexe
- Gestion d'organisations/équipes
- Billing par siège
- Permissions granulaires par tenant
- Isolation de données complexe
- Métriques par tenant

### ✅ Gardé (Essentiel)
- Authentification JWT simple
- Isolation des données par utilisateur
- Billing Stripe individuel
- Feature gates par abonnement
- Monitoring basique
- Tests complets

### 🚀 Bénéfices
- **Développement 3x plus rapide**
- **Maintenance simplifiée**
- **Moins de bugs potentiels**
- **Focus sur les features core**
- **Architecture évolutive si besoin**

Cette architecture simplifiée est parfaitement adaptée pour une plateforme de créateurs individuels comme Huntaze, sans la complexité inutile du multi-tenancy d'entreprise.