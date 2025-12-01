# Azure AI Infrastructure

This directory contains Terraform configuration for deploying Azure OpenAI Service and related resources for the Huntaze AI migration.

## Architecture

The infrastructure includes:

- **Azure OpenAI Service** (Primary & Secondary regions)
  - GPT-4 Turbo deployment (premium tier)
  - GPT-4 deployment (standard tier)
  - GPT-3.5 Turbo deployment (economy tier)
  - GPT-4 Vision deployment (multimodal)
  - Text-embedding-ada-002 deployment (embeddings)

- **Azure Cognitive Search**
  - Vector search capabilities
  - Hybrid search (vector + keyword)
  - Auto-scaling (3-12 replicas)

- **Azure Key Vault**
  - Secrets management
  - API key storage
  - Customer-managed keys (CMK)

- **Azure Monitor & Application Insights**
  - Distributed tracing
  - Custom metrics
  - Cost tracking
  - Performance monitoring

## Prerequisites

1. **Azure CLI** - [Install](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
   ```bash
   az --version
   ```

2. **Terraform** - [Install](https://www.terraform.io/downloads)
   ```bash
   terraform --version
   ```

3. **Azure Subscription** with permissions to create:
   - Cognitive Services
   - Search Services
   - Key Vault
   - Log Analytics
   - Application Insights

## Deployment

### 1. Login to Azure

```bash
az login
az account set --subscription "Your Subscription Name"
```

### 2. Deploy Infrastructure

```bash
cd infra/terraform/azure-ai
./deploy.sh
```

The script will:
- Initialize Terraform
- Validate configuration
- Create deployment plan
- Apply infrastructure changes
- Save outputs to `.env.azure`

### 3. Verify Deployment

```bash
# Check Azure OpenAI deployments
az cognitiveservices account deployment list \
  --resource-group huntaze-ai-production-rg \
  --name huntaze-ai-production-openai-primary

# Check Cognitive Search service
az search service show \
  --resource-group huntaze-ai-production-rg \
  --name huntaze-ai-production-search

# Test OpenAI endpoint
curl -X POST "https://huntaze-ai-westeurope.openai.azure.com/openai/deployments/gpt-4-turbo-prod/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }'
```

## Configuration

### Environment Variables

After deployment, update your `.env` file with values from `.env.azure`:

```bash
# Copy Azure configuration
cat .env.azure >> .env
```

### Managed Identity (Production)

For production, enable Managed Identity authentication:

1. Assign Managed Identity to your application (App Service, Container Apps, etc.)
2. Grant permissions to Azure OpenAI and Cognitive Search
3. Set `AZURE_USE_MANAGED_IDENTITY=true`

```bash
# Grant Cognitive Services User role
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY_PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/huntaze-ai-production-rg/providers/Microsoft.CognitiveServices/accounts/huntaze-ai-production-openai-primary
```

## Cost Optimization

### Provisioned Throughput

The deployments use provisioned throughput units (PTU) for predictable costs:

- GPT-4 Turbo: 100 PTU (~$3,000/month)
- GPT-4: 50 PTU (~$1,500/month)
- GPT-3.5 Turbo: 100 PTU (~$300/month)

### Reserved Capacity

For production, consider purchasing reserved capacity for 30-50% savings:

```bash
az cognitiveservices account commitment-plan create \
  --resource-group huntaze-ai-production-rg \
  --account-name huntaze-ai-production-openai-primary \
  --commitment-plan-name "1-year-reserved" \
  --commitment-period "P1Y"
```

## Monitoring

### Application Insights Queries

```kusto
// AI request latency
customMetrics
| where name == "azure_openai_latency"
| summarize avg(value), percentile(value, 95) by bin(timestamp, 5m)

// AI cost tracking
customMetrics
| where name == "azure_openai_cost"
| summarize sum(value) by bin(timestamp, 1h), tostring(customDimensions.model)

// Error rate
requests
| where name startswith "Azure OpenAI"
| summarize errorRate = 100.0 * countif(success == false) / count() by bin(timestamp, 5m)
```

### Alerts

The deployment includes alerts for:
- Cost thresholds (80%, 90%, 100% of budget)
- Latency SLA violations (>2s p95)
- Error rate spikes (>5%)
- Circuit breaker state changes

## Disaster Recovery

### Regional Failover

The infrastructure includes a secondary deployment in North Europe:

```typescript
// Automatic failover in code
const primaryEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const secondaryEndpoint = process.env.AZURE_OPENAI_SECONDARY_ENDPOINT;

// Health check and failover logic in AzureOpenAIRouter
```

### Backup & Restore

- **Cognitive Search**: Automatic backups, 30-day retention
- **Key Vault**: Soft-delete enabled, 90-day retention
- **Application Insights**: 90-day data retention

## Security

### Network Security

For production, enable private endpoints:

```hcl
# In main.tf, update network_acls
network_acls {
  default_action = "Deny"
  ip_rules       = ["YOUR_OFFICE_IP"]
  virtual_network_subnet_ids = [azurerm_subnet.ai.id]
}
```

### RBAC Permissions

Minimum required roles:
- **Cognitive Services User**: For API access
- **Search Index Data Reader**: For vector search
- **Key Vault Secrets User**: For secret access
- **Monitoring Metrics Publisher**: For custom metrics

## Troubleshooting

### Common Issues

1. **Deployment quota exceeded**
   ```bash
   # Request quota increase
   az cognitiveservices account quota show \
     --resource-group huntaze-ai-production-rg \
     --name huntaze-ai-production-openai-primary
   ```

2. **Authentication errors**
   ```bash
   # Verify API key
   az keyvault secret show \
     --vault-name huntaze-ai-production-kv \
     --name azure-openai-primary-key
   ```

3. **Rate limiting**
   - Check provisioned throughput utilization
   - Consider increasing PTU capacity
   - Implement request queuing

## Cleanup

To destroy all resources:

```bash
cd infra/terraform/azure-ai
terraform destroy -var="environment=production"
```

⚠️ **Warning**: This will permanently delete all Azure resources and data.

## Support

- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure Cognitive Search Documentation](https://learn.microsoft.com/en-us/azure/search/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

## License

Internal use only - Huntaze Platform
