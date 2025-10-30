# 🔧 HUNTAZE - Backend Détaillé

## 📋 Table des Matières

1. [Architecture Backend](#architecture-backend)
2. [API Routes](#api-routes)
3. [Services](#services)
4. [Middleware](#middleware)
5. [Base de Données](#base-de-données)

---

## 🏗️ Architecture Backend

### Structure des Dossiers

```
huntaze/
├── app/api/                    # Next.js API Routes
│   ├── auth/                   # Authentication
│   │   ├── signin/route.ts
│   │   ├── signup/route.ts
│   │   ├── refresh/route.ts
│   │   └── logout/route.ts
│   │
│   ├── content-ideas/          # Génération d'idées
│   │   └── generate/route.ts
│   │
│   ├── ai-assistant/           # Assistant IA
│   │   ├── generate/route.ts
│   │   └── tools/
│   │       ├── content-ideas/route.ts
│   │       ├── message-generator/route.ts
│   │       └── pricing-optimizer/route.ts
│   │
│   ├── content-creation/       # Gestion contenu
│   │   ├── assets/route.ts
│   │   ├── campaigns/route.ts
│   │   ├── schedule/route.ts
│   │   └── upload/route.ts
│   │
│   ├── analytics/              # Analytics
│   │   ├── revenue/route.ts
│   │   ├── engagement/route.ts
│   │   └── performance/route.ts
│   │
│   ├── billing/                # Facturation
│   │   ├── stripe/
│   │   │   └── webhook/route.ts
│   │   └── message-packs/
│   │       └── checkout/route.ts
│   │
│   ├── health/route.ts         # Health checks
│   └── metrics/route.ts        # Métriques Prometheus
│
└── lib/                        # Logique métier
    ├── services/               # Services business
    │   ├── ai-service.ts
    │   ├── content-generation-service.ts
    │   ├── simple-user-service.ts
    │   ├── simple-billing-service.ts
    │   └── api-monitoring-service.ts
    │
    ├── middleware/             # Middleware
    │   ├── api-auth.ts
    │   ├── api-validation.ts
    │   └── rate-limiting.ts
    │
    └── utils/                  # Utilitaires
        ├── api.ts
        ├── validation.ts
        └── errors.ts
```

---

## 🛣️ API Routes

### Authentication

#### POST /api/auth/signin
**Description:** Connexion utilisateur

**Request:**
```typescript
{
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    subscription: 'free' | 'pro' | 'enterprise';
  };
  accessToken: string;
}
```

**Cookies:**
- `refreshToken` (HTTP-only, secure)

---

#### POST /api/auth/signup
**Description:** Inscription utilisateur

**Request:**
```typescript
{
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}
```

**Response:**
```typescript
{
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    subscription: string;
    createdAt: Date;
  };
}
```

---

### Content Generation

#### POST /api/content-ideas/generate
**Description:** Génère des idées de contenu personnalisées

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```typescript
{
  creatorProfile: {
    id: string;
    niche: string[];
    contentTypes: ('photo' | 'video' | 'story' | 'live')[];
    audiencePreferences: string[];
    performanceHistory: {
      topPerformingContent: any[];
      engagementPatterns: Record<string, any>;
      revenueByCategory: Record<string, number>;
    };
    currentGoals: string[];
    constraints: {
      equipment: string[];
      location: string[];
      timeAvailability: string;
    };
  };
  options: {
    count?: number; // 1-20, default: 5
    creativity?: 'conservative' | 'balanced' | 'creative';
    includeHashtags?: boolean;
    includeCaptions?: boolean;
    targetPlatforms?: ('onlyfans' | 'instagram' | 'tiktok')[];
  };
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    ideas: Array<{
      id: string;
      title: string;
      description: string;
      contentType: string;
      estimatedEngagement: number;
      estimatedRevenue: number;
      difficulty: 'easy' | 'medium' | 'hard';
      timeRequired: string;
      caption?: string;
      hashtags?: string[];
      tips: string[];
      generatedAt: Date;
    }>;
    metadata: {
      generatedAt: Date;
      count: number;
      profile: string;
      options: any;
    };
  };
  meta: {
    requestId: string;
    timestamp: Date;
    duration: number;
  };
}
```

---

### Analytics

#### GET /api/analytics/revenue
**Description:** Récupère les statistiques de revenus

**Query Parameters:**
```
?period=7d|30d|90d|1y
&startDate=2025-01-01
&endDate=2025-01-31
```

**Response:**
```typescript
{
  totalRevenue: number;
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
  revenueBySource: Record<string, number>;
  growth: {
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}
```

---

## 🔧 Services

### AI Service

**Fichier:** `lib/services/ai-service.ts`

**Responsabilités:**
- Routage intelligent vers Azure OpenAI
- Gestion du cache des prompts
- Circuit breaker pour résilience
- Monitoring des coûts

**Méthodes principales:**
```typescript
class AIService {
  // Génération de texte
  async generateText(request: AIRequest): Promise<AIResponse>
  
  // Génération avec streaming
  async generateTextStream(request: AIRequest): AsyncGenerator<AIChunk>
  
  // Vérification de santé
  async isHealthy(): Promise<boolean>
  
  // Métriques
  getMetrics(): AIMetrics
}
```

---

### Content Generation Service

**Fichier:** `lib/services/content-generation-service.ts`

**Responsabilités:**
- Génération d'idées de contenu
- Personnalisation des messages
- Optimisation des captions
- Suggestions de hashtags

**Méthodes principales:**
```typescript
class ContentGenerationService {
  // Générer des idées
  async generateContentIdeas(
    profile: CreatorProfile,
    options: GenerationOptions
  ): Promise<ContentIdea[]>
  
  // Personnaliser un message
  async personalizeMessage(
    template: string,
    recipient: User,
    context: MessageContext
  ): Promise<string>
  
  // Santé du service
  async getHealthStatus(): Promise<ServiceHealth>
}
```

---

### User Service

**Fichier:** `lib/services/simple-user-service.ts`

**Responsabilités:**
- Gestion des utilisateurs
- Profils créateurs
- Préférences
- Authentification

**Méthodes principales:**
```typescript
class UserService {
  // Créer un utilisateur
  async createUser(data: CreateUserData): Promise<User>
  
  // Récupérer un utilisateur
  async getUser(id: string): Promise<User | null>
  
  // Mettre à jour le profil
  async updateProfile(id: string, data: UpdateProfileData): Promise<User>
  
  // Supprimer un utilisateur
  async deleteUser(id: string): Promise<void>
}
```

---

### Billing Service

**Fichier:** `lib/services/simple-billing-service.ts`

**Responsabilités:**
- Gestion des abonnements Stripe
- Calcul des revenus
- Webhooks Stripe
- Facturation

**Méthodes principales:**
```typescript
class BillingService {
  // Créer un abonnement
  async createSubscription(
    userId: string,
    priceId: string
  ): Promise<Subscription>
  
  // Annuler un abonnement
  async cancelSubscription(subscriptionId: string): Promise<void>
  
  // Récupérer les revenus
  async getRevenue(userId: string, period: string): Promise<Revenue>
  
  // Gérer les webhooks
  async handleWebhook(event: StripeEvent): Promise<void>
}
```

---

## 🛡️ Middleware

### Authentication Middleware

**Fichier:** `lib/middleware/api-auth.ts`

**Fonctionnalités:**
- Validation du token JWT
- Extraction de l'utilisateur
- Vérification des permissions
- Rate limiting par utilisateur

**Usage:**
```typescript
export const POST = withAuth(async (req: NextRequest) => {
  const user = (req as any).user;
  // ... logique métier
});
```

---

### Validation Middleware

**Fichier:** `lib/middleware/api-validation.ts`

**Fonctionnalités:**
- Validation des données avec Zod
- Messages d'erreur détaillés
- Type safety

**Usage:**
```typescript
const CreateContentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const POST = withAuth(
  withValidation(CreateContentSchema)(
    async (req, data) => {
      // data est typé et validé
    }
  )
);
```

---

## 💾 Base de Données

### Schéma Prisma

**Fichier:** `prisma/schema.prisma`

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String?
  passwordHash  String
  subscription  String   @default("free")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  content       Content[]
  analytics     Analytics[]
  subscriptions Subscription[]
}

model Content {
  id          String   @id @default(uuid())
  userId      String
  title       String
  body        String?
  type        String
  status      String
  aiGenerated Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}

model Subscription {
  id                    String   @id @default(uuid())
  userId                String
  stripeSubscriptionId  String   @unique
  status                String
  plan                  String
  currentPeriodEnd      DateTime
  createdAt             DateTime @default(now())
  
  user                  User     @relation(fields: [userId], references: [id])
}
```

---

**📖 Voir aussi :**
- `HUNTAZE_FRONTEND_DETAILED.md` - Frontend en détail
- `HUNTAZE_INTEGRATION.md` - Intégration Frontend-Backend
