# Design Document - AWS Rate Limiter Backend Integration

## Overview

Cette intégration connecte l'application Next.js Huntaze (déployée sur AWS Amplify) avec l'infrastructure de rate limiting AWS existante (Lambda + SQS + Redis). L'objectif est de permettre l'envoi de messages OnlyFans avec un rate limiting automatique de 10 messages/minute, géré de manière transparente par l'infrastructure AWS.

### Architecture Actuelle

**Infrastructure AWS déployée:**
- Lambda `huntaze-rate-limiter` (Node.js 20, token bucket algorithm)
- SQS Queue `huntaze-rate-limiter-queue` (standard queue)
- Redis ElastiCache chiffré (stockage état token bucket)
- CloudWatch monitoring (alarms, dashboards, logs)
- IAM roles et policies configurés

**Application Backend:**
- Next.js 14 sur AWS Amplify (App ID: d33l77zi1h78ce)
- Prisma + PostgreSQL pour la persistence
- Services existants: `IntelligentQueueManager` (utilise déjà SQS)
- Variables d'environnement configurées dans `amplify.yml`

### Objectifs d'Intégration

1. **Réutiliser l'infrastructure existante** sans duplication
2. **Intégrer avec le service `IntelligentQueueManager`** existant
3. **Ajouter une couche d'abstraction** pour le rate limiting OnlyFans
4. **Maintenir la compatibilité** avec les workflows existants
5. **Monitoring unifié** via CloudWatch

## Architecture

### Diagramme de Flux

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application (Amplify)                │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  API Route       │         │  OnlyFansRateLimiterService  │  │
│  │  /api/onlyfans/  │────────▶│  (New Service Layer)         │  │
│  │  messages/send   │         │                              │  │
│  └──────────────────┘         └──────────┬───────────────────┘  │
│                                           │                      │
│                                           ▼                      │
│                              ┌────────────────────────┐          │
│                              │ IntelligentQueueManager│          │
│                              │ (Existing Service)     │          │
│                              └────────────┬───────────┘          │
└───────────────────────────────────────────┼──────────────────────┘
                                            │
                                            │ AWS SDK
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Infrastructure                        │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  SQS Queue       │────────▶│  Lambda Rate Limiter         │  │
│  │  huntaze-rate-   │ trigger │  (Token Bucket Algorithm)    │  │
│  │  limiter-queue   │         │                              │  │
│  └──────────────────┘         └──────────┬───────────────────┘  │
│                                           │                      │
│                                           ▼                      │
│                              ┌────────────────────────┐          │
│                              │  Redis ElastiCache     │          │
│                              │  (Token Bucket State)  │          │
│                              └────────────────────────┘          │
│                                           │                      │
│                                           ▼                      │
│                              ┌────────────────────────┐          │
│                              │  OnlyFans API          │          │
│                              │  (External)            │          │
│                              └────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```


### Composants Clés

#### 1. OnlyFansRateLimiterService (Nouveau)

Service TypeScript qui encapsule la logique d'envoi de messages avec rate limiting.

**Responsabilités:**
- Valider les payloads de messages
- Générer des messageId uniques
- Déléguer l'envoi à `IntelligentQueueManager`
- Gérer les feature flags (`RATE_LIMITER_ENABLED`)
- Logger les opérations

**Interface:**
```typescript
interface OnlyFansMessage {
  userId: string;
  recipientId: string;
  content: string;
  mediaUrls?: string[];
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface SendResult {
  success: boolean;
  messageId: string;
  queuedAt: Date;
  error?: string;
}
```

#### 2. IntelligentQueueManager (Existant - Modifications)

Service existant qui gère déjà SQS. Modifications nécessaires:
- Ajouter support pour la queue `huntaze-rate-limiter-queue`
- Mapper les messages OnlyFans au format attendu par la Lambda
- Conserver la logique de retry et DLQ existante

#### 3. API Route `/api/onlyfans/messages/send` (Nouveau)

Endpoint REST pour envoyer des messages OnlyFans.

**Request:**
```json
POST /api/onlyfans/messages/send
{
  "recipientId": "user_123",
  "content": "Hello! Thanks for subscribing!",
  "mediaUrls": ["https://cdn.example.com/image.jpg"],
  "priority": "high"
}
```

**Response (Success):**
```json
HTTP 202 Accepted
{
  "success": true,
  "messageId": "msg_abc123",
  "queuedAt": "2025-10-29T10:30:00Z",
  "estimatedDelivery": "2025-10-29T10:31:00Z"
}
```

**Response (Error):**
```json
HTTP 500 Internal Server Error
{
  "success": false,
  "error": "Failed to queue message",
  "details": "SQS service unavailable"
}
```

## Components and Interfaces

### Service Layer

#### OnlyFansRateLimiterService

```typescript
export class OnlyFansRateLimiterService {
  private queueManager: IntelligentQueueManager;
  private enabled: boolean;
  
  constructor(queueManager: IntelligentQueueManager) {
    this.queueManager = queueManager;
    this.enabled = process.env.RATE_LIMITER_ENABLED === 'true';
  }
  
  async sendMessage(message: OnlyFansMessage): Promise<SendResult>;
  async sendBatch(messages: OnlyFansMessage[]): Promise<SendResult[]>;
  async getQueueStatus(): Promise<QueueStatus>;
  private validateMessage(message: OnlyFansMessage): void;
  private generateMessageId(): string;
}
```

#### IntelligentQueueManager (Extensions)

```typescript
// Ajouter à la classe existante
export class IntelligentQueueManager {
  // Nouvelle méthode pour la queue rate limiter
  async sendToRateLimiterQueue(
    message: QueuedMessage
  ): Promise<{ messageId: string; success: boolean }>;
  
  // Configuration étendue
  private readonly QUEUES = {
    // ... queues existantes
    RATE_LIMITER: process.env.SQS_RATE_LIMITER_QUEUE || 
      'https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue'
  };
}
```

### API Layer

#### Route Handler

```typescript
// app/api/onlyfans/messages/send/route.ts
export async function POST(request: Request) {
  // 1. Authentification (JWT/session)
  // 2. Validation du body
  // 3. Appel au service
  // 4. Retour de la réponse
}
```

### Configuration Layer

#### Environment Variables (Amplify)

Variables à ajouter dans `amplify.yml`:

```yaml
# SQS Rate Limiter
SQS_RATE_LIMITER_QUEUE: https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue

# Feature Flags
RATE_LIMITER_ENABLED: true

# AWS Credentials (déjà configurées)
AWS_REGION: us-east-1
AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
```

## Data Models

### Message Payload (SQS → Lambda)

Format attendu par la Lambda `huntaze-rate-limiter`:

```typescript
interface RateLimiterPayload {
  messageId: string;           // UUID v4
  userId: string;              // ID utilisateur Huntaze
  recipientId: string;         // ID destinataire OnlyFans
  content: string;             // Contenu du message
  mediaUrls?: string[];        // URLs des médias (optionnel)
  timestamp: string;           // ISO 8601
  metadata: {
    source: 'huntaze-app';
    workflowId?: string;
    traceId?: string;
    priority: 'low' | 'medium' | 'high';
  };
}
```

### Database Schema (Prisma)

Ajouter un modèle pour tracker les messages:

```prisma
model OnlyFansMessage {
  id            String   @id @default(uuid())
  userId        String
  recipientId   String
  content       String
  mediaUrls     String[]
  status        String   // 'queued' | 'sent' | 'failed' | 'rate_limited'
  sqsMessageId  String?
  attempts      Int      @default(0)
  lastError     String?
  queuedAt      DateTime @default(now())
  sentAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([status])
  @@index([queuedAt])
}
```

## Error Handling

### Stratégie de Gestion d'Erreurs

#### 1. Erreurs de Validation
- **Cause:** Payload invalide (champs manquants, format incorrect)
- **Action:** Retourner HTTP 400 avec détails de validation
- **Retry:** Non (erreur client)

#### 2. Erreurs AWS SDK
- **Cause:** SQS indisponible, throttling, credentials invalides
- **Action:** Retry avec exponential backoff (3 tentatives)
- **Fallback:** Stocker en base de données locale
- **Monitoring:** Alarme CloudWatch si taux d'erreur > 5%

#### 3. Erreurs de Rate Limiting
- **Cause:** Token bucket vide (10 msg/min dépassé)
- **Action:** Message reste dans SQS, Lambda ajuste visibility timeout
- **Retry:** Automatique par SQS après délai calculé
- **Monitoring:** Métrique custom `RateLimitedMessages`

#### 4. Erreurs OnlyFans API
- **Cause:** API OnlyFans down, credentials invalides
- **Action:** Lambda marque le message comme failed
- **Retry:** Selon configuration (max 3 tentatives)
- **Fallback:** Dead Letter Queue (DLQ)

### Circuit Breaker Pattern

Implémenter un circuit breaker pour protéger l'application:

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
      }, this.timeout);
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests

**Fichiers à tester:**
- `lib/services/onlyfans-rate-limiter.service.ts`
- `app/api/onlyfans/messages/send/route.ts`

**Scénarios:**
- Validation de payload (valide/invalide)
- Génération de messageId unique
- Feature flag enabled/disabled
- Gestion d'erreurs

**Outils:** Vitest, AWS SDK mocks

### 2. Integration Tests

**Scénarios:**
- Envoi réussi à SQS (mock)
- Retry sur erreur SQS
- Circuit breaker activation
- Fallback vers base de données

**Outils:** Vitest, Testcontainers (LocalStack pour SQS)

### 3. E2E Tests

**Scénarios:**
- POST `/api/onlyfans/messages/send` → SQS → Lambda → Redis
- Vérifier que le message est bien rate-limited
- Vérifier les métriques CloudWatch

**Outils:** Playwright, environnement de staging AWS

### 4. Load Tests

**Objectifs:**
- Tester le comportement sous charge (100 msg/min)
- Vérifier que le rate limiting fonctionne (max 10 msg/min)
- Mesurer la latence end-to-end

**Outils:** k6, Artillery

## Monitoring and Observability

### CloudWatch Metrics

**Métriques Custom à ajouter:**

```typescript
// Dans OnlyFansRateLimiterService
await cloudWatch.putMetricData({
  Namespace: 'Huntaze/OnlyFans',
  MetricData: [
    {
      MetricName: 'MessagesQueued',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: 'production' },
        { Name: 'Priority', Value: message.priority }
      ]
    },
    {
      MetricName: 'QueueLatency',
      Value: latencyMs,
      Unit: 'Milliseconds'
    }
  ]
});
```

**Métriques à monitorer:**
- `MessagesQueued` (Count)
- `MessagesSent` (Count)
- `MessagesFailed` (Count)
- `RateLimitedMessages` (Count)
- `QueueLatency` (Milliseconds)
- `APILatency` (Milliseconds)

### CloudWatch Alarms

**Alarmes à créer:**

1. **High Error Rate**
   - Condition: `MessagesFailed / MessagesQueued > 0.05` (5%)
   - Action: SNS notification

2. **Queue Depth High**
   - Condition: `ApproximateNumberOfMessagesVisible > 100`
   - Action: SNS notification + Auto-scaling

3. **Rate Limiter Lambda Errors**
   - Condition: `Lambda Errors > 10` (5 minutes)
   - Action: SNS notification

### Logging Strategy

**Structured Logging:**

```typescript
logger.info('Message queued', {
  messageId,
  userId,
  recipientId,
  priority,
  queueUrl,
  timestamp: new Date().toISOString(),
  traceId: context.traceId
});

logger.error('Failed to queue message', {
  messageId,
  error: error.message,
  stack: error.stack,
  retryCount,
  timestamp: new Date().toISOString()
});
```

**Log Retention:**
- Production: 90 jours
- Staging: 30 jours
- Development: 7 jours

### Dashboards

**Dashboard CloudWatch "OnlyFans Rate Limiter":**

Widgets:
1. Messages Queued (timeseries)
2. Messages Sent vs Failed (stacked area)
3. Rate Limited Messages (bar chart)
4. Queue Depth (line chart)
5. Lambda Duration (heatmap)
6. Error Rate (gauge)

## Security Considerations

### 1. Authentication & Authorization

- **API Route:** Protégée par NextAuth.js session
- **IAM Roles:** Principe du moindre privilège
- **SQS Access:** Limité aux services autorisés

### 2. Data Protection

- **Encryption in Transit:** TLS 1.2+ pour toutes les communications
- **Encryption at Rest:** 
  - SQS: KMS encryption
  - Redis: At-rest encryption activé
  - Database: PostgreSQL encryption
- **PII Handling:** Pas de données sensibles dans les logs

### 3. Rate Limiting

- **Application Level:** Circuit breaker (5 erreurs → OPEN)
- **AWS Level:** Lambda reserved concurrency = 2
- **OnlyFans Level:** Token bucket (10 msg/min)

### 4. Secrets Management

- **Redis AUTH Token:** AWS Secrets Manager
- **AWS Credentials:** Amplify environment variables (encrypted)
- **OnlyFans API Keys:** Secrets Manager

## Deployment Strategy

### Phase 1: Infrastructure Validation (Déjà fait ✅)

- Lambda déployée
- SQS queue créée
- Redis configuré
- Monitoring actif

### Phase 2: Backend Integration (À faire)

1. **Ajouter variables d'environnement dans Amplify**
   ```bash
   aws amplify update-app \
     --app-id d33l77zi1h78ce \
     --environment-variables \
       SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
       RATE_LIMITER_ENABLED=true
   ```

2. **Déployer le code backend**
   - Créer `OnlyFansRateLimiterService`
   - Modifier `IntelligentQueueManager`
   - Créer API route
   - Ajouter tests

3. **Tester en staging**
   - Smoke tests
   - Load tests
   - Validation end-to-end

4. **Déployer en production**
   - Feature flag OFF initialement
   - Monitoring actif
   - Activer progressivement (10% → 50% → 100%)

### Phase 3: Monitoring & Optimization

1. **Surveiller les métriques** (première semaine)
2. **Ajuster les seuils** de rate limiting si nécessaire
3. **Optimiser les coûts** (Lambda memory, SQS batch size)

## Performance Considerations

### Latency Budget

- **API Route → SQS:** < 100ms (p95)
- **SQS → Lambda trigger:** < 1s
- **Lambda → OnlyFans API:** < 2s
- **Total end-to-end:** < 3s (p95)

### Throughput

- **Target:** 10 messages/minute (rate limit OnlyFans)
- **Burst capacity:** 10 messages (token bucket capacity)
- **Queue capacity:** Illimité (SQS standard)

### Cost Optimization

**Estimations mensuelles:**
- SQS requests: ~43,200 msg/mois → $0.02
- Lambda invocations: ~43,200 → $0.01
- CloudWatch metrics: ~10 custom metrics → $3.00
- **Total:** ~$3/mois (négligeable)

## Rollback Plan

### Scénario 1: Erreurs critiques en production

1. **Désactiver le feature flag**
   ```bash
   aws amplify update-app \
     --app-id d33l77zi1h78ce \
     --environment-variables RATE_LIMITER_ENABLED=false
   ```

2. **Redéployer la version précédente**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Vider la queue SQS** (si nécessaire)
   ```bash
   aws sqs purge-queue \
     --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
   ```

### Scénario 2: Performance dégradée

1. **Augmenter Lambda concurrency**
2. **Ajuster SQS batch size**
3. **Activer circuit breaker**

## Future Enhancements

### Phase 4 (Q1 2026)

1. **Multi-region deployment** (us-west-2 failover)
2. **Advanced analytics** (message delivery rates, user engagement)
3. **A/B testing** (different rate limiting strategies)
4. **Webhook callbacks** (notify app when message is sent)

### Phase 5 (Q2 2026)

1. **ML-based rate limiting** (adaptive based on OnlyFans API behavior)
2. **Priority queue optimization** (dynamic priority adjustment)
3. **Cost optimization** (Lambda SnapStart, SQS batching)

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Ready for Implementation
