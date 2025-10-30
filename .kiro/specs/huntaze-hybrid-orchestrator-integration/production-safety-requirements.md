# Production Safety Requirements - Huntaze Hybrid Orchestrator

## 🎯 **ANALYSE DE L'ARCHITECTURE EXISTANTE**

### ✅ **État Actuel Validé**

**A) Gestion d'État OnlyFansGateway**
- ✅ **Cache en mémoire** : `Map<string, CacheEntry<unknown>>`
- ✅ **Rate limiting intégré** : `requestCount = { perMinute: 0, perHour: 0 }`
- ✅ **Retry avec backoff** : Configuration complète dans `types.ts`
- ⚠️ **Pas de persistence** : Redémarrage = perte de l'état des messages en cours

**B) Orchestrateur Huntaze**
- ✅ **LangGraph avec checkpointing** : `thread_id: workflowId, checkpoint_ns: userId`
- ✅ **PostgreSQL configuré** : Via Prisma pour persistence
- ✅ **Gestion d'état complète** : `WorkflowState` avec stages et métriques
- ✅ **Error handling** : Array d'erreurs par stage avec timestamps

**C) AI Router Structure**
- ✅ **Responses typées** : `AIRouterAPIResponse<T>` avec metadata
- ✅ **Retry config** : Backoff exponentiel configuré
- ✅ **Error classification** : Codes d'erreur retryables vs non-retryables
- ⚠️ **Pas de distributed tracing** : Pas de correlation IDs cross-services

## 🚨 **GAPS CRITIQUES IDENTIFIÉS**

### 1. **State Machine pour Workflows Hybrides** (CRITIQUE)

**Problème** : Ton `HuntazeOrchestrator` gère bien les workflows internes, mais pas les workflows **hybrides** qui passent par Azure → Rate Limiter → OnlyFans.

**Solution Requise** :
```typescript
interface HybridWorkflowState extends WorkflowState {
  providerStates: {
    azure: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout'
    openai: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout'
    rateLimiter: 'pending' | 'checking' | 'throttled' | 'approved' | 'rejected'
    onlyFans: 'pending' | 'sending' | 'sent' | 'failed' | 'rate_limited'
  }
  fallbackHistory: Array<{
    from: 'azure' | 'openai'
    to: 'azure' | 'openai'
    reason: string
    timestamp: Date
  }>
  retryAttempts: {
    azure: number
    openai: number
    onlyFans: number
  }
}
```

### 2. **Distributed Tracing Cross-Services** (CRITIQUE)

**Problème** : Impossible de tracer un request qui passe par :
`API → HybridOrchestrator → Azure Planner → Rate Limiter → OnlyFans Gateway`

**Solution Requise** :
```typescript
interface TraceContext {
  traceId: string        // UUID pour tout le workflow
  spanId: string         // UUID pour chaque service call
  parentSpanId?: string  // Chaînage des appels
  userId: string
  workflowId: string
  timestamp: Date
}

// Chaque service doit propager le context
interface ServiceCall {
  traceContext: TraceContext
  // ... autres params
}
```

### 3. **Fallback Strategy Matrix** (IMPORTANT)

**Problème** : Spec dit "fallback Azure → OpenAI" mais pas les autres scénarios.

**Solution Requise** :
```typescript
interface FallbackMatrix {
  scenarios: {
    'azure_timeout': { fallback: 'openai', maxRetries: 2, delayMs: 5000 }
    'azure_rate_limited': { fallback: 'openai', maxRetries: 1, delayMs: 1000 }
    'openai_timeout': { fallback: 'azure', maxRetries: 2, delayMs: 5000 }
    'openai_rate_limited': { fallback: 'queue', maxRetries: 0, delayMs: 60000 }
    'onlyfans_rate_limited': { fallback: 'queue', maxRetries: 0, delayMs: 45000 }
    'rate_limiter_down': { fallback: 'bypass_with_warning', maxRetries: 1, delayMs: 2000 }
  }
}
```

### 4. **Persistence des Workflows Hybrides** (IMPORTANT)

**Problème** : `OnlyFansGateway` utilise cache mémoire. Si restart pendant un workflow hybride = perte d'état.

**Solution AWS-Ready** :
```typescript
// Étendre ton PostgreSQL RDS schema existant
interface HybridWorkflowPersistence {
  workflowId: string
  userId: string
  currentProvider: 'azure' | 'openai' | 'hybrid'
  providerStates: HybridWorkflowState['providerStates']
  sqsMessageId?: string        // AWS SQS Message ID pour retry
  checkpointData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Utiliser SQS existant pour message queuing
interface SQSMessagePayload {
  workflowId: string
  recipientId: string
  content: string
  attempts: number
  maxRetries: number
  scheduledFor: string         // ISO date
  lastError?: string
}
```

## 🎯 **PRODUCTION SAFETY MATRIX**

### Phase 1: Infrastructure (Tasks 1.1-1.3)
| Task | Safety Requirement | Implementation |
|------|-------------------|----------------|
| 1.1 ProductionHybridOrchestrator | ✅ Distributed tracing | Add TraceContext to all calls |
| 1.2 Enhanced error handling | ✅ Fallback matrix | Implement FallbackMatrix config |
| 1.3 Production monitoring | ✅ Cross-service metrics | CloudWatch custom metrics |

### Phase 2: Integration Middleware (Tasks 2.1-2.3)
| Task | Safety Requirement | Implementation |
|------|-------------------|----------------|
| 2.1 IntegrationMiddleware | ✅ State persistence | PostgreSQL hybrid workflow table |
| 2.2 Feature flag management | ✅ Rollback < 5min | Environment variable override |
| 2.3 Backward compatibility | ✅ Zero downtime | Blue-green deployment |

### Phase 3: Rate Limiter (Tasks 3.1-3.3)
| Task | Safety Requirement | Implementation |
|------|-------------------|----------------|
| 3.1 EnhancedRateLimiter | ✅ OnlyFans compliance | 10 msg/min + recipient limits |
| 3.2 Intelligent queuing | ✅ Message persistence | AWS SQS + PostgreSQL RDS backup |
| 3.3 OnlyFans integration | ✅ Graceful degradation | Bypass mode if rate limiter down |

## 🚀 **UPDATED TASK PRIORITIES**

### **MUST HAVE (Core Safety)**
- [ ] 1.1 ProductionHybridOrchestrator + TraceContext
- [ ] 1.2 Enhanced error handling + FallbackMatrix  
- [ ] 2.1 IntegrationMiddleware + State persistence
- [ ] 3.1 EnhancedRateLimiter + OnlyFans rules
- [ ] 5.1 Enhanced campaign API endpoints
- [ ] 6.1 CloudWatch monitoring + distributed tracing

### **SHOULD HAVE (Production Ready)**
- [ ] 1.3 Production monitoring
- [ ] 2.2 Feature flag management
- [ ] 3.2 Intelligent queuing
- [ ] 4.1 CostMonitoringService
- [ ] 5.2 Feature flag middleware
- [ ] 7.1 Deployment automation

### **NICE TO HAVE (Optimization)**
- [ ] 2.3 Backward compatibility layer
- [ ] 3.3 OnlyFans gateway integration
- [ ] 4.2 Cost alerting system
- [ ] 6.2 Business metrics tracking
- [ ] 7.2 Canary deployment

### **OPTIONAL (Can Skip for MVP)**
- [ ]* 1.4 Unit tests (focus on integration tests)
- [ ]* 3.4 Rate limiter dashboard (use CloudWatch)
- [ ]* 4.4 Cost monitoring dashboard (basic metrics first)
- [ ]* 6.4 Automated alerting (manual monitoring initially)

## 🎯 **IMPLEMENTATION ORDER OPTIMIZED**

### **Week 1: Core Safety (6 tasks)**
1. **1.1** ProductionHybridOrchestrator + TraceContext
2. **1.2** Enhanced error handling + FallbackMatrix
3. **2.1** IntegrationMiddleware + State persistence
4. **3.1** EnhancedRateLimiter + OnlyFans rules
5. **5.1** Enhanced campaign API endpoints
6. **6.1** CloudWatch monitoring + distributed tracing

### **Week 2: Production Features (6 tasks)**
7. **1.3** Production monitoring
8. **2.2** Feature flag management
9. **3.2** Intelligent queuing
10. **4.1** CostMonitoringService
11. **5.2** Feature flag middleware
12. **7.1** Deployment automation

### **Week 3: Optimization (6 tasks)**
13. **2.3** Backward compatibility layer
14. **3.3** OnlyFans gateway integration
15. **4.2** Cost alerting system
16. **6.2** Business metrics tracking
17. **7.2** Canary deployment
18. **8.1** End-to-end testing

## ✅ **VALIDATION CHECKLIST**

Avant de commencer l'implémentation, valider :

- [ ] **TraceContext** : Chaque service call propage le trace ID
- [ ] **FallbackMatrix** : Tous les scénarios d'erreur couverts
- [ ] **State Persistence** : Workflows survivent aux redémarrages
- [ ] **OnlyFans Compliance** : Rate limits respectent les ToS
- [ ] **Rollback Plan** : < 5 minutes via feature flags
- [ ] **Monitoring** : Métriques cross-services dans CloudWatch

## 🚨 **RISQUES MITIGÉS**

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Workflow bloqué mid-execution | Élevé | Critique | State persistence + recovery |
| Provider timeout sans fallback | Moyen | Élevé | FallbackMatrix + circuit breaker |
| Rate limit OnlyFans violation | Élevé | Critique | Enhanced rate limiter + queuing |
| Perte de tracing cross-services | Élevé | Moyen | Distributed tracing obligatoire |
| Rollback > 5 minutes | Faible | Élevé | Feature flags + blue-green |

Cette approche garantit **zéro incident de production** tout en déployant rapidement les fonctionnalités critiques.

## 🔧 **AWS-SPECIFIC IMPLEMENTATION NOTES**

### **Database Migrations (RDS PostgreSQL)**
```bash
# Production deployment - pas de migrate dev
npx prisma migrate deploy

# Ajouter table pour workflows hybrides
npx prisma migrate deploy --name add_hybrid_workflows
```

### **SQS Integration (Existing Queues)**
```typescript
// Utiliser tes queues SQS existantes
const SQS_QUEUES = {
  HYBRID_MESSAGES: 'huntaze-hybrid-messages-production',
  RETRY_QUEUE: 'huntaze-alerts-production',        // Réutiliser
  DLQ: 'huntaze-dlq-production'                    // Réutiliser
}

// Configuration SQS pour retry logic
const SQS_CONFIG = {
  visibilityTimeout: 300,      // 5 minutes
  maxReceiveCount: 3,          // Puis DLQ
  messageRetentionPeriod: 1209600  // 14 jours
}
```

### **Secrets Management**
```typescript
// DATABASE_URL depuis AWS Secrets Manager
const secrets = await secretsManager.getSecretValue({
  SecretId: 'huntaze/database/production'
}).promise()

const DATABASE_URL = JSON.parse(secrets.SecretString).DATABASE_URL
```

### **Testing avec Vitest**
```typescript
// Configuration Vitest pour AWS mocks
import { vi } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import { SQSClient } from '@aws-sdk/client-sqs'

const sqsMock = mockClient(SQSClient)

beforeEach(() => {
  sqsMock.reset()
})
```

## 🎯 **UPDATED IMPLEMENTATION PRIORITIES**

### **Semaine 1: Core Safety (AWS-Ready)**
1. **1.1** ProductionHybridOrchestrator + TraceContext + AWS X-Ray
2. **1.2** Enhanced error handling + FallbackMatrix + SQS retry
3. **2.1** IntegrationMiddleware + RDS persistence + Prisma migrations
4. **3.1** EnhancedRateLimiter + OnlyFans rules + SQS queuing
5. **5.1** Enhanced campaign API endpoints + AWS Secrets
6. **6.1** CloudWatch monitoring + distributed tracing + SQS metrics

### **Deployment Commands (AWS)**
```bash
# 1. Deploy database migrations
npx prisma migrate deploy

# 2. Deploy to ECS Fargate
aws ecs update-service --cluster huntaze-of-fargate --service hybrid-orchestrator

# 3. Update environment variables
aws ecs update-service --cluster huntaze-of-fargate --force-new-deployment

# 4. Monitor deployment
aws logs tail /aws/ecs/huntaze-hybrid-orchestrator --follow
```

Cette approche utilise ton infrastructure AWS existante (RDS, SQS, ECS, CloudWatch) pour un déploiement production-ready immédiat.