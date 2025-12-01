# Design Document - Migration du Système IA Huntaze vers GCP

## Overview

Ce document décrit l'architecture détaillée pour la migration complète du système d'intelligence artificielle de Huntaze vers Google Cloud Platform (GCP). La migration transforme l'infrastructure IA actuelle basée sur OpenAI/Anthropic vers une architecture native GCP utilisant Vertex AI, Gemini, et les services managés Google Cloud.

### Objectifs de la Migration

1. **Réduction des Coûts**: Optimiser les coûts d'API en utilisant les modèles Gemini avec pricing compétitif
2. **Performance Améliorée**: Bénéficier de la latence réduite et de l'intégration native GCP
3. **Scalabilité**: Utiliser l'auto-scaling et les services managés pour gérer la croissance
4. **Multimodalité**: Exploiter les capacités vision de Gemini pour l'analyse d'images et vidéos
5. **Observabilité**: Intégrer Cloud Monitoring, Logging, et Trace pour une visibilité complète
6. **Sécurité**: Renforcer la sécurité avec Cloud KMS, Workload Identity, et les contrôles IAM

### Scope de la Migration

**Composants à Migrer:**
- LLM Router (src/lib/ai/llm-router.ts)
- AI Team System avec 4 agents (Emma, Alex, Sarah, Claire)
- Memory Service et services associés (Personality, Emotion, Preference Learning)
- Content Generation (captions, hashtags, messages)
- Cost Tracking et Analytics
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
│                      VERTEX AI GATEWAY                               │
│                   (Workload Identity Auth)                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌──────────────────┐                    ┌──────────────────┐
│   VERTEX AI      │                    │  VERTEX AI       │
│   GEMINI API     │                    │  VECTOR SEARCH   │
│                  │                    │                  │
│ • Gemini 1.5 Pro │                    │ • Embeddings     │
│ • Gemini 1.5     │                    │ • Semantic       │
│   Flash          │                    │   Search         │
└──────────────────┘                    └──────────────────┘
        ↓                                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUD OBSERVABILITY                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Cloud      │  │   Cloud      │  │   Cloud      │             │
│  │  Monitoring  │  │   Logging    │  │    Trace     │             │
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
│              │   VertexAITeamCoordinator  │                         │
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
│  │ (Gemini  │  │ (Gemini  │  │ (Gemini  │  │ (Gemini  │           │
│  │  1.5 Pro)│  │  1.5 Pro)│  │  1.5     │  │  1.5     │           │
│  │          │  │          │  │  Flash)  │  │  Flash)  │           │
│  │Messaging │  │Analytics │  │  Sales   │  │Compliance│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    VERTEX AI SERVICES                                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Gemini API  │  │ Vector Search│  │  Embeddings  │             │
│  │  (via SDK)   │  │   Service    │  │   Service    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. VertexAIService

Service principal pour interagir avec Vertex AI Gemini.

**Interface:**
```typescript
interface VertexAIService {
  // Génération de texte
  generateText(prompt: string, options: GenerationOptions): Promise<GenerationResponse>;
  
  // Chat conversationnel
  chat(messages: ChatMessage[], options: GenerationOptions): Promise<GenerationResponse>;
  
  // Streaming
  generateTextStream(prompt: string, options: GenerationOptions): AsyncGenerator<string>;
  
  // Multimodal (texte + image)
  generateFromMultimodal(parts: MultimodalPart[], options: GenerationOptions): Promise<GenerationResponse>;
  
  // Comptage de tokens
  countTokens(content: string | MultimodalPart[]): Promise<number>;
  
  // Gestion des modèles
  setModel(model: VertexAIModel): void;
  getAvailableModels(): VertexAIModel[];
}

interface GenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  safetySettings?: SafetySetting[];
  responseFormat?: 'text' | 'json';
}

interface GenerationResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  safetyRatings?: SafetyRating[];
}

type VertexAIModel = 
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-1.0-pro';

interface MultimodalPart {
  type: 'text' | 'image' | 'video';
  content: string | Buffer;
  mimeType?: string;
}
```

**Implémentation:**
```typescript
// lib/ai/vertex-ai.service.ts
import { VertexAI } from '@google-cloud/vertexai';

export class VertexAIService {
  private vertexAI: VertexAI;
  private currentModel: GenerativeModel;
  
  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID!,
      location: process.env.GCP_REGION || 'us-central1',
    });
    
    this.currentModel = this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });
  }
  
  async generateText(
    prompt: string, 
    options: GenerationOptions = {}
  ): Promise<GenerationResponse> {
    const result = await this.currentModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: this.buildGenerationConfig(options),
      safetySettings: options.safetySettings,
    });
    
    return this.parseResponse(result.response);
  }
  
  // ... autres méthodes
}
```

### 2. VertexAIRouter

Remplace le LLM Router actuel pour router vers Vertex AI.

**Interface:**
```typescript
interface VertexAIRouter {
  generateWithPolicy(options: RouterOptions): Promise<RouterResponse>;
  decideTier(policy: PolicyInput): ModelTier;
  getFallbackChain(tier: ModelTier): ModelConfig[];
}

interface RouterOptions {
  policy: PolicyInput;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  meta?: {
    accountId?: string;
    plan: UserPlan;
    segment?: string;
    action?: string;
  };
}

interface RouterResponse {
  content: string;
  tier: ModelTier;
  model: string;
  usage: TokenUsage;
  latency: number;
}

type ModelTier = 'premium' | 'standard' | 'economy';
type UserPlan = 'starter' | 'pro' | 'scale' | 'enterprise';

interface ModelConfig {
  model: VertexAIModel;
  maxTokens: number;
  temperature: number;
}
```

**Fallback Chain:**
```typescript
const FALLBACK_CHAINS: Record<ModelTier, ModelConfig[]> = {
  premium: [
    { model: 'gemini-1.5-pro', maxTokens: 8192, temperature: 0.7 },
    { model: 'gemini-1.5-flash', maxTokens: 4096, temperature: 0.7 },
  ],
  standard: [
    { model: 'gemini-1.5-flash', maxTokens: 4096, temperature: 0.7 },
    { model: 'gemini-1.5-pro', maxTokens: 2048, temperature: 0.6 },
  ],
  economy: [
    { model: 'gemini-1.5-flash', maxTokens: 2048, temperature: 0.5 },
    { model: 'gemini-1.5-flash', maxTokens: 1024, temperature: 0.4 },
  ],
};
```

### 3. VertexAIVectorService

Service pour Vector Search et embeddings.

**Interface:**
```typescript
interface VertexAIVectorService {
  // Génération d'embeddings
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  
  // Recherche sémantique
  searchSimilar(query: string, options: SearchOptions): Promise<SearchResult[]>;
  
  // Gestion de l'index
  upsertVectors(vectors: VectorDocument[]): Promise<void>;
  deleteVectors(ids: string[]): Promise<void>;
}

interface SearchOptions {
  topK?: number;
  filter?: Record<string, any>;
  namespace?: string;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  content: string;
}

interface VectorDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
  content: string;
}
```

**Implémentation:**
```typescript
// lib/ai/vertex-vector.service.ts
import { VertexAI } from '@google-cloud/vertexai';

export class VertexAIVectorService {
  private vertexAI: VertexAI;
  private embeddingModel: string = 'text-embedding-004';
  
  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.vertexAI.preview.getGenerativeModel({
      model: this.embeddingModel,
    });
    
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
    });
    
    return result.embedding.values;
  }
  
  async searchSimilar(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // Générer embedding de la requête
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Rechercher dans l'index Vertex AI
    const results = await this.vectorIndex.search({
      queries: [queryEmbedding],
      topK: options.topK || 10,
      filter: options.filter,
    });
    
    return results.map(r => ({
      id: r.id,
      score: r.distance,
      metadata: r.metadata,
      content: r.metadata.content,
    }));
  }
}
```

### 4. VertexAITeamCoordinator

Coordinateur des agents IA utilisant Vertex AI.

**Interface:**
```typescript
interface VertexAITeamCoordinator {
  handleFanMessage(context: MessageContext): Promise<MessageResponse>;
  generateContent(context: ContentContext): Promise<ContentResponse>;
  analyzePerformance(context: AnalyticsContext): Promise<AnalyticsResponse>;
  checkCompliance(content: string, platform: string): Promise<ComplianceResponse>;
}

interface MessageContext {
  creatorId: string;
  fanId: string;
  message: string;
  history: ChatMessage[];
  fanProfile: FanProfile;
}

interface MessageResponse {
  suggestions: MessageSuggestion[];
  confidence: number;
  reasoning: string;
}
```

**Implémentation:**
```typescript
// lib/ai/vertex-team-coordinator.ts
export class VertexAITeamCoordinator {
  private vertexService: VertexAIService;
  private vectorService: VertexAIVectorService;
  private network: AIKnowledgeNetwork;
  private agents: Map<string, VertexAIAgent>;
  
  constructor() {
    this.vertexService = new VertexAIService();
    this.vectorService = new VertexAIVectorService();
    this.network = new AIKnowledgeNetwork();
    
    // Initialiser les agents avec Vertex AI
    this.agents = new Map([
      ['messaging', new MessagingAI(this.vertexService, this.network)],
      ['analytics', new AnalyticsAI(this.vertexService, this.network)],
      ['sales', new SalesAI(this.vertexService, this.network)],
      ['compliance', new ComplianceAI(this.vertexService, this.network)],
    ]);
  }
  
  async handleFanMessage(context: MessageContext): Promise<MessageResponse> {
    // 1. Récupérer le contexte mémoire via Vector Search
    const memoryContext = await this.vectorService.searchSimilar(
      context.message,
      { filter: { creatorId: context.creatorId, fanId: context.fanId } }
    );
    
    // 2. Vérifier la compliance
    const compliance = await this.agents.get('compliance')!
      .checkContent(context.message);
    
    if (!compliance.safe) {
      return { suggestions: [], confidence: 0, reasoning: 'Unsafe content' };
    }
    
    // 3. Générer réponse avec MessagingAI
    const messaging = await this.agents.get('messaging')!
      .generateResponse(context, memoryContext);
    
    // 4. Optimiser avec SalesAI
    const sales = await this.agents.get('sales')!
      .optimizeMessage(messaging, context.fanProfile);
    
    // 5. Analyser avec AnalyticsAI
    const analytics = await this.agents.get('analytics')!
      .predictEngagement(sales, context.fanProfile);
    
    // 6. Combiner les résultats
    return this.combineResponses(messaging, sales, analytics);
  }
}
```

### 5. AI Agents avec Vertex AI

Chaque agent utilise Vertex AI au lieu d'OpenAI/Anthropic.

**MessagingAI (Emma):**
```typescript
// lib/ai/agents/messaging-ai.ts
export class MessagingAI implements VertexAIAgent {
  id = 'messaging_ai';
  name = 'Emma';
  model = 'gemini-1.5-pro';
  
  constructor(
    private vertexService: VertexAIService,
    private network: AIKnowledgeNetwork
  ) {}
  
  async generateResponse(
    context: MessageContext,
    memoryContext: SearchResult[]
  ): Promise<MessageSuggestion[]> {
    // Construire prompt enrichi avec mémoire
    const prompt = this.buildPrompt(context, memoryContext);
    
    // Générer avec Gemini 1.5 Pro
    const response = await this.vertexService.generateText(prompt, {
      temperature: 0.8,
      maxOutputTokens: 1024,
      responseFormat: 'json',
    });
    
    // Parser les suggestions
    const suggestions = JSON.parse(response.text);
    
    // Partager insight si haute confiance
    if (response.usage.totalTokens < 500) {
      this.network.broadcastInsight(context.creatorId, {
        source: this.id,
        type: 'pattern',
        confidence: 0.9,
        data: { strategy: 'concise_response', effective: true },
      });
    }
    
    return suggestions;
  }
  
  private buildPrompt(
    context: MessageContext,
    memory: SearchResult[]
  ): string {
    return `You are Emma, a messaging AI assistant for OnlyFans creators.

Creator ID: ${context.creatorId}
Fan Message: "${context.message}"

Past Interactions:
${memory.map(m => `- ${m.content} (relevance: ${m.score})`).join('\n')}

Fan Profile:
- Engagement Level: ${context.fanProfile.engagementLevel}
- Spending Tier: ${context.fanProfile.spendingTier}
- Preferred Topics: ${context.fanProfile.preferredTopics.join(', ')}

Generate 3 message suggestions in JSON format:
{
  "suggestions": [
    {
      "text": "...",
      "tone": "friendly|flirty|professional",
      "confidence": 0.0-1.0,
      "reasoning": "..."
    }
  ]
}`;
  }
}
```

**AnalyticsAI (Alex):**
```typescript
// lib/ai/agents/analytics-ai.ts
export class AnalyticsAI implements VertexAIAgent {
  id = 'analytics_ai';
  name = 'Alex';
  model = 'gemini-1.5-pro';
  
  async analyzePatterns(
    creatorId: string,
    data: AnalyticsData
  ): Promise<AnalyticsInsights> {
    const prompt = `Analyze these OnlyFans creator metrics:

Revenue: $${data.revenue}
Engagement Rate: ${data.engagementRate}%
Fan Count: ${data.fanCount}
Content Posted: ${data.contentCount}

Identify patterns, anomalies, and provide recommendations.
Return as JSON with: insights, predictions, recommendations.`;
    
    const response = await this.vertexService.generateText(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseFormat: 'json',
    });
    
    return JSON.parse(response.text);
  }
}
```

**SalesAI (Sarah):**
```typescript
// lib/ai/agents/sales-ai.ts
export class SalesAI implements VertexAIAgent {
  id = 'sales_ai';
  name = 'Sarah';
  model = 'gemini-1.5-flash'; // Plus économique pour sales
  
  async optimizeMessage(
    message: MessageSuggestion,
    fanProfile: FanProfile
  ): Promise<MessageSuggestion> {
    const prompt = `Optimize this message for sales conversion:

Original: "${message.text}"
Fan Spending Tier: ${fanProfile.spendingTier}
Past Purchases: ${fanProfile.pastPurchases.join(', ')}

Add subtle upsell opportunities while maintaining authenticity.
Return optimized message as JSON.`;
    
    const response = await this.vertexService.generateText(prompt, {
      temperature: 0.6,
      maxOutputTokens: 512,
      responseFormat: 'json',
    });
    
    return JSON.parse(response.text);
  }
}
```

**ComplianceAI (Claire):**
```typescript
// lib/ai/agents/compliance-ai.ts
export class ComplianceAI implements VertexAIAgent {
  id = 'compliance_ai';
  name = 'Claire';
  model = 'gemini-1.5-flash';
  
  async checkContent(
    content: string,
    platform: string = 'onlyfans'
  ): Promise<ComplianceResult> {
    const prompt = `Check this ${platform} content for compliance:

Content: "${content}"

Platform Rules:
- No explicit solicitation
- No personal contact info
- No hate speech
- No illegal content

Return JSON: { safe: boolean, issues: string[], suggestions: string[] }`;
    
    const response = await this.vertexService.generateText(prompt, {
      temperature: 0.1, // Très déterministe pour compliance
      maxOutputTokens: 512,
      responseFormat: 'json',
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      ],
    });
    
    return JSON.parse(response.text);
  }
}
```

## Data Models

### VertexAI Configuration

```typescript
interface VertexAIConfig {
  projectId: string;
  location: string;
  credentials?: ServiceAccountCredentials;
  timeout?: number;
  retryConfig?: RetryConfig;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
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
interface VertexAICostLog {
  id: string;
  timestamp: Date;
  accountId: string;
  plan: UserPlan;
  model: VertexAIModel;
  tier: ModelTier;
  operation: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCost: number;
  latency: number;
  success: boolean;
  errorCode?: string;
}

interface CostAggregation {
  period: 'hour' | 'day' | 'week' | 'month';
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  byModel: Record<VertexAIModel, ModelCostStats>;
  byTier: Record<ModelTier, TierCostStats>;
  byCreator: Record<string, CreatorCostStats>;
}

interface ModelCostStats {
  cost: number;
  tokens: number;
  requests: number;
  avgLatency: number;
}
```

### Vector Store Models

```typescript
interface VectorMemory {
  id: string;
  creatorId: string;
  fanId: string;
  content: string;
  embedding: number[];
  metadata: {
    timestamp: Date;
    messageType: 'incoming' | 'outgoing';
    sentiment: string;
    topics: string[];
    engagement: number;
  };
}

interface VectorIndex {
  name: string;
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dot_product';
  shards: number;
  replicas: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Premium Tier Routing Consistency
*For any* request classified as premium tier, the router should invoke Gemini 1.5 Pro with appropriate parameters (temperature, maxTokens) matching the premium configuration.
**Validates: Requirements 1.1**

### Property 2: Standard Tier Routing Consistency
*For any* request classified as standard tier, the router should invoke Gemini 1.5 Flash with optimized settings matching the standard configuration.
**Validates: Requirements 1.2**

### Property 3: Economy Tier Token Limit Enforcement
*For any* request classified as economy tier, the router should invoke Gemini 1.5 Flash with reduced token limits as specified in the economy configuration.
**Validates: Requirements 1.3**

### Property 4: Fallback Exponential Backoff
*For any* Vertex AI call that fails, the system should implement exponential backoff with delays increasing by the configured backoff factor between retry attempts.
**Validates: Requirements 1.4**

### Property 5: Streaming Token Delivery
*For any* streaming request, tokens should arrive progressively to the client without waiting for complete generation.
**Validates: Requirements 1.5**

### Property 6: MessagingAI Model Selection
*For any* MessagingAI request, the system should use Gemini 1.5 Pro and include personality-aware context in the prompt.
**Validates: Requirements 2.1**

### Property 7: AnalyticsAI Structured Output
*For any* AnalyticsAI analysis request, the response should be valid JSON containing insights, predictions, and recommendations fields.
**Validates: Requirements 2.2**

### Property 8: SalesAI Cost Optimization
*For any* SalesAI message optimization request, the system should use Gemini 1.5 Flash (not Pro) to minimize costs.
**Validates: Requirements 2.3**

### Property 9: ComplianceAI Safety Configuration
*For any* ComplianceAI content check, the system should configure safety settings to block low-and-above harmful content.
**Validates: Requirements 2.4**

### Property 10: Knowledge Network Broadcasting
*For any* insight shared by an agent, all other agents in the network should receive the broadcasted insight via the event system.
**Validates: Requirements 2.5**

### Property 11: Embedding Model Consistency
*For any* interaction stored in the memory service, the system should generate embeddings using the text-embedding-004 model.
**Validates: Requirements 3.1**

### Property 12: Semantic Search Relevance
*For any* memory context retrieval, the returned interactions should have semantic similarity scores above a minimum threshold.
**Validates: Requirements 3.2**

### Property 13: Vector Search Latency
*For any* embedding query, 95% of requests should complete in under 100ms.
**Validates: Requirements 3.3**

### Property 14: GDPR Embedding Deletion
*For any* user requesting data deletion, all embeddings associated with that user should be removed from the vector store.
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
*For any* completed Vertex AI request, the system should log token usage (input and output) and estimated cost to Cloud Logging.
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
*For any* deployed model, the system should track latency, accuracy, and cost metrics in Cloud Monitoring.
**Validates: Requirements 8.3**

### Property 34: Automatic Model Rollback
*For any* model that underperforms based on defined thresholds, the system should automatically rollback to the previous stable version.
**Validates: Requirements 8.4**

### Property 35: PII Redaction in Logs
*For any* AI interaction logged to Cloud Logging, personally identifiable information (PII) should be redacted before writing.
**Validates: Requirements 9.4**

### Property 36: Immutable Audit Logs
*For any* AI operation requiring GDPR compliance, the system should maintain immutable logs that cannot be modified or deleted.
**Validates: Requirements 9.5**

### Property 37: Gemini Prompt Format Compliance
*For any* prompt constructed for Gemini, it should follow Gemini-specific formatting guidelines and instruction patterns.
**Validates: Requirements 10.1**

### Property 38: JSON Mode Activation
*For any* request requiring structured output, the system should enable Gemini's native JSON mode in the generation config.
**Validates: Requirements 10.2**

### Property 39: Prompt Caching Token Reduction
*For any* repeated context in prompts, the system should implement caching to reduce token costs on subsequent requests.
**Validates: Requirements 10.3**

### Property 40: Context-Preserving Truncation
*For any* prompt exceeding token limits, the truncation algorithm should preserve key context elements (user query, critical instructions).
**Validates: Requirements 10.4**

### Property 41: Few-Shot Example Inclusion
*For any* prompt template requiring few-shot learning, the system should include optimized examples in the prompt.
**Validates: Requirements 10.5**

### Property 42: Metrics Emission on Request
*For any* Vertex AI request made, the system should emit metrics (latency, tokens, cost) to Cloud Monitoring.
**Validates: Requirements 11.1**

### Property 43: Distributed Tracing Propagation
*For any* AI service call, Cloud Trace should create trace spans that propagate across all service boundaries.
**Validates: Requirements 11.3**

### Property 44: Correlation ID in Logs
*For any* log entry written to Cloud Logging, it should contain a correlation ID for request tracing.
**Validates: Requirements 11.4**

### Property 45: Fallback Testing Graceful Degradation
*For any* simulated Vertex AI failure in tests, the system should gracefully degrade to fallback logic without crashing.
**Validates: Requirements 13.2**

### Property 46: Cost Tracking Accuracy
*For any* logged cost entry, the estimated cost should match the actual Cloud Billing data within 5% margin.
**Validates: Requirements 13.3**

### Property 47: Semantic Search Test Relevance
*For any* memory retrieval test with known relevant interactions, the semantic search should return those interactions in the top results.
**Validates: Requirements 13.4**

### Property 48: Instant Rollback Capability
*For any* critical issue detected, the system should support instant rollback to OpenAI/Anthropic providers without service interruption.
**Validates: Requirements 15.1**

### Property 49: Rollback Data Preservation
*For any* rollback operation, all data and state should be preserved without loss or corruption.
**Validates: Requirements 15.2**

### Property 50: Disaster Recovery Time
*For any* disaster recovery trigger, the system should restore service within 15 minutes.
**Validates: Requirements 15.4**

### Property 51: Dual-Write Consistency
*For any* write operation during migration period, both the old and new systems should receive the write to maintain consistency.
**Validates: Requirements 15.5**

## Error Handling

### Error Categories

**1. Vertex AI API Errors**
- Rate limiting (429)
- Authentication failures (401, 403)
- Service unavailable (503)
- Timeout errors
- Invalid request errors (400)

**2. Vector Search Errors**
- Index not found
- Embedding generation failures
- Search timeout
- Quota exceeded

**3. Circuit Breaker Errors**
- Circuit open (service unavailable)
- Half-open test failures
- Threshold exceeded

**4. Data Errors**
- Invalid input format
- Token limit exceeded
- Unsupported content type

### Error Handling Strategy

```typescript
// lib/ai/error-handler.ts
export class VertexAIErrorHandler {
  async handleError(error: Error, context: ErrorContext): Promise<ErrorResponse> {
    // 1. Classify error
    const errorType = this.classifyError(error);
    
    // 2. Log with context
    await this.logError(error, errorType, context);
    
    // 3. Determine recovery strategy
    const strategy = this.getRecoveryStrategy(errorType);
    
    // 4. Execute recovery
    return await this.executeRecovery(strategy, context);
  }
  
  private classifyError(error: Error): ErrorType {
    if (error.message.includes('429')) return 'RATE_LIMIT';
    if (error.message.includes('timeout')) return 'TIMEOUT';
    if (error.message.includes('auth')) return 'AUTH_FAILURE';
    if (error.message.includes('quota')) return 'QUOTA_EXCEEDED';
    return 'UNKNOWN';
  }
  
  private getRecoveryStrategy(errorType: ErrorType): RecoveryStrategy {
    const strategies: Record<ErrorType, RecoveryStrategy> = {
      RATE_LIMIT: 'EXPONENTIAL_BACKOFF',
      TIMEOUT: 'RETRY_WITH_REDUCED_TOKENS',
      AUTH_FAILURE: 'REFRESH_CREDENTIALS',
      QUOTA_EXCEEDED: 'FALLBACK_TO_CACHE',
      UNKNOWN: 'FALLBACK_TO_SIMPLE_LOGIC',
    };
    
    return strategies[errorType] || 'FALLBACK_TO_SIMPLE_LOGIC';
  }
  
  private async executeRecovery(
    strategy: RecoveryStrategy,
    context: ErrorContext
  ): Promise<ErrorResponse> {
    switch (strategy) {
      case 'EXPONENTIAL_BACKOFF':
        return await this.retryWithBackoff(context);
      
      case 'RETRY_WITH_REDUCED_TOKENS':
        return await this.retryWithReducedTokens(context);
      
      case 'FALLBACK_TO_CACHE':
        return await this.getCachedResponse(context);
      
      case 'FALLBACK_TO_SIMPLE_LOGIC':
        return await this.useSimpleLogic(context);
      
      default:
        throw new Error('No recovery strategy available');
    }
  }
}
```

### Retry Logic

```typescript
// lib/ai/retry-logic.ts
export class RetryLogic {
  async retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
    } = options;
    
    let lastError: Error;
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Log retry attempt
        logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
          error: lastError.message,
          delay,
        });
        
        // Wait before retry
        await this.sleep(delay);
        
        // Increase delay
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Testing Strategy

### Unit Testing

**Test Coverage:**
- VertexAIService methods (generateText, chat, streaming)
- VertexAIRouter tier selection and fallback logic
- VertexAIVectorService embedding generation and search
- AI Agent prompt construction and response parsing
- Error handling and retry logic
- Circuit breaker state transitions

**Testing Framework:**
- Vitest for unit tests
- Mock Vertex AI SDK responses
- Test fixtures for common scenarios

**Example Unit Test:**
```typescript
// lib/ai/__tests__/vertex-ai-router.test.ts
import { describe, it, expect, vi } from 'vitest';
import { VertexAIRouter } from '../vertex-ai-router';

describe('VertexAIRouter', () => {
  it('should route premium tier to Gemini 1.5 Pro', async () => {
    const router = new VertexAIRouter();
    const mockVertexService = vi.fn();
    
    const result = await router.generateWithPolicy({
      policy: { complexity: 'high', latency: 'low' },
      messages: [{ role: 'user', content: 'Test' }],
      meta: { plan: 'enterprise' },
    });
    
    expect(result.model).toBe('gemini-1.5-pro');
    expect(result.tier).toBe('premium');
  });
  
  it('should fallback on Vertex AI failure', async () => {
    const router = new VertexAIRouter();
    
    // Mock first call to fail
    vi.spyOn(router, 'callVertexAI')
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce({ content: 'Fallback response' });
    
    const result = await router.generateWithPolicy({
      policy: { complexity: 'medium' },
      messages: [{ role: 'user', content: 'Test' }],
    });
    
    expect(result.content).toBe('Fallback response');
  });
});
```

### Property-Based Testing

**Property Testing Library:** fast-check (JavaScript/TypeScript)

**Test Configuration:**
- Minimum 100 iterations per property test
- Random input generation for comprehensive coverage
- Shrinking to find minimal failing cases

**Example Property Test:**
```typescript
// lib/ai/__tests__/vertex-ai-router.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { VertexAIRouter } from '../vertex-ai-router';

describe('VertexAIRouter Properties', () => {
  /**
   * Feature: huntaze-ai-gcp-migration, Property 1: Premium Tier Routing Consistency
   * For any request classified as premium tier, the router should invoke 
   * Gemini 1.5 Pro with appropriate parameters.
   */
  it('should always use Gemini 1.5 Pro for premium tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          complexity: fc.constant('high'),
          latency: fc.constant('low'),
        }),
        fc.array(fc.record({
          role: fc.constantFrom('user', 'assistant'),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
        })),
        async (policy, messages) => {
          const router = new VertexAIRouter();
          const result = await router.generateWithPolicy({
            policy,
            messages,
            meta: { plan: 'enterprise' },
          });
          
          return result.model === 'gemini-1.5-pro' && 
                 result.tier === 'premium';
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: huntaze-ai-gcp-migration, Property 4: Fallback Exponential Backoff
   * For any Vertex AI call that fails, the system should implement 
   * exponential backoff with increasing delays.
   */
  it('should use exponential backoff on failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // failure count
        async (failureCount) => {
          const router = new VertexAIRouter();
          const delays: number[] = [];
          
          // Mock to track delays
          vi.spyOn(router, 'sleep').mockImplementation(async (ms) => {
            delays.push(ms);
          });
          
          try {
            await router.retryWithBackoff(
              () => Promise.reject(new Error('Fail')),
              { maxAttempts: failureCount + 1 }
            );
          } catch {}
          
          // Verify exponential growth
          for (let i = 1; i < delays.length; i++) {
            const ratio = delays[i] / delays[i - 1];
            if (ratio < 1.5) return false; // Should grow exponentially
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Test Scenarios:**
- End-to-end message generation flow
- Vector search with real embeddings
- Cost tracking and aggregation
- Circuit breaker behavior under load
- Multi-agent coordination

**Testing Environment:**
- Staging GCP project with test data
- Mock OnlyFans API responses
- Test creators and fans

### Performance Testing

**Metrics to Track:**
- Latency (p50, p95, p99)
- Throughput (requests per second)
- Token usage efficiency
- Cost per request
- Error rate

**Load Testing:**
- Gradual ramp-up to 1000 concurrent users
- Sustained load for 30 minutes
- Spike testing (sudden 10x traffic)

## Deployment Strategy

### Phase 1: Infrastructure Setup (Week 1)
1. Create GCP project and enable Vertex AI APIs
2. Configure Workload Identity Federation
3. Set up Cloud KMS for encryption
4. Deploy Vector Search index
5. Configure Cloud Monitoring dashboards

### Phase 2: Service Migration (Week 2-3)
1. Implement VertexAIService
2. Implement VertexAIRouter with fallback to old system
3. Implement VertexAIVectorService
4. Migrate AI agents one by one
5. Deploy with feature flag (0% traffic)

### Phase 3: Testing & Validation (Week 4)
1. Run integration tests in staging
2. Perform load testing
3. Validate cost tracking accuracy
4. Test rollback procedures
5. Conduct security audit

### Phase 4: Gradual Rollout (Week 5-6)
1. Enable for 1% of traffic
2. Monitor metrics and errors
3. Increase to 10% if stable
4. Increase to 50% if stable
5. Increase to 100% if stable

### Phase 5: Cleanup (Week 7)
1. Remove old OpenAI/Anthropic code
2. Remove feature flags
3. Update documentation
4. Conduct team training
5. Archive migration artifacts

### Rollback Plan

**Trigger Conditions:**
- Error rate > 5%
- Latency p95 > 2x baseline
- Cost > 150% of budget
- Critical bug discovered

**Rollback Procedure:**
1. Set feature flag to 0% (instant)
2. Verify old system is handling traffic
3. Investigate root cause
4. Fix issues in staging
5. Re-test before re-enabling

## Monitoring and Observability

### Key Metrics

**Performance Metrics:**
- `vertex_ai_latency_ms` (histogram)
- `vertex_ai_tokens_input` (counter)
- `vertex_ai_tokens_output` (counter)
- `vertex_ai_requests_total` (counter)
- `vertex_ai_errors_total` (counter)

**Cost Metrics:**
- `vertex_ai_cost_usd` (gauge)
- `vertex_ai_cost_by_model` (gauge)
- `vertex_ai_cost_by_creator` (gauge)

**Circuit Breaker Metrics:**
- `circuit_breaker_state` (gauge: 0=closed, 1=open, 2=half-open)
- `circuit_breaker_failures` (counter)
- `circuit_breaker_successes` (counter)

### Dashboards

**Vertex AI Overview Dashboard:**
- Request rate and error rate
- Latency percentiles (p50, p95, p99)
- Token usage trends
- Cost trends
- Model distribution

**AI Agents Dashboard:**
- Requests per agent
- Success rate per agent
- Average confidence scores
- Knowledge network activity

**Cost Optimization Dashboard:**
- Cost per creator
- Cost per model tier
- Optimization opportunities
- Budget alerts

### Alerts

**Critical Alerts:**
- Error rate > 5% for 5 minutes
- Latency p95 > 5 seconds for 5 minutes
- Daily cost > $1000
- Circuit breaker open for > 10 minutes

**Warning Alerts:**
- Error rate > 2% for 10 minutes
- Latency p95 > 3 seconds for 10 minutes
- Daily cost > $500
- Token usage spike > 200% of baseline

## Security Considerations

### Authentication & Authorization

**Workload Identity Federation:**
```typescript
// lib/ai/vertex-auth.ts
import { GoogleAuth } from 'google-auth-library';

export class VertexAIAuth {
  private auth: GoogleAuth;
  
  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }
  
  async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    return token.token!;
  }
}
```

### Data Encryption

**At Rest:**
- Vector embeddings encrypted with Cloud KMS
- Cost logs encrypted in Cloud Logging
- Audit trails encrypted in Cloud Storage

**In Transit:**
- TLS 1.3 for all Vertex AI API calls
- mTLS for internal service communication

### PII Redaction

```typescript
// lib/ai/pii-redactor.ts
export class PIIRedactor {
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  };
  
  redact(text: string): string {
    let redacted = text;
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    }
    
    return redacted;
  }
}
```

### Audit Logging

```typescript
// lib/ai/audit-logger.ts
export class AuditLogger {
  async logAIOperation(operation: AIOperation): Promise<void> {
    const log = {
      timestamp: new Date().toISOString(),
      operation: operation.type,
      userId: operation.userId,
      model: operation.model,
      inputTokens: operation.inputTokens,
      outputTokens: operation.outputTokens,
      cost: operation.cost,
      success: operation.success,
      // PII redacted
      input: this.redactor.redact(operation.input),
      output: this.redactor.redact(operation.output),
    };
    
    // Write to Cloud Logging with immutable flag
    await this.cloudLogging.write({
      logName: 'ai-operations-audit',
      resource: { type: 'global' },
      entries: [{ jsonPayload: log }],
      labels: { immutable: 'true' },
    });
  }
}
```

## Cost Optimization

### Pricing Model

**Gemini 1.5 Pro:**
- Input: $0.00125 per 1K tokens
- Output: $0.00375 per 1K tokens

**Gemini 1.5 Flash:**
- Input: $0.000075 per 1K tokens
- Output: $0.0003 per 1K tokens

**Text Embeddings:**
- $0.00002 per 1K tokens

### Optimization Strategies

**1. Model Selection:**
- Use Flash for simple tasks (compliance, sales optimization)
- Use Pro only for complex tasks (analytics, personality calibration)

**2. Prompt Caching:**
- Cache system prompts and few-shot examples
- Reduce repeated context in conversations

**3. Token Limits:**
- Set appropriate maxOutputTokens per use case
- Truncate long inputs intelligently

**4. Batch Processing:**
- Batch embedding generation
- Batch analytics queries

**5. Caching:**
- Cache frequent queries (e.g., compliance checks)
- Cache embeddings for common content

### Cost Monitoring

```typescript
// lib/ai/cost-monitor.ts
export class CostMonitor {
  async trackCost(operation: AIOperation): Promise<void> {
    const cost = this.calculateCost(operation);
    
    // Log to Cloud Monitoring
    await this.metrics.recordGauge('vertex_ai_cost_usd', cost, {
      model: operation.model,
      creator: operation.creatorId,
      operation: operation.type,
    });
    
    // Check budget alerts
    const dailyCost = await this.getDailyCost();
    if (dailyCost > this.budgetThreshold) {
      await this.alerting.sendAlert({
        severity: 'warning',
        message: `Daily cost ${dailyCost} exceeds threshold ${this.budgetThreshold}`,
      });
    }
  }
  
  private calculateCost(operation: AIOperation): number {
    const pricing = this.getPricing(operation.model);
    const inputCost = (operation.inputTokens / 1000) * pricing.input;
    const outputCost = (operation.outputTokens / 1000) * pricing.output;
    return inputCost + outputCost;
  }
}
```

## Migration Checklist

### Pre-Migration
- [ ] GCP project created and configured
- [ ] Vertex AI APIs enabled
- [ ] Workload Identity Federation configured
- [ ] Cloud KMS keys created
- [ ] Vector Search index deployed
- [ ] Monitoring dashboards created
- [ ] Alert policies configured
- [ ] Staging environment ready
- [ ] Team trained on GCP services

### Migration
- [ ] VertexAIService implemented and tested
- [ ] VertexAIRouter implemented with fallback
- [ ] VertexAIVectorService implemented
- [ ] AI agents migrated to Vertex AI
- [ ] Cost tracking implemented
- [ ] Circuit breakers configured
- [ ] Error handling tested
- [ ] Integration tests passing
- [ ] Load tests passing
- [ ] Security audit completed

### Post-Migration
- [ ] 1% traffic rollout successful
- [ ] 10% traffic rollout successful
- [ ] 50% traffic rollout successful
- [ ] 100% traffic rollout successful
- [ ] Old code removed
- [ ] Feature flags removed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Retrospective conducted

---

**Document Version:** 1.0  
**Last Updated:** 2024-11-30  
**Authors:** Kiro AI Assistant  
**Status:** Ready for Review
