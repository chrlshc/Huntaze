# Azure AI Training Guide

## Overview

This guide provides training materials for the Huntaze team on Azure AI Services. It covers the key concepts, hands-on exercises, and certification paths.

---

## Training Schedule

### Week 1: Azure Fundamentals

| Day | Topic | Duration | Format |
|-----|-------|----------|--------|
| Mon | Azure Portal & Resource Management | 2h | Workshop |
| Tue | Azure OpenAI Service Overview | 2h | Presentation |
| Wed | Hands-on: First API Call | 2h | Lab |
| Thu | Authentication & Security | 2h | Workshop |
| Fri | Q&A Session | 1h | Discussion |

### Week 2: Advanced Topics

| Day | Topic | Duration | Format |
|-----|-------|----------|--------|
| Mon | LLM Router & Tier Selection | 2h | Workshop |
| Tue | Circuit Breakers & Resilience | 2h | Lab |
| Wed | Memory Service & Vector Search | 2h | Workshop |
| Thu | Monitoring & Observability | 2h | Lab |
| Fri | Cost Optimization | 2h | Workshop |

### Week 3: Operations

| Day | Topic | Duration | Format |
|-----|-------|----------|--------|
| Mon | Incident Response | 2h | Simulation |
| Tue | Disaster Recovery | 2h | Drill |
| Wed | Performance Tuning | 2h | Lab |
| Thu | Troubleshooting Deep Dive | 2h | Workshop |
| Fri | Final Assessment | 2h | Exam |

---

## Module 1: Azure OpenAI Fundamentals

### Learning Objectives

- Understand Azure OpenAI Service architecture
- Learn model capabilities and limitations
- Master API authentication methods
- Understand pricing and quotas

### Key Concepts

#### 1.1 Azure OpenAI vs OpenAI

| Feature | Azure OpenAI | OpenAI Direct |
|---------|--------------|---------------|
| Data Residency | Regional (EU) | US-based |
| SLA | 99.9% | Best effort |
| Authentication | Managed Identity | API Key only |
| Compliance | SOC2, GDPR | Limited |
| Support | Enterprise | Community |

#### 1.2 Available Models

```
GPT-4 Turbo (gpt-4-turbo)
├── Context: 128K tokens
├── Best for: Complex analysis, long documents
└── Cost: $0.01/$0.03 per 1K tokens

GPT-4 (gpt-4)
├── Context: 8K tokens
├── Best for: Standard conversations
└── Cost: $0.03/$0.06 per 1K tokens

GPT-3.5 Turbo (gpt-35-turbo)
├── Context: 16K tokens
├── Best for: Simple tasks, high volume
└── Cost: $0.0005/$0.0015 per 1K tokens

text-embedding-ada-002
├── Dimensions: 1536
├── Best for: Semantic search
└── Cost: $0.0001 per 1K tokens
```

### Hands-on Exercise 1.1

**Goal:** Make your first Azure OpenAI API call

```typescript
// exercise-1-1.ts
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';

async function exercise1() {
  const azure = new AzureOpenAIService();
  
  // Task 1: Generate a simple response
  const response = await azure.generateText(
    'What is the capital of France?',
    { maxTokens: 50 }
  );
  
  console.log('Response:', response.text);
  console.log('Tokens used:', response.usage.totalTokens);
  
  // Task 2: Try different temperatures
  const creative = await azure.generateText(
    'Write a haiku about coding',
    { temperature: 0.9, maxTokens: 50 }
  );
  
  const precise = await azure.generateText(
    'Write a haiku about coding',
    { temperature: 0.1, maxTokens: 50 }
  );
  
  console.log('Creative:', creative.text);
  console.log('Precise:', precise.text);
}

exercise1();
```

---

## Module 2: LLM Router & Tier Selection

### Learning Objectives

- Understand tier-based routing
- Configure model selection rules
- Implement fallback chains
- Monitor routing decisions

### Key Concepts

#### 2.1 Tier Selection Logic

```typescript
// Tier selection based on use case
const tierMapping = {
  // Premium: Complex analysis, critical operations
  premium: {
    model: 'gpt-4-turbo',
    useCases: ['analytics', 'complex-reasoning', 'long-documents'],
    maxTokens: 4096,
  },
  
  // Standard: Regular conversations
  standard: {
    model: 'gpt-4',
    useCases: ['messaging', 'content-generation'],
    maxTokens: 2048,
  },
  
  // Economy: Simple tasks, high volume
  economy: {
    model: 'gpt-35-turbo',
    useCases: ['compliance-check', 'simple-queries', 'sales'],
    maxTokens: 1024,
  },
};
```

### Hands-on Exercise 2.1

**Goal:** Implement tier-based routing

```typescript
// exercise-2-1.ts
import { AzureOpenAIRouter } from '@/lib/ai/azure/azure-openai-router';

async function exercise2() {
  const router = new AzureOpenAIRouter();
  
  // Task 1: Route a premium request
  const premiumResponse = await router.route({
    prompt: 'Analyze this quarterly report and provide insights...',
    tier: 'premium',
    accountId: 'test-user',
    plan: 'pro',
  });
  
  console.log('Premium model used:', premiumResponse.model);
  
  // Task 2: Route an economy request
  const economyResponse = await router.route({
    prompt: 'Is this message appropriate?',
    tier: 'economy',
    accountId: 'test-user',
    plan: 'free',
  });
  
  console.log('Economy model used:', economyResponse.model);
  
  // Task 3: Test automatic tier selection
  const autoResponse = await router.routeAuto({
    prompt: 'Hello, how are you?',
    accountId: 'test-user',
    plan: 'pro',
  });
  
  console.log('Auto-selected tier:', autoResponse.tier);
}

exercise2();
```

---

## Module 3: Circuit Breakers & Resilience

### Learning Objectives

- Understand circuit breaker pattern
- Configure failure thresholds
- Implement fallback logic
- Monitor circuit breaker state

### Key Concepts

#### 3.1 Circuit Breaker States

```
CLOSED (Normal)
    │
    │ Failures > threshold
    ▼
  OPEN (Blocking)
    │
    │ Cooldown expires
    ▼
HALF-OPEN (Testing)
    │
    ├── Success → CLOSED
    │
    └── Failure → OPEN
```

### Hands-on Exercise 3.1

**Goal:** Test circuit breaker behavior

```typescript
// exercise-3-1.ts
import { CircuitBreaker } from '@/lib/ai/azure/circuit-breaker';

async function exercise3() {
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 5000,
    cooldownPeriod: 10000,
  });
  
  // Task 1: Simulate failures
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Simulated failure');
      });
    } catch (e) {
      console.log(`Attempt ${i + 1}: Failed`);
    }
  }
  
  console.log('Breaker state:', breaker.getState());
  // Should be 'open'
  
  // Task 2: Wait for cooldown
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('Breaker state after cooldown:', breaker.getState());
  // Should be 'half-open'
  
  // Task 3: Recover with successful calls
  for (let i = 0; i < 3; i++) {
    await breaker.execute(async () => {
      return 'Success';
    });
    console.log(`Recovery attempt ${i + 1}: Success`);
  }
  
  console.log('Final breaker state:', breaker.getState());
  // Should be 'closed'
}

exercise3();
```

---

## Module 4: Memory Service & Vector Search

### Learning Objectives

- Understand embedding generation
- Configure Azure Cognitive Search
- Implement semantic search
- Optimize search performance

### Hands-on Exercise 4.1

**Goal:** Implement semantic memory search

```typescript
// exercise-4-1.ts
import { AzureEmbeddingService } from '@/lib/ai/azure/azure-embedding.service';
import { AzureCognitiveSearchService } from '@/lib/ai/azure/azure-cognitive-search.service';

async function exercise4() {
  const embedding = new AzureEmbeddingService();
  const search = new AzureCognitiveSearchService();
  
  // Task 1: Generate embeddings
  const texts = [
    'I love your photos!',
    'When is your next post?',
    'Can you do a custom video?',
  ];
  
  const embeddings = await embedding.generateEmbeddings(texts);
  console.log('Generated', embeddings.length, 'embeddings');
  console.log('Dimensions:', embeddings[0].length);
  
  // Task 2: Store in search index
  const documents = texts.map((text, i) => ({
    id: `doc-${i}`,
    content: text,
    contentVector: embeddings[i],
    metadata: { timestamp: new Date().toISOString() },
  }));
  
  await search.upsertDocuments(documents);
  console.log('Documents indexed');
  
  // Task 3: Semantic search
  const query = 'custom content request';
  const results = await search.searchSimilar(query, { topK: 3 });
  
  console.log('Search results:');
  results.forEach((r, i) => {
    console.log(`${i + 1}. Score: ${r.score.toFixed(3)} - ${r.document.content}`);
  });
}

exercise4();
```

---

## Module 5: Monitoring & Cost Optimization

### Learning Objectives

- Configure Application Insights
- Track AI metrics
- Analyze costs
- Implement optimizations

### Hands-on Exercise 5.1

**Goal:** Implement cost tracking

```typescript
// exercise-5-1.ts
import { AzureCostTrackingService } from '@/lib/ai/azure/azure-cost-tracking.service';
import { AzureMetricsService } from '@/lib/ai/azure/azure-metrics.service';

async function exercise5() {
  const costTracker = new AzureCostTrackingService();
  const metrics = new AzureMetricsService();
  
  // Task 1: Log a request
  await costTracker.logRequest({
    deployment: 'gpt-4-turbo',
    tokensInput: 500,
    tokensOutput: 200,
    latency: 1500,
    success: true,
    accountId: 'test-user',
  });
  
  // Task 2: Get cost report
  const report = await costTracker.getReport({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(),
    groupBy: 'model',
  });
  
  console.log('Cost Report:');
  console.log(JSON.stringify(report, null, 2));
  
  // Task 3: Check optimization recommendations
  const recommendations = await costTracker.getOptimizationRecommendations('test-user');
  
  console.log('Recommendations:');
  recommendations.forEach(r => {
    console.log(`- ${r.description} (Potential savings: $${r.potentialSavings})`);
  });
}

exercise5();
```

---

## Assessment

### Knowledge Check

1. What is the difference between Azure OpenAI and OpenAI direct?
2. When should you use GPT-4 Turbo vs GPT-3.5 Turbo?
3. Explain the circuit breaker pattern and its states.
4. How does semantic search work with embeddings?
5. What metrics should you monitor for cost optimization?

### Practical Assessment

Complete the following tasks:

1. [ ] Set up local development environment
2. [ ] Make API calls to all three model tiers
3. [ ] Implement a circuit breaker with custom thresholds
4. [ ] Store and retrieve memories using vector search
5. [ ] Generate a cost report for the past 24 hours

---

## Certification Recommendations

### Azure Certifications

1. **AZ-900: Azure Fundamentals**
   - Prerequisite for all Azure certifications
   - Covers basic Azure concepts

2. **AI-900: Azure AI Fundamentals**
   - Introduction to AI services
   - Covers Azure OpenAI basics

3. **AI-102: Azure AI Engineer Associate**
   - Advanced AI implementation
   - Covers production deployment

### Learning Resources

- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure AI Services Learning Path](https://learn.microsoft.com/training/paths/get-started-azure-ai/)
- [Huntaze Internal Wiki](https://wiki.huntaze.com/azure-ai)

---

## Q&A Sessions

### Schedule

- **Weekly:** Fridays 3-4 PM (Slack #azure-ai-training)
- **Office Hours:** Tuesdays 10-11 AM (Zoom)

### Contact

- Training Lead: @training-lead
- Azure Expert: @azure-expert
- Platform Team: #platform-team
