#!/usr/bin/env node

/**
 * Script pour trouver le bon nom de déploiement Azure OpenAI
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

console.log('🔍 Recherche du déploiement Azure OpenAI...\n');

// Noms de déploiement courants à tester
const commonDeployments = [
  'gpt-4-turbo',
  'gpt-4',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-35-turbo',
  'gpt-3.5-turbo',
  'huntaze-gpt4',
  'huntaze-gpt4-turbo',
  'default',
];

async function testDeployment(deploymentName) {
  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'test' }
        ],
        max_tokens: 5,
      }),
    });
    
    if (response.ok) {
      return { success: true, deploymentName };
    } else {
      const error = await response.json();
      return { success: false, deploymentName, error: error.error?.code };
    }
  } catch (error) {
    return { success: false, deploymentName, error: error.message };
  }
}

console.log('Test des déploiements courants...\n');

for (const deployment of commonDeployments) {
  process.stdout.write(`Testing ${deployment}... `);
  const result = await testDeployment(deployment);
  
  if (result.success) {
    console.log('✅ TROUVÉ !');
    console.log(`\n🎉 Déploiement trouvé : ${deployment}`);
    console.log(`\nMettez à jour votre .env :`);
    console.log(`AZURE_OPENAI_DEPLOYMENT=${deployment}`);
    console.log(`DEFAULT_AI_MODEL=${deployment}`);
    process.exit(0);
  } else {
    console.log(`❌ ${result.error || 'Not found'}`);
  }
}

console.log('\n❌ Aucun déploiement trouvé parmi les noms courants.');
console.log('\n💡 Solutions :');
console.log('1. Vérifiez le nom exact dans Azure Portal :');
console.log('   → Votre ressource → Model deployments → Manage Deployments');
console.log('2. Créez un nouveau déploiement dans Azure Portal');
console.log('3. Utilisez OpenAI standard comme alternative');
