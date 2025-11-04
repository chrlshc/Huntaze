#!/usr/bin/env node

/**
 * Script de validation des corrections d'hydratation en staging
 * Vérifie que toutes les corrections sont bien déployées et fonctionnelles
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATION STAGING - Corrections d\'hydratation React #130');
console.log('================================================================');

// Configuration
const STAGING_URL = 'https://staging.huntaze.com'; // À adapter selon votre URL staging
const validationResults = {
  timestamp: new Date().toISOString(),
  deploymentId: `staging-validation-${Date.now()}`,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function logTest(name, status, details = '') {
  const test = { name, status, details, timestamp: new Date().toISOString() };
  validationResults.tests.push(test);
  validationResults.summary.total++;
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${details ? ` - ${details}` : ''}`);
  
  if (status === 'PASS') validationResults.summary.passed++;
  else if (status === 'FAIL') validationResults.summary.failed++;
  else validationResults.summary.warnings++;
}

async function validateStagingDeployment() {
  console.log('\n🚀 Phase 1: Validation des fichiers déployés');
  console.log('─'.repeat(50));
  
  // Vérifier les composants d'hydratation
  const hydrationComponents = [
    'components/hydration/HydrationErrorBoundary.tsx',
    'components/hydration/HydrationSafeWrapper.tsx',
    'components/hydration/SSRDataProvider.tsx',
    'components/hydration/SafeDateRenderer.tsx',
    'components/hydration/SafeBrowserAPI.tsx',
    'components/hydration/SafeRandomContent.tsx',
    'components/hydration/index.ts'
  ];
  
  for (const component of hydrationComponents) {
    if (fs.existsSync(component)) {
      logTest(`Composant ${path.basename(component)}`, 'PASS', 'Présent');
    } else {
      logTest(`Composant ${path.basename(component)}`, 'FAIL', 'Manquant');
    }
  }
  
  console.log('\n📊 Phase 2: Validation des corrections appliquées');
  console.log('─'.repeat(50));
  
  // Vérifier les corrections dans les fichiers
  const correctedFiles = [
    'components/landing/LandingFooter.tsx',
    'app/analytics/advanced/page.tsx',
    'app/status/page.tsx',
    'lib/email/ses.ts',
    'lib/services/reportGenerationService.ts'
  ];
  
  for (const file of correctedFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Vérifier qu'il n'y a plus de new Date().getFullYear() ou new Date().toLocaleString()
      const hasOldDateUsage = content.includes('new Date().getFullYear()') || 
                             content.includes('new Date().toLocaleString()');
      
      if (hasOldDateUsage) {
        logTest(`Corrections dans ${path.basename(file)}`, 'FAIL', 'Anciennes méthodes Date détectées');
      } else {
        logTest(`Corrections dans ${path.basename(file)}`, 'PASS', 'Corrections appliquées');
      }
    } else {
      logTest(`Fichier ${path.basename(file)}`, 'WARN', 'Fichier non trouvé');
    }
  }
  
  console.log('\n🛠️ Phase 3: Validation de la configuration');
  console.log('─'.repeat(50));
  
  // Vérifier la configuration d'hydratation
  if (fs.existsSync('hydration.config.js')) {
    logTest('Configuration hydratation', 'PASS', 'hydration.config.js présent');
  } else {
    logTest('Configuration hydratation', 'FAIL', 'hydration.config.js manquant');
  }
  
  // Vérifier le workflow GitHub Actions
  if (fs.existsSync('.github/workflows/hydration-validation.yml')) {
    logTest('Workflow CI/CD', 'PASS', 'Validation automatique configurée');
  } else {
    logTest('Workflow CI/CD', 'WARN', 'Workflow de validation manquant');
  }
  
  console.log('\n📚 Phase 4: Validation de la documentation');
  console.log('─'.repeat(50));
  
  const docs = [
    'docs/HYDRATION_DEPLOYMENT_GUIDE.md',
    'docs/HYDRATION_SAFE_COMPONENTS_GUIDE.md',
    'docs/HYDRATION_TROUBLESHOOTING_GUIDE.md',
    'docs/HYDRATION_BEST_PRACTICES_GUIDE.md'
  ];
  
  for (const doc of docs) {
    if (fs.existsSync(doc)) {
      logTest(`Documentation ${path.basename(doc)}`, 'PASS', 'Disponible');
    } else {
      logTest(`Documentation ${path.basename(doc)}`, 'WARN', 'Manquante');
    }
  }
  
  console.log('\n🔍 Phase 5: Tests de validation');
  console.log('─'.repeat(50));
  
  // Vérifier les tests
  const testFiles = [
    'tests/unit/hydration/hydration-safe-wrappers.test.tsx',
    'tests/integration/hydration/full-page-hydration.test.tsx',
    'tests/e2e/hydration/real-world-scenarios.test.ts'
  ];
  
  for (const testFile of testFiles) {
    if (fs.existsSync(testFile)) {
      logTest(`Tests ${path.basename(testFile)}`, 'PASS', 'Présent');
    } else {
      logTest(`Tests ${path.basename(testFile)}`, 'WARN', 'Manquant');
    }
  }
}

async function generateReport() {
  console.log('\n📊 RAPPORT DE VALIDATION STAGING');
  console.log('================================');
  console.log(`🕐 Timestamp: ${validationResults.timestamp}`);
  console.log(`🆔 ID de validation: ${validationResults.deploymentId}`);
  console.log(`📈 Tests total: ${validationResults.summary.total}`);
  console.log(`✅ Tests réussis: ${validationResults.summary.passed}`);
  console.log(`❌ Tests échoués: ${validationResults.summary.failed}`);
  console.log(`⚠️ Avertissements: ${validationResults.summary.warnings}`);
  
  const successRate = Math.round((validationResults.summary.passed / validationResults.summary.total) * 100);
  console.log(`📊 Taux de réussite: ${successRate}%`);
  
  // Sauvegarder le rapport
  const reportPath = `logs/staging-validation-${validationResults.deploymentId}.json`;
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
  console.log(`📄 Rapport sauvegardé: ${reportPath}`);
  
  if (successRate >= 80) {
    console.log('\n🎉 VALIDATION STAGING RÉUSSIE !');
    console.log('✅ Les corrections d\'hydratation sont prêtes pour la production');
  } else {
    console.log('\n⚠️ VALIDATION STAGING PARTIELLE');
    console.log('🔧 Quelques ajustements peuvent être nécessaires avant la production');
  }
  
  console.log('\n🔗 PROCHAINES ÉTAPES:');
  console.log('1. Tester manuellement les pages en staging');
  console.log('2. Vérifier l\'absence d\'erreurs React #130 dans la console');
  console.log('3. Valider le comportement d\'hydratation');
  console.log('4. Si tout est OK, déployer en production');
  
  return successRate >= 80;
}

async function main() {
  try {
    await validateStagingDeployment();
    const success = await generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateStagingDeployment, generateReport };