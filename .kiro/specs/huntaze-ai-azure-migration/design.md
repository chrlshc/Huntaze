# Design Document - Migration du Système IA Huntaze vers Azure AI

## Overview

Ce document décrit l'architecture détaillée pour la migration complète du système d'intelligence artificielle de Huntaze vers Microsoft Azure AI.

### ⚠️ MISE À JOUR STRATÉGIQUE: Migration vers US East 2

> **Document de référence:** [US-EAST-2-MIGRATION-STRATEGY.md](./US-EAST-2-MIGRATION-STRATEGY.md)

La stratégie a été réorientée vers la région **Azure US East 2** pour accéder aux technologies 2025:

| Ancien (West Europe) | Nouveau (US East 2) |
|---------------------|---------------------|
| GPT-4 Turbo | **GPT-4o** (Omni) |
| GPT-4 | **GPT-4o** |
| GPT-3.5 Turbo | **GPT-4o Mini** (-60% coût) |
| ada-002 | **text-embedding-3-large** |
| - | **GPT-4o Realtime** (nouveau) |

**Nouvelles fonctionnalités 2025:**
- **Prompt Caching**: -50% coûts sur contextes répétitifs
- **API Batch**: -50% coûts pour tâches non-urgentes (24h)
- **Global Standard**: Routage mondial pour éviter la saturation

### Objectifs de la Migration

1. **Accès Technologies 2025**: Bénéficier des modèles GPT-4o et fonctionnalités exclusives US East 2
2. **SLA Entreprise**: Bénéficier des SLA de 99.9% d'Azure OpenAI Service
3. **Intégration Microsoft**: Exploiter l'écosystème Azure (Monitor, Key Vault, Managed Identity)
4. **Réduction des Coûts**: Optimiser avec GPT-4o Mini (-60%), Prompt Caching (-50%), Batch API (-50%)
5. **Performance Améliorée**: Global Standard avec routage mondial et latence optimisée
6. **Sécurité Renforcée**: Private Endpoints, Managed Identity, même aux US

### Scope de la Migration

**Composants à Migrer:**
- LLM Router vers Azure OpenAI Service
- AI Team System avec 4 agents vers Azure OpenAI
- Memory Service vers Azure Cognitive Search
- Content Generation vers Azure AI Vision + Azure OpenAI
- Cost Tracking vers Azure Monitor + Application Insights
- Circuit Breakers et Resilience Patterns

**Hors Scope:**
- Migration de la base de données (reste sur PostgreSQL)
- Migration du cache (reste sur Redis/Upstash)
- Migration de l'authentification (reste sur NextAuth)


## Architecture

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HUNTAZE PLATFORM                             │
│                      (Next.js 15 / Vercel)                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                    AZURE API MANAGEMENT                              │
│                   (Managed Identity Auth)                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌──────────────────┐                    ┌──────────────────┐
│  AZURE OPENAI    │                    │  AZURE COGNITIVE │
│  (US East 2)     │                    │     SEARCH       │
│                  │                    │                  │
│ • GPT-4o (Omni)  │                    │ • Vector Search  │
│ • GPT-4o Mini    │                    │ • Semantic       │
│ • GPT-4o Realtime│                    │   Ranking        │
│ • Embed V3       │                    │ • 3072 dims      │
└──────────────────┘                    └──────────────────┘
        ↓                                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AZURE OBSERVABILITY                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Azure      │  │ Application  │  │   Azure      │             │
│  │   Monitor    │  │   Insights   │  │  Key Vault   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture des Composants

```
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   API        │  │  Dashboard   │  │   Content    │             │
│  │  Routes      │  │     UI       │  │   Editor     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE ORCHESTRATION                             │
│                                                                      │
│              ┌────────────────────────────┐                         │
│              │  AzureAITeamCoordinator    │                         │
│              │  (Remplace AITeamCoord)    │                         │
│              └────────────────────────────┘                         │
│                          ↓                                           │
│              ┌────────────────────────────┐                         │
│              │   AIKnowledgeNetwork       │                         │
│              │  (Inchangé - Event System) │                         │
│              └────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘

                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      AI AGENTS LAYER                                 │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Emma    │  │  Alex    │  │  Sarah   │  │  Claire  │           │
│  │ (GPT-4)  │  │ (GPT-4)  │  │ (GPT-3.5 │  │ (GPT-3.5 │           │
│  │          │  │          │  │  Turbo)  │  │  Turbo)  │           │
│  │Messaging │  │Analytics │  │  Sales   │  │Compliance│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AZURE AI SERVICES                                 │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Azure OpenAI │  │   Cognitive  │  │  Embeddings  │             │
│  │  (via SDK)   │  │    Search    │  │   Service    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AzureOpenAIService

Service principal pour interagir avec Azure OpenAI Service.

**Interface:**
```typescript
interface AzureOpenAIService {
  // Génération de texte
  generateText(prompt: string, options: GenerationOptions): Promise<GenerationResponse>;
  
  // Chat conversationnel
  chat(messages: ChatMessage[], options: GenerationOptions): Promise<GenerationResponse>;
  
  // Streaming
  generateTextStream(prompt: string, options: GenerationOptions): AsyncGenerator<string>;
  
  // Multimodal (texte + image avec GPT-4 Vision)
  generateFromMultimodal(parts: MultimodalPart[], options: GenerationOptions): Promise<GenerationResponse>;
  
  // Comptage de tokens
  countTokens(content: string | MultimodalPart[]): Promise<number>;
  
  // Gestion des déploiements
  setDeployment(deployment: AzureDeployment): void;
  getAvailableDeployments(): AzureDeployment[];
}


interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  responseFormat?: { type: 'text' | 'json_object' };
}

interface GenerationResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  model: string;
}

type AzureDeployment = 
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-35-turbo'
  | 'gpt-4-vision';

interface MultimodalPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}
```

**Implémentation:**
```typescript
// lib/ai/azure/azure-openai.service.ts
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';

export class AzureOpenAIService {
  private client: OpenAIClient;
  private currentDeployment: string;
  
  constructor() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const useManaged Identity = process.env.AZURE_USE_MANAGED_IDENTITY === 'true';
    
    if (useManagedIdentity) {
      // Production: Managed Identity
      this.client = new OpenAIClient(endpoint, new DefaultAzureCredential());
    } else {
      // Development: API Key
      const apiKey = process.env.AZURE_OPENAI_API_KEY!;
      this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    }
    
    this.currentDeployment = 'gpt-4-turbo';
  }
  
  async generateText(
    prompt: string, 
    options: GenerationOptions = {}
  ): Promise<GenerationResponse> {
    const result = await this.client.getChatCompletions(
      this.currentDeployment,
      [{ role: 'user', content: prompt }],
      {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
        stop: options.stop,
        responseFormat: options.responseFormat,
      }
    );
    
    return this.parseResponse(result);
  }
  
  async *generateTextStream(
    prompt: string,
    options: GenerationOptions = {}
  ): AsyncGenerator<string> {
    const stream = await this.client.streamChatCompletions(
      this.currentDeployment,
      [{ role: 'user', content: prompt }],
      options
    );
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
  
  // ... autres méthodes
}
```


### 3. AzureCognitiveSearchService

Service pour Vector Search et recherche sémantique.

**Interface:**
```typescript
interface AzureCognitiveSearchService {
  // Génération d'embeddings
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  
  // Recherche sémantique
  searchSimilar(query: string, options: SearchOptions): Promise<SearchResult[]>;
  
  // Gestion de l'index
  upsertDocuments(documents: VectorDocument[]): Promise<void>;
  deleteDocuments(ids: string[]): Promise<void>;
}

interface SearchOptions {
  topK?: number;
  filter?: string; // OData filter syntax
  select?: string[];
  searchMode?: 'any' | 'all';
}

interface SearchResult {
  id: string;
  score: number;
  document: Record<string, any>;
}

interface VectorDocument {
  id: string;
  content: string;
  contentVector: number[];
  metadata: Record<string, any>;
}
```

## Data Models

### Azure OpenAI Configuration

```typescript
interface AzureOpenAIConfig {
  endpoint: string;
  apiKey?: string;
  useManagedIdentity: boolean;
  deployments: {
    premium: string;
    standard: string;
    economy: string;
    vision: string;
  };
  timeout?: number;
  retryConfig?: RetryConfig;
}

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}
```

### Cost Tracking Models

```typescript
interface AzureOpenAICostLog {
  id: string;
  timestamp: Date;
  accountId: string;
  plan: UserPlan;
  deployment: string;
  tier: ModelTier;
  operation: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCost: number;
  latency: number;
  success: boolean;
  errorCode?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Premium Tier Routing Consistency
*For any* request classified as premium tier, the router should invoke GPT-4 Turbo with appropriate parameters (temperature, maxTokens) matching the premium configuration.
**Validates: Requirements 1.1**

### Property 2: Standard Tier Routing Consistency
*For any* request classified as standard tier, the router should invoke GPT-4 with optimized settings matching the standard configuration.
**Validates: Requirements 1.2**

### Property 3: Economy Tier Token Limit Enforcement
*For any* request classified as economy tier, the router should invoke GPT-3.5 Turbo with reduced token limits as specified in the economy configuration.
**Validates: Requirements 1.3**

### Property 4: Fallback Exponential Backoff
*For any* Azure OpenAI call that fails, the system should implement exponential backoff with delays increasing by the configured backoff factor between retry attempts.
**Validates: Requirements 1.4**

### Property 5: Streaming Token Delivery
*For any* streaming request, tokens should arrive progressively to the client without waiting for complete generation.
**Validates: Requirements 1.5**

### Property 6: MessagingAI Model Selection
*For any* MessagingAI request, the system should use GPT-4 and include personality-aware context in the prompt.
**Validates: Requirements 2.1**

### Property 7: AnalyticsAI Structured Output
*For any* AnalyticsAI analysis request, the response should be valid JSON containing insights, predictions, and recommendations fields.
**Validates: Requirements 2.2**

### Property 8: SalesAI Cost Optimization
*For any* SalesAI message optimization request, the system should use GPT-3.5 Turbo (not GPT-4) to minimize costs.
**Validates: Requirements 2.3**

### Property 9: ComplianceAI Content Filtering
*For any* ComplianceAI content check, the system should use GPT-3.5 Turbo with content filtering configured.
**Validates: Requirements 2.4**

### Property 10: Knowledge Network Broadcasting
*For any* insight shared by an agent, all other agents in the network should receive the broadcasted insight via the event system.
**Validates: Requirements 2.5**

### Property 11: Embedding Model Consistency
*For any* interaction stored in the memory service, the system should generate embeddings using the text-embedding-ada-002 model.
**Validates: Requirements 3.1**

### Property 12: Semantic Search Relevance
*For any* memory context retrieval, the returned interactions should have semantic similarity scores above a minimum threshold.
**Validates: Requirements 3.2**

### Property 13: Vector Search Latency
*For any* embedding query, 95% of requests should complete in under 100ms.
**Validates: Requirements 3.3**

### Property 14: GDPR Embedding Deletion
*For any* user requesting data deletion, all embeddings associated with that user should be removed from Azure Cognitive Search.
**Validates: Requirements 3.5**

### Property 15: Personality Profile Confidence
*For any* personality profile generated by the Personality Calibrator, the output should include a confidence score between 0 and 1.
**Validates: Requirements 4.1**

### Property 16: Multi-Dimensional Emotion Detection
*For any* message processed by the Emotion Analyzer, the output should contain multiple emotional dimensions (e.g., sentiment, intensity, valence).
**Validates: Requirements 4.2**

### Property 17: Tone Adaptation Based on Preferences
*For any* response style calibration, the tone should match the learned preferences from the user's interaction history.
**Validates: Requirements 4.3**

### Property 18: Emotional State Memory Update
*For any* significant emotional state change detected, the Memory Service should receive an update with the new emotional context.
**Validates: Requirements 4.4**

### Property 19: Dominant Emotion Prioritization
*For any* message with multiple detected emotions, the response generation should prioritize the emotion with the highest confidence score.
**Validates: Requirements 4.5**

### Property 20: Cost Logging Completeness
*For any* completed Azure OpenAI request, the system should log token usage (input and output) and estimated cost to Application Insights.
**Validates: Requirements 5.1**

### Property 21: Cost Report Aggregation
*For any* cost report generation, costs should be correctly aggregated by creator, model, and operation type.
**Validates: Requirements 5.3**

### Property 22: Rate Limit Quota Enforcement
*For any* user with a plan that has usage limits, the system should enforce rate limits based on remaining quota.
**Validates: Requirements 5.4**

### Property 23: Cost Optimization Recommendations
*For any* account with high costs, the system should generate recommendations for model tier adjustments.
**Validates: Requirements 5.5**

### Property 24: Circuit Breaker Opening Threshold
*For any* service where error rate exceeds 50%, the circuit breaker should transition to open state and prevent further requests.
**Validates: Requirements 6.1**

### Property 25: Circuit Breaker Fallback Behavior
*For any* request when circuit breaker is open, the system should return cached responses or fallback to simpler logic instead of calling the failing service.
**Validates: Requirements 6.2**

### Property 26: Circuit Breaker Half-Open Testing
*For any* circuit breaker in half-open state, only a limited percentage of traffic should be allowed through for recovery testing.
**Validates: Requirements 6.3**

### Property 27: Circuit Breaker Recovery
*For any* circuit breaker that detects service recovery, it should transition to closed state and resume normal operations.
**Validates: Requirements 6.4**

### Property 28: Circuit Breaker Independence
*For any* scenario where multiple services fail, each circuit breaker should operate independently without triggering cascading failures.
**Validates: Requirements 6.5**

### Property 29: Visual Hashtag Relevance
*For any* image analyzed for hashtag generation, the suggested hashtags should be semantically related to the visual themes extracted from the image.
**Validates: Requirements 7.2**

### Property 30: Multimodal Context Integration
*For any* content optimization request with both text and image, the recommendations should reference both contexts in the reasoning.
**Validates: Requirements 7.3**

### Property 31: Multi-Image Caption Cohesion
*For any* caption generation with multiple images, the generated caption should reference elements from all provided images.
**Validates: Requirements 7.5**

### Property 32: A/B Test Traffic Distribution
*For any* A/B test configuration, traffic should be split between model versions according to the specified percentages.
**Validates: Requirements 8.2**

### Property 33: Model Performance Metrics Tracking
*For any* deployed model, the system should track latency, accuracy, and cost metrics in Azure Monitor.
**Validates: Requirements 8.3**

### Property 34: Automatic Model Rollback
*For any* model that underperforms based on defined thresholds, the system should automatically rollback to the previous stable version.
**Validates: Requirements 8.4**

### Property 35: PII Redaction in Logs
*For any* AI interaction logged to Application Insights, personally identifiable information (PII) should be redacted before writing.
**Validates: Requirements 9.4**

### Property 36: Immutable Audit Logs
*For any* AI operation requiring GDPR compliance, the system should maintain immutable logs that cannot be modified or deleted.
**Validates: Requirements 9.5**

### Property 37: Azure OpenAI Prompt Format Compliance
*For any* prompt constructed for Azure OpenAI, it should follow Azure OpenAI-specific formatting guidelines and instruction patterns.
**Validates: Requirements 10.1**

### Property 38: JSON Mode Activation
*For any* request requiring structured output, the system should enable GPT-4's native JSON mode in the generation config.
**Validates: Requirements 10.2**

### Property 39: Prompt Caching Token Reduction
*For any* repeated context in prompts, the system should implement caching to reduce token costs on subsequent requests.
**Validates: Requirements 10.3**

### Property 40: Context-Preserving Truncation
*For any* prompt that exceeds token limits, the truncation should preserve key context elements while staying within limits.
**Validates: Requirements 10.4**

### Property 41: Few-Shot Example Inclusion
*For any* prompt template requiring few-shot learning, the system should include optimized examples in the prompt.
**Validates: Requirements 10.5**

### Property 42: Metrics Emission on Request
*For any* Azure OpenAI request, the system should emit telemetry metrics to Azure Monitor.
**Validates: Requirements 11.1**

### Property 43: Distributed Tracing Propagation
*For any* request spanning multiple services, Application Insights should propagate trace context across all service boundaries.
**Validates: Requirements 11.3**

### Property 44: Correlation ID in Logs
*For any* log entry in Application Insights, it should contain a correlation ID for request tracking.
**Validates: Requirements 11.4**

### Property 45: Fallback Testing Graceful Degradation
*For any* simulated Azure OpenAI failure, the system should gracefully degrade to fallback logic without crashing.
**Validates: Requirements 13.2**

### Property 46: Cost Tracking Accuracy
*For any* cost report, the logged costs should match actual Azure billing data within 5% margin.
**Validates: Requirements 13.3**

### Property 47: Semantic Search Test Relevance
*For any* test query with known relevant interactions, the semantic search should return those interactions in the top results.
**Validates: Requirements 13.4**

### Property 48: Instant Rollback Capability
*For any* critical issue, the system should be able to rollback to OpenAI/Anthropic providers within 60 seconds.
**Validates: Requirements 15.1**

### Property 49: Rollback Data Preservation
*For any* rollback operation, all data and state should be preserved without loss.
**Validates: Requirements 15.2**

### Property 50: Disaster Recovery Time
*For any* disaster recovery scenario, the system should restore service within 15 minutes.
**Validates: Requirements 15.4**

### Property 51: Dual-Write Consistency
*For any* write operation during migration period, data should be consistent across both old and new systems.
**Validates: Requirements 15.5**

## Error Handling

### Azure-Specific Error Codes

```typescript
enum AzureOpenAIErrorCode {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  QUOTA_EXCEEDED = 'quota_exceeded',
  CONTENT_FILTER = 'content_filter',
  INVALID_REQUEST = 'invalid_request',
  AUTHENTICATION_ERROR = 'authentication_error',
  DEPLOYMENT_NOT_FOUND = 'deployment_not_found',
  TIMEOUT = 'timeout',
}
```

## Testing Strategy

### Unit Testing
- Test individual service methods with mocked Azure SDK
- Test routing logic with various tier configurations
- Test cost calculation accuracy
- Test PII redaction patterns

### Property-Based Testing
- Use fast-check library with 100+ iterations per property
- Test all 51 correctness properties defined above
- Generate random inputs for comprehensive coverage
- Tag each test with property number and requirement reference

### Integration Testing
- Test end-to-end flows with Azure OpenAI Service
- Test fallback chains with simulated failures
- Test vector search with Azure Cognitive Search
- Test cost tracking with Application Insights

## Security Considerations

- Use Managed Identity for production authentication
- Store API keys in Azure Key Vault for development
- Enable Private Endpoints for Azure OpenAI Service
- Implement PII redaction before logging
- Use Azure RBAC for access control
- Enable audit logging for compliance
