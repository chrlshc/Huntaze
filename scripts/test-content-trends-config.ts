#!/usr/bin/env npx ts-node
/**
 * Test Content Trends AI Engine Configuration
 * 
 * Run: npx ts-node scripts/test-content-trends-config.ts
 * 
 * Checks:
 * 1. Environment variables are set
 * 2. Endpoints are reachable
 * 3. API key is valid
 */

import { validateEndpointConfiguration, getContentTrendsAIConfig } from '../lib/ai/content-trends/azure-foundry-config';

async function main() {
  console.log('🔍 Content Trends AI Engine - Configuration Check\n');
  console.log('='.repeat(60));

  // Check configuration
  const config = getContentTrendsAIConfig();
  const validation = validateEndpointConfiguration();

  console.log('\n📋 Model Endpoints:\n');
  
  for (const [modelId, endpoint] of Object.entries(config.models)) {
    const status = endpoint.endpoint ? '✅' : '❌';
    console.log(`${status} ${modelId}`);
    console.log(`   Endpoint: ${endpoint.endpoint || 'NOT CONFIGURED'}`);
    console.log(`   Deployment: ${endpoint.deploymentName}`);
    console.log(`   Pricing: $${endpoint.pricing.inputPerMillion}/1M in, $${endpoint.pricing.outputPerMillion}/1M out`);
    console.log('');
  }

  console.log('🔐 Authentication:\n');
  console.log(`   Managed Identity: ${config.auth.useManagedIdentity ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   API Key: ${config.auth.apiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Tenant ID: ${config.auth.tenantId || 'Not set'}`);

  console.log('\n🌍 Regional Configuration:\n');
  console.log(`   Primary Region: ${config.regional.primaryRegion}`);
  console.log(`   Failover Regions: ${config.regional.failoverRegions.join(', ')}`);

  console.log('\n⚡ Rate Limits:\n');
  console.log(`   Requests/min: ${config.rateLimits.requestsPerMinute}`);
  console.log(`   Tokens/min: ${config.rateLimits.tokensPerMinute}`);

  console.log('\n' + '='.repeat(60));
  
  if (validation.valid) {
    console.log('\n✅ Configuration is VALID - Ready to use!\n');
    console.log('Next steps:');
    console.log('1. Test the API: curl http://localhost:3000/api/ai/content-trends/analyze');
    console.log('2. Send a test request with frameUrls');
  } else {
    console.log('\n❌ Configuration ERRORS:\n');
    validation.errors.forEach(err => console.log(`   - ${err}`));
    console.log('\n📝 To fix, add these to .env.local:\n');
    console.log('AZURE_DEEPSEEK_R1_ENDPOINT=https://your-r1-endpoint.eastus2.models.ai.azure.com');
    console.log('AZURE_DEEPSEEK_V3_ENDPOINT=https://your-v3-endpoint.eastus2.models.ai.azure.com');
    console.log('AZURE_LLAMA_VISION_ENDPOINT=https://your-vision-endpoint.eastus2.models.ai.azure.com');
    console.log('AZURE_AI_API_KEY=REDACTED-api-key');
  }

  console.log('');
}

main().catch(console.error);
