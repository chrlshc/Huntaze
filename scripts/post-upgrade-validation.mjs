#!/usr/bin/env node

/**
 * 🔍 Script de validation post-upgrade Huntaze 2025
 * Vérifie que l'upgrade s'est bien passé
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkNodeVersion() {
  log('📋 Vérification Node.js...', 'blue');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 22) {
    log(`✅ Node.js ${nodeVersion} (compatible)`, 'green');
    return true;
  } else {
    log(`❌ Node.js ${nodeVersion}. Version 22+ requise.`, 'red');
    return false;
  }
}

function checkPackageJson() {
  log('📦 Vérification package.json...', 'blue');
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const checks = [];
    
    // Vérifier Next.js 15
    if (packageJson.dependencies?.next?.includes('15.')) {
      log('✅ Next.js 15 détecté', 'green');
      checks.push(true);
    } else {
      log('❌ Next.js 15 non détecté', 'red');
      checks.push(false);
    }
    
    // Vérifier React 19
    if (packageJson.dependencies?.react?.includes('19.')) {
      log('✅ React 19 détecté', 'green');
      checks.push(true);
    } else {
      log('❌ React 19 non détecté', 'red');
      checks.push(false);
    }
    
    // Vérifier TypeScript 5.9+
    if (packageJson.dependencies?.typescript?.includes('5.9') || 
        packageJson.devDependencies?.typescript?.includes('5.9')) {
      log('✅ TypeScript 5.9+ détecté', 'green');
      checks.push(true);
    } else {
      log('⚠️ TypeScript 5.9+ non détecté', 'yellow');
      checks.push(false);
    }
    
    // Vérifier Tailwind v4
    if (packageJson.dependencies?.tailwindcss?.includes('4.') || 
        packageJson.devDependencies?.tailwindcss?.includes('4.')) {
      log('✅ Tailwind CSS v4 détecté', 'green');
      checks.push(true);
    } else {
      log('❌ Tailwind CSS v4 non détecté', 'red');
      checks.push(false);
    }
    
    // Vérifier ESLint 9
    if (packageJson.devDependencies?.eslint?.includes('9.')) {
      log('✅ ESLint 9 détecté', 'green');
      checks.push(true);
    } else {
      log('❌ ESLint 9 non détecté', 'red');
      checks.push(false);
    }
    
    return checks.every(Boolean);
  } catch (error) {
    log('❌ Erreur lecture package.json', 'red');
    return false;
  }
}

function checkTailwindImport() {
  log('🎨 Vérification Tailwind CSS v4...', 'blue');
  
  const cssFiles = [
    'app/globals.css',
    'styles/globals.css', 
    'src/styles/globals.css',
    'src/app/globals.css'
  ];
  
  for (const file of cssFiles) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('@import "tailwindcss"')) {
        log(`✅ Tailwind v4 import correct dans ${file}`, 'green');
        return true;
      } else if (content.includes('@tailwind')) {
        log(`⚠️ Ancien format Tailwind détecté dans ${file}`, 'yellow');
        log(`   Remplacez par: @import "tailwindcss";`, 'yellow');
        return false;
      }
    }
  }
  
  log('⚠️ Aucun fichier CSS principal trouvé', 'yellow');
  return false;
}

function checkESLintConfig() {
  log('🔍 Vérification ESLint 9...', 'blue');
  
  if (existsSync('eslint.config.mjs') || existsSync('eslint.config.js')) {
    log('✅ ESLint 9 flat config détecté', 'green');
    
    // Vérifier le contenu
    const configFiles = ['eslint.config.mjs', 'eslint.config.js'];
    for (const file of configFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf8');
        if (content.includes('export default')) {
          log('✅ Format flat config correct', 'green');
          return true;
        }
      }
    }
    
    log('⚠️ Config trouvée mais format à vérifier', 'yellow');
    return false;
  } else {
    log('❌ Config ESLint 9 manquante', 'red');
    return false;
  }
}

function checkAsyncAPIs() {
  log('🔄 Vérification APIs async Next.js 15...', 'blue');
  
  try {
    // Chercher des patterns async dans app/
    const result = execSync('find app -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -10', { encoding: 'utf8' });
    const files = result.trim().split('\n').filter(Boolean);
    
    let asyncFound = false;
    let oldPatternFound = false;
    
    for (const file of files.slice(0, 5)) { // Vérifier quelques fichiers
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf8');
        
        if (content.includes('await cookies()') || 
            content.includes('await headers()') ||
            content.includes('use(')) {
          asyncFound = true;
        }
        
        if (content.match(/cookies\(\)\.get/) || 
            content.match(/headers\(\)\.get/)) {
          oldPatternFound = true;
        }
      }
    }
    
    if (asyncFound) {
      log('✅ APIs async Next.js 15 détectées', 'green');
      return true;
    } else if (oldPatternFound) {
      log('⚠️ Anciens patterns détectés, exécutez le codemod:', 'yellow');
      log('   npx @next/codemod@latest next-async-request-api .', 'yellow');
      return false;
    } else {
      log('ℹ️ Aucune utilisation d\'APIs async détectée', 'blue');
      return true;
    }
  } catch (error) {
    log('⚠️ Impossible de vérifier les APIs async', 'yellow');
    return true; // Pas bloquant
  }
}

function checkBuildSuccess() {
  log('🏗️ Test de build...', 'blue');
  
  try {
    execSync('npm run build', { stdio: 'ignore' });
    log('✅ Build réussi', 'green');
    return true;
  } catch (error) {
    log('❌ Build échoué', 'red');
    log('   Exécutez: npm run build pour voir les erreurs', 'yellow');
    return false;
  }
}

function checkTypeCheck() {
  log('🔍 Vérification TypeScript...', 'blue');
  
  try {
    execSync('npm run typecheck', { stdio: 'ignore' });
    log('✅ TypeCheck réussi', 'green');
    return true;
  } catch (error) {
    log('❌ Erreurs TypeScript détectées', 'red');
    log('   Exécutez: npm run typecheck pour voir les erreurs', 'yellow');
    return false;
  }
}

function checkLint() {
  log('📏 Vérification ESLint...', 'blue');
  
  try {
    execSync('npm run lint', { stdio: 'ignore' });
    log('✅ Lint réussi', 'green');
    return true;
  } catch (error) {
    log('❌ Erreurs de lint détectées', 'red');
    log('   Exécutez: npm run lint pour voir les erreurs', 'yellow');
    return false;
  }
}

function checkRedisVersion() {
  log('🔴 Vérification Redis (sécurité)...', 'blue');
  
  try {
    const result = execSync('redis-cli INFO server | grep redis_version', { encoding: 'utf8' });
    const version = result.match(/redis_version:(\d+\.\d+\.\d+)/)?.[1];
    
    if (version) {
      const [major, minor, patch] = version.split('.').map(Number);
      
      if (major >= 8 && minor >= 2 && patch >= 2) {
        log(`✅ Redis ${version} (sécurisé)`, 'green');
        return true;
      } else {
        log(`⚠️ Redis ${version} - Upgrade vers 8.2.2+ recommandé (CVE-2025-49844)`, 'yellow');
        return false;
      }
    } else {
      log('⚠️ Version Redis non détectée', 'yellow');
      return false;
    }
  } catch (error) {
    log('ℹ️ Redis non accessible localement (normal si managé)', 'blue');
    return true; // Pas bloquant
  }
}

function runValidation() {
  log('🔍 VALIDATION POST-UPGRADE HUNTAZE 2025', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  const checks = [
    { name: 'Node.js 22+', fn: checkNodeVersion, critical: true },
    { name: 'Package.json', fn: checkPackageJson, critical: true },
    { name: 'Tailwind v4', fn: checkTailwindImport, critical: false },
    { name: 'ESLint 9', fn: checkESLintConfig, critical: false },
    { name: 'APIs Async', fn: checkAsyncAPIs, critical: false },
    { name: 'Build', fn: checkBuildSuccess, critical: true },
    { name: 'TypeCheck', fn: checkTypeCheck, critical: true },
    { name: 'Lint', fn: checkLint, critical: false },
    { name: 'Redis Sécurité', fn: checkRedisVersion, critical: false }
  ];
  
  let passed = 0;
  let critical_failed = 0;
  
  for (const check of checks) {
    const result = check.fn();
    if (result) {
      passed++;
    } else if (check.critical) {
      critical_failed++;
    }
  }
  
  log('\n' + '='.repeat(50), 'cyan');
  log(`📊 RÉSULTAT: ${passed}/${checks.length} vérifications passées`, 'blue');
  
  if (critical_failed === 0) {
    log('🎉 UPGRADE RÉUSSI !', 'green');
    log('✅ Toutes les vérifications critiques sont OK', 'green');
    
    if (passed === checks.length) {
      log('🌟 Upgrade parfait ! Tous les tests passent.', 'green');
    } else {
      log('⚠️ Quelques ajustements mineurs recommandés', 'yellow');
    }
  } else {
    log('❌ UPGRADE INCOMPLET', 'red');
    log(`${critical_failed} vérification(s) critique(s) échouée(s)`, 'red');
    log('Consultez UPGRADE_RUNBOOK_2025.md pour les corrections', 'yellow');
  }
  
  log('\n📝 Prochaines étapes:', 'blue');
  log('1. Testez l\'application dans le navigateur', 'blue');
  log('2. Exécutez les tests: npm test && npx playwright test', 'blue');
  log('3. Vérifiez les fonctionnalités critiques', 'blue');
  log('4. Commitez les changements si tout fonctionne', 'blue');
  
  return critical_failed === 0;
}

// Exécution
const success = runValidation();
process.exit(success ? 0 : 1);