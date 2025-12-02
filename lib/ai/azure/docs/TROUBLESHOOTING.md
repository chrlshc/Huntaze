# Azure AI Troubleshooting Guide

## Quick Diagnosis

### Health Check Commands

```bash
# Overall system health
curl https://api.huntaze.com/api/health

# Azure AI specific health
curl https://api.huntaze.com/api/health/azure-ai

# Circuit breaker status
curl https://api.huntaze.com/api/health/circuit-breakers
```

### Log Queries

```bash
# Recent errors
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    exceptions
    | where timestamp > ago(1h)
    | where problemId contains 'azure'
    | project timestamp, problemId, outerMessage
    | order by timestamp desc
    | take 20
  "

# Slow requests
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    requests
    | where timestamp > ago(1h)
    | where duration > 5000
    | where name contains 'azure-openai'
    | project timestamp, name, duration, resultCode
    | order by duration desc
  "
```

---

## Error Reference

### HTTP Status Codes

| Code | Meaning | Common Cause | Solution |
|------|---------|--------------|----------|
| 400 | Bad Request | Invalid prompt format | Check prompt structure |
| 401 | Unauthorized | Invalid API key | Rotate API key |
| 403 | Forbidden | Insufficient permissions | Check RBAC roles |
| 404 | Not Found | Deployment doesn't exist | Verify deployment name |
| 429 | Rate Limited | Quota exceeded | Wait or increase quota |
| 500 | Server Error | Azure service issue | Check Azure status |
| 503 | Service Unavailable | Deployment overloaded | Enable fallback |

### Azure OpenAI Error Codes

#### `content_filter`

**Description:** Content was blocked by Azure's content filtering

**Solution:**
```typescript
// Check content filter results
const response = await azure.generateText(prompt, options);
if (response.contentFilterResults?.hate?.filtered) {
  // Handle filtered content
  return generateSafeAlternative(prompt);
}
```

#### `context_length_exceeded`

**Description:** Prompt + response exceeds model's context window

**Solution:**
```typescript
// Truncate prompt intelligently
import { truncatePrompt } from '@/lib/ai/azure/azure-prompt-optimizer';

const truncatedPrompt = truncatePrompt(prompt, {
  maxTokens: 8000,
  preserveSystemPrompt: true,
  preserveRecentMessages: 5,
});
```

#### `rate_limit_exceeded`

**Description:** Too many requests per minute

**Solution:**
```typescript
// Implement exponential backoff
import { withRetry } from '@/lib/ai/azure/fallback-chain';

const response = await withRetry(
  () => azure.generateText(prompt, options),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffFactor: 2,
  }
);
```

#### `deployment_not_found`

**Description:** Specified deployment doesn't exist

**Solution:**
```bash
# List available deployments
az openai deployment list \
  --resource-group huntaze-ai-rg \
  --resource-name huntaze-ai-westeurope

# Verify deployment name in .env
echo $AZURE_OPENAI_DEPLOYMENT_GPT4_TURBO
```

---

## Component-Specific Issues

### LLM Router Issues

#### Symptom: Wrong model being selected

**Diagnosis:**
```typescript
// Enable debug logging
process.env.DEBUG = 'azure:router';

// Check tier mapping
import { AzureOpenAIRouter } from '@/lib/ai/azure/azure-openai-router';
const router = new AzureOpenAIRouter();
console.log(router.getTierMapping());
```

**Solution:**
```typescript
// Verify tier configuration
const tierConfig = {
  premium: 'gpt-4-turbo-prod',
  standard: 'gpt-4-standard-prod',
  economy: 'gpt-35-turbo-prod',
};
```

#### Symptom: Fallback not triggering

**Diagnosis:**
```typescript
// Check fallback chain configuration
import { FallbackChain } from '@/lib/ai/azure/fallback-chain';
const chain = new FallbackChain();
console.log(chain.getProviders());
```

**Solution:**
```env
# Ensure fallback is enabled
AZURE_ENABLE_FALLBACK=true
OPENAI_API_KEY=sk-xxx  # Fallback provider
```

### Circuit Breaker Issues

#### Symptom: Circuit breaker won't close

**Diagnosis:**
```typescript
import { CircuitBreakerManager } from '@/lib/ai/azure/circuit-breaker';
const manager = CircuitBreakerManager.getInstance();

// Check breaker state
const state = manager.getState('gpt-4-turbo');
console.log(state);
// { state: 'open', failures: 10, lastFailure: Date, cooldownEnd: Date }
```

**Solution:**
```typescript
// Force reset if service is healthy
manager.reset('gpt-4-turbo');

// Or wait for cooldown period
// Default: 30 seconds
```

#### Symptom: Circuit breaker opening too frequently

**Solution:**
```typescript
// Adjust thresholds
const config = {
  failureThreshold: 10,  // Increase from 5
  successThreshold: 3,
  timeout: 30000,
  cooldownPeriod: 60000,  // Increase cooldown
};
```

### Memory Service Issues

#### Symptom: Semantic search returns no results

**Diagnosis:**
```bash
# Check index document count
az search index show \
  --service-name huntaze-search \
  --name huntaze-memory-index \
  --query "documentCount"

# Test search directly
curl -X POST "https://huntaze-search.search.windows.net/indexes/huntaze-memory-index/docs/search?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_SEARCH_API_KEY" \
  -d '{"search": "*", "top": 5}'
```

**Solution:**
```typescript
// Verify embedding generation
const embedding = await azure.generateEmbedding('test query');
console.log('Embedding dimensions:', embedding.length);
// Should be 1536 for ada-002

// Check search configuration
const searchConfig = {
  vectorFields: 'contentVector',
  k: 10,
  minScore: 0.7,  // Lower if too strict
};
```

#### Symptom: Slow embedding generation

**Solution:**
```typescript
// Use batch processing
const texts = ['text1', 'text2', 'text3', ...];
const batchSize = 16;

for (let i = 0; i < texts.length; i += batchSize) {
  const batch = texts.slice(i, i + batchSize);
  const embeddings = await azure.generateEmbeddings(batch);
  // Process embeddings
}
```

### Cost Tracking Issues

#### Symptom: Costs not being logged

**Diagnosis:**
```typescript
// Check Application Insights connection
import { appInsights } from '@/lib/ai/azure/azure-metrics.service';
console.log('AI connected:', appInsights.isConnected());

// Verify metric emission
appInsights.trackMetric({
  name: 'test_metric',
  value: 1,
});
```

**Solution:**
```env
# Verify connection string
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/
```

#### Symptom: Cost calculations incorrect

**Solution:**
```typescript
// Verify pricing configuration
const pricing = {
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-35-turbo': { input: 0.0005, output: 0.0015 },
};

// Check token counting
const tokens = await azure.countTokens(prompt);
console.log('Token count:', tokens);
```

---

## Performance Issues

### High Latency

**Diagnosis:**
```bash
# Check latency by deployment
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "
    requests
    | where timestamp > ago(1h)
    | where name contains 'azure-openai'
    | summarize avg(duration), percentile(duration, 95) by tostring(customDimensions.deployment)
  "
```

**Solutions:**

1. **Enable caching**
   ```typescript
   const cacheService = new AzureCachingService({
     enabled: true,
     ttl: 3600,
   });
   ```

2. **Use streaming**
   ```typescript
   // For long responses, use streaming
   const stream = azure.generateTextStream(prompt, options);
   ```

3. **Optimize prompts**
   ```typescript
   // Reduce prompt size
   const optimizedPrompt = promptOptimizer.optimize(prompt, {
     maxTokens: 4000,
     removeRedundancy: true,
   });
   ```

### Memory Leaks

**Diagnosis:**
```bash
# Monitor Node.js memory
node --inspect app.js

# In Chrome DevTools, take heap snapshots
```

**Solution:**
```typescript
// Ensure streams are properly closed
const stream = azure.generateTextStream(prompt, options);
try {
  for await (const chunk of stream) {
    // Process chunk
  }
} finally {
  // Stream auto-closes, but ensure cleanup
}

// Clear caches periodically
setInterval(() => {
  cacheService.prune();
}, 3600000); // Every hour
```

---

## Testing Issues

### Property Tests Failing

**Diagnosis:**
```bash
# Run with verbose output
npm run test -- --verbose tests/unit/ai/azure-router-tier-selection.property.test.ts

# Check seed for reproducibility
npm run test -- --seed=12345
```

**Solution:**
```typescript
// Increase iterations for flaky tests
fc.assert(
  fc.property(fc.string(), (input) => {
    // Property test
  }),
  { numRuns: 200 }  // Increase from 100
);
```

### Integration Tests Timing Out

**Solution:**
```typescript
// Increase timeout for Azure calls
jest.setTimeout(30000);

// Or per-test
it('should generate response', async () => {
  // test
}, 30000);
```

---

## Quick Fixes

### Reset Everything

```bash
# Reset all circuit breakers
curl -X POST https://api.huntaze.com/api/admin/circuit-breakers/reset-all \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Clear all caches
curl -X POST https://api.huntaze.com/api/admin/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Restart services (if self-hosted)
pm2 restart all
```

### Emergency Fallback

```bash
# Force fallback to OpenAI
curl -X POST https://api.huntaze.com/api/admin/fallback/force \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"provider": "openai", "duration": 3600}'
```

### Disable Problematic Feature

```bash
# Disable specific agent
curl -X POST https://api.huntaze.com/api/admin/agents/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"agent": "analytics"}'
```

---

## Getting Help

1. **Check Azure Status:** https://status.azure.com
2. **Azure Support:** Create ticket in Azure Portal
3. **Internal:** Slack #azure-ai-support
4. **On-Call:** PagerDuty escalation
