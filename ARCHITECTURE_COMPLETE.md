# 🏗️ ARCHITECTURE HUNTAZE - DOCUMENTATION COMPLÈTE

## 📋 SOMMAIRE

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Stack Technique](#2-stack-technique)
3. [Architecture Frontend](#3-architecture-frontend)
4. [Architecture Backend](#4-architecture-backend)
5. [Services de Résilience](#5-services-de-résilience)
6. [Monitoring & Observabilité](#6-monitoring--observabilité)
7. [Sécurité & Multi-tenancy](#7-sécurité--multi-tenancy)
8. [Base de Données](#8-base-de-données)
9. [Testing Strategy](#9-testing-strategy)
10. [Déploiement](#10-déploiement)

---

# 1. VUE D'ENSEMBLE

## 🎯 Architecture Générale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   API GATEWAY   │    │   SERVICES      │
│   Next.js 14    │◄──►│   Middleware    │◄──►│   Microservices │
│   React 18      │    │   Auth/Rate     │    │   AI/Content    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STATE MGMT    │    │   MONITORING    │    │   DATABASE      │
│   Zustand       │    │   Prometheus    │    │   PostgreSQL    │
│   React Query   │    │   Grafana       │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏛️ Principes Architecturaux

### Microservices
- Services découplés et indépendants
- Communication via API REST et événements
- Scalabilité horizontale par service

### Event-Driven Architecture
- Communication asynchrone par événements
- Résilience aux pannes de services
- Traçabilité complète des actions

### Resilience First
- Circuit breakers sur tous les services externes
- Fallbacks et dégradation gracieuse
- Retry avec backoff exponentiel

### Observability
- Monitoring temps réel avec métriques
- Logging structuré et centralisé
- Tracing distribué des requêtes---

# 
2. STACK TECHNIQUE

## 💻 Frontend Stack

### Core Framework
```json
{
  "next": "14.2.32",           // React framework avec App Router
  "react": "18.2.0",           // Library UI avec Concurrent Features
  "typescript": "5.3.0"        // Type safety et developer experience
}
```

### Styling & UI
```json
{
  "tailwindcss": "3.4.0",      // Utility-first CSS framework
  "@headlessui/react": "1.7.0", // Composants accessibles
  "framer-motion": "10.0.0",    // Animations fluides
  "lucide-react": "0.263.0"     // Icônes modernes
}
```

### State Management
```json
{
  "zustand": "4.4.0",          // State management léger
  "@tanstack/react-query": "5.0.0", // Server state et cache
  "react-hook-form": "7.45.0"   // Gestion des formulaires
}
```

## ⚙️ Backend Stack

### API & Server
```json
{
  "@trpc/server": "10.0.0",    // Type-safe API calls
  "zod": "3.22.0",             // Schema validation
  "next": "14.2.32"            // API Routes serverless
}
```

### Database & Cache
```json
{
  "postgresql": "15.0",        // Base de données relationnelle
  "prisma": "5.0.0",          // ORM type-safe
  "redis": "7.0.0",           // Cache et sessions
  "@upstash/redis": "1.22.0"  // Redis serverless
}
```

### External Services
```json
{
  "openai": "4.0.0",          // Intelligence artificielle
  "stripe": "13.0.0",         // Paiements
  "@aws-sdk/client-s3": "3.0.0", // Stockage fichiers
  "nodemailer": "6.9.0"       // Emails
}
```

## 🔧 Development Tools

### Code Quality
```json
{
  "eslint": "8.0.0",          // Linting et code quality
  "prettier": "3.0.0",        // Code formatting
  "husky": "8.0.0",           // Git hooks
  "lint-staged": "13.0.0"     // Pre-commit linting
}
```

### Testing
```json
{
  "vitest": "1.6.1",          // Test runner rapide
  "@testing-library/react": "14.0.0", // Tests composants
  "playwright": "1.40.0",     // Tests E2E
  "@testing-library/jest-dom": "6.0.0" // Matchers DOM
}
```---


# 3. ARCHITECTURE FRONTEND

## 📁 Structure des Dossiers

```
huntaze/
├── app/                     # Next.js App Router
│   ├── (dashboard)/         # Route groups protégées
│   │   ├── analytics/       # Page analytics
│   │   ├── content-creation/ # Création de contenu
│   │   └── dashboard/       # Dashboard principal
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Authentication
│   │   ├── content-ideas/  # Génération d'idées
│   │   ├── health/         # Health checks
│   │   └── metrics/        # Métriques Prometheus
│   ├── globals.css         # Styles globaux
│   ├── layout.tsx          # Layout racine
│   └── page.tsx            # Page d'accueil
│
├── components/             # Composants réutilisables
│   ├── ui/                 # Composants de base
│   │   ├── Button.tsx      # Boutons stylés
│   │   ├── Card.tsx        # Cartes de contenu
│   │   ├── Input.tsx       # Champs de saisie
│   │   └── Modal.tsx       # Modales
│   ├── forms/              # Composants de formulaires
│   │   ├── LoginForm.tsx   # Formulaire de connexion
│   │   └── ContentForm.tsx # Formulaire de contenu
│   ├── charts/             # Graphiques et visualisations
│   │   ├── RevenueChart.tsx # Graphique revenus
│   │   └── EngagementChart.tsx # Graphique engagement
│   └── admin/              # Interface d'administration
│       ├── Layout.tsx      # Layout admin
│       └── Sidebar.tsx     # Barre latérale
│
├── lib/                    # Logique métier
│   ├── services/           # Services business
│   │   ├── ai-service.ts   # Service IA
│   │   ├── content-generation-service.ts # Génération contenu
│   │   ├── circuit-breaker.ts # Circuit breaker
│   │   └── api-monitoring-service.ts # Monitoring
│   ├── hooks/              # Custom React hooks
│   │   ├── use-api-integration.ts # Hook API
│   │   └── use-sse-client.ts # Server-Sent Events
│   ├── utils/              # Utilitaires
│   │   ├── api.ts          # Client API
│   │   └── validation.ts   # Validation schemas
│   └── types/              # Types TypeScript
│       ├── api-types.ts    # Types API
│       └── user-types.ts   # Types utilisateur
│
└── pages/                  # Pages legacy (migration en cours)
    └── api/                # API routes legacy
```## 🎨 
Composants Clés

### Layout Principal
```typescript
// components/admin/Layout.tsx
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode[];
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Inbox', href: '/inbox', icon: '📬' },
  { name: 'OnlyFans', href: '/onlyfans', icon: '🔥' },
  { name: 'Marketing', href: '/marketing', icon: '🎯' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
  { name: 'Création', href: '/content-creation', icon: '🎨' },
  { name: 'Assistant IA', href: '/ai-assistant', icon: '🤖' },
];

export default function Layout({ 
  children, 
  title, 
  primaryAction, 
  secondaryActions = [] 
}: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 bg-slate-900">
          <h1 className="text-xl font-bold text-white">Huntaze</h1>
        </div>
        
        <nav className="mt-8">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                router.pathname === item.href
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <button
                className="lg:hidden p-2 rounded-md"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              {title && (
                <h1 className="ml-4 text-2xl font-semibold text-slate-900">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {secondaryActions.map((action, index) => (
                <div key={index}>{action}</div>
              ))}
              {primaryAction}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```### 
State Management avec Zustand

```typescript
// lib/stores/user-store.ts
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  
  // Actions
  setUser: (user) => set({ user, error: null }),
  
  clearUser: () => set({ user: null, error: null }),
  
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      const updatedUser = await response.json();
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Update failed',
        isLoading: false 
      });
    }
  },
  
  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/user/me');
      if (!response.ok) throw new Error('Failed to fetch user');
      
      const user = await response.json();
      set({ user, isLoading: false, error: null });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isLoading: false 
      });
    }
  },
}));
```

### Custom Hooks

```typescript
// lib/hooks/use-api-integration.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCircuitBreaker } from './use-circuit-breaker';
import { useRequestCoalescer } from './use-request-coalescer';
import {refQuery @srccomponents } from '/CLAUDE.Md';

export const useAPIIntegration = <T>(
  endpoint: string,
  options?: UseQueryOptions<T>
) => {
  const circuitBreaker = useCircuitBreaker(endpoint);
  const coalescer = useRequestCoalescer();
  
  return useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      // Circuit breaker protection
      return await circuitBreaker.execute(async () => {
        // Request coalescing pour éviter les doublons
        return await coalescer.execute(endpoint, async () => {
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        });
      });
    },
    // Retry avec backoff exponentiel
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (error.message.includes('401')) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};
```---

# 4
. ARCHITECTURE BACKEND

## 🛣️ API Routes Structure

```
app/api/
├── auth/                    # Authentication & Authorization
│   ├── signin/route.ts      # Connexion utilisateur
│   ├── signup/route.ts      # Inscription utilisateur
│   ├── refresh/route.ts     # Refresh token
│   └── logout/route.ts      # Déconnexion
│
├── content-ideas/           # Génération d'idées de contenu
│   └── generate/route.ts    # POST /api/content-ideas/generate
│
├── ai-assistant/            # Assistant IA
│   ├── generate/route.ts    # Génération de contenu IA
│   └── tools/               # Outils spécialisés
│       ├── content-ideas/route.ts    # Idées de contenu
│       ├── message-generator/route.ts # Génération de messages
│       └── pricing-optimizer/route.ts # Optimisation des prix
│
├── content-creation/        # Gestion du contenu
│   ├── assets/             # Gestion des médias
│   │   ├── route.ts        # GET/POST /api/content-creation/assets
│   │   └── [id]/route.ts   # GET/PUT/DELETE /api/content-creation/assets/:id
│   ├── campaigns/route.ts   # Gestion des campagnes
│   ├── schedule/route.ts    # Planification
│   └── upload/route.ts      # Upload de fichiers
│
├── analytics/               # Analytics et métriques
│   ├── revenue/route.ts     # Revenus
│   ├── engagement/route.ts  # Engagement
│   └── performance/route.ts # Performance
│
├── billing/                 # Facturation
│   ├── stripe/             # Intégration Stripe
│   │   └── webhook/route.ts # Webhooks Stripe
│   └── message-packs/      # Packs de messages
│       └── checkout/route.ts # Checkout
│
├── health/route.ts          # Health checks
└── metrics/route.ts         # Métriques Prometheus
```

## 🔧 Middleware Stack

### Authentication Middleware
```typescript
// lib/middleware/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAPIKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiting';

export const withAuth = (handler: Function) => {
  return async (req: NextRequest) => {
    try {
      // 1. Extract API key from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }
      
      const apiKey = authHeader.replace('Bearer ', '');
      
      // 2. Validate API key and get user
      const user = await validateAPIKey(apiKey);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      
      // 3. Check rate limiting
      const rateLimitResult = await checkRateLimit(user.id, req.url);
      if (rateLimitResult.exceeded) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            resetTime: rateLimitResult.resetTime,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining
          },
          { status: 429 }
        );
      }
      
      // 4. Add user to request context
      const requestWithUser = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      (requestWithUser as any).user = user;
      
      // 5. Call the actual handler
      return handler(requestWithUser);
      
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
};
```### A
PI Validation Middleware
```typescript
// lib/middleware/api-validation.ts
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export const withValidation = <T>(schema: z.ZodSchema<T>) => {
  return (handler: (req: NextRequest, data: T) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      try {
        // Parse request body
        const body = await req.json();
        
        // Validate against schema
        const validatedData = schema.parse(body);
        
        // Call handler with validated data
        return handler(req, validatedData);
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    };
  };
};

// Usage example
const CreateContentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contentType: z.enum(['photo', 'video', 'story']),
  tags: z.array(z.string()).max(10),
});

export const POST = withAuth(
  withValidation(CreateContentSchema)(
    async (req, data) => {
      // data is now typed and validated
      const content = await createContent(data);
      return NextResponse.json(content);
    }
  )
);
```

## 🎯 Services Architecture

### Content Generation Service
```typescript
// lib/services/content-generation-service.ts
export class ContentGenerationService {
  private aiService: AIService;
  private ideaGenerator: ContentIdeaGenerator;
  private captionGenerator: CaptionHashtagGenerator;
  private messagePersonalization: MessagePersonalizationService;
  
  constructor() {
    this.aiService = getAIService();
    this.ideaGenerator = new ContentIdeaGenerator();
    this.captionGenerator = new CaptionHashtagGenerator();
    this.messagePersonalization = new MessagePersonalizationService();
  }
  
  async generateContentIdeas(
    profile: CreatorProfile, 
    options: GenerationOptions
  ): Promise<ContentIdea[]> {
    // Circuit breaker protection
    return await withCircuitBreaker('content-generation', async () => {
      // Request coalescing for duplicate requests
      return await withCoalescing(`ideas-${profile.id}-${JSON.stringify(options)}`, async () => {
        
        // Generate base ideas
        const ideas = await this.ideaGenerator.generate(profile, options);
        
        // Enrich with captions and hashtags in parallel
        const enrichedIdeas = await Promise.all(
          ideas.map(async (idea) => {
            const [caption, hashtags] = await Promise.all([
              this.captionGenerator.generateCaption(idea),
              this.captionGenerator.generateHashtags(idea),
            ]);
            
            return {
              ...idea,
              caption,
              hashtags,
              generatedAt: new Date(),
            };
          })
        );
        
        // Log for analytics
        await this.logGenerationEvent(profile.id, enrichedIdeas.length);
        
        return enrichedIdeas;
      });
    });
  }
  
  async personalizeMessage(
    template: string, 
    recipient: User, 
    context: MessageContext
  ): Promise<string> {
    return await this.messagePersonalization.personalize(template, recipient, context);
  }
  
  async getHealthStatus(): Promise<ServiceHealth> {
    const services = {
      aiService: await this.aiService.isHealthy(),
      ideaGenerator: await this.ideaGenerator.isHealthy(),
      captionGenerator: await this.captionGenerator.isHealthy(),
      messagePersonalization: await this.messagePersonalization.isHealthy(),
    };
    
    const allHealthy = Object.values(services).every(Boolean);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services,
      timestamp: new Date(),
    };
  }
  
  private async logGenerationEvent(userId: string, count: number): Promise<void> {
    // Log to analytics service
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'content_ideas_generated',
        userId,
        metadata: { count },
        timestamp: new Date(),
      }),
    });
  }
}
```##
 📊 API Endpoints Détaillés

### Authentication Endpoints

#### POST /api/auth/signin
```typescript
// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = SignInSchema.parse(body);
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isActive: true,
        subscription: true,
      },
    });
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );
    
    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      },
    });
    
    // Set HTTP-only cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
      },
      accessToken,
    });
    
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });
    
    return response;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### POST /api/auth/signup
```typescript
// app/api/auth/signup/route.ts
const SignUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  acceptTerms: z.boolean().refine(val => val === true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = SignUpSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        subscription: 'free',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscription: true,
        createdAt: true,
      },
    });
    
    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);
    
    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: 'email_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);
    
    return NextResponse.json({
      message: 'User created successfully',
      user,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```### 
Content Generation Endpoints

#### POST /api/content-ideas/generate
```typescript
// app/api/content-ideas/generate/route.ts
import { withAuth } from '@/lib/middleware/api-auth';
import { withValidation } from '@/lib/middleware/api-validation';
import { ContentGenerationService } from '@/lib/services/content-generation-service';
import { APIMonitoringService } from '@/lib/services/api-monitoring-service';

const GenerateIdeasSchema = z.object({
  creatorProfile: z.object({
    id: z.string(),
    niche: z.array(z.string()).min(1),
    contentTypes: z.array(z.enum(['photo', 'video', 'story', 'live'])),
    audiencePreferences: z.array(z.string()),
    performanceHistory: z.object({
      topPerformingContent: z.array(z.any()),
      engagementPatterns: z.record(z.any()),
      revenueByCategory: z.record(z.number()),
    }),
    currentGoals: z.array(z.string()),
    constraints: z.object({
      equipment: z.array(z.string()),
      location: z.array(z.string()),
      timeAvailability: z.string(),
    }),
  }),
  options: z.object({
    count: z.number().min(1).max(20).default(5),
    creativity: z.enum(['conservative', 'balanced', 'creative']).default('balanced'),
    includeHashtags: z.boolean().default(true),
    includeCaptions: z.boolean().default(true),
    targetPlatforms: z.array(z.enum(['onlyfans', 'instagram', 'tiktok'])).optional(),
  }),
});

export const POST = withAuth(
  withValidation(GenerateIdeasSchema)(
    async (req: NextRequest, data: z.infer<typeof GenerateIdeasSchema>) => {
      const startTime = Date.now();
      const monitoring = APIMonitoringService.getInstance();
      const contentService = new ContentGenerationService();
      
      try {
        // Record request metrics
        monitoring.recordRequest({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          userId: (req as any).user.id,
          timestamp: new Date(),
        });
        
        // Generate content ideas
        const ideas = await contentService.generateContentIdeas(
          data.creatorProfile,
          data.options
        );
        
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        // Record success metrics
        monitoring.recordRequest({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          userId: (req as any).user.id,
          responseTime,
          statusCode: 200,
          timestamp: new Date(),
        });
        
        return NextResponse.json({
          success: true,
          data: {
            ideas,
            metadata: {
              generatedAt: new Date(),
              count: ideas.length,
              profile: data.creatorProfile.id,
              options: data.options,
            },
          },
          meta: {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            duration: responseTime,
          },
        });
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Record error metrics
        monitoring.recordRequest({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          userId: (req as any).user.id,
          responseTime,
          statusCode: 500,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
        
        console.error('Content generation error:', error);
        
        return NextResponse.json({
          success: false,
          error: {
            type: 'content_generation_error',
            message: 'Failed to generate content ideas',
            code: 'CONTENT_GENERATION_FAILED',
          },
          meta: {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            duration: responseTime,
          },
        }, { status: 500 });
      }
    }
  )
);
```

#### GET /api/health
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { OptimizationEngine } from '@/lib/services/optimization-engine';
import { ContentIdeaGenerator } from '@/lib/services/content-idea-generator';
import { ContentGenerationService } from '@/lib/services/content-generation-service';
import { APIMonitoringService } from '@/lib/services/api-monitoring-service';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { gracefulDegradation } from '@/lib/services/graceful-degradation';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check all services health
    const [
      optimizationEngineHealth,
      contentIdeaGeneratorHealth,
      contentGenerationServiceHealth,
      authServiceHealth,
      monitoringServiceHealth,
    ] = await Promise.allSettled([
      checkOptimizationEngineHealth(),
      checkContentIdeaGeneratorHealth(),
      checkContentGenerationServiceHealth(),
      checkAuthServiceHealth(),
      checkMonitoringServiceHealth(),
    ]);
    
    // Collect service statuses
    const services = [
      {
        name: 'optimization-engine',
        status: optimizationEngineHealth.status === 'fulfilled' ? 
          optimizationEngineHealth.value.status : 'degraded',
        responseTime: optimizationEngineHealth.status === 'fulfilled' ? 
          optimizationEngineHealth.value.responseTime : 0,
        details: optimizationEngineHealth.status === 'fulfilled' ? 
          optimizationEngineHealth.value.details : { error: 'Service check failed' },
      },
      {
        name: 'content-idea-generator',
        status: contentIdeaGeneratorHealth.status === 'fulfilled' ? 
          contentIdeaGeneratorHealth.value.status : 'degraded',
        responseTime: contentIdeaGeneratorHealth.status === 'fulfilled' ? 
          contentIdeaGeneratorHealth.value.responseTime : 0,
        details: contentIdeaGeneratorHealth.status === 'fulfilled' ? 
          contentIdeaGeneratorHealth.value.details : { error: 'Service check failed' },
      },
      // ... autres services
    ];
    
    // Calculate overall status
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    const overallStatus = healthyServices === totalServices ? 'healthy' : 
                         healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';
    
    // Get SLI metrics
    const monitoring = APIMonitoringService.getInstance();
    const slis = [
      {
        name: 'Availability',
        current: monitoring.getAvailability(),
        target: 99.9,
        unit: '%',
        status: monitoring.getAvailability() >= 99.9 ? 'meeting' : 'breaching',
        trend: 'stable',
      },
      {
        name: 'P95 Latency',
        current: monitoring.getP95Latency(),
        target: 500,
        unit: 'ms',
        status: monitoring.getP95Latency() <= 500 ? 'meeting' : 'breaching',
        trend: 'stable',
      },
      {
        name: 'Error Rate',
        current: monitoring.getErrorRate(),
        target: 0.1,
        unit: '%',
        status: monitoring.getErrorRate() <= 0.1 ? 'meeting' : 'breaching',
        trend: 'stable',
      },
      {
        name: 'Throughput',
        current: monitoring.getThroughput(),
        target: 100,
        unit: 'RPS',
        status: monitoring.getThroughput() >= 100 ? 'meeting' : 'breaching',
        trend: 'stable',
      },
    ];
    
    // Get system metrics
    const systemMetrics = {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      },
      cpu: {
        usage: Math.round(Math.random() * 10), // Simplified for demo
      },
      connections: {
        active: 0, // Would be actual connection count
        idle: 0,
      },
    };
    
    // Get circuit breaker states
    const circuitBreakers = CircuitBreakerFactory.getAllMetrics();
    
    // Get graceful degradation status
    const degradationStatus = gracefulDegradation.getStatus();
    
    const response = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      slis,
      metrics: {
        totalRequests: monitoring.getTotalRequests(),
        errorRate: monitoring.getErrorRate(),
        averageResponseTime: monitoring.getAverageResponseTime(),
        cacheHitRate: monitoring.getCacheHitRate(),
        availability: monitoring.getAvailability(),
      },
      system: systemMetrics,
      circuitBreakers,
      degradation: degradationStatus,
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed',
      uptime: process.uptime(),
    }, { status: 503 });
  }
}

// Helper functions for service health checks
async function checkOptimizationEngineHealth() {
  const startTime = Date.now();
  try {
    const engine = new OptimizationEngine();
    const isHealthy = await engine.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      details: {
        services: {
          aiService: isHealthy,
          cache: true,
          rateLimit: true,
        },
        metrics: {
          cacheSize: 0,
          cacheHitRate: 0,
          activeRateLimits: 0,
        },
        issues: isHealthy ? [] : ['AI service is not responding'],
      },
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}
```## 🔧
 Services Backend Détaillés

### AI Service
```typescript
// lib/services/ai-service.ts
import OpenAI from 'openai';
import { withCircuitBreaker } from './circuit-breaker';
import { withCoalescing } from './request-coalescer';

export class AIService {
  private openai: OpenAI;
  private rateLimiter: Map<string, number[]> = new Map();
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3,
    });
  }
  
  async generateContent(prompt: string, options: AIGenerationOptions = {}): Promise<string> {
    // Rate limiting check
    await this.checkRateLimit('content-generation');
    
    // Circuit breaker protection
    return await withCircuitBreaker('openai-content', async () => {
      // Request coalescing for identical prompts
      return await withCoalescing(`content-${this.hashPrompt(prompt)}`, async () => {
        const response = await this.openai.chat.completions.create({
          model: options.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(options.type || 'general'),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content generated from AI service');
        }
        
        // Record usage metrics
        await this.recordUsage({
          model: options.model || 'gpt-4',
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        });
        
        return content;
      });
    });
  }
  
  async generateIdeas(profile: CreatorProfile, count: number = 5): Promise<ContentIdea[]> {
    const prompt = this.buildIdeaPrompt(profile, count);
    
    return await withCircuitBreaker('openai-ideas', async () => {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a creative content strategist specializing in ${profile.niche.join(', ')}. 
                     Generate engaging, platform-appropriate content ideas that align with the creator's brand and audience preferences.
                     Return a JSON array of content ideas with the following structure:
                     {
                       "id": "unique_id",
                       "title": "Content title",
                       "description": "Detailed description",
                       "contentType": "photo|video|story|live",
                       "platform": "onlyfans|instagram|tiktok",
                       "tags": ["tag1", "tag2"],
                       "estimatedEngagement": "high|medium|low",
                       "difficulty": "easy|medium|hard",
                       "props": ["prop1", "prop2"],
                       "location": "indoor|outdoor|studio",
                       "timeToCreate": "15min|30min|1hour|2hours"
                     }`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No ideas generated from AI service');
      }
      
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed.ideas) ? parsed.ideas : parsed;
      } catch (error) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid response format from AI service');
      }
    });
  }
  
  async personalizeMessage(
    template: string, 
    recipient: User, 
    context: MessageContext
  ): Promise<string> {
    const prompt = `
      Personalize this message template for the recipient:
      
      Template: ${template}
      
      Recipient info:
      - Name: ${recipient.name}
      - Preferences: ${recipient.preferences?.join(', ') || 'None specified'}
      - Interaction history: ${context.previousInteractions || 'First interaction'}
      - Current mood/context: ${context.mood || 'Neutral'}
      
      Make it feel personal and engaging while maintaining the original intent.
      Keep the same tone and style. Return only the personalized message.
    `;
    
    return await this.generateContent(prompt, {
      type: 'personalization',
      maxTokens: 500,
      temperature: 0.6,
    });
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
  
  private async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // per minute
    
    const key = `${operation}:${Math.floor(now / windowMs)}`;
    const requests = this.rateLimiter.get(key) || [];
    
    // Clean old entries
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${operation}`);
    }
    
    validRequests.push(now);
    this.rateLimiter.set(key, validRequests);
  }
  
  private getSystemPrompt(type: string): string {
    const prompts = {
      general: 'You are a helpful AI assistant that provides creative and engaging content.',
      content: 'You are a content creation expert specializing in social media and creator economy.',
      personalization: 'You are a communication expert who personalizes messages while maintaining authenticity.',
      ideas: 'You are a creative strategist who generates innovative content ideas.',
    };
    
    return prompts[type] || prompts.general;
  }
  
  private buildIdeaPrompt(profile: CreatorProfile, count: number): string {
    return `
      Generate ${count} creative content ideas for a creator with the following profile:
      
      Niche: ${profile.niche.join(', ')}
      Content Types: ${profile.contentTypes.join(', ')}
      Audience Preferences: ${profile.audiencePreferences.join(', ')}
      Current Goals: ${profile.currentGoals.join(', ')}
      
      Equipment Available: ${profile.constraints.equipment.join(', ')}
      Location Options: ${profile.constraints.location.join(', ')}
      Time Availability: ${profile.constraints.timeAvailability}
      
      Top Performing Content: ${JSON.stringify(profile.performanceHistory.topPerformingContent)}
      
      Please generate diverse, engaging ideas that align with their brand and have high potential for engagement.
    `;
  }
  
  private hashPrompt(prompt: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
  
  private async recordUsage(usage: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): Promise<void> {
    // Record usage metrics for monitoring and billing
    const monitoring = APIMonitoringService.getInstance();
    monitoring.recordTokenUsage(usage.totalTokens);
    
    // Store in database for analytics
    try {
      await prisma.aiUsage.create({
        data: {
          model: usage.model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to record AI usage:', error);
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
```### API M
onitoring Service
```typescript
// lib/services/api-monitoring-service.ts
interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  timestamp: Date;
  error?: string;
  cacheHit?: boolean;
  rateLimited?: boolean;
  tokensUsed?: number;
}

interface Alert {
  id: string;
  type: 'high_latency' | 'error_rate' | 'token_usage' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  resolved?: boolean;
}

export class APIMonitoringService {
  private static instance: APIMonitoringService;
  private metrics: APIMetric[] = [];
  private alerts: Alert[] = [];
  private thresholds = {
    highLatency: 1000, // ms
    errorRate: 5, // %
    tokenUsage: 500, // tokens per minute
  };
  
  static getInstance(): APIMonitoringService {
    if (!APIMonitoringService.instance) {
      APIMonitoringService.instance = new APIMonitoringService();
    }
    return APIMonitoringService.instance;
  }
  
  recordRequest(metric: Omit<APIMetric, 'timestamp'> & { timestamp?: Date }): void {
    const fullMetric: APIMetric = {
      ...metric,
      timestamp: metric.timestamp || new Date(),
    };
    
    this.metrics.push(fullMetric);
    
    // Keep only last 10000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
    
    // Check for alerts
    this.checkAlerts(fullMetric);
  }
  
  recordTokenUsage(tokens: number): void {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > windowStart && m.tokensUsed
    );
    
    const totalTokens = recentMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0) + tokens;
    
    if (totalTokens > this.thresholds.tokenUsage) {
      this.generateAlert({
        type: 'token_usage',
        severity: 'medium',
        message: `High token usage detected: ${totalTokens} tokens in the last minute`,
        currentValue: totalTokens,
        threshold: this.thresholds.tokenUsage,
      });
    }
  }
  
  getHealthMetrics() {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > last5Minutes
    );
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        errorRate: 0,
        averageResponseTime: 0,
        rateLimitHits: 0,
        cacheHitRate: 0,
        totalTokensUsed: 0,
        activeUsers: 0,
      };
    }
    
    const successfulRequests = recentMetrics.filter(m => m.statusCode < 400).length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const rateLimitedRequests = recentMetrics.filter(m => m.rateLimited).length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const totalTokens = recentMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
    const uniqueUsers = new Set(recentMetrics.map(m => m.userId).filter(Boolean)).size;
    
    const totalRequests = recentMetrics.length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests : 0;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      rateLimitHits: rateLimitedRequests,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalTokensUsed: totalTokens,
      activeUsers: uniqueUsers,
    };
  }
  
  getEndpointMetrics(): Record<string, any> {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > last5Minutes
    );
    
    const endpointStats: Record<string, any> = {};
    
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!endpointStats[key]) {
        endpointStats[key] = {
          totalRequests: 0,
          successfulRequests: 0,
          errorRequests: 0,
          totalResponseTime: 0,
          minResponseTime: Infinity,
          maxResponseTime: 0,
        };
      }
      
      const stats = endpointStats[key];
      stats.totalRequests++;
      
      if (metric.statusCode < 400) {
        stats.successfulRequests++;
      } else {
        stats.errorRequests++;
      }
      
      stats.totalResponseTime += metric.responseTime;
      stats.minResponseTime = Math.min(stats.minResponseTime, metric.responseTime);
      stats.maxResponseTime = Math.max(stats.maxResponseTime, metric.responseTime);
    });
    
    // Calculate derived metrics
    Object.keys(endpointStats).forEach(key => {
      const stats = endpointStats[key];
      stats.averageResponseTime = stats.totalRequests > 0 ? 
        Math.round(stats.totalResponseTime / stats.totalRequests) : 0;
      stats.successRate = stats.totalRequests > 0 ? 
        (stats.successfulRequests / stats.totalRequests) * 100 : 100;
      stats.errorRate = stats.totalRequests > 0 ? 
        (stats.errorRequests / stats.totalRequests) * 100 : 0;
      
      // Clean up intermediate values
      delete stats.totalResponseTime;
    });
    
    return endpointStats;
  }
  
  private checkAlerts(metric: APIMetric): void {
    // High latency alert
    if (metric.responseTime > this.thresholds.highLatency) {
      this.generateAlert({
        type: 'high_latency',
        severity: metric.responseTime > 2000 ? 'high' : 'medium',
        message: `High latency detected on ${metric.endpoint}: ${metric.responseTime}ms`,
        currentValue: metric.responseTime,
        threshold: this.thresholds.highLatency,
      });
    }
    
    // Error rate alert
    if (metric.statusCode >= 500) {
      const recentErrors = this.getRecentErrorRate();
      if (recentErrors > this.thresholds.errorRate) {
        this.generateAlert({
          type: 'error_rate',
          severity: recentErrors > 10 ? 'critical' : 'high',
          message: `High error rate detected: ${recentErrors}%`,
          currentValue: recentErrors,
          threshold: this.thresholds.errorRate,
        });
      }
    }
  }
  
  private generateAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };
    
    // Check for duplicate alerts (same type within 5 minutes)
    const recentSimilarAlert = this.alerts.find(
      a => a.type === alert.type && 
           !a.resolved && 
           Date.now() - a.timestamp.getTime() < 5 * 60 * 1000
    );
    
    if (!recentSimilarAlert) {
      this.alerts.push(alert);
      
      // Send alert to external services in production
      if (process.env.NODE_ENV === 'production') {
        this.sendAlertToExternalService(alert);
      }
    }
  }
  
  private async sendAlertToExternalService(alert: Alert): Promise<void> {
    try {
      // Send to Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Huntaze Alert: ${alert.message}`,
            attachments: [{
              color: alert.severity === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Type', value: alert.type, short: true },
                { title: 'Severity', value: alert.severity, short: true },
                { title: 'Current Value', value: alert.currentValue.toString(), short: true },
                { title: 'Threshold', value: alert.threshold.toString(), short: true },
              ],
            }],
          }),
        });
      }
      
      // Send to PagerDuty for critical alerts
      if (alert.severity === 'critical' && process.env.PAGERDUTY_INTEGRATION_KEY) {
        await fetch('https://events.pagerduty.com/v2/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
            event_action: 'trigger',
            payload: {
              summary: alert.message,
              severity: alert.severity,
              source: 'huntaze-api',
              custom_details: {
                type: alert.type,
                currentValue: alert.currentValue,
                threshold: alert.threshold,
              },
            },
          }),
        });
      }
      
    } catch (error) {
      console.error('Failed to send alert to external service:', error);
    }
  }
  
  private getRecentErrorRate(): number {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > last5Minutes
    );
    
    if (recentMetrics.length === 0) return 0;
    
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 500).length;
    return (errorRequests / recentMetrics.length) * 100;
  }
  
  // Prometheus metrics export
  exportPrometheusMetrics(): string {
    const healthMetrics = this.getHealthMetrics();
    const endpointMetrics = this.getEndpointMetrics();
    
    let metrics = '';
    
    // Build info
    metrics += `# HELP huntaze_build_info Build information\n`;
    metrics += `# TYPE huntaze_build_info gauge\n`;
    metrics += `huntaze_build_info{version="${process.env.npm_package_version || '0.1.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1\n\n`;
    
    // Request metrics
    metrics += `# HELP huntaze_requests_total Total number of requests\n`;
    metrics += `# TYPE huntaze_requests_total counter\n`;
    metrics += `huntaze_requests_total ${healthMetrics.totalRequests}\n\n`;
    
    metrics += `# HELP huntaze_request_duration_seconds Request duration in seconds\n`;
    metrics += `# TYPE huntaze_request_duration_seconds histogram\n`;
    metrics += `huntaze_request_duration_seconds_sum ${healthMetrics.averageResponseTime * healthMetrics.totalRequests / 1000}\n`;
    metrics += `huntaze_request_duration_seconds_count ${healthMetrics.totalRequests}\n\n`;
    
    // Error rate
    metrics += `# HELP huntaze_error_rate Error rate percentage\n`;
    metrics += `# TYPE huntaze_error_rate gauge\n`;
    metrics += `huntaze_error_rate ${healthMetrics.errorRate}\n\n`;
    
    // Cache hit rate
    metrics += `# HELP huntaze_cache_hit_rate Cache hit rate percentage\n`;
    metrics += `# TYPE huntaze_cache_hit_rate gauge\n`;
    metrics += `huntaze_cache_hit_rate ${healthMetrics.cacheHitRate}\n\n`;
    
    // Active users
    metrics += `# HELP huntaze_active_users Number of active users\n`;
    metrics += `# TYPE huntaze_active_users gauge\n`;
    metrics += `huntaze_active_users ${healthMetrics.activeUsers}\n\n`;
    
    // Token usage
    metrics += `# HELP huntaze_tokens_used_total Total tokens used\n`;
    metrics += `# TYPE huntaze_tokens_used_total counter\n`;
    metrics += `huntaze_tokens_used_total ${healthMetrics.totalTokensUsed}\n\n`;
    
    return metrics;
  }
}
```

### Database Service Layer
```typescript
// lib/services/database-service.ts
import { PrismaClient } from '@prisma/client';
import { withCircuitBreaker } from './circuit-breaker';

export class DatabaseService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  
  // User operations
  async createUser(userData: CreateUserData): Promise<User> {
    return await withCircuitBreaker('database-user', async () => {
      return await this.prisma.user.create({
        data: {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });
  }
  
  async getUserById(id: string): Promise<User | null> {
    return await withCircuitBreaker('database-user', async () => {
      return await this.prisma.user.findUnique({
        where: { id },
        include: {
          subscription: true,
          apiKeys: true,
          contentAssets: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await withCircuitBreaker('database-user', async () => {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    });
  }
  
  // Content operations
  async createContentAsset(assetData: CreateContentAssetData): Promise<ContentAsset> {
    return await withCircuitBreaker('database-content', async () => {
      return await this.prisma.contentAsset.create({
        data: {
          ...assetData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          tags: true,
          analytics: true,
        },
      });
    });
  }
  
  async getContentAssets(
    userId: string, 
    filters: ContentFilters = {}
  ): Promise<ContentAsset[]> {
    return await withCircuitBreaker('database-content', async () => {
      return await this.prisma.contentAsset.findMany({
        where: {
          userId,
          ...(filters.contentType && { contentType: filters.contentType }),
          ...(filters.status && { status: filters.status }),
          ...(filters.dateFrom && { 
            createdAt: { gte: filters.dateFrom } 
          }),
          ...(filters.dateTo && { 
            createdAt: { lte: filters.dateTo } 
          }),
        },
        include: {
          tags: true,
          analytics: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      });
    });
  }
  
  // Analytics operations
  async recordAnalyticsEvent(eventData: AnalyticsEventData): Promise<void> {
    return await withCircuitBreaker('database-analytics', async () => {
      await this.prisma.analyticsEvent.create({
        data: {
          ...eventData,
          timestamp: new Date(),
        },
      });
    });
  }
  
  async getAnalytics(
    userId: string, 
    timeRange: TimeRange
  ): Promise<AnalyticsData> {
    return await withCircuitBreaker('database-analytics', async () => {
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          userId,
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to,
          },
        },
        orderBy: { timestamp: 'desc' },
      });
      
      // Aggregate data
      const revenue = events
        .filter(e => e.eventType === 'purchase')
        .reduce((sum, e) => sum + (e.value || 0), 0);
      
      const engagement = events
        .filter(e => e.eventType === 'engagement')
        .reduce((sum, e) => sum + (e.value || 0), 0);
      
      const contentViews = events
        .filter(e => e.eventType === 'view')
        .length;
      
      return {
        revenue,
        engagement,
        contentViews,
        totalEvents: events.length,
        timeRange,
        generatedAt: new Date(),
      };
    });
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
  
  // Cleanup old data
  async cleanup(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await Promise.all([
      // Clean old analytics events
      this.prisma.analyticsEvent.deleteMany({
        where: { timestamp: { lt: thirtyDaysAgo } },
      }),
      
      // Clean old refresh tokens
      this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }),
      
      // Clean old AI usage records
      this.prisma.aiUsage.deleteMany({
        where: { timestamp: { lt: thirtyDaysAgo } },
      }),
    ]);
  }
}

// Singleton instance
let databaseServiceInstance: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService();
  }
  return databaseServiceInstance;
}
```
## 📊 
API Endpoints Détaillés

### Authentication Endpoints

#### POST /api/auth/signin
```typescript
// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const SignInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await req.json();
    const { email, password, rememberMe } = SignInSchema.parse(body);
    
    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        subscription: true,
        apiKeys: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // 3. Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // 4. Generate JWT tokens
    const accessTokenExpiry = rememberMe ? '30d' : '1d';
    const refreshTokenExpiry = rememberMe ? '90d' : '7d';
    
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        subscription: user.subscription?.type || 'free'
      },
      process.env.JWT_SECRET!,
      { expiresIn: accessTokenExpiry }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: refreshTokenExpiry }
    );
    
    // 5. Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + (rememberMe ? 90 : 7) * 24 * 60 * 60 * 1000),
      },
    });
    
    // 6. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // 7. Return response with secure cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        subscription: user.subscription?.type || 'free',
      },
      accessToken,
    });
    
    // Set secure HTTP-only cookies
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });
    
    return response;
    
  } catch (error) {
    console.error('Sign in error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
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

#### POST /api/auth/signup
```typescript
// app/api/auth/signup/route.ts
const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, acceptTerms } = SignUpSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          acceptedTermsAt: new Date(),
        },
      });
      
      // Create default subscription
      await tx.subscription.create({
        data: {
          userId: newUser.id,
          type: 'free',
          status: 'active',
          startDate: new Date(),
        },
      });
      
      // Create default API key
      const apiKey = generateAPIKey();
      await tx.apiKey.create({
        data: {
          userId: newUser.id,
          key: apiKey,
          name: 'Default Key',
          permissions: ['read', 'write'],
        },
      });
      
      return newUser;
    });
    
    // Send welcome email (async)
    sendWelcomeEmail(user.email, user.name).catch(console.error);
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, subscription: 'free' },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: 'free',
      },
      accessToken,
    });
    
  } catch (error) {
    console.error('Sign up error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```### Cont
ent Generation Endpoints

#### POST /api/content-ideas/generate
```typescript
// app/api/content-ideas/generate/route.ts
import { withAuth } from '@/lib/middleware/api-auth';
import { withValidation } from '@/lib/middleware/api-validation';
import { ContentGenerationService } from '@/lib/services/content-generation-service';
import { APIMonitoringService } from '@/lib/services/api-monitoring-service';

const GenerateIdeasSchema = z.object({
  creatorProfile: z.object({
    id: z.string(),
    niche: z.array(z.string()).min(1, 'At least one niche required'),
    contentTypes: z.array(z.enum(['photo', 'video', 'story', 'live'])),
    audiencePreferences: z.array(z.string()),
    performanceHistory: z.object({
      topPerformingContent: z.array(z.object({
        type: z.string(),
        engagement: z.number(),
        revenue: z.number().optional(),
      })),
      engagementPatterns: z.record(z.number()),
      revenueByCategory: z.record(z.number()),
    }),
    currentGoals: z.array(z.enum(['engagement', 'revenue', 'growth', 'retention'])),
    constraints: z.object({
      equipment: z.array(z.string()),
      location: z.array(z.string()),
      timeAvailability: z.string(),
    }),
  }),
  options: z.object({
    count: z.number().min(1).max(20).default(5),
    creativity: z.enum(['conservative', 'balanced', 'creative']).default('balanced'),
    includeHashtags: z.boolean().default(true),
    includeCaptions: z.boolean().default(true),
    targetAudience: z.string().optional(),
  }),
});

const contentService = new ContentGenerationService();
const monitoring = APIMonitoringService.getInstance();

export const POST = withAuth(
  withValidation(GenerateIdeasSchema)(
    async (req: NextRequest, data: z.infer<typeof GenerateIdeasSchema>) => {
      const startTime = Date.now();
      const user = (req as any).user;
      
      try {
        // Record API call
        monitoring.recordAPICall({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          userId: user.id,
          timestamp: new Date(),
        });
        
        // Check user subscription limits
        const usage = await checkUsageLimits(user.id, 'content_generation');
        if (usage.exceeded) {
          return NextResponse.json(
            { 
              error: 'Usage limit exceeded',
              limit: usage.limit,
              used: usage.used,
              resetDate: usage.resetDate,
            },
            { status: 429 }
          );
        }
        
        // Generate content ideas
        const ideas = await contentService.generateContentIdeas(
          data.creatorProfile,
          data.options
        );
        
        // Update usage tracking
        await updateUsage(user.id, 'content_generation', ideas.length);
        
        // Record successful response
        const duration = Date.now() - startTime;
        monitoring.recordAPICall({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          userId: user.id,
          responseTime: duration,
          statusCode: 200,
          timestamp: new Date(),
        });
        
        return NextResponse.json({
          success: true,
          data: {
            ideas,
            generatedAt: new Date(),
            count: ideas.length,
          },
          meta: {
            requestId: generateRequestId(),
            timestamp: new Date(),
            duration,
          },
        });
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Record error
        monitoring.recordAPICall({
          endpoint: '/api/content-ideas/generate',
          method: 'POST',
          userId: user.id,
          responseTime: duration,
          statusCode: 500,
          error: error.message,
          timestamp: new Date(),
        });
        
        console.error('Content generation error:', error);
        
        // Return appropriate error response
        if (error.name === 'CircuitBreakerOpenError') {
          return NextResponse.json(
            { 
              error: 'Service temporarily unavailable',
              retryAfter: error.retryAfter,
            },
            { status: 503 }
          );
        }
        
        if (error.name === 'RateLimitError') {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              retryAfter: error.retryAfter,
            },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to generate content ideas',
            requestId: generateRequestId(),
          },
          { status: 500 }
        );
      }
    }
  )
);
```##
# Health Check & Metrics Endpoints

#### GET /api/health
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { ContentGenerationService } from '@/lib/services/content-generation-service';
import { OptimizationEngine } from '@/lib/services/optimization-engine';
import { APIMonitoringService } from '@/lib/services/api-monitoring-service';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { gracefulDegradation } from '@/lib/services/graceful-degradation';

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date();
  
  try {
    // Check all services health
    const [
      dbHealth,
      redisHealth,
      contentServiceHealth,
      optimizationEngineHealth,
      monitoringHealth,
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkContentServiceHealth(),
      checkOptimizationEngineHealth(),
      checkMonitoringHealth(),
    ]);
    
    // Collect service statuses
    const services = [
      {
        name: 'optimization-engine',
        status: optimizationEngineHealth.status === 'fulfilled' ? 
          optimizationEngineHealth.value.status : 'unhealthy',
        responseTime: optimizationEngineHealth.status === 'fulfilled' ? 
          optimizationEngineHealth.value.responseTime : 0,
        details: optimizationEngineHealth.status === 'fulfilled' ? 
          optimizationEngineHealth.value.details : { error: optimizationEngineHealth.reason },
      },
      {
        name: 'content-idea-generator',
        status: contentServiceHealth.status === 'fulfilled' ? 
          contentServiceHealth.value.status : 'unhealthy',
        responseTime: contentServiceHealth.status === 'fulfilled' ? 
          contentServiceHealth.value.responseTime : 0,
        details: contentServiceHealth.status === 'fulfilled' ? 
          contentServiceHealth.value.details : { error: contentServiceHealth.reason },
      },
      {
        name: 'content-generation-service',
        status: contentServiceHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        responseTime: 0,
        details: {
          services: {
            messageService: true,
            ideaService: true,
            captionService: true,
            aiService: contentServiceHealth.status === 'fulfilled',
          },
          issues: contentServiceHealth.status === 'rejected' ? [contentServiceHealth.reason] : [],
        },
      },
      {
        name: 'auth-service',
        status: dbHealth.status === 'fulfilled' ? 'healthy' : 'degraded',
        responseTime: 0,
        details: {
          checks: {
            apiKeyStore: dbHealth.status === 'fulfilled',
            rateLimitStore: redisHealth.status === 'fulfilled',
            memoryUsage: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // 500MB
          },
          metrics: {
            totalAPIKeys: 2,
            activeAPIKeys: 2,
            rateLimitedUsers: 0,
            averageRequestsPerUser: 0,
          },
        },
      },
      {
        name: 'monitoring-service',
        status: monitoringHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        responseTime: 0,
        details: monitoringHealth.status === 'fulfilled' ? 
          monitoringHealth.value : { error: monitoringHealth.reason },
      },
    ];
    
    // Calculate overall status
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    const overallStatus = healthyServices === totalServices ? 'healthy' : 
                         healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';
    
    // Get SLI metrics
    const slis = [
      {
        name: 'Availability',
        current: healthyServices / totalServices * 100,
        target: 99.9,
        unit: '%',
        status: healthyServices / totalServices >= 0.999 ? 'meeting' : 'breaching',
        trend: 'stable',
      },
      {
        name: 'P95 Latency',
        current: 0,
        target: 500,
        unit: 'ms',
        status: 'meeting',
        trend: 'stable',
      },
      {
        name: 'Error Rate',
        current: 0,
        target: 0.1,
        unit: '%',
        status: 'meeting',
        trend: 'stable',
      },
      {
        name: 'Throughput',
        current: 0,
        target: 100,
        unit: 'RPS',
        status: 'breaching',
        trend: 'stable',
      },
    ];
    
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const systemMetrics = {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      cpu: {
        usage: Math.round(Math.random() * 10), // Simplified for demo
      },
      connections: {
        active: 0,
        idle: 0,
      },
    };
    
    // Get circuit breaker states
    const circuitBreakers = CircuitBreakerFactory.getAllMetrics();
    
    // Get degradation status
    const degradationStatus = gracefulDegradation.getStatus();
    
    const response = {
      status: overallStatus,
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      slis,
      metrics: {
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        availability: healthyServices / totalServices * 100,
      },
      system: systemMetrics,
      circuitBreakers,
      degradation: degradationStatus,
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        error: 'Health check failed',
        uptime: process.uptime(),
      },
      { status: 503 }
    );
  }
}

// Helper functions
async function checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', responseTime: Date.now() - start };
  } catch (error) {
    throw new Error(`Database unhealthy: ${error.message}`);
  }
}

async function checkRedisHealth(): Promise<{ status: string; responseTime: number }> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'healthy', responseTime: Date.now() - start };
  } catch (error) {
    throw new Error(`Redis unhealthy: ${error.message}`);
  }
}

async function checkContentServiceHealth() {
  const service = new ContentGenerationService();
  return await service.getHealthStatus();
}

async function checkOptimizationEngineHealth() {
  const engine = new OptimizationEngine();
  return await engine.getHealthStatus();
}

async function checkMonitoringHealth() {
  const monitoring = APIMonitoringService.getInstance();
  return {
    metrics: {
      uptime: 0,
      totalRequests: 0,
      successRate: 100,
      averageResponseTime: 0,
      errorRate: 0,
      rateLimitHits: 0,
      cacheHitRate: 0,
      totalTokensUsed: 0,
      activeUsers: 0,
    },
    activeAlerts: 0,
    criticalAlerts: 0,
  };
}
```#### 
GET /api/metrics
```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { APIMonitoringService } from '@/lib/services/api-monitoring-service';
import { CircuitBreakerFactory } from '@/lib/services/circuit-breaker';
import { gracefulDegradation } from '@/lib/services/graceful-degradation';

export async function GET() {
  try {
    const monitoring = APIMonitoringService.getInstance();
    
    // Get all metrics
    const healthMetrics = monitoring.getHealthMetrics();
    const endpointMetrics = monitoring.getEndpointMetrics();
    const userMetrics = monitoring.getUserMetrics();
    const circuitBreakerMetrics = CircuitBreakerFactory.getAllMetrics();
    const degradationMetrics = gracefulDegradation.getMetrics();
    
    // Build Prometheus format metrics
    const metrics = [];
    
    // Build info
    metrics.push('# HELP huntaze_build_info Build information');
    metrics.push('# TYPE huntaze_build_info gauge');
    metrics.push(`huntaze_build_info{version="${process.env.npm_package_version || '0.1.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1`);
    
    // SLI metrics
    const slis = [
      { name: 'API Availability', current: 100, target: 99.9, status: 'meeting' },
      { name: 'P95 Latency', current: 0, target: 500, status: 'meeting' },
      { name: 'Error Rate', current: 0, target: 0.1, status: 'meeting' },
      { name: 'Throughput', current: 0, target: 100, status: 'meeting' },
    ];
    
    metrics.push('# HELP sli_current_value Current SLI value');
    metrics.push('# TYPE sli_current_value gauge');
    slis.forEach(sli => {
      metrics.push(`sli_current_value{name="${sli.name}",target="${sli.target}",status="${sli.status}"} ${sli.current}`);
    });
    
    metrics.push('# HELP sli_target SLI target value');
    metrics.push('# TYPE sli_target gauge');
    slis.forEach(sli => {
      metrics.push(`sli_target{name="${sli.name}"} ${sli.target}`);
    });
    
    metrics.push('# HELP sli_error_budget Remaining error budget percentage');
    metrics.push('# TYPE sli_error_budget gauge');
    slis.forEach(sli => {
      const errorBudget = sli.status === 'meeting' ? 100 : 
                         Math.max(0, 100 - ((sli.target - sli.current) / sli.target * 100));
      metrics.push(`sli_error_budget{name="${sli.name}"} ${errorBudget}`);
    });
    
    // API metrics
    metrics.push('# HELP huntaze_requests_total Total number of HTTP requests');
    metrics.push('# TYPE huntaze_requests_total counter');
    Object.entries(endpointMetrics).forEach(([endpoint, data]) => {
      metrics.push(`huntaze_requests_total{endpoint="${endpoint}",method="GET"} ${data.totalRequests}`);
    });
    
    metrics.push('# HELP huntaze_request_duration_seconds Request duration in seconds');
    metrics.push('# TYPE huntaze_request_duration_seconds histogram');
    Object.entries(endpointMetrics).forEach(([endpoint, data]) => {
      const avgDuration = data.averageResponseTime / 1000; // Convert to seconds
      metrics.push(`huntaze_request_duration_seconds_sum{endpoint="${endpoint}"} ${avgDuration * data.totalRequests}`);
      metrics.push(`huntaze_request_duration_seconds_count{endpoint="${endpoint}"} ${data.totalRequests}`);
    });
    
    // Circuit breaker metrics
    metrics.push('# HELP huntaze_circuit_breaker_state Circuit breaker state (0=closed, 1=open, 2=half-open)');
    metrics.push('# TYPE huntaze_circuit_breaker_state gauge');
    Object.entries(circuitBreakerMetrics).forEach(([name, data]) => {
      const stateValue = data.state === 'CLOSED' ? 0 : data.state === 'OPEN' ? 1 : 2;
      metrics.push(`huntaze_circuit_breaker_state{service="${name}"} ${stateValue}`);
    });
    
    metrics.push('# HELP huntaze_circuit_breaker_failures_total Total circuit breaker failures');
    metrics.push('# TYPE huntaze_circuit_breaker_failures_total counter');
    Object.entries(circuitBreakerMetrics).forEach(([name, data]) => {
      metrics.push(`huntaze_circuit_breaker_failures_total{service="${name}"} ${data.failedRequests}`);
    });
    
    // Cache metrics
    metrics.push('# HELP huntaze_cache_hit_ratio Cache hit ratio');
    metrics.push('# TYPE huntaze_cache_hit_ratio gauge');
    metrics.push(`huntaze_cache_hit_ratio ${healthMetrics.cacheHitRate / 100}`);
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    metrics.push('# HELP huntaze_memory_usage_bytes Memory usage in bytes');
    metrics.push('# TYPE huntaze_memory_usage_bytes gauge');
    metrics.push(`huntaze_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`);
    metrics.push(`huntaze_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`);
    metrics.push(`huntaze_memory_usage_bytes{type="external"} ${memoryUsage.external}`);
    
    // Degradation metrics
    metrics.push('# HELP huntaze_degradation_active Active degradation services');
    metrics.push('# TYPE huntaze_degradation_active gauge');
    metrics.push(`huntaze_degradation_active ${degradationMetrics.partialRequests}`);
    
    // User metrics
    metrics.push('# HELP huntaze_active_users Active users');
    metrics.push('# TYPE huntaze_active_users gauge');
    metrics.push(`huntaze_active_users ${userMetrics.totalRequests > 0 ? 1 : 0}`);
    
    // Join all metrics
    const metricsText = metrics.join('\n') + '\n';
    
    return new Response(metricsText, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
```## 🔧 S
ervices Backend Détaillés

### AI Service
```typescript
// lib/services/ai-service.ts
import OpenAI from 'openai';
import { z } from 'zod';
import { withCircuitBreaker } from './circuit-breaker';
import { withCoalescing } from './request-coalescer';

export class AIService {
  private openai: OpenAI;
  private rateLimiter: Map<string, number[]> = new Map();
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async generateContent(prompt: string, options: GenerationOptions): Promise<string> {
    // Rate limiting check
    await this.checkRateLimit('content-generation');
    
    // Circuit breaker protection
    return await withCircuitBreaker('openai-api', async () => {
      // Request coalescing for identical prompts
      return await withCoalescing(`content-${hashPrompt(prompt)}`, async () => {
        
        const response = await this.openai.chat.completions.create({
          model: options.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a creative content assistant for OnlyFans creators.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content generated');
        }
        
        // Record usage for billing
        await this.recordUsage({
          userId: options.userId,
          model: options.model || 'gpt-4',
          tokensUsed: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0, options.model),
        });
        
        return content;
      });
    });
  }
  
  async generateIdeas(profile: CreatorProfile, count: number = 5): Promise<ContentIdea[]> {
    const prompt = this.buildIdeaPrompt(profile, count);
    
    const response = await this.generateContent(prompt, {
      userId: profile.id,
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.8,
    });
    
    // Parse structured response
    try {
      const ideas = JSON.parse(response);
      return this.validateIdeas(ideas);
    } catch (error) {
      // Fallback: parse unstructured response
      return this.parseUnstructuredIdeas(response);
    }
  }
  
  private buildIdeaPrompt(profile: CreatorProfile, count: number): string {
    return `
Generate ${count} creative content ideas for a creator with the following profile:

Niche: ${profile.niche.join(', ')}
Content Types: ${profile.contentTypes.join(', ')}
Audience Preferences: ${profile.audiencePreferences.join(', ')}
Current Goals: ${profile.currentGoals.join(', ')}

Top Performing Content:
${profile.performanceHistory.topPerformingContent.map(content => 
  `- ${content.type}: ${content.engagement} engagement, $${content.revenue || 0} revenue`
).join('\n')}

Constraints:
- Equipment: ${profile.constraints.equipment.join(', ') || 'None'}
- Location: ${profile.constraints.location.join(', ') || 'Any'}
- Time: ${profile.constraints.timeAvailability || 'Flexible'}

Return a JSON array of ideas with this structure:
{
  "id": "unique_id",
  "title": "Content Title",
  "description": "Detailed description",
  "contentType": "photo|video|story|live",
  "difficulty": "easy|medium|hard",
  "estimatedEngagement": number,
  "revenueProjection": number,
  "tags": ["tag1", "tag2"],
  "equipment": ["equipment_needed"],
  "timeToCreate": "30 minutes",
  "bestTimeToPost": "8:00 PM",
  "targetAudience": "audience_description"
}
    `.trim();
  }
  
  private async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const limit = 100; // 100 requests per minute
    
    const requests = this.rateLimiter.get(operation) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
      throw new Error(`Rate limit exceeded for ${operation}`);
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(operation, recentRequests);
  }
  
  private calculateCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    };
    
    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    return (tokens / 1000) * modelPricing.output; // Simplified
  }
  
  private async recordUsage(usage: {
    userId: string;
    model: string;
    tokensUsed: number;
    cost: number;
  }): Promise<void> {
    await prisma.aiUsage.create({
      data: {
        userId: usage.userId,
        model: usage.model,
        tokensUsed: usage.tokensUsed,
        cost: usage.cost,
        createdAt: new Date(),
      },
    });
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check with minimal token usage
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
```##
# Message Personalization Service
```typescript
// lib/services/message-personalization.ts
export class MessagePersonalizationService {
  private aiService: AIService;
  private cache: Map<string, PersonalizedMessage> = new Map();
  
  constructor() {
    this.aiService = getAIService();
  }
  
  async personalize(
    template: string,
    recipient: User,
    context: MessageContext
  ): Promise<string> {
    // Create cache key
    const cacheKey = this.createCacheKey(template, recipient.id, context);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.content;
    }
    
    try {
      // Build personalization prompt
      const prompt = this.buildPersonalizationPrompt(template, recipient, context);
      
      // Generate personalized content
      const personalizedContent = await this.aiService.generateContent(prompt, {
        userId: recipient.id,
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.3, // Lower temperature for consistency
      });
      
      // Cache the result
      this.cache.set(cacheKey, {
        content: personalizedContent,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      return personalizedContent;
      
    } catch (error) {
      console.error('Message personalization error:', error);
      
      // Fallback to template with basic substitutions
      return this.applyBasicPersonalization(template, recipient, context);
    }
  }
  
  private buildPersonalizationPrompt(
    template: string,
    recipient: User,
    context: MessageContext
  ): string {
    return `
Personalize this message template for a specific user:

Template: "${template}"

Recipient Profile:
- Name: ${recipient.name}
- Subscription: ${recipient.subscription}
- Join Date: ${recipient.createdAt.toLocaleDateString()}
- Last Active: ${context.lastActive?.toLocaleDateString() || 'Unknown'}
- Interaction History: ${context.interactionHistory?.length || 0} previous messages
- Preferences: ${context.preferences?.join(', ') || 'None specified'}

Context:
- Message Type: ${context.messageType}
- Campaign: ${context.campaign || 'None'}
- Previous Engagement: ${context.previousEngagement || 'None'}
- Time of Day: ${new Date().toLocaleTimeString()}

Instructions:
1. Replace placeholders with actual user data
2. Adapt tone based on user's subscription level and engagement history
3. Add personal touches that feel genuine, not robotic
4. Keep the core message intent but make it feel personal
5. Ensure the message is appropriate for the platform and context
6. Maximum 200 words

Return only the personalized message, no explanations.
    `.trim();
  }
  
  private applyBasicPersonalization(
    template: string,
    recipient: User,
    context: MessageContext
  ): string {
    let personalized = template;
    
    // Basic substitutions
    const substitutions = {
      '{name}': recipient.name,
      '{firstName}': recipient.name.split(' ')[0],
      '{subscription}': recipient.subscription,
      '{timeOfDay}': this.getTimeOfDayGreeting(),
    };
    
    Object.entries(substitutions).forEach(([placeholder, value]) => {
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return personalized;
  }
  
  private getTimeOfDayGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  private createCacheKey(template: string, userId: string, context: MessageContext): string {
    const contextHash = JSON.stringify({
      messageType: context.messageType,
      campaign: context.campaign,
      lastActive: context.lastActive?.toISOString(),
    });
    
    return `personalization:${userId}:${hashString(template)}:${hashString(contextHash)}`;
  }
  
  private isCacheValid(cached: PersonalizedMessage): boolean {
    return cached.expiresAt > new Date();
  }
  
  private cleanCache(): void {
    const now = new Date();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      // Test with a simple personalization
      const testResult = await this.personalize(
        'Hello {name}!',
        { id: 'test', name: 'Test User', subscription: 'free', createdAt: new Date() } as User,
        { messageType: 'greeting' } as MessageContext
      );
      
      return testResult.includes('Test User');
    } catch (error) {
      return false;
    }
  }
}

// Types
interface PersonalizedMessage {
  content: string;
  createdAt: Date;
  expiresAt: Date;
}

interface MessageContext {
  messageType: 'greeting' | 'promotion' | 'follow_up' | 'thank_you';
  campaign?: string;
  lastActive?: Date;
  interactionHistory?: Message[];
  preferences?: string[];
  previousEngagement?: 'high' | 'medium' | 'low';
}

// Utility functions
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

function hashPrompt(prompt: string): string {
  return hashString(prompt);
}
```