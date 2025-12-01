# Azure AI Migration - Quick Reference

## 🚀 Quick Start Commands

### Deploy Infrastructure

```bash
# Navigate to Terraform directory
cd infra/terraform/azure-ai

# Deploy all Azure resources
./deploy.sh

# Follow prompts and wait ~10-15 minutes
```

### Configure Environment

```bash
# Copy Azure configuration
cat .env.azure >> .env

# Get API key from Key Vault
az keyvault secret show \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key \
  --query value -o tsv
```

### Test Deployment

```bash
# Test Azure OpenAI endpoint
curl -X POST "https://huntaze-ai-westeurope.openai.azure.com/openai/deployments/gpt-4-turbo-prod/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}], "max_tokens": 50}'
```

## 📝 Code Examples

### Basic Usage

```typescript
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';

const service = new AzureOpenAIService('gpt-4-turbo-prod');
const response = await service.generateText('Hello, Azure!');
console.log(response.text);
```

### Streaming

```typescript
for await (const chunk of service.generateTextStream('Tell me a story')) {
  process.stdout.write(chunk.content);
}
```

### Multimodal

```typescript
const response = await service.generateFromMultimodal([
  { type: 'text', text: 'Describe this image' },
  { type: 'image_url', image_url: { url: 'https://...' } }
]);
```

## 🔧 Azure CLI Commands

### Check Deployments

```bash
# List all deployments
az cognitiveservices account deployment list \
  --resource-group huntaze-ai-production-rg \
  --name huntaze-ai-production-openai-primary

# Check quota
az cognitiveservices account quota show \
  --resource-group huntaze-ai-production-rg \
  --name huntaze-ai-production-openai-primary
```

### Monitor Costs

```bash
# Get current month costs
az consumption usage list \
  --start-date $(date -u -d "1 month ago" '+%Y-%m-%d') \
  --end-date $(date -u '+%Y-%m-%d') \
  --query "[?contains(instanceName, 'huntaze-ai')]"
```

### Manage Secrets

```bash
# Get secret
az keyvault secret show \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key

# Set secret
az keyvault secret set \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key \
  --value "new-key-value"
```

## 📊 Application Insights Queries

### Average Latency

```kusto
customMetrics
| where name == "azure_openai_latency"
| summarize avg(value), percentile(value, 95) by bin(timestamp, 5m)
```

### Cost Tracking

```kusto
customMetrics
| where name == "azure_openai_cost"
| summarize sum(value) by bin(timestamp, 1h), tostring(customDimensions.model)
```

### Error Rate

```kusto
requests
| where name startswith "Azure OpenAI"
| summarize errorRate = 100.0 * countif(success == false) / count() by bin(timestamp, 5m)
```

## 🔐 Security Commands

### Assign RBAC Roles

```bash
# Cognitive Services User
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY \
  --role "Cognitive Services User" \
  --scope /subscriptions/SUB_ID/resourceGroups/huntaze-ai-production-rg

# Key Vault Secrets User
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/SUB_ID/resourceGroups/huntaze-ai-production-rg
```

## 💰 Cost Reference

| Resource | Monthly Cost |
|----------|--------------|
| GPT-4 Turbo (100 PTU) | $3,000 |
| GPT-4 (50 PTU) | $1,500 |
| GPT-3.5 Turbo (100 PTU) | $300 |
| GPT-4 Vision (30 PTU) | $900 |
| Embeddings (50 PTU) | $150 |
| Cognitive Search | $750 |
| Application Insights | $230 |
| Key Vault | $25 |
| **Total** | **$6,855** |

## 🔄 Rollback Commands

```bash
# Disable Azure AI
echo "ENABLE_AZURE_AI=false" >> .env

# Restart application
npm run build && npm start

# System automatically uses OpenAI/Anthropic
```

## 📈 Monitoring Dashboards

### Application Insights

```
https://portal.azure.com/#@YOUR_TENANT/resource/subscriptions/YOUR_SUB/resourceGroups/huntaze-ai-production-rg/providers/microsoft.insights/components/huntaze-ai-production-insights/overview
```

### Cost Management

```
https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis
```

## 🆘 Troubleshooting

### Authentication Error

```bash
# Verify API key
az keyvault secret show \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key

# Test authentication
curl -H "api-key: YOUR_KEY" \
  "https://huntaze-ai-westeurope.openai.azure.com/openai/models?api-version=2024-02-15-preview"
```

### Rate Limiting

```typescript
// Implement exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (let i = 0; i < 3; i++) {
  try {
    return await service.generateText(prompt);
  } catch (error) {
    if (error.code === 'rate_limit_exceeded') {
      await delay(1000 * Math.pow(2, i));
    } else {
      throw error;
    }
  }
}
```

### High Latency

```bash
# Check Application Insights
az monitor app-insights metrics show \
  --app huntaze-ai-production-insights \
  --resource-group huntaze-ai-production-rg \
  --metric requests/duration \
  --aggregation avg
```

## 📚 Documentation Links

- [Phase 1 Complete Report](.kiro/specs/huntaze-ai-azure-migration/PHASE-1-COMPLETE.md)
- [Deployment Guide](.kiro/specs/huntaze-ai-azure-migration/DEPLOYMENT-GUIDE.md)
- [Service README](lib/ai/azure/README.md)
- [Infrastructure README](infra/terraform/azure-ai/README.md)

## 🎯 Next Steps

1. Deploy infrastructure: `cd infra/terraform/azure-ai && ./deploy.sh`
2. Configure environment: `cat .env.azure >> .env`
3. Test endpoints: See "Test Deployment" above
4. Proceed to Phase 2: Core LLM Router Migration

---

**Status**: Phase 1 Complete ✅  
**Ready for**: Phase 2 Implementation
