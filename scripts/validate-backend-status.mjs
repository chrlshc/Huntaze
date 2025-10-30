#!/usr/bin/env node

/**
 * Script de validation de l'état du backend Huntaze
 * Vérifie la correspondance entre la documentation et l'état réel
 * Basé sur HUNTAZE_BACKEND_REAL_STATUS.md
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(title, colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
}

// Validation du schema Prisma
function validatePrismaSchema() {
  logSection('PRISMA SCHEMA VALIDATION');

  if (!existsSync('prisma/schema.prisma')) {
    logError('prisma/schema.prisma not found');
    return { valid: false, score: 0 };
  }

  const schema = readFileSync('prisma/schema.prisma', 'utf-8');
  let score = 0;
  const maxScore = 10;

  // Vérifier le provider
  if (schema.includes('provider = "postgresql"')) {
    logSuccess('PostgreSQL provider configured');
    score += 2;
  } else {
    logError('PostgreSQL provider not configured');
  }

  // Vérifier les models
  const requiredModels = ['User', 'RefreshToken', 'SubscriptionRecord', 'ContentAsset', 'ApiKey'];
  const foundModels = requiredModels.filter(model => schema.includes(`model ${model}`));
  
  logInfo(`Found ${foundModels.length}/${requiredModels.length} required models`);
  score += (foundModels.length / requiredModels.length) * 4;

  // Vérifier les enums
  const hasEnums = schema.match(/enum\s+\w+/g);
  if (hasEnums && hasEnums.length >= 4) {
    logSuccess(`Found ${hasEnums.length} enums`);
    score += 2;
  } else {
    logWarning('Missing some enum definitions');
  }

  // Vérifier les relations
  if (schema.includes('@relation')) {
    logSuccess('Relations defined');
    score += 1;
  }

  // Vérifier les indexes
  if (schema.includes('@@index') || schema.includes('@@unique')) {
    logSuccess('Indexes defined');
    score += 1;
  } else {
    logWarning('No indexes found - may impact performance');
  }

  logInfo(`Schema score: ${score}/${maxScore}`);
  return { valid: score >= 7, score };
}

// Validation de la structure des API routes
function validateApiRoutes() {
  logSection('API ROUTES STRUCTURE VALIDATION');

  const requiredRoutes = [
    'app/api/auth',
    'app/api/users',
    'app/api/content',
    'app/api/billing',
    'app/api/ai',
    'app/api/analytics',
    'app/api/integrations',
    'app/api/webhooks'
  ];

  let foundRoutes = 0;
  const missingRoutes = [];

  for (const route of requiredRoutes) {
    if (existsSync(route)) {
      logSuccess(`${route} exists`);
      foundRoutes++;
    } else {
      logError(`${route} not found`);
      missingRoutes.push(route);
    }
  }

  logInfo(`Found ${foundRoutes}/${requiredRoutes.length} required route directories`);

  // Compter le nombre total de routes
  let totalRoutes = 0;
  if (existsSync('app/api')) {
    totalRoutes = countRouteFiles('app/api');
    logInfo(`Total API routes: ${totalRoutes}`);
  }

  return {
    valid: foundRoutes >= requiredRoutes.length * 0.8,
    foundRoutes,
    totalRoutes,
    missingRoutes
  };
}

function countRouteFiles(dir) {
  let count = 0;
  
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = join(dir, item.name);
      
      if (item.isDirectory()) {
        count += countRouteFiles(fullPath);
      } else if (item.name === 'route.ts' || item.name === 'route.js') {
        count++;
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  return count;
}

// Détection des mocks en mémoire
function detectInMemoryMocks() {
  logSection('IN-MEMORY MOCKS DETECTION');

  const routesToCheck = [
    'app/api/users/profile/route.ts',
    'app/api/billing/checkout/route.ts',
    'app/api/content/generate/route.ts',
    'app/api/auth/signin/route.ts'
  ];

  const mockPatterns = [
    /new Map\s*\(/,
    /const\s+\w+\s*=\s*\[\]/,
    /\/\/\s*Mock/i,
    /\/\/\s*TODO.*prisma/i
  ];

  let routesWithMocks = 0;
  const mockedRoutes = [];

  for (const route of routesToCheck) {
    if (existsSync(route)) {
      const content = readFileSync(route, 'utf-8');
      
      let hasMock = false;
      for (const pattern of mockPatterns) {
        if (pattern.test(content)) {
          hasMock = true;
          break;
        }
      }

      if (hasMock) {
        logWarning(`${route} uses in-memory mocks`);
        routesWithMocks++;
        mockedRoutes.push(route);
      } else {
        logSuccess(`${route} appears to use real implementation`);
      }
    }
  }

  logInfo(`${routesWithMocks}/${routesToCheck.length} routes using mocks`);

  return {
    routesWithMocks,
    mockedRoutes,
    needsMigration: routesWithMocks > 0
  };
}

// Validation du client Prisma
function validatePrismaClient() {
  logSection('PRISMA CLIENT VALIDATION');

  let score = 0;
  const maxScore = 5;

  // Vérifier si lib/prisma.ts existe
  if (existsSync('lib/prisma.ts')) {
    logSuccess('lib/prisma.ts exists');
    score += 2;

    const content = readFileSync('lib/prisma.ts', 'utf-8');
    
    if (content.includes('PrismaClient')) {
      logSuccess('PrismaClient imported');
      score += 1;
    }

    if (content.includes('global') || content.includes('globalThis')) {
      logSuccess('Singleton pattern implemented');
      score += 1;
    }

    if (content.includes('export')) {
      logSuccess('Prisma client exported');
      score += 1;
    }
  } else {
    logError('lib/prisma.ts not found - Prisma client not initialized');
  }

  // Vérifier si @prisma/client est utilisé
  const filesToCheck = [
    'lib/db.ts',
    'lib/services/simple-user-service.ts',
    'lib/services/simple-billing-service.ts'
  ];

  let prismaImports = 0;
  for (const file of filesToCheck) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('@prisma/client')) {
        prismaImports++;
      }
    }
  }

  if (prismaImports > 0) {
    logSuccess(`@prisma/client imported in ${prismaImports} files`);
  } else {
    logWarning('No @prisma/client imports found');
  }

  logInfo(`Prisma client score: ${score}/${maxScore}`);

  return {
    valid: score >= 3,
    score,
    initialized: existsSync('lib/prisma.ts')
  };
}

// Validation des migrations
function validateMigrations() {
  logSection('DATABASE MIGRATIONS VALIDATION');

  const migrationsExist = existsSync('prisma/migrations');
  
  if (migrationsExist) {
    logSuccess('prisma/migrations directory exists');
    
    try {
      const migrations = readdirSync('prisma/migrations');
      logInfo(`Found ${migrations.length} migrations`);
      
      return {
        valid: true,
        count: migrations.length,
        initialized: true
      };
    } catch (error) {
      logError('Cannot read migrations directory');
      return { valid: false, count: 0, initialized: false };
    }
  } else {
    logWarning('prisma/migrations not found - database not initialized');
    logInfo('Run: npx prisma migrate dev --name init');
    
    return {
      valid: false,
      count: 0,
      initialized: false
    };
  }
}

// Validation NextAuth
function validateNextAuth() {
  logSection('NEXTAUTH CONFIGURATION VALIDATION');

  let score = 0;
  const maxScore = 4;

  // Vérifier la route NextAuth
  if (existsSync('app/api/auth/[...nextauth]/route.ts')) {
    logSuccess('NextAuth route configured');
    score += 2;
  } else {
    logWarning('NextAuth route not found');
  }

  // Vérifier les dépendances
  if (existsSync('package.json')) {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if ('next-auth' in deps) {
      logSuccess('next-auth installed');
      score += 1;
    } else {
      logWarning('next-auth not installed');
    }

    if ('@auth/prisma-adapter' in deps) {
      logSuccess('@auth/prisma-adapter installed');
      score += 1;
    } else {
      logWarning('@auth/prisma-adapter not installed');
    }
  }

  logInfo(`NextAuth score: ${score}/${maxScore}`);

  return {
    valid: score >= 2,
    score,
    configured: score === maxScore
  };
}

// Validation des webhooks Stripe
function validateStripeWebhooks() {
  logSection('STRIPE WEBHOOKS VALIDATION');

  const webhookRoute = 'app/api/webhooks/stripe/route.ts';
  
  if (!existsSync(webhookRoute)) {
    logError('Stripe webhook route not found');
    return { valid: false, implemented: false };
  }

  logSuccess('Stripe webhook route exists');

  const content = readFileSync(webhookRoute, 'utf-8');
  let score = 0;
  const maxScore = 5;

  // Vérifier la vérification de signature
  if (content.includes('constructEvent') || content.includes('verifySignature')) {
    logSuccess('Webhook signature verification implemented');
    score += 2;
  } else {
    logWarning('Webhook signature verification missing');
  }

  // Vérifier l'utilisation de Prisma
  if (content.includes('prisma.') || content.includes('@prisma/client')) {
    logSuccess('Uses Prisma for database updates');
    score += 2;
  } else {
    logWarning('Uses mocks instead of Prisma');
  }

  // Vérifier les événements gérés
  const events = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ];

  const handledEvents = events.filter(event => content.includes(event));
  
  if (handledEvents.length >= 3) {
    logSuccess(`Handles ${handledEvents.length}/${events.length} critical events`);
    score += 1;
  } else {
    logWarning(`Only handles ${handledEvents.length}/${events.length} events`);
  }

  logInfo(`Stripe webhooks score: ${score}/${maxScore}`);

  return {
    valid: score >= 3,
    score,
    handledEvents
  };
}

// Estimation de la complexité de migration
function estimateMigrationComplexity() {
  logSection('MIGRATION COMPLEXITY ESTIMATION');

  const apiRouteCount = countRouteFiles('app/api');
  const mockDetection = detectInMemoryMocks();
  
  let complexity;
  let estimatedDays;

  if (apiRouteCount < 10) {
    complexity = 'LOW';
    estimatedDays = '2-3 days';
  } else if (apiRouteCount < 30) {
    complexity = 'MEDIUM';
    estimatedDays = '5-7 days';
  } else {
    complexity = 'HIGH';
    estimatedDays = '10-15 days';
  }

  logInfo(`Total API routes: ${apiRouteCount}`);
  logInfo(`Routes with mocks: ${mockDetection.routesWithMocks}`);
  logInfo(`Migration complexity: ${complexity}`);
  logInfo(`Estimated time: ${estimatedDays}`);

  return {
    complexity,
    estimatedDays,
    apiRouteCount,
    routesWithMocks: mockDetection.routesWithMocks
  };
}

// Génération du rapport
function generateReport(results) {
  logSection('BACKEND STATUS REPORT');

  const totalScore = Object.values(results)
    .filter(r => typeof r.score === 'number')
    .reduce((sum, r) => sum + r.score, 0);

  const maxTotalScore = 34; // Somme des maxScore de tous les tests

  const percentage = Math.round((totalScore / maxTotalScore) * 100);

  log('\n📊 Overall Status:', colors.bright);
  log(`Score: ${totalScore}/${maxTotalScore} (${percentage}%)`, colors.cyan);

  if (percentage >= 80) {
    logSuccess('Backend is production-ready!');
  } else if (percentage >= 60) {
    logWarning('Backend needs some improvements');
  } else {
    logError('Backend requires significant work');
  }

  log('\n📋 Component Status:', colors.bright);
  log(`Prisma Schema: ${results.schema.valid ? '✅' : '❌'} (${results.schema.score}/10)`, colors.cyan);
  log(`API Routes: ${results.routes.valid ? '✅' : '❌'} (${results.routes.foundRoutes} routes)`, colors.cyan);
  log(`Prisma Client: ${results.client.valid ? '✅' : '❌'} (${results.client.score}/5)`, colors.cyan);
  log(`Migrations: ${results.migrations.valid ? '✅' : '❌'} (${results.migrations.count} migrations)`, colors.cyan);
  log(`NextAuth: ${results.nextauth.valid ? '✅' : '❌'} (${results.nextauth.score}/4)`, colors.cyan);
  log(`Stripe Webhooks: ${results.webhooks.valid ? '✅' : '❌'} (${results.webhooks.score}/5)`, colors.cyan);

  log('\n🎯 Next Actions:', colors.bright);

  if (!results.client.initialized) {
    log('1. Create lib/prisma.ts with PrismaClient', colors.yellow);
  }

  if (!results.migrations.initialized) {
    log('2. Run: npx prisma migrate dev --name init', colors.yellow);
  }

  if (results.mocks.needsMigration) {
    log(`3. Migrate ${results.mocks.routesWithMocks} routes from mocks to Prisma`, colors.yellow);
  }

  if (!results.nextauth.configured) {
    log('4. Install and configure NextAuth', colors.yellow);
  }

  if (!results.webhooks.valid) {
    log('5. Implement real Stripe webhook handlers', colors.yellow);
  }

  log('\n⏱️  Migration Estimate:', colors.bright);
  log(`Complexity: ${results.complexity.complexity}`, colors.cyan);
  log(`Estimated time: ${results.complexity.estimatedDays}`, colors.cyan);

  return {
    score: totalScore,
    maxScore: maxTotalScore,
    percentage,
    ready: percentage >= 80
  };
}

// Fonction principale
async function main() {
  log('🔍 Huntaze Backend Status Validator', colors.bright + colors.cyan);
  log('Validating backend configuration and migration readiness...\n');

  const results = {
    schema: validatePrismaSchema(),
    routes: validateApiRoutes(),
    mocks: detectInMemoryMocks(),
    client: validatePrismaClient(),
    migrations: validateMigrations(),
    nextauth: validateNextAuth(),
    webhooks: validateStripeWebhooks(),
    complexity: estimateMigrationComplexity()
  };

  const report = generateReport(results);

  // Sauvegarder le rapport
  const reportJson = JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    report
  }, null, 2);

  try {
    const fs = await import('fs/promises');
    await fs.writeFile('backend-status-report.json', reportJson);
    logSuccess('Report saved to backend-status-report.json');
  } catch (error) {
    logWarning('Could not save report file');
  }

  // Exit code basé sur le statut
  process.exit(report.ready ? 0 : 1);
}

main().catch(error => {
  logError(`Validation failed: ${error.message}`);
  process.exit(1);
});
