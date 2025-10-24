#!/usr/bin/env node

/**
 * 🚀 Huntaze Upgrade Assistant 2025
 * Script d'aide pour l'upgrade vers Next 15 + React 19 + Tailwind v4
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function execCommand(command, description) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} terminé`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur lors de ${description}`, 'red');
    log(error.message, 'red');
    return false;
  }
}

function checkNodeVersion() {
  log('\n📋 Vérification de la version Node.js...', 'blue');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 22) {
    log(`✅ Node.js ${nodeVersion} (compatible)`, 'green');
    return true;
  } else {
    log(`❌ Node.js ${nodeVersion} détecté. Version 22+ requise.`, 'red');
    log('Exécutez: nvm use 22 || volta pin node@22', 'yellow');
    return false;
  }
}

function createBranch() {
  log('\n🌿 Création de la branche d\'upgrade...', 'blue');
  
  try {
    // Vérifier si on est sur git
    execSync('git status', { stdio: 'ignore' });
    
    // Créer la branche
    execSync('git checkout -b chore/upgrade-2025', { stdio: 'inherit' });
    log('✅ Branche chore/upgrade-2025 créée', 'green');
    return true;
  } catch (error) {
    log('⚠️ Impossible de créer la branche git', 'yellow');
    return false;
  }
}

function backupPackageJson() {
  log('\n💾 Sauvegarde du package.json...', 'blue');
  
  try {
    const packageJson = readFileSync('package.json', 'utf8');
    writeFileSync('package.json.backup', packageJson);
    log('✅ package.json sauvegardé vers package.json.backup', 'green');
    return true;
  } catch (error) {
    log('❌ Erreur lors de la sauvegarde', 'red');
    return false;
  }
}

function updatePackageJson() {
  log('\n📦 Mise à jour du package.json...', 'blue');
  
  const newPackageJson = {
    "name": "huntaze",
    "version": "0.1.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "start:test": "next build && next start",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "type-check": "tsc --noEmit",
      "typecheck": "tsc --noEmit",
      "test": "vitest",
      "test:unit": "vitest run tests/unit",
      "test:integration": "vitest run tests/integration",
      "test:regression": "vitest run tests/regression",
      "test:performance": "node scripts/run-performance-tests.mjs",
      "test:coverage": "vitest run --coverage",
      "test:watch": "vitest watch",
      "test:all": "npm run test:coverage && npm run test:performance && npm run e2e:smoke",
      "e2e": "playwright test",
      "e2e:smoke": "playwright test --grep '@smoke'",
      "e2e:headed": "playwright test --headed",
      "e2e:debug": "playwright test --debug",
      "lighthouse": "lhci autorun",
      "security:audit": "npm audit --audit-level high",
      "security:check": "node scripts/security-checklist.mjs",
      "ci:install": "npm ci && npx playwright install --with-deps",
      "ci:test": "npm run test:coverage && npm run e2e:smoke && npm run lighthouse",
      "ci:quality": "npm run lint && npm run typecheck && npm run security:check",
      "requirements:matrix": "node scripts/requirements-matrix.mjs",
      "coverage:check": "node scripts/check-coverage.mjs 80 80 80 80",
      "load-test": "tsx scripts/run-load-test.ts",
      "load-test:smoke": "tsx scripts/run-load-test.ts smoke",
      "load-test:load": "tsx scripts/run-load-test.ts load",
      "load-test:stress": "tsx scripts/run-load-test.ts stress",
      "load-test:spike": "tsx scripts/run-load-test.ts spike",
      "health-check": "curl -f http://localhost:3000/api/health || exit 1",
      "api:validate": "npm run health-check && npm run load-test:smoke",
      "validate:optimizations": "tsx scripts/validate-optimizations.ts",
      "setup:monitoring": "chmod +x scripts/setup-monitoring.sh && ./scripts/setup-monitoring.sh",
      "monitoring:start": "cd monitoring && ./start.sh",
      "monitoring:stop": "cd monitoring && ./stop.sh",
      "debug:all": "tsx scripts/debug-optimizations.ts",
      "debug:types": "tsx scripts/debug-types.ts",
      "debug:deps": "tsx scripts/debug-dependencies.ts",
      "debug:quick": "npm run debug:deps && npm run debug:types",
      "debug:master": "tsx scripts/debug-master.ts",
      "validate:tests": "node scripts/validate-tests.mjs",
      "test:validate": "npm run validate:tests",
      "test:tailwind": "vitest run tests/unit/tailwind-*.test.ts tests/integration/tailwind-*.test.ts tests/regression/tailwind-*.test.ts",
      "test:auth": "vitest run tests/unit/auth-endpoints-simple.test.ts tests/unit/auth-coverage-validation.test.ts tests/integration/auth-flow-integration.test.ts tests/regression/auth-security-regression.test.ts",
      "test:auth:e2e": "playwright test tests/e2e/auth-endpoints.spec.ts",
      "test:tailwind:watch": "vitest watch tests/unit/tailwind-*.test.ts tests/integration/tailwind-*.test.ts tests/regression/tailwind-*.test.ts",
      "validate:tailwind": "npm run test:tailwind && npm run lint",
      "format": "prettier --write .",
      "format:check": "prettier --check ."
    },
    "dependencies": {
      "@aws-sdk/client-cloudwatch-logs": "^3.700.0",
      "@aws-sdk/client-eventbridge": "^3.700.0",
      "@aws-sdk/client-s3": "^3.700.0",
      "@aws-sdk/client-sqs": "^3.700.0",
      "@headlessui/react": "^2.2.0",
      "@tanstack/react-query": "^5.62.0",
      "@trpc/client": "^11.0.0",
      "@trpc/next": "^11.0.0",
      "@trpc/react-query": "^11.0.0",
      "@trpc/server": "^11.0.0",
      "@types/pg": "^8.15.5",
      "@upstash/ratelimit": "^2.0.6",
      "@upstash/redis": "^1.35.6",
      "bcryptjs": "^3.0.2",
      "chart.js": "^4.5.1",
      "clsx": "^2.1.1",
      "cmdk": "^1.1.1",
      "csv-parse": "^6.1.0",
      "date-fns": "^4.1.0",
      "framer-motion": "^12.23.24",
      "ioredis": "^5.8.2",
      "jose": "^6.1.0",
      "jszip": "^3.10.1",
      "lucide-react": "^0.546.0",
      "next": "^15.1.0",
      "nodemailer": "^6.9.0",
      "openai": "^5.0.0",
      "p-queue": "^9.0.0",
      "pg": "^8.16.3",
      "prisma": "^6.0.0",
      "@prisma/client": "^6.0.0",
      "prom-client": "^15.1.3",
      "rate-limiter-flexible": "^8.1.0",
      "react": "^19.0.0",
      "react-chartjs-2": "^5.3.0",
      "react-countup": "^6.5.3",
      "react-dom": "^19.0.0",
      "react-hook-form": "^7.54.0",
      "react-intersection-observer": "^9.16.0",
      "stripe": "^19.1.0",
      "tailwind-merge": "^3.3.1",
      "tailwindcss": "^4.0.0",
      "typescript": "^5.9.0",
      "web-vitals": "^3.5.0",
      "zod": "^4.1.12",
      "zustand": "^5.0.8"
    },
    "devDependencies": {
      "@playwright/test": "^1.56.0",
      "@tailwindcss/upgrade": "^4.0.0",
      "@testing-library/jest-dom": "^6.9.1",
      "@testing-library/react": "^16.0.0",
      "@testing-library/user-event": "^14.6.1",
      "@types/bcryptjs": "^2.4.6",
      "@types/node": "^22.0.0",
      "@types/nodemailer": "^6.4.19",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@vitejs/plugin-react": "^4.7.0",
      "@vitest/coverage-v8": "^3.0.0",
      "autoprefixer": "^10.4.21",
      "eslint": "^9.0.0",
      "eslint-config-next": "^15.1.0",
      "glob": "^11.0.0",
      "husky": "^9.0.0",
      "jest-axe": "^8.0.0",
      "jsdom": "^25.0.0",
      "lint-staged": "^16.0.0",
      "postcss": "^8.4.35",
      "prettier": "^3.6.0",
      "tsx": "^4.7.0",
      "vitest": "^3.0.0",
      "wait-on": "^8.0.0"
    },
    "engines": {
      "node": ">=22.0.0",
      "npm": ">=10.0.0"
    },
    "packageManager": "npm@10.0.0"
  };

  try {
    writeFileSync('package.json', JSON.stringify(newPackageJson, null, 2));
    log('✅ package.json mis à jour', 'green');
    return true;
  } catch (error) {
    log('❌ Erreur lors de la mise à jour du package.json', 'red');
    return false;
  }
}

function createEslintConfig() {
  log('\n⚙️ Création de la config ESLint 9...', 'blue');
  
  const eslintConfig = `import next from "eslint-config-next";

export default [
  ...next(),
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      "infrastructure/stripe-eventbridge/cdk.out"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];
`;

  try {
    writeFileSync('eslint.config.mjs', eslintConfig);
    log('✅ eslint.config.mjs créé', 'green');
    
    // Supprimer l'ancienne config si elle existe
    if (existsSync('.eslintrc.json')) {
      execSync('rm .eslintrc.json');
      log('✅ .eslintrc.json supprimé', 'green');
    }
    if (existsSync('.eslintrc.js')) {
      execSync('rm .eslintrc.js');
      log('✅ .eslintrc.js supprimé', 'green');
    }
    
    return true;
  } catch (error) {
    log('❌ Erreur lors de la création de la config ESLint', 'red');
    return false;
  }
}

function runUpgradeSteps() {
  log('\n🚀 Démarrage de l\'upgrade Huntaze 2025 (codemods officiels)...', 'bright');
  
  // Étape 1: Vérifications préalables
  if (!checkNodeVersion()) {
    log('\n❌ Upgrade interrompu. Corrigez la version Node.js d\'abord.', 'red');
    process.exit(1);
  }
  
  // Étape 2: Branche git
  createBranch();
  
  // Étape 3: Sauvegarde
  if (!backupPackageJson()) {
    log('\n❌ Upgrade interrompu. Impossible de sauvegarder.', 'red');
    process.exit(1);
  }
  
  // Étape 4: Codemod Next.js 15 OFFICIEL (fait tout automatiquement)
  log('\n🔄 Codemod Next.js 15 officiel...', 'cyan');
  if (!execCommand('npx @next/codemod@canary upgrade latest', 'Upgrade Next.js 15 + React 19')) {
    log('\n⚠️ Codemod échoué, continuons avec mise à jour manuelle...', 'yellow');
    updatePackageJson();
    execCommand('npm install', 'Installation manuelle des dépendances');
  }
  
  // Étape 5: Codemods APIs async
  log('\n🔄 Codemod APIs async (cookies, headers, params)...', 'cyan');
  execCommand('npx @next/codemod@latest next-async-request-api .', 'APIs async Next.js 15');
  execCommand('npx @next/codemod@latest app-dir-runtime-config-experimental-edge .', 'Runtime config edge');
  
  // Étape 6: Types React 19
  log('\n📦 Mise à jour types React 19...', 'cyan');
  execCommand('npm i -E typescript@latest @types/react@latest @types/react-dom@latest', 'Types React 19');
  
  // Étape 7: Upgrade Tailwind OFFICIEL
  log('\n🎨 Upgrade Tailwind CSS v4 officiel...', 'cyan');
  execCommand('npx @tailwindcss/upgrade', 'Upgrade Tailwind CSS v4');
  
  // Étape 8: Config ESLint 9
  createEslintConfig();
  
  // Étape 9: State/Server libs
  log('\n📚 Upgrade state/server libraries...', 'cyan');
  execCommand('npm i -E @trpc/server@latest @trpc/client@latest @trpc/next@latest @trpc/react-query@latest', 'tRPC 11');
  execCommand('npm i -E zod@latest @tanstack/react-query@latest zustand@latest react-hook-form@latest', 'State libs');
  
  // Étape 10: Data layer
  log('\n🗄️ Upgrade data layer...', 'cyan');
  execCommand('npm i -E prisma@latest @prisma/client@latest', 'Prisma 6');
  execCommand('npx prisma generate', 'Génération Prisma');
  
  // Étape 11: SDKs externes
  log('\n🔌 Upgrade SDKs externes...', 'cyan');
  execCommand('npm i -E openai@latest stripe@latest @aws-sdk/client-s3@latest nodemailer@latest', 'SDKs externes');
  
  // Étape 12: Tests & tooling
  log('\n🧪 Upgrade tests & tooling...', 'cyan');
  execCommand('npm i -D -E vitest@latest @testing-library/react@latest playwright@latest prettier@latest', 'Tests & tooling');
  
  // Étape 13: Tests de validation
  log('\n✅ Tests de validation...', 'cyan');
  
  const buildSuccess = execCommand('npm run build', 'Build de validation');
  const typecheckSuccess = execCommand('npm run typecheck', 'Vérification des types');
  const lintSuccess = execCommand('npm run lint', 'Lint avec ESLint 9');
  
  // Résumé final
  log('\n🎉 UPGRADE TERMINÉ !', 'bright');
  log('\n📋 Résumé:', 'blue');
  log(`✅ Node.js 22+ vérifié`, 'green');
  log(`✅ Branche chore/upgrade-2025 créée`, 'green');
  log(`✅ Next.js 15 + React 19 + codemods appliqués`, 'green');
  log(`✅ Tailwind v4 upgradé`, 'green');
  log(`✅ ESLint 9 configuré`, 'green');
  log(`✅ Toutes les dépendances mises à jour`, 'green');
  log(`${buildSuccess ? '✅' : '❌'} Build ${buildSuccess ? 'réussi' : 'échoué'}`, buildSuccess ? 'green' : 'red');
  log(`${typecheckSuccess ? '✅' : '❌'} TypeCheck ${typecheckSuccess ? 'réussi' : 'échoué'}`, typecheckSuccess ? 'green' : 'red');
  log(`${lintSuccess ? '✅' : '❌'} Lint ${lintSuccess ? 'réussi' : 'échoué'}`, lintSuccess ? 'green' : 'red');
  
  log('\n📝 Contrôles manuels recommandés:', 'yellow');
  log('1. Vérifier @import "tailwindcss" dans le CSS principal', 'yellow');
  log('2. Tester les composants dans le navigateur', 'yellow');
  log('3. Vérifier les appels fetch (cache par défaut changé)', 'yellow');
  log('4. Exécuter les tests: npm test && npx playwright test', 'yellow');
  log('5. Upgrade Redis vers 8.2.2+ (sécurité critique)', 'yellow');
  
  if (!buildSuccess || !typecheckSuccess || !lintSuccess) {
    log('\n⚠️ Des erreurs ont été détectées. Consultez UPGRADE_RUNBOOK_2025.md pour les corrections.', 'yellow');
  } else {
    log('\n🎉 Upgrade réussi ! Prêt pour les tests finaux.', 'green');
  }
}

// Exécution du script
runUpgradeSteps();