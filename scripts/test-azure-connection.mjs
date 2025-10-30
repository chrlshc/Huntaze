#!/usr/bin/env node

/**
 * Script de test de connexion Azure OpenAI
 * Vérifie que les variables d'environnement sont correctes
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Vérification de la configuration Azure OpenAI...\n');

// Vérifier les variables requises
const requiredVars = [
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_VERSION',
  'AZURE_OPENAI_DEPLOYMENT',
];

let allPresent = true;

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'AZURE_OPENAI_API_KEY' ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`❌ ${varName}: MANQUANT`);
    allPresent = false;
  }
}

console.log('\n📊 Configuration détectée:');
console.log(`   Provider: ${process.env.DEFAULT_AI_PROVIDER || 'openai'}`);
console.log(`   Model: ${process.env.DEFAULT_AI_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT}`);
console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);

if (!allPresent) {
  console.log('\n❌ Configuration incomplète. Vérifiez votre fichier .env');
  process.exit(1);
}

console.log('\n✅ Configuration complète !');
console.log('\n🚀 Prochaines étapes:');
console.log('   1. Testez avec: npm test tests/unit/ai-service.test.ts');
console.log('   2. Lancez l\'app: npm run dev');
console.log('   3. Testez l\'endpoint: GET /api/ai/azure/smoke?force=1');

// Test de connexion basique (optionnel)
if (process.argv.includes('--test-connection')) {
  console.log('\n🔌 Test de connexion à Azure OpenAI...');
  
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from Huntaze!"' }
        ],
        max_tokens: 50,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connexion réussie !');
      console.log(`📝 Réponse: ${data.choices[0].message.content}`);
      console.log(`📊 Tokens utilisés: ${data.usage.total_tokens}`);
    } else {
      const error = await response.json();
      console.log('❌ Erreur de connexion:');
      console.log(JSON.stringify(error, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    process.exit(1);
  }
}
