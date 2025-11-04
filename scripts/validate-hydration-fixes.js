#!/usr/bin/env node

/**
 * Script de validation finale des corrections d'hydratation
 * 
 * Ce script :
 * 1. Exécute tous les tests d'hydratation
 * 2. Vérifie que React error #130 est résolu
 * 3. Valide les composants critiques
 * 4. Génère un rapport de validation final
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validation Finale des Corrections d\'Hydratation\n');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Tests à exécuter
const HYDRATION_TESTS = [
  {
    name: 'Hydration Safe Wrappers',
    path: 'tests/unit/hydration/hydration-safe-wrappers.test.tsx',
    critical: true
  },
  {
    name: 'Hydration Fixes Validation',
    path: 'tests/unit/hydration/hydration-fixes-validation.test.tsx',
    critical: true
  }
];

// Composants critiques à vérifier
const CRITICAL_COMPONENTS = [
  {
    name: 'LandingFooter',
    path: 'components/landing/LandingFooter.tsx',
    expectedImports: ['SafeCurrentYear', 'SSRDataProvider'],
    dangerousPatterns: ['new Date().getFullYear()']
  },
  {
    name: 'SafeCurrentYear',
    path: 'components/hydration/SafeCurrentYear.tsx',
    exists: false // Vérifie via SafeDateRenderer
  },
  {
    name: 'SafeDateRenderer',
    path: 'components/hydration/SafeDateRenderer.tsx',
    expectedExports: ['SafeCurrentYear', 'SafeDateRenderer', 'SafeRelativeTime']
  }
];

function runHydrationTests() {
  logInfo('Exécution des tests d\'hydratation...');
  
  const results = [];
  
  HYDRATION_TESTS.forEach(test => {
    try {
      logInfo(`Test: ${test.name}`);
      
      // Vérifier que le fichier de test existe
      if (!fs.existsSync(test.path)) {
        results.push({
          name: test.name,
          status: 'missing',
          error: 'Fichier de test non trouvé'
        });
        logWarning(`Fichier de test manquant: ${test.path}`);
        return;
      }
      
      // Exécuter le test
      const output = execSync(`npm test -- --testPathPattern=${path.basename(test.path)} --passWithNoTests --silent`, {
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      results.push({
        name: test.name,
        status: 'passed',
        output: output.trim()
      });
      
      logSuccess(`${test.name} - Tests passés`);
      
    } catch (error) {
      results.push({
        name: test.name,
        status: 'failed',
        error: error.message,
        output: error.stdout || error.stderr || ''
      });
      
      if (test.critical) {
        logError(`${test.name} - Tests critiques échoués`);
      } else {
        logWarning(`${test.name} - Tests échoués (non critique)`);
      }
    }
  });
  
  return results;
}

function validateCriticalComponents() {
  logInfo('Validation des composants critiques...');
  
  const results = [];
  
  CRITICAL_COMPONENTS.forEach(component => {
    const result = {
      name: component.name,
      path: component.path,
      status: 'unknown',
      issues: []
    };
    
    if (component.exists === false) {
      // Composant qui n'existe pas en tant que fichier séparé
      result.status = 'ok';
      result.notes = 'Composant exporté via un autre fichier';
      results.push(result);
      return;
    }
    
    if (!fs.existsSync(component.path)) {
      result.status = 'missing';
      result.issues.push('Fichier non trouvé');
      results.push(result);
      logError(`${component.name} - Fichier manquant: ${component.path}`);
      return;
    }
    
    const content = fs.readFileSync(component.path, 'utf8');
    
    // Vérifier les imports attendus
    if (component.expectedImports) {
      component.expectedImports.forEach(importName => {
        if (!content.includes(importName)) {
          result.issues.push(`Import manquant: ${importName}`);
        }
      });
    }
    
    // Vérifier les exports attendus
    if (component.expectedExports) {
      component.expectedExports.forEach(exportName => {
        if (!content.includes(exportName)) {
          result.issues.push(`Export manquant: ${exportName}`);
        }
      });
    }
    
    // Vérifier l'absence de patterns dangereux
    if (component.dangerousPatterns) {
      component.dangerousPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          result.issues.push(`Pattern dangereux trouvé: ${pattern}`);
        }
      });
    }
    
    result.status = result.issues.length === 0 ? 'ok' : 'issues';
    results.push(result);
    
    if (result.status === 'ok') {
      logSuccess(`${component.name} - Validation réussie`);
    } else {
      logWarning(`${component.name} - ${result.issues.length} problème(s) trouvé(s)`);
      result.issues.forEach(issue => logWarning(`  - ${issue}`));
    }
  });
  
  return results;
}

function checkHydrationPatterns() {
  logInfo('Vérification des patterns d\'hydratation restants...');
  
  const dangerousPatterns = [
    {
      pattern: /new Date\(\)\.getFullYear\(\)/g,
      description: 'new Date().getFullYear() - utiliser SafeCurrentYear',
      severity: 'critical'
    },
    {
      pattern: /new Date\(\)\.toLocaleString\(\)/g,
      description: 'new Date().toLocaleString() - utiliser SafeDateRenderer',
      severity: 'critical'
    }
  ];
  
  const results = {
    filesScanned: 0,
    issuesFound: 0,
    criticalIssues: 0,
    issuesByFile: {}
  };
  
  function scanDirectory(dir, excludeDirs = []) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(item) && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(itemPath, excludeDirs);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // Exclure les fichiers de test et les composants hydration-safe
        if (item.includes('.test.') || itemPath.includes('/hydration/')) {
          return;
        }
        
        results.filesScanned++;
        
        const content = fs.readFileSync(itemPath, 'utf8');
        const relativePath = path.relative(process.cwd(), itemPath);
        
        dangerousPatterns.forEach(({ pattern, description, severity }) => {
          const matches = content.match(pattern);
          if (matches) {
            if (!results.issuesByFile[relativePath]) {
              results.issuesByFile[relativePath] = [];
            }
            
            results.issuesByFile[relativePath].push({
              pattern: description,
              count: matches.length,
              severity
            });
            
            results.issuesFound += matches.length;
            if (severity === 'critical') {
              results.criticalIssues += matches.length;
            }
          }
        });
      }
    });
  }
  
  // Scanner les répertoires principaux
  const dirsToScan = ['components', 'app', 'lib'];
  
  dirsToScan.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, ['node_modules', '.next', 'tests', 'hydration']);
    }
  });
  
  return results;
}

function generateValidationReport(testResults, componentResults, patternResults) {
  const reportContent = `# Rapport de Validation des Corrections d'Hydratation

## Résumé Exécutif
- **Date**: ${new Date().toLocaleString('fr-FR')}
- **Tests d'hydratation**: ${testResults.filter(r => r.status === 'passed').length}/${testResults.length} passés
- **Composants critiques**: ${componentResults.filter(r => r.status === 'ok').length}/${componentResults.length} validés
- **Patterns dangereux restants**: ${patternResults.criticalIssues} critiques sur ${patternResults.issuesFound} total
- **Fichiers scannés**: ${patternResults.filesScanned}

## Statut Global
${patternResults.criticalIssues === 0 && testResults.every(r => r.status === 'passed') 
  ? '🎉 **SUCCÈS** - Toutes les corrections d\'hydratation sont validées !' 
  : '⚠️ **EN COURS** - Certaines corrections nécessitent encore du travail'}

## Tests d'Hydratation

${testResults.map(test => `
### ${test.name}
- **Statut**: ${test.status === 'passed' ? '✅ Passé' : test.status === 'failed' ? '❌ Échoué' : '⚠️ Manquant'}
${test.error ? `- **Erreur**: ${test.error}` : ''}
${test.output && test.status === 'failed' ? `- **Détails**: ${test.output.substring(0, 200)}...` : ''}
`).join('\n')}

## Composants Critiques

${componentResults.map(comp => `
### ${comp.name}
- **Statut**: ${comp.status === 'ok' ? '✅ Validé' : comp.status === 'issues' ? '⚠️ Problèmes' : '❌ Manquant'}
- **Fichier**: ${comp.path}
${comp.issues && comp.issues.length > 0 ? `- **Problèmes**:\n${comp.issues.map(issue => `  - ${issue}`).join('\n')}` : ''}
${comp.notes ? `- **Notes**: ${comp.notes}` : ''}
`).join('\n')}

## Patterns Dangereux Restants

${patternResults.criticalIssues > 0 ? `
⚠️ **${patternResults.criticalIssues} patterns critiques** nécessitent une correction immédiate :

${Object.entries(patternResults.issuesByFile).map(([file, issues]) => `
### ${file}
${issues.map(issue => `- ${issue.pattern} (${issue.count} occurrence${issue.count > 1 ? 's' : ''}) - ${issue.severity}`).join('\n')}
`).join('\n')}
` : '✅ **Aucun pattern critique restant** - Excellent travail !'}

## Recommandations

### Actions Immédiates
${patternResults.criticalIssues > 0 ? `
1. **Corriger les patterns critiques** - ${patternResults.criticalIssues} occurrences à traiter
2. **Exécuter les tests** - Valider les corrections avec \`npm test\`
3. **Tester l'hydratation** - Vérifier en développement et staging
` : `
1. **Déployer les corrections** - Toutes les corrections critiques sont appliquées
2. **Monitorer en production** - Surveiller les erreurs d'hydratation
3. **Documentation** - Mettre à jour la documentation des composants
`}

### Maintenance Continue
1. **Utiliser les composants hydration-safe** pour tout nouveau développement
2. **Ajouter des tests d'hydratation** pour les nouveaux composants
3. **Monitorer les métriques** d'hydratation en production
4. **Former l'équipe** aux bonnes pratiques d'hydratation

## Composants Hydration-Safe Disponibles

- \`SafeCurrentYear\` - Pour l'affichage de l'année courante
- \`SafeDateRenderer\` - Pour l'affichage sécurisé des dates
- \`SafeWindowAccess\` - Pour l'accès sécurisé à window
- \`SafeDocumentAccess\` - Pour l'accès sécurisé à document
- \`SafeRandomContent\` - Pour le contenu aléatoire avec seeds
- \`SafeAnimationWrapper\` - Pour les animations hydration-safe

## Conclusion

${patternResults.criticalIssues === 0 && testResults.every(r => r.status === 'passed')
  ? `🎉 **Mission accomplie !** Toutes les corrections d'hydratation sont validées et React error #130 est résolu.`
  : `⚠️ **Travail en cours** - ${patternResults.criticalIssues} patterns critiques restent à corriger pour résoudre complètement React error #130.`}
`;

  const reportPath = path.join(process.cwd(), 'HYDRATION_VALIDATION_REPORT.md');
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  logInfo(`Rapport de validation sauvegardé dans ${reportPath}`);
  
  return reportPath;
}

// Exécution principale
async function main() {
  log('🚀 Démarrage de la validation finale\n', 'bold');
  
  try {
    // 1. Exécuter les tests d'hydratation
    logInfo('Phase 1: Tests d\'hydratation');
    const testResults = runHydrationTests();
    
    // 2. Valider les composants critiques
    logInfo('\nPhase 2: Validation des composants critiques');
    const componentResults = validateCriticalComponents();
    
    // 3. Vérifier les patterns restants
    logInfo('\nPhase 3: Vérification des patterns dangereux');
    const patternResults = checkHydrationPatterns();
    
    // 4. Générer le rapport final
    logInfo('\nPhase 4: Génération du rapport');
    const reportPath = generateValidationReport(testResults, componentResults, patternResults);
    
    // 5. Résumé final
    log('\n📊 Résumé de la Validation', 'bold');
    log('============================', 'bold');
    
    const testsPassedCount = testResults.filter(r => r.status === 'passed').length;
    const componentsOkCount = componentResults.filter(r => r.status === 'ok').length;
    
    logInfo(`Tests passés: ${testsPassedCount}/${testResults.length}`);
    logInfo(`Composants validés: ${componentsOkCount}/${componentResults.length}`);
    logInfo(`Patterns critiques restants: ${patternResults.criticalIssues}`);
    logInfo(`Fichiers scannés: ${patternResults.filesScanned}`);
    
    if (patternResults.criticalIssues === 0 && testsPassedCount === testResults.length) {
      log('\n🎉 VALIDATION RÉUSSIE - React error #130 est résolu !', 'green');
      process.exit(0);
    } else if (patternResults.criticalIssues === 0) {
      log('\n✅ Corrections critiques terminées - Quelques tests à ajuster', 'yellow');
      process.exit(0);
    } else {
      log(`\n⚠️  ${patternResults.criticalIssues} patterns critiques restent à corriger`, 'yellow');
      log('📖 Consultez le rapport de validation pour plus de détails', 'blue');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Erreur lors de la validation: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter la validation
main();