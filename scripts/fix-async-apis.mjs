#!/usr/bin/env node

/**
 * 🔧 Script de correction automatique des APIs async Next.js 15
 * Corrige cookies(), headers(), draftMode(), params, searchParams
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Patterns à corriger
const ASYNC_PATTERNS = [
  {
    name: 'cookies()',
    pattern: /(\s+)const\s+(\w+)\s*=\s*cookies\(\)\.get\(/g,
    replacement: '$1const $2 = (await cookies()).get('
  },
  {
    name: 'cookies() assignment',
    pattern: /(\s+)const\s+(\w+)\s*=\s*cookies\(\)/g,
    replacement: '$1const $2 = await cookies()'
  },
  {
    name: 'headers()',
    pattern: /(\s+)const\s+(\w+)\s*=\s*headers\(\)/g,
    replacement: '$1const $2 = await headers()'
  },
  {
    name: 'headers().get()',
    pattern: /(\s+)const\s+(\w+)\s*=\s*headers\(\)\.get\(/g,
    replacement: '$1const $2 = (await headers()).get('
  },
  {
    name: 'draftMode()',
    pattern: /(\s+)const\s+(\w+)\s*=\s*draftMode\(\)/g,
    replacement: '$1const $2 = await draftMode()'
  },
  {
    name: 'draftMode().isEnabled',
    pattern: /(\s+)const\s+\{\s*(\w+)\s*\}\s*=\s*draftMode\(\)/g,
    replacement: '$1const { $2 } = await draftMode()'
  },
  {
    name: 'params destructuring',
    pattern: /(\s+)const\s+\{\s*([^}]+)\s*\}\s*=\s*params/g,
    replacement: '$1const { $2 } = await params'
  },
  {
    name: 'params assignment',
    pattern: /(\s+)const\s+(\w+)\s*=\s*params\.(\w+)/g,
    replacement: '$1const $2 = (await params).$3'
  },
  {
    name: 'searchParams destructuring',
    pattern: /(\s+)const\s+\{\s*([^}]+)\s*\}\s*=\s*searchParams/g,
    replacement: '$1const { $2 } = await searchParams'
  },
  {
    name: 'searchParams assignment',
    pattern: /(\s+)const\s+(\w+)\s*=\s*searchParams\.(\w+)/g,
    replacement: '$1const $2 = (await searchParams).$3'
  }
];

// Patterns pour les props de page
const PAGE_PROPS_PATTERNS = [
  {
    name: 'Page props params',
    pattern: /export\s+default\s+(?:async\s+)?function\s+(\w+)\s*\(\s*\{\s*params\s*\}\s*:\s*\{[^}]*\}\s*\)/g,
    replacement: 'export default async function $1({ params }: { params: Promise<any> })'
  },
  {
    name: 'Page props searchParams',
    pattern: /export\s+default\s+(?:async\s+)?function\s+(\w+)\s*\(\s*\{\s*searchParams\s*\}\s*:\s*\{[^}]*\}\s*\)/g,
    replacement: 'export default async function $1({ searchParams }: { searchParams: Promise<any> })'
  },
  {
    name: 'Page props both',
    pattern: /export\s+default\s+(?:async\s+)?function\s+(\w+)\s*\(\s*\{\s*params,\s*searchParams\s*\}\s*:\s*\{[^}]*\}\s*\)/g,
    replacement: 'export default async function $1({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> })'
  }
];

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Ignorer certains dossiers
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function fixAsyncAPIs(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let hasChanges = false;
    const changes = [];
    
    // Vérifier si le codemod officiel a déjà été appliqué
    if (modifiedContent.includes('// @next/codemod applied') || 
        modifiedContent.includes('use(') ||
        modifiedContent.includes('await cookies()') ||
        modifiedContent.includes('await headers()')) {
      return { success: true, changes: ['Codemod officiel déjà appliqué'] };
    }
    
    // Appliquer les corrections d'APIs async (seulement si pas déjà fait)
    for (const pattern of ASYNC_PATTERNS) {
      const matches = modifiedContent.match(pattern.pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement);
        hasChanges = true;
        changes.push(pattern.name);
      }
    }
    
    // Appliquer les corrections de props de page
    for (const pattern of PAGE_PROPS_PATTERNS) {
      const matches = modifiedContent.match(pattern.pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement);
        hasChanges = true;
        changes.push(pattern.name);
      }
    }
    
    // Ajouter async à la fonction si nécessaire et pas déjà présent
    if (hasChanges && !modifiedContent.includes('export default async function')) {
      // Chercher les fonctions de page qui utilisent maintenant await
      const functionPattern = /export\s+default\s+function\s+(\w+)/g;
      const awaitPattern = /await\s+(cookies|headers|draftMode|params|searchParams)/;
      
      if (functionPattern.test(modifiedContent) && awaitPattern.test(modifiedContent)) {
        modifiedContent = modifiedContent.replace(
          /export\s+default\s+function\s+(\w+)/g,
          'export default async function $1'
        );
        changes.push('Added async to function');
      }
    }
    
    // Ajouter un commentaire pour indiquer le traitement
    if (hasChanges) {
      modifiedContent = `// Fixed async APIs for Next.js 15\n${modifiedContent}`;
      writeFileSync(filePath, modifiedContent);
      return { success: true, changes };
    }
    
    return { success: true, changes: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function main() {
  log('🔧 Correction complémentaire des APIs async Next.js 15...', 'blue');
  log('ℹ️ Ce script complète le codemod officiel @next/codemod next-async-request-api', 'blue');
  
  // Dossiers à traiter
  const directories = ['app', 'lib', 'components', 'middleware'];
  const allFiles = [];
  
  for (const dir of directories) {
    try {
      const files = getAllFiles(dir);
      allFiles.push(...files);
    } catch (error) {
      log(`⚠️ Dossier ${dir} non trouvé, ignoré`, 'yellow');
    }
  }
  
  log(`📁 ${allFiles.length} fichiers à analyser...`, 'blue');
  
  let totalFixed = 0;
  let totalErrors = 0;
  let alreadyProcessed = 0;
  
  for (const file of allFiles) {
    const result = fixAsyncAPIs(file);
    
    if (result.success) {
      if (result.changes.length > 0) {
        if (result.changes.includes('Codemod officiel déjà appliqué')) {
          alreadyProcessed++;
        } else {
          log(`✅ ${file}`, 'green');
          for (const change of result.changes) {
            log(`   - ${change}`, 'green');
          }
          totalFixed++;
        }
      }
    } else {
      log(`❌ ${file}: ${result.error}`, 'red');
      totalErrors++;
    }
  }
  
  log('\n📊 Résumé:', 'blue');
  log(`✅ ${totalFixed} fichiers corrigés`, 'green');
  log(`ℹ️ ${alreadyProcessed} fichiers déjà traités par le codemod officiel`, 'blue');
  log(`❌ ${totalErrors} erreurs`, totalErrors > 0 ? 'red' : 'green');
  
  if (totalFixed === 0 && alreadyProcessed > 0) {
    log('\n🎉 Le codemod officiel a déjà tout traité !', 'green');
  } else if (totalFixed > 0) {
    log('\n⚠️ Vérifications manuelles recommandées:', 'yellow');
    log('1. Vérifiez que les types sont corrects', 'yellow');
    log('2. Testez les fonctions modifiées', 'yellow');
    log('3. Exécutez: npm run typecheck', 'yellow');
  }
  
  log('\n💡 Rappel: Utilisez d\'abord le codemod officiel:', 'blue');
  log('   npx @next/codemod@latest next-async-request-api .', 'blue');
  
  log('\n🎉 Correction terminée !', 'green');
}

main();