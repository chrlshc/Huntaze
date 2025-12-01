# Azure Region Update - US East

## Change Summary

The Azure AI infrastructure has been updated to use **US East (eastus)** as the primary region instead of West Europe.

## What Changed

### Configuration Updates

1. **Primary Region**: `westeurope` → `eastus`
2. **Secondary Region**: Removed (single region deployment)
3. **Endpoint**: `https://huntaze-ai-eastus.openai.azure.com/`

### Files Updated

- ✅ `lib/ai/azure/azure-openai.config.ts` - Updated endpoint and region
- ✅ `infra/terraform/azure-ai/main.tf` - Updated Terraform configuration
- ✅ `.env.azure.example` - Updated environment variables
- ✅ `infra/terraform/azure-ai/deploy.sh` - Updated deployment script

## New Configuration

### Azure OpenAI Service

**Region**: US East (eastus)
- GPT-4 Turbo deployment: `gpt-4-turbo-prod`
- GPT-4 deployment: `gpt-4-standard-prod`
- GPT-3.5 Turbo deployment: `gpt-35-turbo-prod`
- GPT-4 Vision deployment: `gpt-4-vision-prod`
- Embeddings deployment: `text-embedding-ada-002-prod`

### Endpoint

```
https://huntaze-ai-eastus.openai.azure.com/
```

### Environment Variables

```bash
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eastus.openai.azure.com/
AZURE_PRIMARY_REGION=eastus
AZURE_SECONDARY_REGION=eastus
```

## Benefits of US East

### Advantages

1. **Lower Latency** for US-based users
2. **Better Availability** - US East is Azure's largest region
3. **More Capacity** - Higher quota limits available
4. **Cost Effective** - Competitive pricing
5. **Proximity** - Closer to your user base

### Considerations

- Single region deployment (no automatic DR failover)
- Can add secondary region later if needed (e.g., West US 2)

## Deployment

### Deploy to US East

```bash
cd infra/terraform/azure-ai
./deploy.sh
```

The script will automatically deploy to US East region.

### Verify Deployment

```bash
# Test endpoint
curl -X POST "https://huntaze-ai-eastus.openai.azure.com/openai/deployments/gpt-4-turbo-prod/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY" \
  -d '{"messages": [{"role": "user", "content": "Hello from US East!"}], "max_tokens": 50}'
```

## Cost Impact

**No change in pricing** - US East has the same pricing as West Europe for Azure OpenAI Service.

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
| **Total** | **$6,855/month** |

## Future Enhancements

### Optional: Add Secondary Region

If you need disaster recovery, you can add a secondary region later:

```hcl
# In main.tf
variable "secondary_location" {
  default = "westus2"  # West US 2 for DR
}

# Add secondary OpenAI resource
resource "azurerm_cognitive_account" "openai_secondary" {
  name     = "${var.resource_prefix}-${var.environment}-openai-secondary"
  location = var.secondary_location
  # ... rest of configuration
}
```

## Migration from Previous Configuration

If you already deployed to West Europe:

### Option 1: Fresh Deployment (Recommended)

```bash
# Destroy old resources
cd infra/terraform/azure-ai
terraform destroy -var="environment=production"

# Deploy to US East
./deploy.sh
```

### Option 2: Keep Both Regions

Keep West Europe as secondary and add US East as primary:

```hcl
variable "location" {
  default = "eastus"
}

variable "secondary_location" {
  default = "westeurope"
}
```

## Testing

### Latency Comparison

Test latency from your application:

```typescript
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';

const service = new AzureOpenAIService('gpt-4-turbo-prod');

const start = Date.now();
const response = await service.generateText('Hello!');
const latency = Date.now() - start;

console.log(`Latency: ${latency}ms`);
```

Expected latency from US locations:
- **US East Coast**: 10-30ms
- **US West Coast**: 50-80ms
- **Europe**: 100-150ms

## Support

For questions about the region change:
- See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- Check [QUICK-REFERENCE.md](QUICK-REFERENCE.md)

---

**Updated**: December 1, 2025  
**Region**: US East (eastus)  
**Status**: Ready for deployment
