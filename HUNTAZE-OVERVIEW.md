# 🎯 HUNTAZE - Documentation Complète

> **Plateforme de gestion tout-en-un pour créateurs OnlyFans**

---

## 📋 Table des Matières

1. [Qu'est-ce que Huntaze ?](#quest-ce-que-huntaze-)
2. [Interface & Navigation](#interface--navigation)
3. [Modules Principaux](#modules-principaux)
4. [Système IA Multi-Agent](#système-ia-multi-agent)
5. [Stack Technique](#stack-technique)
6. [Infrastructure](#infrastructure)

---

## 🎯 Qu'est-ce que Huntaze ?

**Huntaze** est une application web SaaS avec **sidebar** qui sert de **tableau de bord centralisé** pour gérer un compte OnlyFans et optimiser la présence sur les réseaux sociaux.

### Objectif Principal
Permettre aux créateurs de contenu de :
- **Centraliser** la gestion de leur business OnlyFans (messages, fans, PPV)
- **Automatiser** les réponses et workflows
- **Analyser** performances et revenus
- **Créer** du contenu optimisé avec l'IA
- **Planifier** le marketing multi-plateforme

### Public Cible
- Créateurs OnlyFans
- Agences de gestion de créateurs
- Content managers

---

## 🧭 Interface & Navigation

### Structure Exacte de la Sidebar

```
┌─────────────────────────────────────┐
│  🏠 Home                            │
├─────────────────────────────────────┤
│  📹 OnlyFans                        │
│     ├── Messages                    │
│     ├── Fans                        │
│     └── PPV                         │
├─────────────────────────────────────┤
│  📊 Analytics                       │
├─────────────────────────────────────┤
│  📝 Content                         │
│     └── Studio                      │
├─────────────────────────────────────┤
│  📣 Marketing                       │
│     ├── Calendar                    │
│     └── Campaigns                   │
├─────────────────────────────────────┤
│  ⚡ Automations                     │
├─────────────────────────────────────┤
│  🔌 Integrations                    │
├─────────────────────────────────────┤
│  ⚙️ Settings (footer)              │
└─────────────────────────────────────┘
```

### Design System
- **Theme**: Clair avec accents monochromes (Polaris-inspired)
- **Style**: Shopify Polaris
- **Typographie**: System fonts + SF Mono (chiffres)
- **Radius**: 14px (cards), 8px (icons), 6px (pills)

---

## 📦 Modules Principaux

### 1. 🏠 Home

**Route**: `/home`

Dashboard principal avec vue d'ensemble de l'activité.

**Contenu**:
- **Priority Actions** - Messages non lus, PPV prêts, fans à réengager, posts planifiés
- **AI Suggestions** - Recommandations personnalisées (répondre aux messages, planifier posts)
- **Quick Access** - Raccourcis : New PPV, Create Post, Automations, Analytics, All Fans, New Offer
- **Automations** - État des automations actives (active/paused)
- **Integrations** - État des connexions (OnlyFans, Instagram, Twitter)
- **Recent Activity** - Fil d'activité filtrable (All, PPV, Subs, Tips, Messages)

**KPIs affichés**:
- Messages en attente
- Revenus totaux

---

### 2. 📹 OnlyFans

**Route**: `/onlyfans`

Hub principal pour la gestion du compte OnlyFans.

**Page principale** (`/onlyfans`):
- KPIs : Monthly Revenue, Total Fans, Response Rate, Unread Messages
- Quick Actions : Messages, Automations, Fans, Integrations
- Recent Activity : nouveaux messages, nouveaux abonnés, ventes PPV

#### 2.1 Messages (`/onlyfans/messages`)

Interface de messagerie 3 colonnes :
```
┌──────────────┬─────────────────┬──────────────┐
│ Conversation │   Chat actif    │  Contexte    │
│    List      │                 │    Fan       │
└──────────────┴─────────────────┴──────────────┘
```

**Fonctionnalités**:
- Liste des conversations
- Chat en temps réel
- Panneau contexte fan (LTV, historique, notes)
- **Assistant IA** pour générer des réponses
- Notes personnelles par fan

#### 2.2 Fans (`/onlyfans/fans`)

CRM des abonnés OnlyFans.

**Fonctionnalités**:
- Liste des fans avec avatar, username, tier
- **Segments** : All Fans, VIP, Active, At-Risk, Churned
- Recherche par nom/username
- Colonnes : Fan, Tier, LTV, Churn Risk, Last Active, AI Insight, Message
- Lien direct pour envoyer un message

**Données par fan**:
- LTV (Lifetime Value)
- Churn Risk (Low/Medium/High + %)
- AI Insight (suggestions IA)

#### 2.3 PPV (`/onlyfans/ppv`)

Gestion des contenus Pay-Per-View.

**KPIs**: Revenue, Sent, Purchases, Conversion %

**Onglets**:
- **Library** - Templates PPV (draft, ready, archived) avec prix, médias, tags
- **Campaigns** - Historique des envois avec stats (Sent, Opened, Bought, Revenue)

**Actions**: New PPV, Send, Edit, Duplicate, Archive, View stats

---

### 3. 📊 Analytics

**Route**: `/analytics`

Dashboard analytique complet.

**Navigation interne (onglets)**:
| Onglet | Description |
|--------|-------------|
| Overview | Vue d'ensemble |
| Pricing | Analyse des prix |
| Churn Risk | Risque d'attrition |
| Upsells | Performance upsells |
| Forecast | Prédictions |
| Payouts | Historique paiements |

**KPIs principaux**:
- Revenue (graphique temporel)
- ARPU, LTV, Churn Rate
- Retention, Expansion, Risk metrics
- Messaging KPIs

**Fonctionnalités**:
- Filtrage par période (7d, 30d, 90d)
- Comparaison de périodes
- Glossaire des termes
- Graphiques interactifs (Recharts)
- Funnel de conversion
- Top Whales (meilleurs fans)
- Platform breakdown

---

### 4. 📝 Content

**Route**: `/content`

Page de découverte de tendances et idées de contenu.

**Contenu principal**:
- **Trending Now** - Tendances virales par plateforme (TikTok, Instagram, Reddit)
- **Content Ideas** - Idées générées par IA avec success rate
- **AI Recommendations** - Suggestions personnalisées

**Filtrage**: All, TikTok, Instagram, Reddit

**Données par trend**:
- Viral Score, Engagement, Velocity
- Hashtags associés
- Tips et conseils
- Lien vers vidéo source

#### 4.1 Studio (`/content/factory`)

Factory de création de contenu.

**Modes**:
- **Footage** - Upload de médias
- **Ideas** - Génération d'idées IA

**Workflow**:
1. Sélection niche (fitness, fashion, tech, food, lifestyle, business)
2. Sélection goal (sell, grow, educate, entertain)
3. Génération d'idées (title, angle, hook, why)
4. Script generation (hook, body, CTA)
5. Production settings
6. Export vers Marketing

---

### 5. 📣 Marketing

**Route**: `/marketing`

Hub marketing avec War Room.

**Page principale** (`/marketing`):
- **Queue** - Posts planifiés (scheduled, uploading, processing, posted, failed)
- **Automations** - Auto-retry, Smart Schedule, etc.
- **Account Health** - Status par plateforme

**Plateformes**: TikTok, Instagram, Reddit

#### 5.1 Calendar (`/marketing/calendar`)

Calendrier éditorial.

**Fonctionnalités**:
- Vue calendrier mensuelle
- Navigation mois précédent/suivant
- Posts par jour avec plateforme et type de média
- Status : draft, scheduled, published
- Badge "AI" pour contenu généré par IA

#### 5.2 Campaigns (`/marketing/campaigns`)

Gestion des campagnes marketing.

**KPIs**: Total campaigns, Active, Total Sent, Avg Open Rate, Conversions

**Statuts**: draft, scheduled, active, paused, completed

**Données par campagne**: Sent, Opens, Clicks, Converted, Open Rate, Click Rate

---

### 6. ⚡ Automations

**Route**: `/automations`

Gestion des workflows automatisés.

**Liste des automations**:
- Nom, Trigger, Status (active/paused), Executions, Success Rate, Last Run

**Triggers disponibles**:
- New Subscriber
- Message Received
- Purchase Completed
- Subscription Expiring

**Sous-routes**:
- `/automations/new` - Créer nouvelle automation
- `/automations/[id]` - Détail d'une automation
- `/automations/analytics` - Stats des automations
- `/automations/flows` - Flow builder
- `/automations/templates` - Templates prédéfinis

**Composants IA**:
- `FlowBuilder` - Constructeur visuel de workflows
- `AIFlowGenerator` - Génération de flows en langage naturel

---

### 7. 🔌 Integrations

**Route**: `/integrations`

Connexion des plateformes externes.

**Plateformes**:
| Plateforme | Permissions | Syncs |
|------------|-------------|-------|
| **OnlyFans** 🔥 | read-write | Messages, Fans, Revenue, PPV |
| **Instagram** 📸 | read-only | Posts, Stories, Analytics |
| **TikTok** 🎵 | read-only | Videos, Analytics, Trends |
| **Reddit** 🤖 | read-write | Posts, Comments, Karma |
| **X (Twitter)** 𝕏 | read-write | Tweets, DMs, Analytics |

**États**:
- ✅ Connected - Account + Last sync + [Sync now] [Manage]
- ⚠️ Needs attention - Impact + [Reconnect] [Why?]
- ⭕ Not connected - Value prop + [Connect]

---

### 8. ⚙️ Settings

**Route**: `/onlyfans/settings`

Paramètres du compte et de l'application.

(Accessible via le footer de la sidebar)

---

## 🤖 Système IA Multi-Agent

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  USER REQUEST                        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              AI TEAM COORDINATOR                     │
│  • Route vers l'agent approprié                      │
│  • Gère le contexte et l'historique                  │
│  • Agrège les réponses multi-agents                  │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
   │MESSAGING│ │ CONTENT  │ │ANALYTICS│ │  SALES   │
   │  AGENT  │ │  AGENT   │ │  AGENT  │ │  AGENT   │
   └────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘
        │           │            │            │
        └───────────┴────────────┴────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            AI KNOWLEDGE NETWORK                      │
│  • Cache des insights (Redis/ElastiCache)            │
│  • Partage de contexte entre agents                  │
│  • Apprentissage des patterns                        │
└─────────────────────────────────────────────────────┘
```

### Agents Spécialisés

#### 1. 💬 Messaging Agent

**Rôle**: Génération de réponses aux fans

**Modèle**: Azure AI (optimisé vitesse)

**Capacités**:
- Réponses contextuelles basées sur l'historique du fan
- Adaptation au style de communication du créateur
- Suggestions d'upsell au bon moment
- Apprentissage des interactions réussies

**Insights générés**:
- `successful_interaction` - Types de messages efficaces
- `fan_preference` - Préférences de communication du fan

#### 2. 📝 Content Agent

**Rôle**: Génération de captions et hashtags

**Modèle**: Azure AI (optimisé créativité)

**Capacités**:
- Optimisation par plateforme (Instagram, TikTok, Twitter, OnlyFans)
- Suggestions de hashtags trending
- Cohérence de la voix de marque
- Intégration de call-to-action

**Insights générés**:
- `content_strategy` - Approches de contenu efficaces
- `trending_topic` - Hashtags et sujets tendance

#### 3. 📊 Analytics Agent

**Rôle**: Analyse de performance et insights

**Modèle**: Azure AI (plus puissant pour analyses complexes)

**Capacités**:
- Reconnaissance de patterns dans les données d'engagement
- Prédictions de performance
- Recommandations actionnables
- Analyse multi-plateforme

**Structure de réponse**:
```typescript
{
  insights: string[];       // Découvertes clés
  patterns: string[];       // Tendances observées
  predictions: string[];    // Projections futures
  recommendations: string[]; // Actions suggérées
  confidence: number;       // Score de confiance 0-1
}
```

#### 4. 💰 Sales Agent

**Rôle**: Optimisation des messages de vente

**Modèle**: Azure AI (équilibré persuasion/vitesse)

**Capacités**:
- Tactiques psychologiques (rareté, urgence, FOMO, preuve sociale)
- Optimisation des prix
- Adaptation au niveau d'engagement du fan
- Tracking des stratégies de conversion

**Structure de réponse**:
```typescript
{
  message: string;          // Message de vente optimisé
  tactics: string[];        // Tactiques utilisées
  suggestedPrice?: number;  // Prix optimal suggéré
  confidence: number;       // Score de confiance 0-1
}
```

### Composants IA Frontend

| Composant | Description |
|-----------|-------------|
| `AIQuotaIndicator` | Affiche le quota IA restant |
| `AIChatAssistant` | Assistant pour réponses aux fans |
| `AICaptionGenerator` | Générateur de légendes |
| `AIAnalyticsDashboard` | Dashboard insights IA |
| `AIInsightsDashboard` | Tableau de bord insights |
| `AIAssistantPanel` | Panneau assistant flottant |
| `FanSegmentationView` | Segmentation IA des fans |
| `AutoReplyConfig` | Configuration auto-réponses IA |
| `AIFlowGenerator` | Génération de workflows IA |

### APIs IA

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/chat` | POST | Génération de réponses |
| `/api/ai/generate-caption` | POST | Génération de captions |
| `/api/ai/analyze-performance` | POST | Analyse de performance |
| `/api/ai/quota` | GET | État du quota utilisateur |

### Gestion des Quotas

| Plan | Limite mensuelle | Coût |
|------|------------------|------|
| **FREE** | 100 requêtes | Gratuit |
| **PRO** | 1000 requêtes | Payant |
| **PREMIUM** | Illimité | Payant |

### Knowledge Network

Système de cache intelligent (Redis/ElastiCache) pour:
- Partage d'insights entre agents
- Cache des réponses (TTL: 1 heure)
- Stockage du contexte (TTL: 24 heures)
- Tracking des patterns d'usage

---

## 🛠️ Stack Technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16 | Framework React |
| React | 18.3 | UI Library |
| TypeScript | 5.9 | Typage |
| TailwindCSS | 4.1 | Styling |
| Framer Motion | 12 | Animations |
| Lucide React | - | Icônes |
| Recharts | 3 | Graphiques |
| SWR | 2 | Data fetching |
| Zustand | 5 | State management |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js API Routes | - | API Backend |
| Prisma | 6.19 | ORM |
| PostgreSQL | - | Base de données |
| NextAuth | 5.0-beta | Authentification |
| Zod | 4 | Validation |
| BullMQ | 5 | Job queues |
| Redis/IORedis | - | Cache |

### IA & ML
| Technologie | Usage |
|-------------|-------|
| Azure AI (Foundry) | LLM principal |
| Azure OpenAI | Modèles GPT |
| Azure Speech | Transcription audio |
| Phi-4 Multimodal | Analyse visuelle |

### Infrastructure AWS
| Service | Usage |
|---------|-------|
| S3 | Stockage assets |
| CloudFront | CDN |
| SES | Emails |
| ElastiCache Redis | Cache, Rate limiting |
| CloudWatch | Monitoring |
| Lambda@Edge | Edge computing |
| Amplify | Déploiement |

---

## 🏗️ Infrastructure

### Architecture Cloud

```
┌─────────────────────────────────────────────────────────┐
│                      UTILISATEUR                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   CLOUDFRONT CDN                         │
│               (Distribution Globale)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS APP (Vercel/Amplify)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   API Routes │  │  Middleware  │   │
│  │   (React)    │  │   (Backend)  │  │   (Auth)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ┌────────┐    ┌─────────┐    ┌──────────┐
     │ Prisma │    │ Gemini  │    │   AWS    │
     │   DB   │    │   AI    │    │ Services │
     └────────┘    └─────────┘    └──────────┘
```

### Environnements

| Environnement | URL | Usage |
|---------------|-----|-------|
| Development | localhost:3000 | Dev local |
| Staging | staging.huntaze.com | Tests |
| Production | app.huntaze.com | Live |

### Sécurité

- ✅ CSRF Protection
- ✅ Rate Limiting (ElastiCache Redis)
- ✅ JWT Authentication
- ✅ bcrypt password hashing
- ✅ HTTPS everywhere
- ✅ VPC privé pour Redis
- ✅ Encryption at-rest et in-transit

---

## 📁 Structure du Projet

```
huntaze/
├── app/                    # Next.js App Router
│   ├── (app)/              # Routes authentifiées
│   │   ├── home/           # Dashboard
│   │   ├── onlyfans/       # Hub OnlyFans
│   │   ├── analytics/      # Analytics
│   │   ├── content/        # Content creation
│   │   ├── marketing/      # Marketing
│   │   ├── automations/    # Automations
│   │   └── integrations/   # Intégrations
│   ├── (auth)/             # Authentification
│   ├── api/                # API Routes
│   │   ├── ai/             # Endpoints IA
│   │   ├── onlyfans/       # API OnlyFans
│   │   ├── automations/    # API Automations
│   │   └── ...
│   └── layout.tsx          # Layout racine
├── components/             # Composants React
│   ├── ai/                 # Composants IA
│   ├── messages/           # Interface messagerie
│   ├── fans/               # CRM fans
│   ├── automations/        # Automations UI
│   ├── analytics/          # Analytics UI
│   └── ui/                 # Composants génériques
├── lib/                    # Logique métier
│   ├── ai/                 # Système IA
│   │   ├── agents/         # Agents spécialisés
│   │   ├── coordinator.ts  # Orchestrateur
│   │   └── knowledge-network.ts
│   ├── services/           # Services backend
│   └── api/                # Clients API
├── hooks/                  # React Hooks
├── styles/                 # Styles globaux
├── prisma/                 # Schéma DB
├── tests/                  # Tests
└── scripts/                # Scripts utilitaires
```

---

## 📊 Résumé

**Huntaze** est une plateforme complète de gestion pour créateurs OnlyFans qui combine:

1. **📹 Gestion OnlyFans** - Messages, Fans, PPV
2. **📊 Analytics avancés** - Revenus, Churn, Prédictions
3. **📝 Création de contenu** - Studio, Captions, Hashtags
4. **📣 Marketing** - Calendrier, Campagnes
5. **⚡ Automations** - Workflows, Auto-réponses
6. **🤖 IA Multi-Agent** - 4 agents spécialisés (Messaging, Content, Analytics, Sales)
7. **🔌 Multi-plateforme** - OnlyFans, Instagram, TikTok, Reddit

Le tout dans une **interface moderne avec sidebar**, propulsée par **Azure AI** et déployée sur **AWS**.

---

## 🔧 Architecture Technique Détaillée

### 1. Schéma de Base de Données (Prisma)

**Fichier**: `prisma/schema.prisma`  
**Base**: PostgreSQL

#### Modèles Principaux

| Modèle | Description |
|--------|-------------|
| `users` | Utilisateurs (créateurs) avec infos OnlyFans, rôle, onboarding |
| `Account` / `Session` | NextAuth - authentification et sessions |
| `content` | Contenus créés (posts, médias) par plateforme |
| `subscriptions` | Abonnements des fans |
| `transactions` | Historique des transactions |
| `user_stats` | Stats agrégées (messages, revenus, response rate) |
| `marketing_campaigns` | Campagnes marketing |
| `oauth_accounts` | Comptes OAuth connectés (Instagram, TikTok, etc.) |

#### Modèles IA

| Modèle | Description |
|--------|-------------|
| `UsageLog` | Logs d'utilisation IA (tokens, coût, feature, agent) |
| `MonthlyCharge` | Facturation mensuelle IA par créateur |
| `AIInsight` | Insights générés par les agents IA |
| `AssistantConversation` / `AssistantMessage` | Historique des conversations avec l'assistant |
| `KnowledgeBaseItem` | Base de connaissances (chat closers, viral structures, etc.) |

#### Modèles Automations & Offres

| Modèle | Description |
|--------|-------------|
| `Automation` | Workflows automatisés (steps en JSON, status, triggers) |
| `AutomationExecution` | Logs d'exécution des automations |
| `Offer` | Offres promotionnelles (discount, validité, audience) |
| `OfferRedemption` | Historique des redemptions |

#### Modèles PPV

| Modèle | Description |
|--------|-------------|
| `PPVTemplate` | Templates PPV (titre, prix, médias, tags, status) |
| `PPVCampaign` | Campagnes d'envoi PPV (recipients, stats, revenue) |

#### Modèles Content Posting

| Modèle | Description |
|--------|-------------|
| `ContentTask` | Tâches de publication (TikTok/Instagram) |
| `SocialAccount` | Comptes sociaux connectés avec tokens |

#### Enums Clés

```prisma
enum KnowledgeKind {
  CHAT_CLOSER_PLAY      // Meilleures réponses → conversion
  VIRAL_STRUCTURE       // Patterns viraux (hook/body/cta)
  EDITING_RULESET       // Règles d'édition
  ANALYTICS_PLAYBOOK    // Règles "do this today"
  TREND_TEMPLATE        // Templates tendance
}

enum ContentTaskStatus {
  PENDING | PROCESSING | POSTED | FAILED
}
```

---

### 2. Orchestrateur IA (AITeamCoordinator)

**Fichier**: `lib/ai/coordinator.ts`

Le **AITeamCoordinator** est le cerveau de l'IA - il orchestre la collaboration multi-agents.

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AITeamCoordinator                      │
│                                                          │
│  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │ Provider Config │  │    Knowledge Network       │   │
│  │ (legacy/foundry │  │    (Redis/ElastiCache)     │   │
│  │  /canary)       │  │                            │   │
│  └─────────────────┘  └────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              AGENTS (Legacy)                     │   │
│  │  MessagingAgent │ ContentAgent │ AnalyticsAgent │   │
│  │                 │ SalesAgent                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           FOUNDRY REGISTRY (Azure)               │   │
│  │  + Circuit Breaker + Retry + Fallback            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Méthodes Principales

| Méthode | Description |
|---------|-------------|
| `initialize()` | Initialise tous les agents avec le Knowledge Network |
| `route(request)` | Route une requête vers le bon agent |
| `selectProvider(userId)` | Choisit le provider (legacy/foundry/canary) |
| `handleFallback()` | Gère le fallback Foundry → Legacy |
| `handleFanMessage()` | Traite un message de fan (Messaging + Sales) |
| `handleCaptionGeneration()` | Génère une caption (Analytics + Content) |
| `handlePerformanceAnalysis()` | Analyse les performances |
| `handleSalesOptimization()` | Optimise les messages de vente |
| `handleContentTrendsAnalysis()` | Analyse les tendances de contenu |

#### Types de Requêtes

```typescript
type AIRequestType = 
  | 'fan_message'           → MessagingAgent + SalesAgent
  | 'generate_caption'      → AnalyticsAgent + ContentAgent
  | 'analyze_performance'   → AnalyticsAgent
  | 'optimize_sales'        → SalesAgent
  | 'content_trends_analysis' → ContentTrendsRouter
```

#### Response Structure

```typescript
interface CoordinatorResponse {
  success: boolean;
  data?: any;
  error?: string;
  agentsInvolved: string[];  // Ex: ['messaging-agent', 'sales-agent']
  usage?: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
    model?: string;
  };
  metadata?: {
    correlationId: string;
    provider: 'foundry' | 'legacy';
    latencyMs: number;
    fallbackUsed: boolean;
  };
}
```

#### Features

- **Provider**: Azure AI (Foundry)
- **Circuit Breaker**: Protection contre les pannes
- **Retry avec backoff**: 3 tentatives avec délai exponentiel
- **Correlation ID**: Traçabilité de bout en bout

---

### 3. Shell de l'Application (Layout & Sidebar)

**Fichiers**: 
- `app/(app)/layout.tsx` - Layout principal
- `components/Sidebar.tsx` - Navigation
- `components/Header.tsx` - Header

#### Structure du Layout

```tsx
<Providers>
  <ProtectedRoute>
    <div className="huntaze-layout">
      <Header />           // Barre supérieure
      <Sidebar />          // Navigation latérale
      <main>               // Contenu principal
        {children}
      </main>
      <AssistantDrawer />  // Drawer IA flottant
    </div>
  </ProtectedRoute>
</Providers>
```

#### CSS Grid Layout

```
┌──────────────────────────────────────────┐
│                 HEADER                    │  60px
├────────────┬─────────────────────────────┤
│            │                              │
│  SIDEBAR   │           MAIN              │
│   200px    │          flex-1             │
│            │                              │
│            │                              │
└────────────┴─────────────────────────────┘
```

#### Sidebar - Navigation Items

```typescript
const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'OnlyFans', href: '/onlyfans', icon: Video,
    subItems: [
      { name: 'Messages', href: '/onlyfans/messages' },
      { name: 'Fans', href: '/onlyfans/fans' },
      { name: 'PPV', href: '/onlyfans/ppv' },
    ]
  },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Content', href: '/content', icon: FileText,
    subItems: [{ name: 'Studio', href: '/content/factory' }]
  },
  { name: 'Marketing', href: '/marketing', icon: Megaphone,
    subItems: [
      { name: 'Calendar', href: '/marketing/calendar' },
      { name: 'Campaigns', href: '/marketing/campaigns' },
    ]
  },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Integrations', href: '/integrations', icon: Plug },
];
// Settings en footer
```

#### Responsive Behavior

| Breakpoint | Comportement |
|------------|--------------|
| Desktop (>1024px) | Sidebar visible, layout 2 colonnes |
| Tablet (768-1024px) | Sidebar collapsible |
| Mobile (<768px) | Sidebar en overlay modal |

---

### 4. Module de Messagerie (UI 3 Colonnes)

**Fichier**: `components/messages/MessagingInterface.tsx`

Interface de messagerie complète pour communiquer avec les fans.

#### Layout 3 Colonnes

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   FAN LIST      │     CHAT CONTAINER   │  CONTEXT PANEL  │
│     25%         │        45-50%        │     25-30%      │
│                 │                      │                 │
│ • Conversations │ • Messages           │ • Fan info      │
│ • Search        │ • Input              │ • Tags          │
│ • Filters       │ • AI Suggestions     │ • LTV           │
│ • Unread count  │                      │ • Notes         │
│                 │                      │ • History       │
└─────────────────┴──────────────────────┴─────────────────┘
```

#### Composants

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `MessagingInterface` | MessagingInterface.tsx | Container principal |
| `FanList` | FanList.tsx | Liste des conversations |
| `FanCard` | FanCard.tsx | Carte de conversation |
| `ChatContainer` | ChatContainer.tsx | Zone de chat |
| `ContextPanel` | ContextPanel.tsx | Infos du fan |
| `FanNotesPanel` | FanNotesPanel.tsx | Notes sur le fan |
| `CustomMessageInput` | CustomMessageInput.tsx | Zone de saisie |

#### Data Flow

```typescript
// 1. Fetch threads
useSWR('/api/messages/unified?creatorId=...')
  → threads: MessageThread[]

// 2. Fetch fan data
useSWR('/api/crm/fans')
  → fans: Fan[]

// 3. Fetch messages for selected conversation
useSWR('/api/messages/{conversationId}')
  → messages: Message[]

// 4. Build fan context
buildFanContext(fan, thread) → {
  fanId, name, avatar, status,
  joinDate, lastActive, totalSpent,
  subscriptionTier, notes, tags
}
```

#### Responsive Behavior

| Breakpoint | Vue |
|------------|-----|
| Desktop (>1024px) | 3 colonnes |
| Tablet (768-1024px) | 2 colonnes (list+chat OU chat+context) |
| Mobile (<768px) | 1 colonne avec navigation (list → chat → notes) |

#### Keyboard Navigation

| Raccourci | Action |
|-----------|--------|
| `Tab` | Navigation entre éléments |
| `Ctrl/Cmd+K` | Focus sur la recherche |
| `Escape` | Retour à la liste (mobile) |
| `Enter` | Sélectionner conversation / Envoyer message |
| `Shift+Enter` | Nouvelle ligne dans le message |

#### État Mobile

```typescript
type MobileView = 'list' | 'chat' | 'notes';
```

---

*Document généré le 25 décembre 2024*  
*Version: 2.0 - Avec détails techniques*
