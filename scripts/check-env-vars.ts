#!/usr/bin/env ts-node

/**
 * Environment Variables Checker
 * 
 * Checks which environment variables are set locally
 * to help debug staging issues
 */

console.log('🔍 Checking Environment Variables\n');
console.log('=' .repeat(60));

const requiredVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

const optionalVars = [
  'REDIS_URL',
  'REDIS_TLS',
  'SES_FROM_EMAIL',
  'ENCRYPTION_KEY',
  'DATA_ENCRYPTION_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'NODE_ENV',
];

console.log('\n📋 Required Variables:\n');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value 
    ? `${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`
    : 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\n📋 Optional Variables:\n');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️ ';
  const display = value 
    ? `${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`
    : 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\n' + '='.repeat(60));

const missingRequired = requiredVars.filter(v => !process.env[v]);
if (missingRequired.length > 0) {
  console.log('\n❌ Missing required variables:');
  missingRequired.forEach(v => console.log(`   - ${v}`));
  console.log('\n⚠️  These must be set in Amplify Console for staging to work!');
} else {
  console.log('\n✅ All required variables are set locally!');
  console.log('   Make sure they are also set in Amplify Console.');
}

console.log('\n💡 To check Amplify variables:');
console.log('   1. Go to: https://console.aws.amazon.com/amplify/');
console.log('   2. Select: Huntaze app');
console.log('   3. Click: Environment variables');
console.log('   4. Verify all required variables are present');
