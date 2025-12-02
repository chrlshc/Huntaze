# Azure AI Developer Setup Guide

## Prerequisites

- Node.js 18+ installed
- Azure subscription with OpenAI access
- Azure CLI installed (`brew install azure-cli`)
- Access to Huntaze Azure resources

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/huntaze/huntaze-platform.git
cd huntaze-platform
npm install
```

### 2. Azure CLI Login

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Huntaze-Production"

# Verify access
az account show
```

### 3. Environment Configuration

Copy the Azure environment template:

```bash
cp .env.azure.example .env.local
```

Edit `.env.local` with your values:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-westeurope.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Deployment Names
AZURE_OPENAI_DEPLOYMENT_GPT4_TURBO=gpt-4-turbo-prod
AZURE_OPENAI_DEPLOYMENT_GPT4=gpt-4-standard-prod
AZURE_OPENAI_DEPLOYMENT_GPT35=gpt-35-turbo-prod
AZURE_OPENAI_DEPLOYMENT_EMBEDDING=text-embedding-ada-002

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://huntaze-search.search.windows.net
AZURE_SEARCH_API_KEY=your-search-key
AZURE_SEARCH_INDEX_NAME=huntaze-memory-index

# Azure Key Vault (optional for local dev)
AZURE_KEY_VAULT_URL=https://huntaze-keyvault.vault.azure.net/

# Azure Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=xxx

# Feature Flags
AZURE_USE_MANAGED_IDENTITY=false  # Set true in production
AZURE_ENABLE_FALLBACK=true
AZURE_ENABLE_CIRCUIT_BREAKER=true
```

### 4. Get API Keys from Azure Portal

#### Azure OpenAI API Key

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "huntaze-ai-westeurope" resource
3. Click "Keys and Endpoint"
4. Copy Key 1 or Key 2

#### Azure Cognitive Search Key

1. Navigate to "huntaze-search" resource
2. Click "Keys"
3. Copy the Admin key

### 5. Verify Setup

```bash
# Run the verification script
npm run azure:verify

# Or test manually
npm run test:azure
```

## Local Development

### Running the Development Server

```bash
npm run dev
```

### Testing Azure Services

```bash
# Run all Azure tests
npm run test:azure

# Run specific test file
npm run test -- tests/unit/ai/azure-openai-router.test.ts

# Run property tests
npm run test -- tests/unit/ai/azure-router-tier-selection.property.test.ts
```

### Using the Azure AI Services

#### Basic Text Generation

```typescript
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';

const azure = new AzureOpenAIService();

// Simple generation
const response = await azure.generateText('Hello, how are you?', {
  temperature: 0.7,
  maxTokens: 100,
});

console.log(response.text);
```

#### Using the LLM Router

```typescript
import { AzureOpenAIRouter } from '@/lib/ai/azure/azure-openai-router';

const router = new AzureOpenAIRouter();

// Route based on tier
const response = await router.route({
  prompt: 'Analyze this data...',
  tier: 'premium', // Uses GPT-4 Turbo
  accountId: 'user-123',
  plan: 'pro',
});
```

#### Streaming Responses

```typescript
const stream = azure.generateTextStream('Tell me a story', {
  maxTokens: 500,
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

#### Using AI Agents

```typescript
import { MessagingAgent } from '@/lib/ai/agents/messaging.azure';
import { AnalyticsAgent } from '@/lib/ai/agents/analytics.azure';

// Messaging AI
const messaging = new MessagingAgent();
const reply = await messaging.generateReply({
  fanMessage: 'Hey, love your content!',
  creatorProfile: { name: 'Creator', style: 'friendly' },
  context: [],
});

// Analytics AI
const analytics = new AnalyticsAgent();
const insights = await analytics.analyzePerformance({
  metrics: { views: 1000, likes: 100, revenue: 500 },
  period: '7d',
});
```

## Debugging

### Enable Debug Logging

```env
# In .env.local
DEBUG=azure:*
LOG_LEVEL=debug
```

### View Application Insights Logs

```bash
# Query recent logs
az monitor app-insights query \
  --app huntaze-insights \
  --analytics-query "traces | where timestamp > ago(1h) | order by timestamp desc | take 100"
```

### Circuit Breaker Status

```typescript
import { CircuitBreakerManager } from '@/lib/ai/azure/circuit-breaker';

const manager = CircuitBreakerManager.getInstance();
const status = manager.getStatus();

console.log(status);
// { gpt4turbo: 'closed', gpt4: 'closed', gpt35: 'closed' }
```

## Common Issues

### 1. Authentication Errors

**Error**: `AuthenticationError: Invalid API key`

**Solution**:
- Verify API key in `.env.local`
- Check key hasn't expired in Azure Portal
- Ensure correct endpoint URL

### 2. Rate Limiting

**Error**: `RateLimitError: Too many requests`

**Solution**:
- Check quota in Azure Portal
- Enable circuit breaker: `AZURE_ENABLE_CIRCUIT_BREAKER=true`
- Use fallback chain for overflow

### 3. Deployment Not Found

**Error**: `DeploymentNotFoundError: Deployment 'gpt-4-turbo-prod' not found`

**Solution**:
- Verify deployment name in Azure Portal
- Check deployment is in correct region
- Ensure deployment is active (not stopped)

### 4. Timeout Errors

**Error**: `TimeoutError: Request timed out after 30000ms`

**Solution**:
- Increase timeout: `AZURE_OPENAI_TIMEOUT=60000`
- Check Azure service status
- Try secondary region

## Testing Locally

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Requires Azure credentials
npm run test:integration:azure
```

### Property-Based Tests

```bash
# Run property tests (100+ iterations)
npm run test:property
```

## Useful Commands

```bash
# Check Azure resource status
az openai deployment list --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope

# View deployment quotas
az openai quota list --resource-group huntaze-ai-rg --resource-name huntaze-ai-westeurope

# Test connectivity
curl -X POST "https://huntaze-ai-westeurope.openai.azure.com/openai/deployments/gpt-4-turbo-prod/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## IDE Setup

### VS Code Extensions

- Azure Tools
- Azure Account
- REST Client (for testing APIs)

### Recommended Settings

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Next Steps

1. Read [Architecture Documentation](./ARCHITECTURE.md)
2. Review [Operational Runbooks](./RUNBOOKS.md)
3. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
