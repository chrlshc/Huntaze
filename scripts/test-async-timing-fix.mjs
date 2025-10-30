#!/usr/bin/env node

/**
 * Script pour exécuter les tests spécifiques à la correction du timing asynchrone
 * dans useOptimisticMutations
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration des couleurs pour la sortie console
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

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Fichiers de test à exécuter
const testFiles = [
  'tests/unit/use-optimistic-mutations.test.ts',
  'tests/regression/optimistic-mutations-async-timing.test.ts',
  'tests/integration/optimistic-mutations-timing-integration.test.ts',
  'tests/performance/optimistic-mutations-timing-performance.test.ts'
];

// Vérifier que tous les fichiers de test existent
function validateTestFiles() {
  logInfo('Validation des fichiers de test...');
  
  const missingFiles = [];
  
  for (const testFile of testFiles) {
    const fullPath = join(rootDir, testFile);
    if (!existsSync(fullPath)) {
      missingFiles.push(testFile);
    }
  }
  
  if (missingFiles.length > 0) {
    logError('Fichiers de test manquants:');
    missingFiles.forEach(file => log(`  - ${file}`, colors.red));
    return false;
  }
  
  logSuccess('Tous les fichiers de test sont présents');
  return true;
}

// Exécuter les tests avec Vitest
function runTests(files, options = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      'vitest',
      'run',
      ...files,
      '--reporter=verbose',
      '--reporter=json',
      '--outputFile.json=test-results/async-timing-results.json'
    ];

    if (options.coverage) {
      args.push('--coverage');
    }

    if (options.watch) {
      args.splice(1, 1, 'watch'); // Replace 'run' with 'watch'
    }

    logInfo(`Exécution: npx ${args.join(' ')}`);

    const child = spawn('npx', args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Tests échoués avec le code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Analyser les résultats des tests
function analyzeResults() {
  const resultsPath = join(rootDir, 'test-results/async-timing-results.json');
  
  if (!existsSync(resultsPath)) {
    logWarning('Fichier de résultats non trouvé');
    return;
  }

  try {
    const results = JSON.parse(require('fs').readFileSync(resultsPath, 'utf8'));
    
    log('\n' + '='.repeat(60), colors.cyan);
    log('RÉSULTATS DES TESTS - CORRECTION TIMING ASYNCHRONE', colors.cyan + colors.bright);
    log('='.repeat(60), colors.cyan);
    
    const { testResults } = results;
    
    if (testResults) {
      const totalTests = testResults.numTotalTests || 0;
      const passedTests = testResults.numPassedTests || 0;
      const failedTests = testResults.numFailedTests || 0;
      const skippedTests = testResults.numPendingTests || 0;
      
      log(`\nTests totaux: ${totalTests}`, colors.blue);
      log(`Tests réussis: ${passedTests}`, colors.green);
      log(`Tests échoués: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
      log(`Tests ignorés: ${skippedTests}`, colors.yellow);
      
      const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';
      log(`Taux de réussite: ${successRate}%`, successRate === '100.0' ? colors.green : colors.yellow);
      
      if (failedTests === 0) {
        log('\n🎉 Tous les tests de la correction du timing asynchrone sont passés!', colors.green + colors.bright);
      } else {
        log('\n💥 Certains tests ont échoué. Vérifiez les détails ci-dessus.', colors.red + colors.bright);
      }
    }
    
  } catch (error) {
    logError(`Erreur lors de l'analyse des résultats: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    unit: args.includes('--unit'),
    regression: args.includes('--regression'),
    integration: args.includes('--integration'),
    performance: args.includes('--performance')
  };

  log('🧪 Tests de la Correction du Timing Asynchrone - useOptimisticMutations', colors.cyan + colors.bright);
  log('='.repeat(80), colors.cyan);

  // Valider les fichiers de test
  if (!validateTestFiles()) {
    process.exit(1);
  }

  // Déterminer quels tests exécuter
  let filesToRun = [];
  
  if (options.unit) {
    filesToRun.push('tests/unit/use-optimistic-mutations.test.ts');
  }
  
  if (options.regression) {
    filesToRun.push('tests/regression/optimistic-mutations-async-timing.test.ts');
  }
  
  if (options.integration) {
    filesToRun.push('tests/integration/optimistic-mutations-timing-integration.test.ts');
  }
  
  if (options.performance) {
    filesToRun.push('tests/performance/optimistic-mutations-timing-performance.test.ts');
  }
  
  // Si aucune option spécifique, exécuter tous les tests
  if (filesToRun.length === 0) {
    filesToRun = testFiles;
  }

  logInfo(`Exécution de ${filesToRun.length} suite(s) de tests:`);
  filesToRun.forEach(file => log(`  - ${file}`, colors.blue));

  try {
    // Créer le dossier de résultats s'il n'existe pas
    const testResultsDir = join(rootDir, 'test-results');
    if (!existsSync(testResultsDir)) {
      require('fs').mkdirSync(testResultsDir, { recursive: true });
    }

    // Exécuter les tests
    await runTests(filesToRun, options);
    
    logSuccess('Tests terminés avec succès!');
    
    // Analyser les résultats si disponibles
    if (!options.watch) {
      analyzeResults();
    }
    
  } catch (error) {
    logError(`Erreur lors de l'exécution des tests: ${error.message}`);
    process.exit(1);
  }
}

// Afficher l'aide
function showHelp() {
  log('Usage: node scripts/test-async-timing-fix.mjs [options]', colors.cyan);
  log('\nOptions:', colors.blue);
  log('  --coverage     Générer un rapport de couverture de code');
  log('  --watch        Exécuter les tests en mode watch');
  log('  --unit         Exécuter uniquement les tests unitaires');
  log('  --regression   Exécuter uniquement les tests de régression');
  log('  --integration  Exécuter uniquement les tests d\'intégration');
  log('  --performance  Exécuter uniquement les tests de performance');
  log('  --help         Afficher cette aide');
  log('\nExemples:', colors.yellow);
  log('  node scripts/test-async-timing-fix.mjs');
  log('  node scripts/test-async-timing-fix.mjs --coverage');
  log('  node scripts/test-async-timing-fix.mjs --unit --regression');
  log('  node scripts/test-async-timing-fix.mjs --watch');
}

// Vérifier si l'aide est demandée
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Exécuter le script principal
main().catch((error) => {
  logError(`Erreur fatale: ${error.message}`);
  process.exit(1);
});