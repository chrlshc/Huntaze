# OnlyFans CRM - Guide Développeur

## Architecture

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application (Amplify)                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Layer                             │   │
│  │                                                           │   │
│  │  /api/onlyfans/messages/send    /api/crm/fans           │   │
│  │  /api/onlyfans/messages/status  /api/crm/conversations  │   │
│  │  /api/onlyfans/import/csv       /api/messages/bulk      │   │
│  │  /api/monitoring/onlyfans                                │   │
│  └────────────┬─────────────────────────────┬───────────────┘   │
│               │                             │                   │
│  ┌────────────▼─────────────────────────────▼───────────────┐   │
│  │                  Service Layer                           │   │
│  │                                                           │   │
│  │  OnlyFansRateLimiterService    CRM Repositories         │   │
│  │  - sendMessage()                - FansRepository         │   │
│  │  - sendBatch()                  - ConversationsRepo      │   │
│  │  - getQueueStatus()             - MessagesRepository     │   │
│  │                                 - CampaignsRepository    │   │
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

---

## Services

### OnlyFansRateLimiterService

**Fichier**: `lib/services/onlyfans-rate-limiter.service.ts`

Service principal pour envoyer des messages OnlyFans avec rate limiting automatique.

#### Méthodes

##### `sendMessage(message: OnlyFansMessage): Promise<SendResult>`

Envoie un message unique via SQS.

```typescript
const service = new OnlyFansRateLimiterService();
const result = await service.sendMessage({
  messageId: crypto.randomUUID(),
  userId: '1',
  recipientId: '123',
  content: 'Hello!',
  mediaUrls: ['https://...'],
  priority: 8,
});
```

**Features**:
- Validation Zod du payload
- Retry avec exponential backoff (3 tentatives)
- Logging structuré
- Métriques CloudWatch

##### `sendBatch(messages: OnlyFansMessage[]): Promise<SendResult[]>`

Envoie plusieurs messages en batch (max 10 par batch SQS).

```typescript
const messages = fans.map(fan => ({
  messageId: crypto.randomUUID(),
  userId: '1',
  recipientId: fan.id.toString(),
  content: 'Special offer!',
}));

const results = await service.sendBatch(messages);
```

**Features**:
- Batch SQS (max 10 messages)
- Gestion des partial failures
- Métriques par message

##### `getQueueStatus(): Promise<QueueStatus>`

Récupère l'état de la queue SQS.

```typescript
const status = await service.getQueueStatus();
console.log(status.queueDepth); // Nombre de messages en attente
console.log(status.dlqCount); // Nombre de messages en DLQ
```

---

## Repositories

### FansRepository

**Fichier**: `lib/db/repositories/fansRepository.ts`

Gestion des fans dans PostgreSQL.

#### Méthodes

```typescript
// List all fans
const fans = await FansRepository.listFans(userId);

// Get single fan
const fan = await FansRepository.getFan(userId, fanId);

// Create fan
const newFan = await FansRepository.createFan(userId, {
  name: 'John Doe',
  platform: 'onlyfans',
  handle: '@johndoe',
  email: 'john@example.com',
  valueCents: 50000,
});

// Update fan
const updated = await FansRepository.updateFan(userId, fanId, {
  tags: ['vip', 'whale'],
  notes: 'High value customer',
});

// Delete fan
const deleted = await FansRepository.deleteFan(userId, fanId);
```

### ConversationsRepository

**Fichier**: `lib/db/repositories/conversationsRepository.ts`

Gestion des conversations.

```typescript
// List conversations
const conversations = await ConversationsRepository.listConversations(userId);

// Get conversation
const conv = await ConversationsRepository.getConversation(userId, convId);

// Create conversation
const newConv = await ConversationsRepository.createConversation(userId, fanId, 'onlyfans');

// Update last message timestamp
await ConversationsRepository.updateLastMessageAt(convId);
```

### MessagesRepository

**Fichier**: `lib/db/repositories/messagesRepository.ts`

Gestion des messages.

```typescript
// List messages
const messages = await MessagesRepository.listMessages(userId, conversationId);

// Create message
const message = await MessagesRepository.createMessage(
  userId,
  conversationId,
  fanId,
  'out', // direction: 'in' | 'out'
  'Hello!',
  500, // priceCents (optional)
  [{ type: 'image', url: 'https://...' }] // attachments (optional)
);

// Mark as read
await MessagesRepository.markMessageRead(userId, messageId);
```

### CampaignsRepository

**Fichier**: `lib/db/repositories/campaignsRepository.ts`

Gestion des campagnes bulk.

```typescript
// Create campaign
const campaign = await CampaignsRepository.createCampaign(userId, {
  name: 'Black Friday 2025',
  type: 'bulk_message',
  status: 'active',
  template: { content: 'Special offer!', mediaUrls: [] },
  targetAudience: { recipientIds: [1, 2, 3] },
  metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, revenueCents: 0 },
});

// Update metrics
await CampaignsRepository.updateCampaignMetrics(campaignId, {
  sent: 100,
  delivered: 95,
});

// Update status
await CampaignsRepository.updateCampaignStatus(campaignId, 'completed');
```

---

## API Routes

### POST /api/onlyfans/messages/send

Envoie un message OnlyFans unique.

**Request**:
```json
{
  "recipientId": "123",
  "content": "Hello!",
  "mediaUrls": ["https://..."],
  "priority": 8
}
```

**Response** (202 Accepted):
```json
{
  "messageId": "uuid",
  "status": "queued",
  "queuedAt": "2025-11-01T12:00:00Z",
  "estimatedSendTime": "2025-11-01T12:00:06Z"
}
```

### GET /api/onlyfans/messages/status

Récupère l'état de la queue SQS.

**Response** (200 OK):
```json
{
  "queueDepth": 42,
  "messagesInFlight": 5,
  "dlqCount": 2,
  "lastProcessedAt": "2025-11-01T12:00:00Z"
}
```

### POST /api/onlyfans/import/csv

Importe des fans depuis un CSV.

**Request** (multipart/form-data):
```
file: onlyfans_export.csv
```

**Response** (200 OK):
```json
{
  "summary": {
    "totalRows": 100,
    "successfulInserts": 95,
    "skipped": 3,
    "errors": [{ "row": 42, "error": "Invalid email" }]
  }
}
```

### POST /api/messages/bulk

Envoie un message à plusieurs fans.

**Request**:
```json
{
  "recipientIds": [1, 2, 3],
  "content": "Special offer!",
  "mediaUrls": ["https://..."],
  "campaignName": "Black Friday",
  "priority": 8
}
```

**Response** (202 Accepted):
```json
{
  "campaignId": 42,
  "totalRecipients": 3,
  "queued": 3,
  "failed": 0,
  "estimatedCompletionTime": "2025-11-01T12:05:00Z",
  "status": "queued"
}
```

### GET /api/monitoring/onlyfans

Health check du système.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00Z",
  "components": {
    "database": { "status": "healthy", "latencyMs": 15 },
    "sqs": { "status": "healthy", "queueDepth": 42 },
    "rateLimiter": { "status": "healthy", "enabled": true }
  }
}
```

---

## Métriques

### CloudWatch Metrics

Namespace: `Huntaze/OnlyFans`

#### Métriques disponibles

| Métrique | Type | Description |
|----------|------|-------------|
| `onlyfans.message.queued` | Counter | Messages mis en queue |
| `onlyfans.message.processed` | Counter | Messages traités |
| `onlyfans.message.failed` | Counter | Messages échoués |
| `onlyfans.queue.depth` | Gauge | Profondeur de la queue |
| `onlyfans.dlq.count` | Gauge | Messages en DLQ |
| `onlyfans.processing.time` | Timing | Temps de traitement |
| `onlyfans.bulk.campaign` | Counter | Campagnes bulk |
| `onlyfans.bulk.recipients` | Gauge | Recipients par campagne |

#### Utilisation

```typescript
import { metrics } from '@/lib/utils/metrics';

// Incrémenter un compteur
metrics.onlyFansMessageQueued(userId);

// Enregistrer une gauge
metrics.onlyFansQueueDepth(42);

// Enregistrer un timing
metrics.onlyFansProcessingTime(150); // ms
```

---

## Logging

### Structured Logging

Tous les logs utilisent le format structuré JSON.

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('Message queued', {
  messageId: 'uuid',
  userId: '1',
  recipientId: '123',
  queueDepth: 42,
});

logger.error('Message failed', {
  messageId: 'uuid',
  error: 'SQS unavailable',
  attempt: 3,
});
```

### Log Levels

- `info`: Opérations normales
- `warn`: Situations anormales mais non critiques
- `error`: Erreurs nécessitant attention

---

## Error Handling

### Retry Logic

Le service implémente un retry avec exponential backoff :

```typescript
// Tentative 1: immédiat
// Tentative 2: après 1s
// Tentative 3: après 2s
// Tentative 4: après 4s
// Échec final: après 3 tentatives
```

### Fallback Storage

Si tous les retries échouent, le message est stocké dans la table `messages` avec `status = 'failed'` pour retry manuel ultérieur.

### DLQ (Dead Letter Queue)

Messages qui échouent après tous les retries Lambda sont envoyés dans la DLQ pour investigation.

---

## Testing

### Unit Tests

```typescript
// tests/unit/services/onlyfans-rate-limiter.test.ts
import { OnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';

describe('OnlyFansRateLimiterService', () => {
  it('should queue message successfully', async () => {
    const service = new OnlyFansRateLimiterService();
    const result = await service.sendMessage({
      messageId: 'test-uuid',
      userId: '1',
      recipientId: '123',
      content: 'Test message',
    });
    
    expect(result.status).toBe('queued');
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/bulk-messaging-endpoints.test.ts
describe('POST /api/messages/bulk', () => {
  it('should create campaign and queue messages', async () => {
    const response = await fetch('/api/messages/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientIds: [1, 2, 3],
        content: 'Test',
        campaignName: 'Test Campaign',
      }),
    });
    
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.campaignId).toBeDefined();
  });
});
```

---

## Deployment

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***

# SQS
SQS_RATE_LIMITER_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/.../huntaze-rate-limiter-queue
SQS_RATE_LIMITER_DLQ_URL=https://sqs.us-east-1.amazonaws.com/.../huntaze-rate-limiter-queue-dlq

# Redis
REDIS_ENDPOINT=huntaze-redis-production.xxxxx.use1.cache.amazonaws.com:6379

# Feature Flags
RATE_LIMITER_ENABLED=true

# Monitoring
CLOUDWATCH_NAMESPACE=Huntaze/OnlyFans
```

### Deployment Steps

1. **Configure Environment Variables** (Amplify Console)
2. **Deploy Code** (`git push` → Amplify auto-deploy)
3. **Verify AWS Resources**:
   - Lambda: `huntaze-rate-limiter`
   - SQS: `huntaze-rate-limiter-queue`
   - Redis: `huntaze-redis-production`
4. **Test Connectivity**: Send test message via API
5. **Monitor**: Check CloudWatch metrics and logs

---

## Performance

### Targets

- API response time: < 200ms (p95)
- SQS → Lambda trigger: < 1s
- Lambda → OnlyFans API: < 2s
- Total end-to-end: < 3s (p95)

### Optimizations

- Database indexes sur `fans.user_id`, `conversations.user_id`
- Redis caching pour queue status
- Pagination pour conversations list (50 per page)
- Batch processing pour bulk operations

---

## Cost Estimation

### Current Usage (10k messages/day)

- Lambda: ~$20/mois
- SQS: ~$5/mois
- Redis: ~$40-80/mois
- **Total**: ~$70-110/mois

### Scaling

- 100k messages/day: ~$150-200/mois
- 1M messages/day: ~$500-700/mois

---

## Troubleshooting

### Queue Depth Too High

**Symptôme**: `queueDepth > 1000`  
**Cause**: Lambda processing trop lent ou rate limit OnlyFans atteint  
**Solution**: Vérifier Lambda logs, augmenter concurrency si nécessaire

### DLQ Count Increasing

**Symptôme**: `dlqCount > 10`  
**Cause**: Messages échouent après tous les retries  
**Solution**: Investiguer DLQ messages, vérifier OnlyFans API status

### Database Latency High

**Symptôme**: `dbLatencyMs > 100ms`  
**Cause**: Database overloaded ou query inefficient  
**Solution**: Vérifier slow queries, ajouter indexes si nécessaire

---

## Future Enhancements

### Phase 2 (Q1 2026)
- Real-time messaging avec WebSockets
- AI-powered message suggestions
- Advanced analytics (cohort analysis, churn prediction)

### Phase 3 (Q2 2026)
- Multi-platform support (Fansly, Patreon)
- Automated campaigns (drip campaigns, re-engagement)
- A/B testing pour messages
- Revenue optimization ML model
