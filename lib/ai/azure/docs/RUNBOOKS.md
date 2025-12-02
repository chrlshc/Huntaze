# Azure AI Operational Runbooks

## Table of Contents

1. [Incident Response](#incident-response)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Performance Tuning](#performance-tuning)
4. [Cost Optimization](#cost-optimization)
5. [Disaster Recovery](#disaster-recovery)

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 | Service down | 15 min | All AI services unavailable |
| P2 | Major degradation | 30 min | High error rate, circuit breakers open |
| P3 | Minor issues | 2 hours | Elevated latency, cost spike |
| P4 | Low priority | 24 hours | Documentation updates, minor bugs |

### P1: Complete Service Outage

**Symptoms:**
- All AI requests failing
- Circuit breakers all open
- No responses from Azure OpenAI

**Immediate Actions:**

```bash
# 1. Check Azure service status
az openai show --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope

# 2. Check circuit breaker status
curl -X GET https://api.huntaze.com/api/health/circuit-breakers

# 3. Enable fallback to OpenAI/Anthropic
curl -X POST https://api.huntaze.com/api/admin/fallback/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Escalation:**
1. Page on-call engineer
2. Notify stakeholders via Slack #incidents
3. Create incident ticket in Jira

### P2: High Error Rate

**Symptoms:**
- Error rate > 5%
- Some circuit breakers open
- Intermittent failures

**Diagnosis:**

```bash
# Check error distribution
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    requests
    | where timestamp > ago(15m)
    | where success == false
    | summarize count() by resultCode
    | order by count_ desc
  "

# Check specific deployment health
az openai deployment show \
  --resource-group huntaze-ai-rg \
  --resource-name huntaze-ai-westeurope \
  --deployment-name gpt-4-turbo-prod
```

**Resolution Steps:**

1. **Rate Limiting (429 errors)**
   ```bash
   # Check quota usage
   az openai quota list --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope
   
   # Increase quota if available
   az openai quota update --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope --quota-limit 100000
   ```

2. **Authentication Errors (401/403)**
   ```bash
   # Rotate API key
   az openai key regenerate --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope --key-type key1
   
   # Update in Key Vault
   az keyvault secret set --vault-name huntaze-keyvault --name azure-openai-key --value "new-key"
   ```

3. **Timeout Errors**
   ```bash
   # Check deployment latency
   az monitor metrics list \
     --resource /subscriptions/xxx/resourceGroups/huntaze-ai-rg/providers/Microsoft.CognitiveServices/accounts/huntaze-ai-westeurope \
     --metric "Latency" \
     --interval PT1M
   ```

### P3: Elevated Latency

**Symptoms:**
- P95 latency > 3s
- Slow response times
- User complaints

**Diagnosis:**

```bash
# Check latency percentiles
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    requests
    | where timestamp > ago(1h)
    | where name contains 'azure-openai'
    | summarize 
        p50=percentile(duration, 50),
        p95=percentile(duration, 95),
        p99=percentile(duration, 99)
      by bin(timestamp, 5m)
  "
```

**Resolution:**

1. Check Azure service health dashboard
2. Enable response caching if not active
3. Consider switching to secondary region
4. Scale up provisioned throughput

---

## Common Issues & Solutions

### Issue: Circuit Breaker Stuck Open

**Cause:** Service recovered but breaker hasn't reset

**Solution:**
```typescript
// Force reset circuit breaker
import { CircuitBreakerManager } from '@/lib/ai/azure/circuit-breaker';

const manager = CircuitBreakerManager.getInstance();
manager.reset('gpt-4-turbo');
```

Or via API:
```bash
curl -X POST https://api.huntaze.com/api/admin/circuit-breaker/reset \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"deployment": "gpt-4-turbo"}'
```

### Issue: Embedding Index Out of Sync

**Cause:** Failed indexing operations

**Solution:**
```bash
# Check index status
az search index show --service-name huntaze-search --name huntaze-memory-index

# Reindex if needed
curl -X POST https://api.huntaze.com/api/admin/memory/reindex \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Issue: Cost Spike

**Cause:** Unexpected high usage or inefficient prompts

**Diagnosis:**
```bash
# Check cost by model
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    customMetrics
    | where name == 'azure_openai_cost'
    | where timestamp > ago(24h)
    | summarize total_cost=sum(value) by tostring(customDimensions.model)
    | order by total_cost desc
  "
```

**Resolution:**
1. Identify high-cost operations
2. Review prompt efficiency
3. Consider tier downgrade for non-critical operations
4. Enable prompt caching

### Issue: Memory Search Returns Irrelevant Results

**Cause:** Embedding quality or search configuration

**Solution:**
```bash
# Test search relevance
curl -X POST https://api.huntaze.com/api/admin/memory/test-search \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"query": "test query", "expectedResults": ["id1", "id2"]}'

# Adjust search parameters
# In azure-cognitive-search.service.ts:
# - Increase minScore threshold
# - Adjust hybrid search weights
```

---

## Performance Tuning

### Optimize Latency

1. **Enable Response Caching**
   ```typescript
   // In azure-caching.service.ts
   const cacheConfig = {
     enabled: true,
     ttl: 3600, // 1 hour
     maxSize: 10000,
   };
   ```

2. **Use Streaming for Long Responses**
   ```typescript
   // Always use streaming for responses > 500 tokens
   if (expectedTokens > 500) {
     return azure.generateTextStream(prompt, options);
   }
   ```

3. **Batch Embedding Requests**
   ```typescript
   // Process 16 items per batch
   const embeddings = await azure.generateEmbeddings(texts.slice(0, 16));
   ```

### Optimize Throughput

1. **Configure Provisioned Throughput**
   ```bash
   az openai deployment update \
     --resource-group huntaze-ai-rg \
     --resource-name huntaze-ai-westeurope \
     --deployment-name gpt-4-turbo-prod \
     --sku-capacity 100  # PTU units
   ```

2. **Enable Load Balancing**
   ```typescript
   // In azure-load-balancer.service.ts
   const config = {
     deployments: ['gpt-4-turbo-prod', 'gpt-4-turbo-prod-2'],
     strategy: 'round-robin',
     healthCheckInterval: 30000,
   };
   ```

### Optimize Memory

1. **Tune Vector Search**
   ```json
   {
     "vectorSearch": {
       "algorithms": [{
         "name": "hnsw",
         "kind": "hnsw",
         "hnswParameters": {
           "m": 4,
           "efConstruction": 400,
           "efSearch": 500,
           "metric": "cosine"
         }
       }]
     }
   }
   ```

---

## Cost Optimization

### Daily Cost Review

```bash
# Get daily cost breakdown
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    customMetrics
    | where name == 'azure_openai_cost'
    | where timestamp > ago(7d)
    | summarize daily_cost=sum(value) by bin(timestamp, 1d)
    | order by timestamp desc
  "
```

### Cost Reduction Strategies

1. **Tier Optimization**
   - Use GPT-3.5 for simple tasks (90% cheaper)
   - Reserve GPT-4 Turbo for complex analysis
   - Use GPT-4 for standard conversations

2. **Prompt Optimization**
   - Enable prompt caching
   - Reduce system prompt size
   - Use efficient few-shot examples

3. **Caching Strategy**
   - Cache common queries (1h TTL)
   - Cache embeddings (24h TTL)
   - Cache personality profiles (1h TTL)

### Budget Alerts

```bash
# Set up cost alerts
az monitor metrics alert create \
  --name "AI-Cost-Warning" \
  --resource-group huntaze-ai-rg \
  --scopes "/subscriptions/xxx/resourceGroups/huntaze-ai-rg" \
  --condition "total cost > 1000" \
  --action-group "ops-team"
```

---

## Disaster Recovery

### DR Activation Procedure

**Trigger Conditions:**
- Primary region (West Europe) unavailable > 5 minutes
- Error rate > 50% for > 10 minutes
- Manual activation by on-call

**Activation Steps:**

```bash
# 1. Verify primary region status
az openai show --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope

# 2. Activate DR mode
curl -X POST https://api.huntaze.com/api/admin/dr/activate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "Primary region outage"}'

# 3. Verify traffic routing to North Europe
curl -X GET https://api.huntaze.com/api/health/region
```

### DR Deactivation (Failback)

```bash
# 1. Verify primary region recovered
az openai show --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope

# 2. Gradual traffic shift (10% → 50% → 100%)
curl -X POST https://api.huntaze.com/api/admin/dr/failback \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"percentage": 10}'

# Wait 15 minutes, monitor metrics

curl -X POST https://api.huntaze.com/api/admin/dr/failback \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"percentage": 50}'

# Wait 15 minutes, monitor metrics

curl -X POST https://api.huntaze.com/api/admin/dr/failback \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"percentage": 100}'

# 3. Deactivate DR mode
curl -X POST https://api.huntaze.com/api/admin/dr/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### DR Testing Schedule

- **Monthly:** Automated DR test (non-production)
- **Quarterly:** Full DR drill with traffic shift
- **Annually:** Complete failover test

### Recovery Time Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Azure OpenAI | 15 min | 0 (stateless) |
| Cognitive Search | 30 min | 1 hour |
| Application Insights | 1 hour | 24 hours |

---

## Contact Information

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty | Slack #oncall |
| Platform Lead | @platform-lead | Direct message |
| Azure Support | Azure Portal | P1 ticket |

## Useful Links

- [Azure Status](https://status.azure.com)
- [Azure OpenAI Docs](https://learn.microsoft.com/azure/ai-services/openai/)
- [Huntaze Monitoring Dashboard](https://portal.azure.com/#@huntaze/dashboard)
- [Incident Management](https://huntaze.atlassian.net/incidents)
