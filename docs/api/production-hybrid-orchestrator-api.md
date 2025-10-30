# Production Hybrid Orchestrator API Documentation

## Overview

L'orchestrateur hybride production gère l'exécution de workflows avec fallback automatique entre Azure et OpenAI, tracking des coûts, et retry strategies intelligentes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Production Hybrid Orchestrator                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ Azure Planner│◄────────┤ Smart Router │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                        │                           │
│         │                        ▼                           │
│         │              ┌──────────────┐                     │
│         └─────────────►│ OpenAI Router│                     │
│                        └──────────────┘                     │
│                               │                              │
│  ┌────────────────────────────┼──────────────────────────┐ │
│  │         Retry Strategy      │   Cost Tracking          │ │
│  │  • Exponential Backoff      │   • Token Usage          │ │
│  │  • Circuit Breaker          │   • Cost Calculation     │ │
│  │  • Timeout Management       │   • CloudWatch Metrics   │ │
│  └─────────────────────────────┴──────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              State Management (PostgreSQL RDS)           ││
│  │  • Workflow State                                        ││
│  │  • Retry Attempts                                        ││
│  │  • Fallback History                                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Execute Workflow

Exécute un workflow avec sélection automatique du provider optimal.

**Endpoint:** `POST /api/workflows/execute`

**Request Body:**
```typescript
{
  userId: string;              // ID utilisateur (requis)
  intent: {
    type: 'content_planning' | 'message_generation' | 
          'content_validation' | 'campaign_execution';
    userId: string;
    data: Record<string, any>;
    platforms?: string[];      // ['instagram', 'tiktok', etc.]
    contentType?: string;      // 'fashion', 'lifestyle', etc.
    sendToOnlyFans?: boolean;  // Envoyer sur OnlyFans après génération
    recipientId?: string;      // ID destinataire OnlyFans
    requiresMultiPlatform?: boolean;
    forceProvider?: 'azure' | 'openai';  // Forcer un provider
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    content: string;           // Contenu généré
    provider: 'azure' | 'openai';
    traceContext: {
      traceId: string;
      spanId: string;
      workflowId: string;
    };
    costInfo: {
      tokens: number;          // Tokens utilisés
      cost: number;            // Coût en USD
      duration: number;        // Durée en ms
    };
    metadata: {
      attempt: number;         // Numéro de tentative
      totalRetries: number;    // Nombre de retries
      success: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

**Example Request:**
```bash
curl -X POST https://api.huntaze.com/api/workflows/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user-123",
    "intent": {
      "type": "content_planning",
      "userId": "user-123",
      "data": {
        "theme": "summer fashion",
        "targetAudience": "premium_subscribers"
      },
      "platforms": ["instagram", "tiktok"],
      "priority": "high"
    }
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "content": "Summer fashion content plan with 7 posts...",
    "provider": "azure",
    "traceContext": {
      "traceId": "trace-abc-123",
      "spanId": "span-def-456",
      "workflowId": "workflow-ghi-789"
    },
    "costInfo": {
      "tokens": 1250,
      "cost": 0.0125,
      "duration": 2340
    },
    "metadata": {
      "attempt": 1,
      "totalRetries": 0,
      "success": true
    }
  }
}
```

### Health Check

Vérifie la santé de tous les services.

**Endpoint:** `GET /api/workflows/health`

**Response:**
```typescript
{
  azure: boolean;      // Azure Planner disponible
  openai: boolean;     // OpenAI Router disponible
  database: boolean;   // PostgreSQL RDS disponible
  sqs: boolean;        // AWS SQS disponible
}
```

**Example:**
```bash
curl https://api.huntaze.com/api/workflows/health
```

**Response:**
```json
{
  "azure": true,
  "openai": true,
  "database": true,
  "sqs": true
}
```

## Error Handling

### Error Types

#### 1. OpenAIExecutionError
Erreur lors de l'exécution avec OpenAI.

```typescript
{
  name: "OpenAIExecutionError",
  code: "TIMEOUT" | "RATE_LIMIT" | "AUTH_FAILED" | "MAX_RETRIES_EXCEEDED",
  message: string,
  cause?: Error
}
```

#### 2. AzureExecutionError
Erreur lors de l'exécution avec Azure.

```typescript
{
  name: "AzureExecutionError",
  code: "TIMEOUT" | "RATE_LIMIT" | "AUTH_FAILED" | "MAX_RETRIES_EXCEEDED",
  message: string,
  cause?: Error
}
```

#### 3. TimeoutError
Timeout lors de l'exécution.

```typescript
{
  name: "TimeoutError",
  message: string
}
```

### Retry Strategy

L'orchestrateur implémente une stratégie de retry automatique :

1. **Exponential Backoff**: 1s → 2s → 5s
2. **Max Retries**: 3 tentatives par provider
3. **Timeout**: 
   - OpenAI: 30 secondes
   - Azure: 45 secondes
4. **Fallback**: Basculement automatique vers l'autre provider

### Retryable Errors

Les erreurs suivantes déclenchent un retry automatique :

- **Network Errors**: `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`
- **HTTP 5xx**: Erreurs serveur
- **HTTP 429**: Rate limiting
- **Timeout**: Dépassement du timeout

### Non-Retryable Errors

Les erreurs suivantes ne déclenchent PAS de retry :

- **HTTP 400**: Bad Request
- **HTTP 401/403**: Authentication/Authorization
- **HTTP 422**: Validation Error

## Cost Tracking

### Token Estimation

Les tokens sont estimés automatiquement :

1. **Si disponible**: Utilise `result.usage.total_tokens`
2. **Sinon**: Estime basé sur la longueur du contenu (1 token ≈ 4 caractères)

### Cost Calculation

**Azure (GPT-4 Turbo):**
```
Cost = (tokens / 1000) × $0.01
```

**OpenAI (GPT-3.5 Turbo):**
```
Cost = (tokens / 1000) × $0.002
```

### Cost Tracking Service

Tous les coûts sont trackés via `costMonitoringService` :

```typescript
await costMonitoringService.trackUsage(
  provider,        // 'azure' | 'openai'
  tokens,          // Nombre de tokens
  cost,            // Coût en USD
  userId,          // ID utilisateur
  workflowId,      // ID workflow
  workflowType,    // Type de workflow
  metadata         // Métadonnées additionnelles
);
```

## Distributed Tracing

### Trace Context

Chaque workflow génère un contexte de tracing :

```typescript
{
  traceId: string;      // ID unique du trace
  spanId: string;       // ID unique du span
  parentSpanId?: string; // ID du span parent
  userId: string;       // ID utilisateur
  workflowId: string;   // ID workflow
  timestamp: Date;      // Timestamp de création
}
```

### CloudWatch Integration

Les métriques sont envoyées à CloudWatch :

- **Namespace**: `Huntaze/HybridOrchestrator`
- **Dimensions**: `UserId`, `WorkflowId`
- **Metrics**: Événements de workflow

## State Management

### Workflow State

L'état du workflow est persisté en PostgreSQL RDS :

```typescript
{
  workflowId: string;
  userId: string;
  traceId: string;
  currentProvider: 'azure' | 'openai' | 'hybrid' | 'completed' | 'failed';
  providerStates: {
    azure: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
    openai: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
    rateLimiter: 'pending' | 'checking' | 'throttled' | 'approved' | 'rejected';
    onlyFans: 'pending' | 'sending' | 'sent' | 'failed' | 'rate_limited';
  };
  fallbackHistory: Array<{
    from: 'azure' | 'openai';
    to: 'azure' | 'openai';
    reason: string;
    timestamp: Date;
  }>;
  retryAttempts: {
    azure: number;
    openai: number;
    onlyFans: number;
  };
}
```

## Best Practices

### 1. Toujours spécifier le userId
```typescript
// ✅ Bon
await orchestrator.executeWorkflow('user-123', intent);

// ❌ Mauvais
await orchestrator.executeWorkflow('', intent);
```

### 2. Utiliser le bon type de workflow
```typescript
// Content planning → Azure (meilleur pour multi-plateforme)
{ type: 'content_planning', requiresMultiPlatform: true }

// Message generation → OpenAI (meilleur pour personnalisation)
{ type: 'message_generation' }

// Content validation → OpenAI (meilleur pour compliance)
{ type: 'content_validation' }
```

### 3. Gérer les erreurs correctement
```typescript
try {
  const result = await orchestrator.executeWorkflow(userId, intent);
  // Traiter le résultat
} catch (error) {
  if (error instanceof OpenAIExecutionError) {
    // Erreur OpenAI spécifique
    console.error('OpenAI failed:', error.code);
  } else if (error instanceof AzureExecutionError) {
    // Erreur Azure spécifique
    console.error('Azure failed:', error.code);
  } else {
    // Erreur générique
    console.error('Workflow failed:', error);
  }
}
```

### 4. Monitorer les coûts
```typescript
const result = await orchestrator.executeWorkflow(userId, intent);

// Vérifier les coûts
if (result.costInfo.cost > 0.10) {
  console.warn('High cost workflow:', result.costInfo);
}

// Logger les métriques
console.log('Tokens used:', result.costInfo.tokens);
console.log('Duration:', result.costInfo.duration, 'ms');
```

### 5. Utiliser le tracing pour le debugging
```typescript
const result = await orchestrator.executeWorkflow(userId, intent);

// Utiliser le traceId pour retrouver les logs
console.log('Trace ID:', result.traceContext.traceId);
console.log('Workflow ID:', result.traceContext.workflowId);

// Rechercher dans CloudWatch avec ces IDs
```

## Rate Limits

### Azure
- **Requests per minute**: 60
- **Tokens per minute**: 90,000
- **Concurrent requests**: 10

### OpenAI
- **Requests per minute**: 3,500
- **Tokens per minute**: 90,000
- **Concurrent requests**: 100

### OnlyFans
- **Messages per minute**: 10
- **Messages per hour**: 100
- **Delay between messages**: 45 seconds

## Security

### Authentication
Tous les endpoints requièrent un token Bearer :

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Data Sanitization
Les résultats sont sanitizés avant logging pour éviter de logger des données sensibles.

### Error Messages
Les messages d'erreur ne contiennent jamais de données sensibles (tokens, credentials, etc.).

## Monitoring

### CloudWatch Metrics
- `workflow_started`
- `workflow_completed`
- `workflow_error`
- `azure_execution_started`
- `azure_execution_completed`
- `azure_execution_failed`
- `openai_execution_started`
- `openai_execution_completed`
- `openai_execution_failed`
- `cost_tracking_failed`

### Logs
Tous les logs incluent :
- `traceId`: Pour tracer les requêtes
- `spanId`: Pour identifier les spans
- `userId`: Pour filtrer par utilisateur
- `workflowId`: Pour suivre les workflows

## Support

Pour toute question ou problème :
- **Email**: support@huntaze.com
- **Slack**: #api-support
- **Documentation**: https://docs.huntaze.com
