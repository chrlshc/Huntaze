# Design Document - OnlyFans CRM Integration

## Overview

Cette intégration connecte l'infrastructure AWS existante (Lambda + SQS + Redis) avec le système CRM OnlyFans déjà en place (database + repositories) pour créer une plateforme complète de gestion des fans et messages OnlyFans. Le système permet d'envoyer des messages rate-limited, gérer les conversations, importer des données CSV, et visualiser des analytics.

### Architecture Existante

**Infrastructure AWS (Déployée)** :
- Lambda `huntaze-rate-limiter` (Node.js 20.x, 256MB, 30s timeout)
- SQS Queue `huntaze-rate-limiter-queue` + DLQ
- ElastiCache Redis `huntaze-redis-production`
- ECS Cluster `huntaze-of-fargate` (vide)

**CRM Backend (Implémenté)** :
- Database tables: `fans`, `conversations`, `messages`, `campaigns`, `platform_connections`
- Repositories: `FansRepository`, `ConversationsRepository`, `MessagesRepository`
- API: `GET/POST /api/crm/fans` (partiel)

**UI (Partiel)** :
- Page `/platforms/connect/onlyfans` (redirect + CSV upload UI)
- Page `/messages/bulk` (form non connecté)

### Objectif

Relier tous les composants pour avoir un système OnlyFans CRM complet :
1. Créer le service rate limiter pour utiliser l'infrastructure AWS
2. Compléter les API endpoints CRM
3. Implémenter CSV import backend
4. Créer les UI conversations et analytics
5. Configurer monitoring et observabilité

## Architecture Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application (Amplify)                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    UI Layer                               │   │
│  │                                                           │   │
│  │  /messages/onlyfans          /platforms/onlyfans/        │   │
│  │  - Conversations list         analytics                  │   │
│  │  - Message thread            - Dashboard                 │   │
│  │  - Send message              - Top fans                  │   │
│  │                              - Revenue trends            │   │
│  └────────────┬─────────────────────────────┬───────────────┘   │
│               │                             │                   │
│  ┌────────────▼─────────────────────────────▼───────────────┐   │
│  │                    API Layer                             │   │
│  │                                                           │   │
│  │  /api/onlyfans/messages/send    /api/crm/fans           │   │
│  │  /api/onlyfans/messages/status  /api/crm/conversations  │   │
│  │  /api/onlyfans/import/csv       /api/crm/messages       │   │
│  │  /api/messages/bulk             /api/monitoring/onlyfans│   │
│  └────────────┬─────────────────────────────┬───────────────┘   │
│               │                             │                   │
│  ┌────────────▼─────────────────────────────▼───────────────┐   │
│  │                  Service Layer                           │   │
│  │                                                           │   │
│  │  OnlyFansRateLimiterService    CRM Repositories         │   │
│  │  - sendMessage()                - FansRepository         │   │
│  │  - sendBatch()                  - ConversationsRepo      │   │
│  │  - getQueueStatus()             - MessagesRepository     │   │
│  └────────────┬─────────────────────────────┬───────────────┘   │
│               │                             │                   │
└───────────────┼─────────────────────────────┼───────────────────┘
                │                             │
                │                             │
    ┌───────────▼──────────┐      ┌──────────▼──────────┐
    │   AWS Infrastructure  │      │  PostgreSQL Database │
    │                       │      │                      │
    │  SQS Queue            │      │  Tables:             │
    │  huntaze-rate-        │      │  - fans              │
    │  limiter-queue        │      │  - conversations     │
    │         │             │      │  - messages          │
    │         ▼             │      │  - campaigns         │
    │  Lambda               │      └──────────────────────┘
    │  huntaze-rate-        │
    │  limiter              │
    │         │             │
    │         ▼             │
    │  Redis Cluster        │
    │  huntaze-redis-       │
    │  production           │
    │         │             │
    │         ▼             │
    │  OnlyFans API         │
    │  (External)           │
    └───────────────────────┘
```

## Components

### 1. OnlyFansRateLimiterService (Nouveau)

Service TypeScript qui encapsule la logique d'envoi de messages avec rate limiting via SQS.

**Fichier** : `lib/services/onlyfans-rate-limiter.service.ts`

**Interface** :
```typescript
interface OnlyFansMessage {
  messageId: string;
  userId: string;
  recipientId: string;
  content: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  priority?: number;
}

interface SendResult {
  messageId: string;
  status: 'queued' | 'failed';
  queuedAt?: Date;
  error?: string;
}

interface QueueStatus {
  queueDepth: number;
  messagesInFlight: number;
  dlqCount: number;
  lastProcessedAt?: Date;
}

export class OnlyFansRateLimiterService {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private enabled: boolean;

  constructor() {
    this.sqsClient = new SQSClient({ region: process.env.AWS_REGION });
    this.queueUrl = process.env.SQS_RATE_LIMITER_QUEUE_URL!;
    this.enabled = process.env.RATE_LIMITER_ENABLED === 'true';
  }

  async sendMessage(message: OnlyFansMessage): Promise<SendResult>
  async sendBatch(messages: OnlyFansMessage[]): Promise<SendResult[]>
  async getQueueStatus(): Promise<QueueStatus>
  private validateMessage(message: OnlyFansMessage): void
  private generateMessageId(): string
}
```

**Implémentation** :
- Utilise `@aws-sdk/client-sqs` pour envoyer à SQS
- Valide le payload avec Zod schema
- Génère messageId avec UUID v4
- Retry avec exponential backoff (3 tentatives)
- Logging structuré avec `lib/utils/logger.ts`
- Métriques CloudWatch avec `lib/utils/metrics.ts`

### 2. API Routes OnlyFans (Nouveaux)

#### POST /api/onlyfans/messages/send

Envoie un message OnlyFans via rate limiter.

**Request** :
```json
{
  "recipientId": "fan_123",
  "content": "Hello! Thanks for subscribing",
  "mediaUrls": ["https://s3.amazonaws.com/media/image.jpg"],
  "priority": 1
}
```

**Response** (202 Accepted) :
```json
{
  "messageId": "uuid-v4",
  "status": "queued",
  "queuedAt": "2025-11-01T12:00:00Z",
  "estimatedSendTime": "2025-11-01T12:00:06Z"
}
```

**Implémentation** :
```typescript
// app/api/onlyfans/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { getUserFromRequest } from '@/lib/auth/request';
import { z } from 'zod';

const SendMessageSchema = z.object({
  recipientId: z.string(),
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  priority: z.number().min(1).max(10).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const validated = SendMessageSchema.parse(body);

  const service = new OnlyFansRateLimiterService();
  const result = await service.sendMessage({
    messageId: crypto.randomUUID(),
    userId: user.userId,
    ...validated,
  });

  return NextResponse.json(result, { status: 202 });
}
```

#### GET /api/onlyfans/messages/status

Récupère l'état de la queue SQS.

**Response** (200 OK) :
```json
{
  "queueDepth": 42,
  "messagesInFlight": 5,
  "dlqCount": 2,
  "lastProcessedAt": "2025-11-01T12:00:00Z",
  "metrics": {
    "messagesQueuedToday": 1234,
    "messagesProcessedToday": 1200,
    "failureRate": 0.027
  }
}
```

### 3. API Routes CRM Complets (Nouveaux)

#### GET /api/crm/fans/[id]

Récupère un fan par ID.

**Response** (200 OK) :
```json
{
  "fan": {
    "id": 123,
    "userId": 1,
    "name": "John Doe",
    "platform": "onlyfans",
    "handle": "@johndoe",
    "email": "john@example.com",
    "avatar": "https://...",
    "tags": ["vip", "whale"],
    "valueCents": 50000,
    "lastSeenAt": "2025-11-01T12:00:00Z",
    "notes": "High value customer",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-11-01T12:00:00Z"
  }
}
```

#### PUT /api/crm/fans/[id]

Met à jour un fan.

**Request** :
```json
{
  "name": "John Doe Updated",
  "tags": ["vip", "whale", "active"],
  "notes": "Very engaged customer",
  "valueCents": 55000
}
```

#### DELETE /api/crm/fans/[id]

Supprime un fan (soft delete ou hard delete selon config).

#### GET /api/crm/conversations

Liste toutes les conversations.

**Response** (200 OK) :
```json
{
  "conversations": [
    {
      "id": 1,
      "userId": 1,
      "fanId": 123,
      "platform": "onlyfans",
      "lastMessageAt": "2025-11-01T12:00:00Z",
      "unreadCount": 3,
      "fan": {
        "id": 123,
        "name": "John Doe",
        "avatar": "https://..."
      }
    }
  ],
  "total": 42
}
```

#### GET /api/crm/conversations/[id]/messages

Récupère les messages d'une conversation.

**Response** (200 OK) :
```json
{
  "messages": [
    {
      "id": 1,
      "conversationId": 1,
      "fanId": 123,
      "direction": "in",
      "text": "Hello!",
      "priceCents": null,
      "read": true,
      "attachments": [],
      "createdAt": "2025-11-01T11:00:00Z"
    },
    {
      "id": 2,
      "conversationId": 1,
      "fanId": 123,
      "direction": "out",
      "text": "Hi! Thanks for subscribing",
      "priceCents": null,
      "read": true,
      "attachments": [],
      "sentByAi": false,
      "createdAt": "2025-11-01T11:05:00Z"
    }
  ],
  "total": 2
}
```

#### POST /api/crm/conversations/[id]/messages

Envoie un message dans une conversation.

**Request** :
```json
{
  "text": "Thanks for your support!",
  "priceCents": 500,
  "attachments": [
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/media/photo.jpg"
    }
  ]
}
```

**Implémentation** :
- Utilise `MessagesRepository.createMessage()`
- Appelle `OnlyFansRateLimiterService.sendMessage()` pour rate limiting
- Met à jour `conversations.last_message_at`
- Retourne HTTP 202 (message queued)

### 4. CSV Import Backend (Nouveau)

#### POST /api/onlyfans/import/csv

Importe des fans depuis un CSV OnlyFans.

**Request** (multipart/form-data) :
```
file: onlyfans_export.csv
```

**CSV Format** :
```csv
Username,Display Name,Email,Subscription Tier,Total Spent,Last Seen
johndoe,John Doe,john@example.com,Premium,$500.00,2025-11-01
janedoe,Jane Doe,jane@example.com,Basic,$100.00,2025-10-30
```

**Response** (200 OK) :
```json
{
  "summary": {
    "totalRows": 100,
    "successfulInserts": 95,
    "skipped": 3,
    "errors": 2
  },
  "errors": [
    {
      "row": 42,
      "error": "Invalid email format"
    }
  ]
}
```

**Implémentation** :
```typescript
// app/api/onlyfans/import/csv/route.ts
import { parse } from 'csv-parse/sync';
import { FansRepository } from '@/lib/db/repositories';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const csvContent = await file.text();
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const results = {
    totalRows: records.length,
    successfulInserts: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, record] of records.entries()) {
    try {
      // Map CSV columns to fan data
      const fanData = {
        name: record['Display Name'] || record['Username'],
        platform: 'onlyfans',
        handle: `@${record['Username']}`,
        email: record['Email'],
        valueCents: parseFloat(record['Total Spent'].replace('$', '')) * 100,
        lastSeenAt: new Date(record['Last Seen']),
      };

      await FansRepository.createFan(userId, fanData);
      results.successfulInserts++;
    } catch (error) {
      results.errors.push({
        row: index + 1,
        error: error.message,
      });
    }
  }

  return NextResponse.json({ summary: results });
}
```

### 5. Bulk Messaging Backend (Nouveau)

#### POST /api/messages/bulk

Envoie un message à plusieurs fans.

**Request** :
```json
{
  "recipientIds": ["fan_1", "fan_2", "fan_3"],
  "content": "Special offer for you!",
  "mediaUrls": ["https://..."],
  "campaignName": "Black Friday 2025"
}
```

**Response** (202 Accepted) :
```json
{
  "campaignId": "campaign_uuid",
  "totalRecipients": 3,
  "estimatedCompletionTime": "2025-11-01T12:05:00Z",
  "status": "queued"
}
```

**Implémentation** :
- Crée un record dans `campaigns` table
- Appelle `OnlyFansRateLimiterService.sendBatch()`
- Retourne campaignId pour tracking
- Met à jour `campaigns.metrics` au fur et à mesure

### 6. UI Conversations OnlyFans (Nouveau)

**Page** : `app/messages/onlyfans/page.tsx`

**Layout** :
```
┌─────────────────────────────────────────────────────────┐
│  Messages OnlyFans                              [Search] │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  Conversations   │  Conversation with John Doe          │
│  List            │                                      │
│                  │  ┌────────────────────────────────┐ │
│  [John Doe]      │  │ Hi! Thanks for subscribing     │ │
│  Last: 2min ago  │  │                         (You)  │ │
│  Unread: 3       │  └────────────────────────────────┘ │
│                  │                                      │
│  [Jane Doe]      │  ┌────────────────────────────────┐ │
│  Last: 1h ago    │  │ Hello! Love your content       │ │
│  Unread: 0       │  │ (John Doe)                     │ │
│                  │  └────────────────────────────────┘ │
│  [Mike Smith]    │                                      │
│  Last: 1d ago    │  ┌────────────────────────────────┐ │
│  Unread: 1       │  │ [Type message...]       [Send] │ │
│                  │  └────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

**Fonctionnalités** :
- Liste conversations avec avatar, nom, dernier message, unread count
- Click conversation → charge messages
- Scroll infini pour messages
- Input pour envoyer message (appelle POST `/api/crm/conversations/[id]/messages`)
- Real-time updates avec polling (toutes les 5s)
- Filtres : unread only, platform, date range

### 7. UI Analytics OnlyFans (Nouveau)

**Page** : `app/platforms/onlyfans/analytics/page.tsx`

**Layout** :
```
┌─────────────────────────────────────────────────────────┐
│  OnlyFans Analytics                      [Export CSV]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Total    │  │ Active   │  │ Lifetime │             │
│  │ Fans     │  │ Fans     │  │ Value    │             │
│  │ 1,234    │  │ 856      │  │ $12,345  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  Top 10 Fans by Value                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 1. John Doe        $5,000  ████████████████████   │ │
│  │ 2. Jane Smith      $3,500  █████████████          │ │
│  │ 3. Mike Johnson    $2,800  ██████████             │ │
│  │ ...                                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Revenue Trends (Last 30 Days)                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │     $                                              │ │
│  │  500│     ╱╲                                       │ │
│  │  400│    ╱  ╲    ╱╲                                │ │
│  │  300│   ╱    ╲  ╱  ╲                               │ │
│  │  200│  ╱      ╲╱    ╲                              │ │
│  │  100│ ╱              ╲                             │ │
│  │    0└────────────────────────────────────────────  │ │
│  │      1   5   10  15  20  25  30 (days)            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Fonctionnalités** :
- KPIs : total fans, active fans, lifetime value
- Top fans chart (bar chart)
- Revenue trends (line chart)
- Filtres : date range, platform, tags
- Export CSV

## Data Models

### OnlyFans Message Payload (SQS)

```typescript
interface SQSMessagePayload {
  messageId: string;
  userId: string;
  recipientId: string;
  content: string;
  mediaUrls?: string[];
  metadata?: {
    conversationId?: number;
    campaignId?: string;
    priority?: number;
  };
  timestamp: string; // ISO 8601
}
```

### Campaign Record (Database)

```sql
-- campaigns table (already exists)
{
  id: SERIAL PRIMARY KEY,
  user_id: INTEGER,
  name: VARCHAR(255),
  type: 'bulk_message',
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed',
  template: JSONB, -- { content, mediaUrls }
  target_audience: JSONB, -- { recipientIds }
  metrics: JSONB, -- { sent, delivered, failed, revenue_cents }
  started_at: TIMESTAMP,
  completed_at: TIMESTAMP
}
```

## Error Handling

### 1. SQS Unavailable
- **Cause** : AWS outage, network issue, credentials invalides
- **Action** : Retry 3x avec exponential backoff (1s, 2s, 4s)
- **Fallback** : Store message in `messages` table avec status 'failed'
- **User** : Afficher erreur "Service temporarily unavailable"

### 2. Rate Limit Exceeded (Lambda)
- **Cause** : Plus de 10 messages/minute
- **Action** : Lambda met message en attente dans Redis
- **Retry** : Automatique après 6 secondes
- **User** : Message "Queued, will be sent shortly"

### 3. OnlyFans API Error
- **Cause** : API OnlyFans down, credentials invalides
- **Action** : Lambda marque message comme failed
- **Retry** : Selon configuration (max 3 tentatives)
- **User** : Notification "Message failed to send"

### 4. CSV Import Error
- **Cause** : Format invalide, données manquantes
- **Action** : Skip row, log error, continue processing
- **User** : Afficher summary avec erreurs détaillées

## Testing Strategy

### Unit Tests
- `OnlyFansRateLimiterService` avec mock SQS
- CSV parser avec sample files
- API route handlers avec mock repositories

### Integration Tests
- End-to-end flow : UI → API → SQS → Lambda
- CSV import avec real database
- Bulk messaging avec multiple recipients

### Load Tests
- 1000 messages/hour via rate limiter
- CSV import avec 10,000 rows
- Concurrent API requests (100 req/s)

## Deployment

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=ASIAUT7VVE47AGCYXJEU
AWS_SECRET_ACCESS_KEY=***
AWS_SESSION_TOKEN=***

# SQS
SQS_RATE_LIMITER_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue

# Redis
REDIS_ENDPOINT=huntaze-redis-production.xxxxx.use1.cache.amazonaws.com:6379
REDIS_AUTH_TOKEN=***

# Feature Flags
RATE_LIMITER_ENABLED=true
ONLYFANS_CRM_ENABLED=true

# Monitoring
CLOUDWATCH_NAMESPACE=Huntaze/OnlyFans
LOG_LEVEL=info
```

### Deployment Steps

1. **Configure Environment Variables** (Amplify Console)
2. **Deploy Code** (git push → Amplify auto-deploy)
3. **Run Database Migrations** (already done)
4. **Test SQS Connectivity** (send test message)
5. **Monitor CloudWatch** (check metrics)

## Monitoring

### CloudWatch Metrics

**Custom Metrics** :
- `OnlyFansMessagesQueued` (count)
- `OnlyFansMessagesProcessed` (count)
- `OnlyFansMessagesFailed` (count)
- `OnlyFansQueueDepth` (gauge)
- `OnlyFansProcessingTime` (milliseconds)

**Alarms** :
- Queue depth > 100 (warning)
- DLQ count > 10 (critical)
- Failure rate > 5% (warning)
- Lambda errors > 10/min (critical)

### Logging

**Structured Logs** :
```json
{
  "timestamp": "2025-11-01T12:00:00Z",
  "level": "info",
  "service": "onlyfans-rate-limiter",
  "action": "message_queued",
  "messageId": "uuid",
  "userId": "1",
  "recipientId": "fan_123",
  "queueDepth": 42
}
```

## Security

### Authentication
- JWT tokens pour toutes les API routes
- Vérification ownership (user owns fan/conversation)

### Authorization
- Rate limiting par user (60 req/min)
- Max 100 recipients pour bulk messaging
- Max 10MB pour CSV upload

### Data Protection
- AWS credentials dans environment variables (encrypted)
- Redis AUTH token dans Secrets Manager
- HTTPS only pour toutes les communications

## Performance

### Targets
- API response time < 200ms (p95)
- SQS → Lambda trigger < 1s
- Lambda → OnlyFans API < 2s
- Total end-to-end < 3s (p95)

### Optimizations
- Database indexes sur `fans.user_id`, `conversations.user_id`
- Redis caching pour queue status
- Pagination pour conversations list (50 per page)
- Lazy loading pour messages (100 per page)

## Cost Estimation

### Current (Infrastructure Only)
- Lambda: ~$5/mois
- SQS: ~$1/mois
- Redis: ~$40-80/mois
- **Total**: ~$50-90/mois

### With Full Usage (10k messages/day)
- Lambda: ~$20/mois
- SQS: ~$5/mois
- Redis: ~$40-80/mois
- **Total**: ~$70-110/mois

## Future Enhancements

### Phase 2 (Q1 2026)
- Real-time messaging avec WebSockets
- AI-powered message suggestions
- Advanced analytics (cohort analysis, churn prediction)
- Mobile app (React Native)

### Phase 3 (Q2 2026)
- Multi-platform support (Fansly, Patreon)
- Automated campaigns (drip campaigns, re-engagement)
- A/B testing pour messages
- Revenue optimization ML model

