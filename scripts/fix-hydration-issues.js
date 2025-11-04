#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les problèmes d'hydratation
 * 
 * Ce script :
 * 1. Identifie les patterns dangereux par priorité
 * 2. Applique des corrections automatiques
 * 3. Génère des rapports de migration
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction Automatique des Problèmes d\'Hydratation\n');

// Configuration
const COMPONENTS_DIR = path.join(process.cwd(), 'components');
const APP_DIR = path.join(process.cwd(), 'app');
const LIB_DIR = path.join(process.cwd(), 'lib');

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

// Patterns de correction avec leurs remplacements
const HYDRATION_FIXES = [
  {
    name: 'Date.getFullYear() → SafeCurrentYear',
    pattern: /new Date\(\)\.getFullYear\(\)/g,
    replacement: (match, filePath) => {
      addImportIfNeeded(filePath, 'SafeCurrentYear', '@/components/hydration');
      return '<SafeCurrentYear fallback={<span>2024</span>} />';
    },
    severity: 'critical',
    description: 'Remplace new Date().getFullYear() par SafeCurrentYear'
  },
  {
    name: 'Date.toLocaleString() → SafeDateRenderer',
    pattern: /new Date\(\)\.toLocaleString\(\)/g,
    replacement: (match, filePath) => {
      addImportIfNeeded(filePath, 'SafeDateRenderer', '@/components/hydration');
      return '<SafeDateRenderer date={new Date()} format="full" />';
    },
    severity: 'critical',
    description: 'Remplace new Date().toLocaleString() par SafeDateRenderer'
  },
  {
    name: 'window. → SafeBrowserAPI',
    pattern: /(?<!\/\/.*)window\./g,
    replacement: (match, filePath) => {
      // Cette correction nécessite une analyse plus complexe
      return match; // Pas de remplacement automatique pour l'instant
    },
    severity: 'high',
    description: 'Accès direct à window - nécessite SafeBrowserAPI',
    autoFix: false
  },
  {
    name: 'document. → SafeBrowserAPI',
    pattern: /(?<!\/\/.*)document\./g,
    replacement: (match, filePath) => {
      // Cette correction nécessite une analyse plus complexe
      return match; // Pas de remplacement automatique pour l'instant
    },
    severity: 'high',
    description: 'Accès direct à document - nécessite SafeBrowserAPI',
    autoFix: false
  },
  {
    name: 'Math.random() → SafeRandomContent',
    pattern: /Math\.random\(\)/g,
    replacement: (match, filePath) => {
      // Cette correction nécessite une analyse contextuelle
      return match; // Pas de remplacement automatique pour l'instant
    },
    severity: 'medium',
    description: 'Math.random() - nécessite SafeRandomContent avec seed',
    autoFix: false
  }
];

// Cache des imports ajoutés par fichier
const fileImports = new Map();

function addImportIfNeeded(filePath, componentName, importPath) {
  if (!fileImports.has(filePath)) {
    fileImports.set(filePath, new Set());
  }
  
  const imports = fileImports.get(filePath);
  if (!imports.has(componentName)) {
    imports.add(componentName);
    return true;
  }
  return false;
}

function updateImportsInFile(filePath, content) {
  if (!fileImports.has(filePath)) {
    return content;
  }
  
  const imports = Array.from(fileImports.get(filePath));
  if (imports.length === 0) {
    return content;
  }
  
  // Vérifier si l'import existe déjà
  const existingImportRegex = /import\s+{[^}]*}\s+from\s+['"]@\/components\/hydration['"]/;
  const existingMatch = content.match(existingImportRegex);
  
  if (existingMatch) {
    // Ajouter aux imports existants
    const existingImports = existingMatch[0];
    const importList = existingImports.match(/{([^}]*)}/)[1];
    const currentImports = importList.split(',').map(i => i.trim()).filter(Boolean);
    
    const newImports = [...new Set([...currentImports, ...imports])];
    const newImportStatement = `import { ${newImports.join(', ')} } from '@/components/hydration';`;
    
    return content.replace(existingImportRegex, newImportStatement);
  } else {
    // Ajouter un nouvel import
    const importStatement = `import { ${imports.join(', ')} } from '@/components/hydration';\n`;
    
    // Trouver où insérer l'import (après les autres imports)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith("import ")) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        insertIndex = i;
        break;
      } else if (!lines[i].startsWith('import ') && !lines[i].startsWith("import ") && lines[i].trim() !== '') {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }
}

function fixFileContent(filePath, content) {
  let modifiedContent = content;
  let fixesApplied = [];
  
  HYDRATION_FIXES.forEach(fix => {
    if (fix.autoFix === false) return;
    
    const matches = modifiedContent.match(fix.pattern);
    if (matches) {
      logInfo(`Correction de ${matches.length} occurrence(s) de "${fix.name}" dans ${path.relative(process.cwd(), filePath)}`);
      
      modifiedContent = modifiedContent.replace(fix.pattern, (match) => {
        return fix.replacement(match, filePath);
      });
      
      fixesApplied.push({
        name: fix.name,
        count: matches.length,
        severity: fix.severity
      });
    }
  });
  
  // Ajouter les imports nécessaires
  if (fixesApplied.length > 0) {
    modifiedContent = updateImportsInFile(filePath, modifiedContent);
  }
  
  return { content: modifiedContent, fixes: fixesApplied };
}

function scanAndFixDirectory(dir, excludeDirs = []) {
  const results = {
    filesScanned: 0,
    filesModified: 0,
    totalFixes: 0,
    fixesByType: {}
  };
  
  function processDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(item) && !item.startsWith('.') && item !== 'node_modules') {
          processDirectory(itemPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // Exclure les fichiers de test et les composants hydration-safe
        if (item.includes('.test.') || itemPath.includes('/hydration/')) {
          return;
        }
        
        results.filesScanned++;
        
        const content = fs.readFileSync(itemPath, 'utf8');
        const { content: newContent, fixes } = fixFileContent(itemPath, content);
        
        if (fixes.length > 0) {
          fs.writeFileSync(itemPath, newContent, 'utf8');
          results.filesModified++;
          results.totalFixes += fixes.reduce((sum, fix) => sum + fix.count, 0);
          
          fixes.forEach(fix => {
            if (!results.fixesByType[fix.name]) {
              results.fixesByType[fix.name] = 0;
            }
            results.fixesByType[fix.name] += fix.count;
          });
          
          logSuccess(`Corrigé ${path.relative(process.cwd(), itemPath)} (${fixes.length} type(s) de corrections)`);
        }
      }
    });
  }
  
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
  
  return results;
}

function generateReport(results) {
  log('\n📊 Rapport de Correction d\'Hydratation', 'bold');
  log('=====================================', 'bold');
  
  logInfo(`Fichiers scannés: ${results.filesScanned}`);
  logSuccess(`Fichiers modifiés: ${results.filesModified}`);
  logSuccess(`Total des corrections: ${results.totalFixes}`);
  
  if (Object.keys(results.fixesByType).length > 0) {
    log('\n🔧 Corrections par type:', 'bold');
    Object.entries(results.fixesByType).forEach(([type, count]) => {
      logSuccess(`${type}: ${count} correction(s)`);
    });
  }
  
  // Sauvegarder le rapport
  const reportPath = path.join(process.cwd(), 'HYDRATION_FIXES_REPORT.md');
  const reportContent = `# Rapport de Correction d'Hydratation

## Résumé
- **Fichiers scannés**: ${results.filesScanned}
- **Fichiers modifiés**: ${results.filesModified}
- **Total des corrections**: ${results.totalFixes}

## Corrections par type
${Object.entries(results.fixesByType).map(([type, count]) => `- **${type}**: ${count} correction(s)`).join('\n')}

## Date de génération
${new Date().toLocaleString('fr-FR')}

## Prochaines étapes
1. Tester les corrections appliquées
2. Corriger manuellement les patterns complexes (window, document, Math.random)
3. Valider que React error #130 est résolu
4. Déployer les corrections
`;
  
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  logInfo(`Rapport sauvegardé dans ${reportPath}`);
}

// Exécution principale
async function main() {
  log('🚀 Démarrage de la correction automatique\n', 'bold');
  
  // Scanner et corriger les répertoires principaux
  const dirsToScan = [
    { dir: COMPONENTS_DIR, name: 'components' },
    { dir: APP_DIR, name: 'app' },
    { dir: LIB_DIR, name: 'lib' }
  ];
  
  let totalResults = {
    filesScanned: 0,
    filesModified: 0,
    totalFixes: 0,
    fixesByType: {}
  };
  
  for (const { dir, name } of dirsToScan) {
    logInfo(`Scan du répertoire ${name}...`);
    const results = scanAndFixDirectory(dir, ['node_modules', '.next', 'tests', 'hydration']);
    
    // Fusionner les résultats
    totalResults.filesScanned += results.filesScanned;
    totalResults.filesModified += results.filesModified;
    totalResults.totalFixes += results.totalFixes;
    
    Object.entries(results.fixesByType).forEach(([type, count]) => {
      if (!totalResults.fixesByType[type]) {
        totalResults.fixesByType[type] = 0;
      }
      totalResults.fixesByType[type] += count;
    });
  }
  
  // Générer le rapport final
  generateReport(totalResults);
  
  if (totalResults.totalFixes > 0) {
    log('\n🎉 Corrections automatiques terminées avec succès !', 'green');
    log('⚠️  N\'oubliez pas de tester les modifications et de corriger manuellement les patterns complexes.', 'yellow');
  } else {
    log('\n✅ Aucune correction automatique nécessaire.', 'green');
  }
}

// Exécuter le script
main().catch(error => {
  logError(`Erreur lors de la correction: ${error.message}`);
  process.exit(1);
});