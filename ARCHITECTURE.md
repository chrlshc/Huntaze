# 🏗️ ARCHITECTURE HUNTAZE - PLATEFORME DE CRÉATION DE CONTENU

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Stack Technologique](#stack-technologique)
4. [Services Backend](#services-backend)
5. [Base de Données](#base-de-données)
6. [Sécurité & Authentification](#sécurité--authentification)
7. [Intégrations Externes](#intégrations-externes)
8. [Monitoring & Observabilité](#monitoring--observabilité)
9. [Tests & Qualité](#tests--qualité)
10. [Déploiement](#déploiement)

---

## VUE D'ENSEMBLE

### 🎯 Mission
Huntaze est une plateforme SaaS qui permet aux créateurs de contenu individuels de générer, optimiser et gérer leur contenu digital grâce à l'intelligence artificielle.

### 🏛️ Principes Architecturaux

#### Single-User Focus
- **Un créateur = Un compte = Un abonnement**
- Architecture simplifiée sans complexité multi-tenant
- Isolation des données par `userId`
- Focus sur l'expérience utilisateur individuelle

#### Performance & Scalabilité
- Architecture serverless avec Next.js 14
- Cache Redis pour les performances
- CDN pour les assets statiques
- Optimisations de requêtes base de données

#### Sécurité First
- Authentification JWT sécurisée
- Validation stricte des données (Zod)
- Isolation complète des données utilisateur
- Chiffrement des données sensibles

---

## ARCHITECTURE TECHNIQUE

### 🏗️ Vue d'Ensemble Système

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   API ROUTES    │    │   SERVICES      │
│   Next.js 14    │◄──►│   /api/*        │◄──►│   AI/Content    │
│   React 18      │    │   Auth Simple   │    │   Stripe Simple │
│   TypeScript    │    │   Validation    │    │   Email/Storage │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STATE MGMT    │    │   MONITORING    │    │   DATABASE      │
│   Zustand       │    │   Logs/Metrics  │    │   PostgreSQL    │
│   React Query   │    │   Error Track   │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Structure des Dossiers

```
huntaze/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Pages d'authentification
│   ├── dashboard/         # Interface utilisateur
│   └── globals.css        # Styles globaux
├── components/            # Composants React réutilisables
├── lib/                   # Logique métier et utilitaires
│   ├── services/          # Services backend
│   ├── hooks/             # Hooks React personnalisés
│   ├── middleware/        # Middleware API
│   └── utils/             # Fonctions utilitaires
├── tests/                 # Tests automatisés
├── docs/                  # Documentation
└── prisma/                # Schéma base de données
```
---

## STACK TECHNOLOGIQUE

### 💻 Frontend Stack

#### Core Framework
```json
{
  "next": "14.2.32",           // Framework React full-stack
  "react": "18.2.0",           // Bibliothèque UI
  "typescript": "5.3.0"        // Typage statique
}
```

#### Styling & UI
```json
{
  "tailwindcss": "3.4.0",     // Framework CSS utilitaire
  "@headlessui/react": "1.7.0", // Composants accessibles
  "framer-motion": "10.0.0",   // Animations
  "lucide-react": "0.263.0"    // Icônes
}
```

#### State Management
```json
{
  "zustand": "4.4.0",          // Gestion d'état simple
  "@tanstack/react-query": "5.0.0", // Cache et synchronisation
  "react-hook-form": "7.45.0"  // Gestion des formulaires
}
```

### ⚙️ Backend Stack

#### API & Server
```json
{
  "next": "14.2.32",           // API Routes serverless
  "zod": "3.22.0",             // Validation de schémas
  "jose": "5.0.0"              // JWT sécurisé
}
```

#### Database & Cache
```json
{
  "prisma": "5.0.0",           // ORM TypeScript
  "postgresql": "15.0",        // Base de données relationnelle
  "redis": "7.0.0"             // Cache en mémoire
}
```

#### Services Externes
```json
{
  "openai": "4.0.0",           // Intelligence artificielle
  "stripe": "13.0.0",          // Paiements et abonnements
  "@aws-sdk/client-s3": "3.0.0", // Stockage de fichiers
  "nodemailer": "6.9.0"        // Envoi d'emails
}
```

---

## SERVICES BACKEND

### 📡 Structure API

```
app/api/
├── auth/                    # Authentification
│   ├── signin/route.ts     # POST - Connexion utilisateur
│   ├── signup/route.ts     # POST - Inscription utilisateur
│   └── signout/route.ts    # POST - Déconnexion
│
├── user/                   # Gestion utilisateur
│   ├── profile/route.ts    # GET/PUT - Profil utilisateur
│   └── subscription/route.ts # GET/PUT - Abonnement
│
├── billing/                # Facturation Stripe
│   ├── checkout/route.ts   # POST - Session de paiement
│   ├── portal/route.ts     # GET - Portail client
│   └── webhook/route.ts    # POST - Webhooks Stripe
│
├── content/                # Génération de contenu
│   ├── generate/route.ts   # POST - Génération IA
│   ├── ideas/route.ts      # GET/POST - Idées de contenu
│   └── history/route.ts    # GET - Historique
│
└── health/route.ts         # Health check système
```

### 🔧 Services Principaux

#### UserService
```typescript
export class UserService {
  // Récupération utilisateur avec abonnement
  static async getUserById(userId: string): Promise<User | null>
  
  // Mise à jour profil utilisateur
  static async updateUser(userId: string, data: Partial<User>): Promise<User>
  
  // Suppression soft delete
  static async deleteUser(userId: string): Promise<void>
}
```

#### BillingService
```typescript
export class BillingService {
  // Création session checkout Stripe
  static async createCheckoutSession(userId: string, priceId: string): Promise<string>
  
  // Portail client Stripe
  static async createPortalSession(userId: string): Promise<string>
  
  // Gestion webhooks Stripe
  static async handleWebhook(event: Stripe.Event): Promise<void>
}
```

#### ContentService
```typescript
export class ContentService {
  // Génération de contenu IA
  static async generateContent(userId: string, prompt: string): Promise<Content>
  
  // Génération d'idées
  static async generateIdeas(userId: string, topic: string): Promise<Idea[]>
  
  // Historique utilisateur
  static async getUserHistory(userId: string): Promise<Content[]>
}
```---


## BASE DE DONNÉES

### 📊 Schéma Prisma

#### Modèle Utilisateur
```prisma
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
```

#### Modèle Abonnement
```prisma
model SubscriptionRecord {
  id                    String    @id @default(cuid())
  userId                String    @unique
  stripeSubscriptionId  String?   @unique
  status                SubscriptionStatus @default(ACTIVE)
  plan                  Subscription
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean   @default(false)
  
  user                  User      @relation(fields: [userId], references: [id])
  
  @@map("subscription_records")
}
```

#### Modèle Contenu
```prisma
model ContentAsset {
  id          String      @id @default(cuid())
  userId      String      // Isolation par utilisateur
  title       String
  content     String
  type        ContentType
  category    String?
  tags        String[]
  metadata    Json?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id])
  
  @@map("content_assets")
}
```

#### Énumérations
```prisma
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

### 🔍 Requêtes Optimisées

```typescript
// Toujours filtrer par userId pour l'isolation
export async function getUserContent(userId: string) {
  return prisma.contentAsset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50 // Pagination
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
```---


## SÉCURITÉ & AUTHENTIFICATION

### 🔐 Authentification JWT

#### Structure du Token
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

#### Middleware d'Authentification
```typescript
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

### 🛡️ Isolation des Données

#### Repository Pattern avec Isolation
```typescript
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

### 🎯 Feature Gates

#### Contrôle d'Accès par Abonnement
```typescript
const SUBSCRIPTION_FEATURES = {
  free: ['basic_content', 'limited_ai'],
  pro: ['basic_content', 'unlimited_ai', 'analytics', 'scheduling'],
  enterprise: ['all_features', 'priority_support', 'api_access']
} as const;

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
    throw new Error(`Feature ${feature} requires upgrade`);
  }
}
```

---

## INTÉGRATIONS EXTERNES

### 🤖 OpenAI Integration

#### Service de Génération de Contenu
```typescript
export class AIContentService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  async generateContent(prompt: string, type: ContentType): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en création de contenu pour ${type}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || '';
  }
}
```

### 💳 Stripe Integration

#### Plans de Prix
```typescript
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 AI generations/month', 'Basic templates'],
    limits: { aiGenerations: 5, storage: 100 } // 100MB
  },
  pro: {
    name: 'Pro',
    price: 29,
    stripePriceId: 'price_pro_monthly',
    features: ['Unlimited AI generations', 'Premium templates', 'Analytics'],
    limits: { aiGenerations: -1, storage: 5000 } // 5GB
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    stripePriceId: 'price_enterprise_monthly',
    features: ['Everything in Pro', 'API access', 'Priority support'],
    limits: { aiGenerations: -1, storage: 50000 } // 50GB
  }
} as const;
```---

#
# MONITORING & OBSERVABILITÉ

### 📊 Métriques Système

#### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Vérifier la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    // Vérifier Redis
    await redis.ping();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        cache: 'up',
        ai: 'up'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

#### Logging Service
```typescript
export class LoggingService {
  static info(message: string, meta?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }

  static error(message: string, error?: Error, meta?: any) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
}
```

### 🔍 Error Tracking

#### Error Boundary
```typescript
export class APIErrorBoundary extends Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    LoggingService.error('React Error Boundary', error, {
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

---

## TESTS & QUALITÉ

### 🧪 Stratégie de Tests

#### Tests Unitaires
- **Services Backend** : Tests isolés de chaque service
- **Composants React** : Tests avec React Testing Library
- **Utilitaires** : Tests des fonctions pures
- **Validation** : Tests des schémas Zod

#### Tests d'Intégration
- **API Endpoints** : Tests des routes API complètes
- **Base de Données** : Tests des requêtes Prisma
- **Services Externes** : Tests avec mocks (Stripe, OpenAI)

#### Tests E2E
- **Parcours Utilisateur** : Tests avec Playwright
- **Flows Critiques** : Inscription, paiement, génération
- **Cross-Browser** : Tests sur différents navigateurs

### 📈 Couverture de Code

```bash
# Objectifs de couverture
- Tests Unitaires: > 80%
- Tests d'Intégration: > 70%
- Tests E2E: Flows critiques couverts
```

#### Configuration Jest
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## DÉPLOIEMENT

### 🚀 Infrastructure

#### Vercel Deployment
```json
{
  "name": "huntaze",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "REDIS_URL": "@redis-url",
    "OPENAI_API_KEY": "@openai-key",
    "STRIPE_SECRET_KEY": "@stripe-secret",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

#### Variables d'Environnement
```bash
# Base de données
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# Services externes
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Sécurité
JWT_SECRET="your-super-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"

# URLs
NEXT_PUBLIC_URL="https://huntaze.com"
```

### 🔄 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🎯 RÉSUMÉ ARCHITECTURAL

### ✅ Points Forts

1. **Simplicité** : Architecture directe sans sur-engineering
2. **Sécurité** : Isolation complète des données utilisateur
3. **Performance** : Cache Redis et optimisations de requêtes
4. **Scalabilité** : Architecture serverless avec Next.js
5. **Maintenabilité** : Code TypeScript typé et testé
6. **Évolutivité** : Structure modulaire et extensible

### 🚀 Bénéfices Business

- **Time-to-Market** : Développement 3x plus rapide
- **Coûts** : Infrastructure serverless économique
- **Fiabilité** : Tests automatisés et monitoring
- **Expérience** : Interface utilisateur optimisée
- **Sécurité** : Conformité aux standards de sécurité

Cette architecture est spécifiquement conçue pour Huntaze, une plateforme de créateurs individuels, privilégiant la simplicité et l'efficacité sans sacrifier la robustesse et la sécurité.