#!/usr/bin/env tsx
/**
 * Verify AI System Setup
 * 
 * Checks that all required environment variables and dependencies are configured
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, passMsg: string, failMsg: string, isWarning = false) {
  if (condition) {
    results.push({ name, status: 'pass', message: passMsg });
  } else {
    results.push({ name, status: isWarning ? 'warn' : 'fail', message: failMsg });
  }
}

console.log('🔍 Verifying AI System Setup...\n');

// Check 1: Environment variables
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);
check(
  'Environment File',
  envExists,
  '.env file exists',
  '.env file not found - copy .env.example to .env',
);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  check(
    'GEMINI_API_KEY',
    envContent.includes('GEMINI_API_KEY=') && !envContent.includes('GEMINI_API_KEY="your'),
    'GEMINI_API_KEY is configured',
    'GEMINI_API_KEY not set - get one from https://aistudio.google.com/app/apikey',
  );

  check(
    'UPSTASH_REDIS_REST_URL',
    envContent.includes('UPSTASH_REDIS_REST_URL=') && !envContent.includes('UPSTASH_REDIS_REST_URL="your'),
    'UPSTASH_REDIS_REST_URL is configured',
    'UPSTASH_REDIS_REST_URL not set - create a free Redis at https://console.upstash.com/',
    true, // Warning only
  );

  check(
    'UPSTASH_REDIS_REST_TOKEN',
    envContent.includes('UPSTASH_REDIS_REST_TOKEN=') && !envContent.includes('UPSTASH_REDIS_REST_TOKEN="your'),
    'UPSTASH_REDIS_REST_TOKEN is configured',
    'UPSTASH_REDIS_REST_TOKEN not set - get from Upstash console',
    true, // Warning only
  );
}

// Check 2: Dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  check(
    '@google/genai',
    !!packageJson.dependencies['@google/genai'],
    '@google/genai is installed',
    '@google/genai not found - run: npm install @google/genai --legacy-peer-deps',
  );

  check(
    '@upstash/ratelimit',
    !!packageJson.dependencies['@upstash/ratelimit'],
    '@upstash/ratelimit is installed',
    '@upstash/ratelimit not found - run: npm install @upstash/ratelimit',
  );

  check(
    '@upstash/redis',
    !!packageJson.dependencies['@upstash/redis'],
    '@upstash/redis is installed',
    '@upstash/redis not found - run: npm install @upstash/redis',
  );
} catch (error) {
  results.push({
    name: 'Dependencies',
    status: 'fail',
    message: 'Could not read package.json',
  });
}

// Check 3: Required files
const requiredFiles = [
  'lib/ai/gemini-client.ts',
  'lib/ai/gemini-billing.service.ts',
  'lib/ai/rate-limit.ts',
  'lib/ai/billing.ts',
  'lib/prisma.ts',
  'app/api/ai/test/route.ts',
];

requiredFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  check(
    path.basename(file),
    exists,
    `${file} exists`,
    `${file} not found`,
  );
});

// Check 4: Prisma schema
const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  check(
    'UsageLog Model',
    schemaContent.includes('model UsageLog'),
    'UsageLog model exists in schema',
    'UsageLog model not found in schema',
  );

  check(
    'MonthlyCharge Model',
    schemaContent.includes('model MonthlyCharge'),
    'MonthlyCharge model exists in schema',
    'MonthlyCharge model not found in schema',
  );
}

// Check 5: Prisma Client
try {
  const prismaClientPath = path.join(process.cwd(), 'node_modules/@prisma/client');
  const clientExists = fs.existsSync(prismaClientPath);
  
  check(
    'Prisma Client',
    clientExists,
    'Prisma Client is generated',
    'Prisma Client not generated - run: npx prisma generate',
  );
} catch (error) {
  results.push({
    name: 'Prisma Client',
    status: 'warn',
    message: 'Could not verify Prisma Client',
  });
}

// Print results
console.log('Results:\n');

const passed = results.filter((r) => r.status === 'pass').length;
const failed = results.filter((r) => r.status === 'fail').length;
const warned = results.filter((r) => r.status === 'warn').length;

results.forEach((result) => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
});

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${warned} warnings\n`);

if (failed > 0) {
  console.log('❌ Setup incomplete. Please fix the failed checks above.\n');
  process.exit(1);
}

if (warned > 0) {
  console.log('⚠️  Setup mostly complete, but some optional features need configuration.\n');
  console.log('Next steps:');
  console.log('1. Run: npx prisma migrate dev --name add-ai-usage-tracking');
  console.log('2. Configure Upstash Redis for rate limiting (optional)');
  console.log('3. Test the system: npm run dev, then visit /api/ai/test\n');
  process.exit(0);
}

console.log('✅ AI System setup is complete!\n');
console.log('Next steps:');
console.log('1. Run: npx prisma migrate dev --name add-ai-usage-tracking');
console.log('2. Start dev server: npm run dev');
console.log('3. Test the API: curl -X POST http://localhost:3000/api/ai/test \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"creatorId": "test-123", "prompt": "Hello!"}\'\n');
console.log('📚 See lib/ai/QUICK_START.md for more details.\n');

process.exit(0);
