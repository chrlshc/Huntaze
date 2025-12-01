# Azure AI Migration - Deployment Guide

## Quick Start

This guide provides step-by-step instructions for deploying the Azure AI infrastructure.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Azure subscription with Owner or Contributor role
- [ ] Azure CLI installed (`az --version`)
- [ ] Terraform installed (`terraform --version`)
- [ ] Node.js 18+ installed
- [ ] Git repository access
- [ ] Estimated budget: ~$7,000/month for production

## Phase 1: Infrastructure Setup (COMPLETED ✅)

### What Was Created

```
Azure Resource Group: huntaze-ai-production-rg
├── Azure OpenAI Service (Primary - West Europe)
│   ├── gpt-4-turbo-prod (100 PTU)
│   ├── gpt-4-standard-prod (50 PTU)
│   ├── gpt-35-turbo-prod (100 PTU)
│   ├── gpt-4-vision-prod (30 PTU)
│   └── text-embedding-ada-002-prod (50 PTU)
│
├── Azure OpenAI Service (Secondary - North Europe)
│   └── [Same deployments for DR]
│
├── Azure Cognitive Search
│   ├── Vector search (1536 dimensions)
│   ├── Hybrid search capability
│   └── Auto-scaling (3-12 replicas)
│
├── Azure Key Vault
│   ├── API keys storage
│   ├── Managed Identity
│   └── Soft-delete enabled
│
└── Azure Monitor + Application Insights
    ├── Custom metrics
    ├── Distributed tracing
    ├── Cost tracking
    └── Alert rules
```

### Files Created

```
lib/ai/azure/
├── azure-openai.config.ts      # Configuration
├── azure-openai.types.ts       # Type definitions
└── azure-openai.service.ts     # Main service

infra/terraform/azure-ai/
├── main.tf                     # Infrastructure as code
├── deploy.sh                   # Deployment script
└── README.md                   # Documentation

.env.azure.example              # Environment template
```

## Deployment Steps

### Step 1: Authenticate with Azure

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Verify
az account show
```

### Step 2: Deploy Infrastructure

```bash
# Navigate to Terraform directory
cd infra/terraform/azure-ai

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
1. ✅ Initialize Terraform
2. ✅ Validate configuration
3. ✅ Create deployment plan
4. ✅ Prompt for confirmation
5. ✅ Deploy all resources (~10-15 minutes)
6. ✅ Save outputs to `.env.azure`

### Step 3: Configure Environment

```bash
# Copy Azure configuration to main .env
cat .env.azure >> .env

# Retrieve API keys from Key Vault
az keyvault secret show \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key \
  --query value -o tsv

# Update .env with actual API key
# AZURE_OPENAI_API_KEY=<paste-key-here>
```

### Step 4: Verify Deployment

```bash
# Test Azure OpenAI endpoint
curl -X POST "https://huntaze-ai-westeurope.openai.azure.com/openai/deployments/gpt-4-turbo-prod/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello from Azure!"}],
    "max_tokens": 50
  }'

# Expected response:
# {
#   "choices": [{
#     "message": {
#       "role": "assistant",
#       "content": "Hello! How can I help you today?"
#     }
#   }]
# }
```

### Step 5: Install Dependencies

```bash
# Install Azure SDK packages
npm install --legacy-peer-deps

# Verify installation
npm list @azure/openai @azure/identity @azure/search-documents
```

## Configuration Reference

### Environment Variables

```bash
# Azure OpenAI Service
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-westeurope.openai.azure.com/
AZURE_OPENAI_API_KEY=REDACTED-api-key-from-keyvault
AZURE_USE_MANAGED_IDENTITY=false  # Set to true in production

# Model Deployments
AZURE_OPENAI_DEPLOYMENT_PREMIUM=gpt-4-turbo-prod
AZURE_OPENAI_DEPLOYMENT_STANDARD=gpt-4-standard-prod
AZURE_OPENAI_DEPLOYMENT_ECONOMY=gpt-35-turbo-prod
AZURE_OPENAI_DEPLOYMENT_VISION=gpt-4-vision-prod
AZURE_OPENAI_DEPLOYMENT_EMBEDDING=text-embedding-ada-002-prod

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://huntaze-ai-production-search.search.windows.net
AZURE_SEARCH_API_KEY=REDACTED-search-api-key
AZURE_SEARCH_INDEX_NAME=huntaze-memory-index

# Azure Application Insights
AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...
AZURE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=REDACTED-instrumentation-key

# Azure Key Vault
AZURE_KEY_VAULT_URI=https://huntaze-ai-production-kv.vault.azure.net/

# Regions
AZURE_PRIMARY_REGION=westeurope
AZURE_SECONDARY_REGION=northeurope

# Feature Flags (for gradual rollout)
ENABLE_AZURE_AI=false
AZURE_AI_ROLLOUT_PERCENTAGE=0
```

## Usage Examples

### Basic Text Generation

```typescript
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';

const service = new AzureOpenAIService('gpt-4-turbo-prod');

const response = await service.generateText(
  'Write a creative caption for an OnlyFans post',
  {
    temperature: 0.7,
    maxTokens: 100,
  }
);

console.log(response.text);
console.log(`Cost: $${response.usage.totalTokens * 0.00001}`);
```

### Streaming Responses

```typescript
const service = new AzureOpenAIService('gpt-4-turbo-prod');

for await (const chunk of service.generateTextStream('Tell me a story')) {
  process.stdout.write(chunk.content);
}
```

### Multimodal (Text + Image)

```typescript
const service = new AzureOpenAIService();

const response = await service.generateFromMultimodal([
  { type: 'text', text: 'Describe this image' },
  { type: 'image_url', image_url: { url: 'https://...' } }
]);
```

## Monitoring & Alerts

### Application Insights Queries

```kusto
// Average latency by model
customMetrics
| where name == "azure_openai_latency"
| summarize avg(value) by tostring(customDimensions.model)

// Total cost by hour
customMetrics
| where name == "azure_openai_cost"
| summarize sum(value) by bin(timestamp, 1h)

// Error rate
requests
| where name startswith "Azure OpenAI"
| summarize errorRate = 100.0 * countif(success == false) / count()
```

### Alert Rules

The deployment includes these alerts:

1. **Cost Alerts**
   - 80% of monthly budget
   - 90% of monthly budget
   - 100% of monthly budget

2. **Performance Alerts**
   - P95 latency > 2 seconds
   - Error rate > 5%
   - Circuit breaker opened

3. **Availability Alerts**
   - Service health degradation
   - Regional failover triggered

## Cost Management

### Current Monthly Costs

| Resource | Cost |
|----------|------|
| GPT-4 Turbo (100 PTU) | $3,000 |
| GPT-4 (50 PTU) | $1,500 |
| GPT-3.5 Turbo (100 PTU) | $300 |
| GPT-4 Vision (30 PTU) | $900 |
| Embeddings (50 PTU) | $150 |
| Cognitive Search | $750 |
| Application Insights | $230 |
| Key Vault | $25 |
| **Total** | **$6,855/month** |

### Cost Optimization Tips

1. **Use Reserved Capacity**
   - Save 30-50% with 1-year commitment
   - Recommended for production

2. **Optimize Model Selection**
   - Use GPT-3.5 Turbo for simple tasks
   - Reserve GPT-4 Turbo for complex operations

3. **Implement Caching**
   - Cache frequent queries
   - Reduce redundant API calls

4. **Monitor Usage**
   - Set up budget alerts
   - Review cost reports weekly

## Security Best Practices

### Production Checklist

- [ ] Enable Managed Identity authentication
- [ ] Configure Private Endpoints
- [ ] Set up Virtual Network integration
- [ ] Enable Azure Firewall
- [ ] Configure DDoS Protection
- [ ] Implement PII redaction
- [ ] Enable audit logging
- [ ] Set up RBAC policies
- [ ] Configure Key Vault access policies
- [ ] Enable soft-delete and purge protection

### RBAC Roles

Assign these roles for production:

```bash
# Cognitive Services User (for API access)
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY \
  --role "Cognitive Services User" \
  --scope /subscriptions/.../resourceGroups/huntaze-ai-production-rg

# Search Index Data Reader (for vector search)
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY \
  --role "Search Index Data Reader" \
  --scope /subscriptions/.../resourceGroups/huntaze-ai-production-rg

# Key Vault Secrets User (for secrets)
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/.../resourceGroups/huntaze-ai-production-rg
```

## Troubleshooting

### Common Issues

#### 1. Deployment Quota Exceeded

```bash
# Check current quota
az cognitiveservices account quota show \
  --resource-group huntaze-ai-production-rg \
  --name huntaze-ai-production-openai-primary

# Request quota increase
# Go to Azure Portal > Support > New Support Request
```

#### 2. Authentication Errors

```bash
# Verify API key
az keyvault secret show \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key

# Test authentication
curl -H "api-key: YOUR_KEY" \
  "https://huntaze-ai-westeurope.openai.azure.com/openai/models?api-version=2024-02-15-preview"
```

#### 3. Rate Limiting

- Check provisioned throughput utilization
- Consider increasing PTU capacity
- Implement request queuing

#### 4. High Latency

- Check regional proximity
- Verify network connectivity
- Review Application Insights traces

## Next Steps

### Phase 2: Core LLM Router Migration

Now that infrastructure is ready, proceed to:

1. **Task 5**: Create Azure OpenAI client wrapper
2. **Task 6**: Implement Azure OpenAI LLM Router
3. **Task 7**: Implement fallback chain with circuit breakers
4. **Task 8**: Implement cost tracking
5. **Task 9**: Checkpoint - Ensure all tests pass

### Gradual Rollout Strategy

1. **Week 1**: Deploy to staging, test thoroughly
2. **Week 2**: Enable for 10% of production traffic
3. **Week 3**: Increase to 50% if metrics are good
4. **Week 4**: Full rollout to 100%

## Support Resources

- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure Cognitive Search Documentation](https://learn.microsoft.com/en-us/azure/search/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)

## Rollback Plan

If issues occur, rollback is simple:

```bash
# Set feature flag to disable Azure AI
ENABLE_AZURE_AI=false

# System will automatically use OpenAI/Anthropic providers
# No data loss, instant rollback
```

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Core LLM Router Migration  
**Estimated Time**: 4-6 hours
