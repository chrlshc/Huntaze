# 🏗️ Architecture Huntaze - Documentation Complète

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Stack Technique Détaillée](#stack-technique)
3. [Architecture Frontend](#frontend)
4. [Architecture Backend](#backend)
5. [Services de Résilience](#resilience)
6. [Monitoring & Observabilité](#monitoring)
7. [Sécurité & Multi-tenancy](#security)
8. [Base de Données](#database)
9. [Testing Strategy](#testing)
10. [Déploiement & Infrastructure](#deployment)

---

## 🎯 Vue d'Ensemble

### Architecture Générale
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Services      │
│   Next.js 14    │◄──►│   Middleware    │◄──►│   Microservices │
│   React 18      │    │   Auth/Rate     │    │   AI/Content    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   Monitoring    │    │   Database      │
│   Zustand       │    │   Prometheus    │    │   PostgreSQL    │
│   React Query   │    │   Grafana       │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Principes Architecturaux
- **Microservices**: Services découplés et indépendants
- **Event-Driven**: Communication asynchrone par événements
- **Resilience First**: Patterns de résilience intégrés
- **Observability**: Monitoring et logging complets
- **Security by Design**: Sécurité intégrée dès la conception
---


## 💻 Stack Technique Détaillée

### Frontend Stack
```typescript
// Core Framework
Next.js 14.2.32          // React framework avec App Router
React 18.2.0             // Library UI avec Concurrent Features
TypeScript 5.3.0         // Type safety et developer experience

// Styling & UI
Tailwind CSS 3.4.0       // Utility-first CSS framework
Headless UI              // Composants accessibles
Framer Motion            // Animations fluides
Lucide React             // Icônes modernes

// State Management
Zustand 4.4.0            // State management léger
React Query 5.0.0        // Server state et cache
React Hook Form          // Gestion des formulaires

// Development Tools
ESLint 8.0.0             // Linting et code quality
Prettier 3.0.0           // Code formatting
Husky 8.0.0              // Git hooks
```

### Backend Stack
```typescript
// API & Server
Next.js API Routes       // Serverless functions
tRPC 10.0.0             // Type-safe API calls
Zod 3.22.0              // Schema validation

// Database & Cache
PostgreSQL 15.0          // Base de données relationnelle
Prisma 5.0.0            // ORM type-safe
Redis 7.0.0             // Cache et sessions
Upstash Redis           // Redis serverless

// External Services
OpenAI GPT-4            // Intelligence artificielle
Stripe 13.0.0           // Paiements
AWS SDK 3.0.0           // Services cloud
Nodemailer 6.9.0        // Emails
```---


## 🎨 Architecture Frontend

### Structure des Dossiers
```
app/                     # Next.js App Router
├── (dashboard)/         # Route groups
├── api/                 # API endpoints
├── globals.css          # Styles globaux
└── layout.tsx           # Layout principal

components/              # Composants réutilisables
├── ui/                  # Composants de base
├── forms/               # Composants de formulaires
├── charts/              # Graphiques et visualisations
└── admin/               # Interface d'administration

lib/                     # Logique métier
├── services/            # Services business
├── hooks/               # Custom React hooks
├── utils/               # Utilitaires
└── types/               # Types TypeScript

pages/                   # Pages legacy (migration en cours)
├── api/                 # API routes legacy
└── [dynamic]/           # Routes dynamiques
```

### Composants Clés

#### Layout Principal
```typescript
// components/admin/Layout.tsx
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode[];
}

const Layout = ({ children, title, primaryAction, secondaryActions }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar responsive */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <main className="lg:pl-64">
        <Header title={title} primaryAction={primaryAction} />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
```####
 State Management avec Zustand
```typescript
// lib/stores/user-store.ts
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user, error: null }),
  clearUser: () => set({ user: null, error: null }),
  
  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const updatedUser = await api.user.update(data);
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

#### Custom Hooks
```typescript
// lib/hooks/use-api-integration.ts
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
        // Request coalescing
        return await coalescer.execute(endpoint, () => 
          fetch(endpoint).then(res => res.json())
        );
      });
    },
    ...options,
  });
};
```---


## ⚙️ Architecture Backend

### API Routes Structure
```
app/api/
├── auth/                # Authentication
│   ├── signin/route.ts
│   ├── signup/route.ts
│   └── refresh/route.ts
├── content-ideas/       # Content generation
│   └── generate/route.ts
├── health/route.ts      # Health checks
├── metrics/route.ts     # Prometheus metrics
└── ai-assistant/        # AI services
    ├── generate/route.ts
    └── tools/
        ├── content-ideas/route.ts
        ├── message-generator/route.ts
        └── pricing-optimizer/route.ts
```

### Middleware Stack
```typescript
// lib/middleware/api-auth.ts
export const withAuth = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1. Extract API key
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      
      // 2. Validate API key
      const user = await validateAPIKey(apiKey);
      if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      // 3. Rate limiting
      const rateLimitResult = await checkRateLimit(user.id, req.url);
      if (rateLimitResult.exceeded) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime 
        });
      }
      
      // 4. Add user to request
      req.user = user;
      
      return handler(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
};
```### Servi
ces Architecture

#### Content Generation Service
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
  
  async generateContentIdeas(profile: CreatorProfile, options: GenerationOptions) {
    // Circuit breaker protection
    return await withCircuitBreaker('content-generation', async () => {
      // Request coalescing for duplicate requests
      return await withCoalescing(`ideas-${profile.id}`, async () => {
        const ideas = await this.ideaGenerator.generate(profile, options);
        
        // Add captions and hashtags
        const enrichedIdeas = await Promise.all(
          ideas.map(async (idea) => ({
            ...idea,
            caption: await this.captionGenerator.generateCaption(idea),
            hashtags: await this.captionGenerator.generateHashtags(idea),
          }))
        );
        
        return enrichedIdeas;
      });
    });
  }
  
  async personalizeMessage(template: string, recipient: User, context: MessageContext) {
    return await this.messagePersonalization.personalize(template, recipient, context);
  }
}
```---

##
 🛡️ Services de Résilience

### 1. Circuit Breaker Pattern

#### Advanced Circuit Breaker
```typescript
// lib/services/advanced-circuit-breaker.ts
export class AdvancedCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  
  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenError(this.serviceName);
      }
    }
    
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      
      // Record success
      this.onSuccess(duration);
      return result;
      
    } catch (error) {
      // Record failure
      this.onFailure(error);
      throw error;
    }
  }
  
  private onSuccess(duration: number) {
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.config.successThreshold) {
        this.reset();
      }
    }
    
    // Record metrics
    this.recordMetrics('success', duration);
  }
  
  private onFailure(error: Error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
    
    // Record metrics
    this.recordMetrics('failure', 0, error);
  }
}
```