# Azure OpenAI Service Integration

This directory contains the Azure OpenAI Service integration for the Huntaze AI migration.

## Overview

The Azure OpenAI Service provides enterprise-grade AI capabilities with:
- 99.9% SLA uptime guarantee
- GDPR-compliant data residency in Europe
- Managed Identity for passwordless authentication
- Provisioned throughput for predictable costs
- Regional failover for disaster recovery

## Architecture

```
Application Layer
       ↓
AzureOpenAIService
       ↓
Azure OpenAI SDK
       ↓
Azure OpenAI Service (West Europe)
       ↓
Fallback: Azure OpenAI Service (North Europe)
```

## Files

- **azure-openai.config.ts** - Configuration and deployment settings
- **azure-openai.types.ts** - TypeScript type definitions
- **azure-openai.service.ts** - Main service implementation

## Quick Start

### 1. Install Dependencies

```bash
npm install @azure/openai @azure/identity --legacy-peer-deps
```

### 2. Configure Environment

```bash
# Copy example configuration
cp .env.azure.example .env.azure

# Update with your values
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
```

### 3. Basic Usage

```typescript
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';

// Initialize service
const service = new AzureOpenAIService('gpt-4-turbo-prod');

// Generate text
const response = await service.generateText('Hello, Azure!');
console.log(response.text);
```

## Usage Examples

### Text Generation

```typescript
const service = new AzureOpenAIService('gpt-4-turbo-prod');

const response = await service.generateText(
  'Write a creative caption for a social media post',
  {
    temperature: 0.7,
    maxTokens: 100,
  }
);

console.log(response.text);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

### Chat Conversation

```typescript
const service = new AzureOpenAIService('gpt-4-standard-prod');

const response = await service.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' },
], {
  temperature: 0.3,
  maxTokens: 50,
});

console.log(response.text);
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
  { type: 'text', text: 'Describe this image in detail' },
  { 
    type: 'image_url', 
    image_url: { 
      url: 'https://example.com/image.jpg',
      detail: 'high'
    } 
  }
], {
  maxTokens: 300,
});

console.log(response.text);
```

### JSON Mode (Structured Output)

```typescript
const service = new AzureOpenAIService('gpt-4-turbo-prod');

const response = await service.generateText(
  'Generate a JSON object with name, age, and city fields',
  {
    responseFormat: { type: 'json_object' },
    temperature: 0.1,
  }
);

const data = JSON.parse(response.text);
console.log(data);
```

## Configuration

### Deployments

The service supports multiple model deployments:

| Deployment | Model | Use Case | Cost |
|------------|-------|----------|------|
| `gpt-4-turbo-prod` | GPT-4 Turbo | Premium tier, complex tasks | $0.01/1K input |
| `gpt-4-standard-prod` | GPT-4 | Standard tier, general use | $0.03/1K input |
| `gpt-35-turbo-prod` | GPT-3.5 Turbo | Economy tier, simple tasks | $0.0005/1K input |
| `gpt-4-vision-prod` | GPT-4 Vision | Multimodal (text + image) | $0.01/1K input |
| `text-embedding-ada-002-prod` | Ada-002 | Embeddings for search | $0.0001/1K tokens |

### Authentication

#### Development (API Key)

```typescript
// Set in .env
AZURE_OPENAI_API_KEY=your-api-key
AZURE_USE_MANAGED_IDENTITY=false
```

#### Production (Managed Identity)

```typescript
// Set in .env
AZURE_USE_MANAGED_IDENTITY=true

// No API key needed - uses Azure Managed Identity
```

### Retry Configuration

```typescript
// In azure-openai.config.ts
retryConfig: {
  maxAttempts: 3,
  initialDelay: 1000,      // 1 second
  maxDelay: 10000,         // 10 seconds
  backoffFactor: 2,        // Exponential backoff
}
```

## Error Handling

The service provides detailed error classification:

```typescript
import { AzureOpenAIError, AzureOpenAIErrorCode } from './azure-openai.types';

try {
  const response = await service.generateText('Hello');
} catch (error) {
  if (error instanceof AzureOpenAIError) {
    switch (error.code) {
      case AzureOpenAIErrorCode.RATE_LIMIT_EXCEEDED:
        // Implement backoff and retry
        break;
      case AzureOpenAIErrorCode.QUOTA_EXCEEDED:
        // Alert operations team
        break;
      case AzureOpenAIErrorCode.CONTENT_FILTER:
        // Handle content policy violation
        break;
      case AzureOpenAIErrorCode.AUTHENTICATION_ERROR:
        // Check credentials
        break;
      default:
        // Handle unknown error
    }
  }
}
```

## Cost Tracking

Track token usage and costs:

```typescript
const response = await service.generateText('Hello');

const inputCost = response.usage.promptTokens * 0.00001;
const outputCost = response.usage.completionTokens * 0.00003;
const totalCost = inputCost + outputCost;

console.log(`Cost: $${totalCost.toFixed(6)}`);
```

## Performance

### Latency Targets

- P50: < 500ms
- P95: < 2000ms
- P99: < 5000ms

### Throughput

With provisioned throughput:
- GPT-4 Turbo: 100 PTU = ~10 requests/second
- GPT-4: 50 PTU = ~5 requests/second
- GPT-3.5 Turbo: 100 PTU = ~20 requests/second

## Monitoring

### Application Insights

The service automatically emits metrics to Application Insights:

```typescript
// Metrics emitted:
// - azure_openai_latency
// - azure_openai_tokens_input
// - azure_openai_tokens_output
// - azure_openai_cost
// - azure_openai_errors
```

### Custom Metrics

```typescript
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

const appInsights = new ApplicationInsights({
  connectionString: process.env.AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING,
});

appInsights.trackMetric({
  name: 'azure_openai_request',
  value: 1,
  properties: {
    model: 'gpt-4-turbo-prod',
    deployment: 'primary',
  },
});
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AzureOpenAIService } from './azure-openai.service';

describe('AzureOpenAIService', () => {
  it('should generate text', async () => {
    const service = new AzureOpenAIService('gpt-4-turbo-prod');
    const response = await service.generateText('Hello');
    
    expect(response.text).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration:azure
```

## Security

### Best Practices

1. **Use Managed Identity in production**
   ```typescript
   AZURE_USE_MANAGED_IDENTITY=true
   ```

2. **Store API keys in Key Vault**
   ```bash
   az keyvault secret set \
     --vault-name huntaze-ai-kv \
     --name azure-openai-key \
     --value "your-key"
   ```

3. **Enable Private Endpoints**
   - Restrict network access
   - Use Virtual Network integration

4. **Implement PII Redaction**
   - Redact sensitive data before logging
   - Use Azure's content filtering

5. **Enable Audit Logging**
   - Track all API calls
   - Maintain compliance records

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```bash
# Verify API key
az keyvault secret show \
  --vault-name huntaze-ai-production-kv \
  --name azure-openai-primary-key

# Test endpoint
curl -H "api-key: YOUR_KEY" \
  "https://your-resource.openai.azure.com/openai/models?api-version=2024-02-15-preview"
```

#### 2. Rate Limiting

```typescript
// Implement exponential backoff
const maxRetries = 3;
let delay = 1000;

for (let i = 0; i < maxRetries; i++) {
  try {
    return await service.generateText(prompt);
  } catch (error) {
    if (error.code === 'rate_limit_exceeded') {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    } else {
      throw error;
    }
  }
}
```

#### 3. High Latency

- Check regional proximity
- Verify provisioned throughput
- Review Application Insights traces

## Migration Guide

### From OpenAI to Azure OpenAI

```typescript
// Before (OpenAI)
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});

// After (Azure OpenAI)
import { AzureOpenAIService } from '@/lib/ai/azure/azure-openai.service';
const service = new AzureOpenAIService('gpt-4-standard-prod');
const response = await service.chat([
  { role: 'user', content: 'Hello' }
]);
```

## Support

- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Internal Wiki](https://wiki.huntaze.com/azure-ai)

## License

Internal use only - Huntaze Platform
