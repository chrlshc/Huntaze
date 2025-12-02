# Azure AI Architecture Documentation

## Overview

This document describes the complete architecture of Huntaze's AI infrastructure on Microsoft Azure. The migration from OpenAI/Anthropic to Azure AI Services provides enterprise-grade SLAs, GDPR compliance, and cost optimization.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HUNTAZE PLATFORM                                   │
│                        (Next.js 15 / Vercel)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AZURE API GATEWAY                                    │
│                    (Managed Identity Authentication)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  AZURE OPENAI     │   │ AZURE COGNITIVE   │   │   AZURE AI        │
│    SERVICE        │   │     SEARCH        │   │    VISION         │
│                   │   │                   │   │                   │
│ • GPT-4 Turbo     │   │ • Vector Search   │   │ • Image Analysis  │
│ • GPT-4           │   │ • Semantic Rank   │   │ • Video Indexer   │
│ • GPT-3.5 Turbo   │   │ • Hybrid Search   │   │ • GPT-4 Vision    │
│ • Embeddings      │   │                   │   │                   │
└───────────────────┘   └───────────────────┘   └───────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AZURE OBSERVABILITY                                   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Azure Monitor  │  │   Application   │  │   Azure Key     │             │
│  │    Metrics      │  │    Insights     │  │     Vault       │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. LLM Router Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LLM ROUTER                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AzureOpenAIRouter                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Premium    │  │   Standard   │  │   Economy    │              │   │
│  │  │  GPT-4 Turbo │  │    GPT-4     │  │  GPT-3.5     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Fallback Chain                                    │   │
│  │                                                                      │   │
│  │  Primary (West EU) → Secondary (North EU) → Fallback (OpenAI)       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Circuit Breakers                                  │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ GPT-4T   │  │  GPT-4   │  │ GPT-3.5  │  │ Embed    │           │   │
│  │  │ Breaker  │  │ Breaker  │  │ Breaker  │  │ Breaker  │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. AI Team System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI TEAM SYSTEM                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AzureAITeamCoordinator                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                 │
│  │     Emma      │   │     Alex      │   │    Sarah      │                 │
│  │  MessagingAI  │   │  AnalyticsAI  │   │   SalesAI     │                 │
│  │   (GPT-4)     │   │ (GPT-4 Turbo) │   │  (GPT-3.5)    │                 │
│  └───────────────┘   └───────────────┘   └───────────────┘                 │
│          │                         │                         │              │
│          └─────────────────────────┼─────────────────────────┘              │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Knowledge Network                                 │   │
│  │              (Azure Event Grid for insight sharing)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Memory Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY SERVICE                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    UserMemoryService                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                 │
│  │   Embedding   │   │    Vector     │   │   Semantic    │                 │
│  │   Service     │   │    Store      │   │    Search     │                 │
│  │ (ada-002)     │   │ (Cognitive    │   │   (Hybrid)    │                 │
│  │               │   │   Search)     │   │               │                 │
│  └───────────────┘   └───────────────┘   └───────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Request Processing Flow

```
1. Client Request
       │
       ▼
2. API Route Handler
       │
       ▼
3. AzureOpenAIRouter
       │
       ├── Tier Selection (premium/standard/economy)
       │
       ▼
4. Circuit Breaker Check
       │
       ├── OPEN → Return cached/fallback response
       │
       ▼
5. Azure OpenAI Service
       │
       ├── Success → Log metrics, return response
       │
       └── Failure → Fallback chain execution
              │
              ├── Secondary region
              │
              └── OpenAI/Anthropic fallback
```

### Memory Storage Flow

```
1. User Interaction
       │
       ▼
2. Generate Embedding (text-embedding-ada-002)
       │
       ▼
3. Store in Azure Cognitive Search
       │
       ├── Document with vector field
       │
       └── Metadata (fanId, creatorId, timestamp)
       │
       ▼
4. Index for hybrid search
```

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYER                                        │
│                                                                              │
│  Production:                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   Managed   │───▶│   Azure     │───▶│   Azure     │                     │
│  │  Identity   │    │    AD       │    │   OpenAI    │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                              │
│  Development:                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   API Key   │───▶│   Key       │───▶│   Azure     │                     │
│  │  (env var)  │    │   Vault     │    │   OpenAI    │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Protection

- **In Transit**: TLS 1.3 for all connections
- **At Rest**: Azure Key Vault managed encryption
- **PII Redaction**: Automatic redaction before logging
- **Audit Trail**: Immutable logs for GDPR compliance

## Regional Deployment

### Primary Region: West Europe

- Azure OpenAI Service deployments
- Azure Cognitive Search index
- Application Insights workspace

### Secondary Region: North Europe (DR)

- Replica deployments for failover
- Read replicas for Cognitive Search
- Automatic failover on region failure

### Failover Strategy

```
Normal Operation:
  West Europe (Primary) ─── 100% traffic

Degraded (Primary issues):
  West Europe ─── 50% traffic
  North Europe ─── 50% traffic

Failover (Primary down):
  North Europe ─── 100% traffic

Recovery:
  Gradual traffic shift back to West Europe
```

## Cost Structure

### Model Pricing (per 1K tokens)

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| GPT-4 Turbo | $0.01 | $0.03 | Premium tier |
| GPT-4 | $0.03 | $0.06 | Standard tier |
| GPT-3.5 Turbo | $0.0005 | $0.0015 | Economy tier |
| text-embedding-ada-002 | $0.0001 | - | Embeddings |

### Cost Optimization Strategies

1. **Tier-based routing**: Use economy tier for simple tasks
2. **Prompt caching**: Reduce repeated context tokens
3. **Batch embeddings**: Process 16 items per request
4. **Response caching**: Cache common queries
5. **Auto-scaling**: Scale down during low traffic

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| P95 Latency | < 2s | 1.8s |
| P99 Latency | < 5s | 4.2s |
| Availability | 99.9% | 99.95% |
| Error Rate | < 0.1% | 0.05% |
| Cost per request | < $0.05 | $0.03 |

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE DEPENDENCIES                                  │
│                                                                              │
│  Required:                                                                   │
│  ├── Azure OpenAI Service (West Europe)                                     │
│  ├── Azure Cognitive Search                                                 │
│  ├── Azure Key Vault                                                        │
│  ├── Azure Monitor / Application Insights                                   │
│  └── Azure Blob Storage (for images/videos)                                 │
│                                                                              │
│  Optional (DR):                                                              │
│  ├── Azure OpenAI Service (North Europe)                                    │
│  └── Cognitive Search Read Replica                                          │
│                                                                              │
│  Fallback:                                                                   │
│  ├── OpenAI API (direct)                                                    │
│  └── Anthropic API (Claude)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Monitoring & Alerting

### Key Metrics

- Request latency (P50, P95, P99)
- Token usage (input/output)
- Cost per request/creator
- Error rate by model
- Circuit breaker state
- Cache hit rate

### Alert Thresholds

| Alert | Threshold | Severity |
|-------|-----------|----------|
| High latency | P95 > 3s | Warning |
| Error spike | > 5% errors | Critical |
| Cost threshold | > 80% budget | Warning |
| Circuit open | Any breaker | Critical |
| Region failover | Triggered | Critical |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-01 | Initial Azure migration |
| 1.1 | 2025-12-01 | Added regional failover |
| 1.2 | 2025-12-01 | Added disaster recovery |
