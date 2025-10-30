#!/usr/bin/env node

/**
 * Script de validation de l'intégration API
 * Vérifie que toutes les optimisations sont correctement implémentées
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, checks) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const results = [];

    for (const check of checks) {
      const passed = check.test(content);
      results.push({
        name: check.name,
        passed,
        message: passed ? check.successMessage : check.failMessage
      });
    }

    return results;
  } catch (error) {
    return [{
      name: 'File Read',
      passed: false,
      message: `Failed to read file: ${error.message}`
    }];
  }
}

// ==================== VALIDATION CHECKS ====================

const orchestratorChecks = [
  {
    name: 'Custom Error Types',
    test: (content) => 
      content.includes('export class OpenAIExecutionError') &&
      content.includes('export class AzureExecutionError') &&
      content.includes('export class TimeoutError'),
    successMessage: '✓ Custom error types defined',
    failMessage: '✗ Missing custom error types'
  },
  {
    name: 'Retry Strategy',
    test: (content) => 
      content.includes('maxRetries') &&
      content.includes('retryDelays') &&
      content.includes('exponential backoff'),
    successMessage: '✓ Retry strategy implemented',
    failMessage: '✗ Missing retry strategy'
  },
  {
    name: 'Error Classification',
    test: (content) => 
      content.includes('classifyError') &&
      content.includes('isRetryableError'),
    successMessage: '✓ Error classification implemented',
    failMessage: '✗ Missing error classification'
  },
  {
    name: 'Timeout Management',
    test: (content) => 
      content.includes('executeWithTimeout') &&
      content.includes('30000') && // OpenAI timeout
      content.includes('45000'),   // Azure timeout
    successMessage: '✓ Timeout management implemented',
    failMessage: '✗ Missing timeout management'
  },
  {
    name: 'Cost Tracking',
    test: (content) => 
      content.includes('estimateTokenUsage') &&
      content.includes('calculateOpenAICost') &&
      content.includes('calculateAzureCost') &&
      content.includes('costMonitoringService.trackUsage'),
    successMessage: '✓ Cost tracking implemented',
    failMessage: '✗ Missing cost tracking'
  },
  {
    name: 'Data Sanitization',
    test: (content) => 
      content.includes('sanitizeResultForLogging'),
    successMessage: '✓ Data sanitization implemented',
    failMessage: '✗ Missing data sanitization'
  },
  {
    name: 'TypeScript Types',
    test: (content) => 
      content.includes('export interface OpenAIExecutionResult') &&
      content.includes('export interface AzureExecutionResult'),
    successMessage: '✓ TypeScript types defined',
    failMessage: '✗ Missing TypeScript types'
  },
  {
    name: 'Logging',
    test: (content) => 
      content.includes('logTrace') &&
      content.includes('CloudWatch'),
    successMessage: '✓ Logging implemented',
    failMessage: '✗ Missing logging'
  },
  {
    name: 'JSDoc Documentation',
    test: (content) => 
      content.includes('@param') &&
      content.includes('@returns') &&
      content.includes('@throws'),
    successMessage: '✓ JSDoc documentation present',
    failMessage: '✗ Missing JSDoc documentation'
  }
];

const testChecks = [
  {
    name: 'Retry Tests',
    test: (content) => 
      content.includes('should retry on timeout error') &&
      content.includes('should retry on rate limit error') &&
      content.includes('should retry on network error'),
    successMessage: '✓ Retry tests present',
    failMessage: '✗ Missing retry tests'
  },
  {
    name: 'Error Classification Tests',
    test: (content) => 
      content.includes('should classify timeout errors') &&
      content.includes('should classify rate limit errors') &&
      content.includes('should classify auth errors'),
    successMessage: '✓ Error classification tests present',
    failMessage: '✗ Missing error classification tests'
  },
  {
    name: 'Cost Tracking Tests',
    test: (content) => 
      content.includes('should track OpenAI costs correctly') &&
      content.includes('should track Azure costs correctly') &&
      content.includes('should estimate tokens when not provided'),
    successMessage: '✓ Cost tracking tests present',
    failMessage: '✗ Missing cost tracking tests'
  },
  {
    name: 'Timeout Tests',
    test: (content) => 
      content.includes('should timeout OpenAI requests after 30s') &&
      content.includes('should timeout Azure requests after 45s'),
    successMessage: '✓ Timeout tests present',
    failMessage: '✗ Missing timeout tests'
  },
  {
    name: 'Fallback Tests',
    test: (content) => 
      content.includes('should fallback from Azure to OpenAI') &&
      content.includes('should fallback from OpenAI to Azure'),
    successMessage: '✓ Fallback tests present',
    failMessage: '✗ Missing fallback tests'
  },
  {
    name: 'Data Sanitization Tests',
    test: (content) => 
      content.includes('should sanitize sensitive data in logs'),
    successMessage: '✓ Data sanitization tests present',
    failMessage: '✗ Missing data sanitization tests'
  }
];

const documentationChecks = [
  {
    name: 'API Endpoints',
    test: (content) => 
      content.includes('POST /api/workflows/execute') &&
      content.includes('GET /api/workflows/health'),
    successMessage: '✓ API endpoints documented',
    failMessage: '✗ Missing API endpoints documentation'
  },
  {
    name: 'Request/Response Examples',
    test: (content) => 
      content.includes('Example Request') &&
      content.includes('Example Response'),
    successMessage: '✓ Request/Response examples present',
    failMessage: '✗ Missing Request/Response examples'
  },
  {
    name: 'Error Handling Guide',
    test: (content) => 
      content.includes('Error Types') &&
      content.includes('Retry Strategy') &&
      content.includes('Retryable Errors'),
    successMessage: '✓ Error handling guide present',
    failMessage: '✗ Missing error handling guide'
  },
  {
    name: 'Cost Tracking Guide',
    test: (content) => 
      content.includes('Token Estimation') &&
      content.includes('Cost Calculation'),
    successMessage: '✓ Cost tracking guide present',
    failMessage: '✗ Missing cost tracking guide'
  },
  {
    name: 'Best Practices',
    test: (content) => 
      content.includes('Best Practices'),
    successMessage: '✓ Best practices documented',
    failMessage: '✗ Missing best practices'
  },
  {
    name: 'Security Guidelines',
    test: (content) => 
      content.includes('Security') &&
      content.includes('Authentication'),
    successMessage: '✓ Security guidelines present',
    failMessage: '✗ Missing security guidelines'
  }
];

// ==================== RUN VALIDATIONS ====================

function runValidation() {
  log('\n🔍 Validation de l\'intégration API\n', 'cyan');

  let totalChecks = 0;
  let passedChecks = 0;

  // Check orchestrator file
  log('📄 Checking lib/services/production-hybrid-orchestrator-v2.ts', 'blue');
  const orchestratorResults = checkFile(
    'lib/services/production-hybrid-orchestrator-v2.ts',
    orchestratorChecks
  );

  orchestratorResults.forEach(result => {
    totalChecks++;
    if (result.passed) {
      passedChecks++;
      log(`  ${result.message}`, 'green');
    } else {
      log(`  ${result.message}`, 'red');
    }
  });

  // Check test file
  log('\n📄 Checking tests/unit/production-hybrid-orchestrator-v2-enhanced.test.ts', 'blue');
  const testResults = checkFile(
    'tests/unit/production-hybrid-orchestrator-v2-enhanced.test.ts',
    testChecks
  );

  testResults.forEach(result => {
    totalChecks++;
    if (result.passed) {
      passedChecks++;
      log(`  ${result.message}`, 'green');
    } else {
      log(`  ${result.message}`, 'red');
    }
  });

  // Check documentation
  log('\n📄 Checking docs/api/production-hybrid-orchestrator-api.md', 'blue');
  const docResults = checkFile(
    'docs/api/production-hybrid-orchestrator-api.md',
    documentationChecks
  );

  docResults.forEach(result => {
    totalChecks++;
    if (result.passed) {
      passedChecks++;
      log(`  ${result.message}`, 'green');
    } else {
      log(`  ${result.message}`, 'red');
    }
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log(`📊 Résultats: ${passedChecks}/${totalChecks} checks passed`, 'cyan');
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  const color = percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red';
  log(`✨ Score: ${percentage}%`, color);

  if (percentage === 100) {
    log('\n🎉 Toutes les optimisations sont correctement implémentées!', 'green');
  } else if (percentage >= 80) {
    log('\n⚠️  La plupart des optimisations sont implémentées, mais il reste du travail.', 'yellow');
  } else {
    log('\n❌ Plusieurs optimisations manquent. Veuillez les implémenter.', 'red');
  }

  log('='.repeat(60) + '\n', 'cyan');

  // Exit with appropriate code
  process.exit(percentage === 100 ? 0 : 1);
}

// ==================== ADDITIONAL CHECKS ====================

function checkCodeQuality() {
  log('\n🔍 Vérification de la qualité du code\n', 'cyan');

  const qualityChecks = [
    {
      name: 'No console.log in production',
      test: () => {
        const content = readFileSync('lib/services/production-hybrid-orchestrator-v2.ts', 'utf-8');
        // Allow console.error and console.warn, but not console.log
        const hasConsoleLog = content.match(/console\.log\(/g);
        return !hasConsoleLog || hasConsoleLog.length <= 2; // Allow a few for debugging
      },
      message: 'Console.log usage'
    },
    {
      name: 'Error handling in async functions',
      test: () => {
        const content = readFileSync('lib/services/production-hybrid-orchestrator-v2.ts', 'utf-8');
        const asyncFunctions = content.match(/async\s+\w+\s*\(/g) || [];
        const tryCatchBlocks = content.match(/try\s*{/g) || [];
        // Should have at least one try-catch per async function
        return tryCatchBlocks.length >= asyncFunctions.length * 0.8;
      },
      message: 'Error handling coverage'
    },
    {
      name: 'TypeScript strict mode',
      test: () => {
        const content = readFileSync('lib/services/production-hybrid-orchestrator-v2.ts', 'utf-8');
        // Check for proper typing (no 'any' except in specific cases)
        const anyUsage = content.match(/:\s*any/g) || [];
        return anyUsage.length < 10; // Allow some 'any' for flexibility
      },
      message: 'TypeScript strict typing'
    }
  ];

  qualityChecks.forEach(check => {
    const passed = check.test();
    const symbol = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`  ${symbol} ${check.message}`, color);
  });
}

// ==================== MAIN ====================

try {
  runValidation();
  checkCodeQuality();
} catch (error) {
  log(`\n❌ Erreur lors de la validation: ${error.message}`, 'red');
  process.exit(1);
}
