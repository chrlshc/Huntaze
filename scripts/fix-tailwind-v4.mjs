#!/usr/bin/env node

/**
 * 🎨 Script de correction automatique Tailwind CSS v4
 * Corrige les imports CSS et les classes renommées
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

// Classes renommées dans Tailwind v4
const CLASS_RENAMES = [
  { from: 'shadow-sm', to: 'shadow-xs' },
  { from: 'outline-none', to: 'outline-hidden' },
  { from: 'ring-offset-white', to: 'ring-offset-white' }, // Pas de changement mais à vérifier
  { from: 'ring-offset-black', to: 'ring-offset-black' },
  // Ajoutez d'autres renommages selon la doc officielle
];

// Patterns CSS à corriger
const CSS_PATTERNS = [
  {
    name: 'Tailwind imports v3 → v4',
    pattern: /@tailwind\s+base;\s*@tailwind\s+components;\s*@tailwind\s+utilities;/g,
    replacement: '@import "tailwindcss";'
  },
  {
    name: 'Tailwind imports multiline',
    pattern: /@tailwind\s+base;\n\s*@tailwind\s+components;\n\s*@tailwind\s+utilities;/g,
    replacement: '@import "tailwindcss";'
  }
];

function getAllFiles(dir, extensions = ['.css', '.scss', '.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    try {
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
    } catch (error) {
      // Ignorer les erreurs de lecture de dossier
    }
  }
  
  traverse(dir);
  return files;
}

function fixCSSImports(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let hasChanges = false;
    const changes = [];
    
    // Appliquer les corrections CSS
    for (const pattern of CSS_PATTERNS) {
      if (pattern.pattern.test(modifiedContent)) {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement);
        hasChanges = true;
        changes.push(pattern.name);
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, modifiedContent);
      return { success: true, changes };
    }
    
    return { success: true, changes: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function fixTailwindClasses(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let hasChanges = false;
    const changes = [];
    
    // Appliquer les renommages de classes
    for (const rename of CLASS_RENAMES) {
      const classPattern = new RegExp(`\\b${rename.from}\\b`, 'g');
      if (classPattern.test(modifiedContent)) {
        modifiedContent = modifiedContent.replace(classPattern, rename.to);
        hasChanges = true;
        changes.push(`${rename.from} → ${rename.to}`);
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, modifiedContent);
      return { success: true, changes };
    }
    
    return { success: true, changes: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function updateTailwindConfig() {
  log('⚙️ Mise à jour de tailwind.config.js...', 'blue');
  
  const configFiles = ['tailwind.config.js', 'tailwind.config.ts'];
  let configFound = false;
  
  for (const configFile of configFiles) {
    try {
      const content = readFileSync(configFile, 'utf8');
      
      // Exemple de mise à jour basique pour v4
      // Note: Tailwind v4 peut nécessiter des changements plus complexes
      let modifiedContent = content;
      
      // Ajouter un commentaire pour indiquer la version
      if (!content.includes('// Tailwind CSS v4')) {
        modifiedContent = `// Tailwind CSS v4 compatible\n${content}`;
      }
      
      writeFileSync(configFile, modifiedContent);
      log(`✅ ${configFile} mis à jour`, 'green');
      configFound = true;
      break;
    } catch (error) {
      // Fichier non trouvé, continuer
    }
  }
  
  if (!configFound) {
    log('⚠️ Aucun fichier de config Tailwind trouvé', 'yellow');
  }
}

function updatePostCSSConfig() {
  log('⚙️ Vérification de postcss.config.js...', 'blue');
  
  try {
    const content = readFileSync('postcss.config.js', 'utf8');
    
    // Vérifier si le plugin Tailwind v4 est utilisé
    if (content.includes('@tailwindcss/postcss')) {
      log('✅ Plugin PostCSS Tailwind v4 déjà configuré', 'green');
    } else {
      log('⚠️ Vous devrez peut-être mettre à jour le plugin PostCSS', 'yellow');
      log('   Voir: https://tailwindcss.com/docs/v4-beta#installation', 'yellow');
    }
  } catch (error) {
    log('⚠️ postcss.config.js non trouvé', 'yellow');
  }
}

function main() {
  log('🎨 Correction automatique Tailwind CSS v4...', 'blue');
  
  // 1. Corriger les imports CSS
  log('\n📄 Correction des imports CSS...', 'blue');
  const cssFiles = getAllFiles('.', ['.css', '.scss']);
  
  let cssFixed = 0;
  for (const file of cssFiles) {
    const result = fixCSSImports(file);
    if (result.success && result.changes.length > 0) {
      log(`✅ ${file}`, 'green');
      for (const change of result.changes) {
        log(`   - ${change}`, 'green');
      }
      cssFixed++;
    }
  }
  
  // 2. Corriger les classes dans les composants
  log('\n🧩 Correction des classes Tailwind...', 'blue');
  const componentFiles = getAllFiles('.', ['.ts', '.tsx', '.js', '.jsx']);
  
  let classesFixed = 0;
  for (const file of componentFiles) {
    const result = fixTailwindClasses(file);
    if (result.success && result.changes.length > 0) {
      log(`✅ ${file}`, 'green');
      for (const change of result.changes) {
        log(`   - ${change}`, 'green');
      }
      classesFixed++;
    }
  }
  
  // 3. Mettre à jour les configs
  log('\n⚙️ Mise à jour des configurations...', 'blue');
  updateTailwindConfig();
  updatePostCSSConfig();
  
  // Résumé
  log('\n📊 Résumé:', 'blue');
  log(`✅ ${cssFixed} fichiers CSS corrigés`, 'green');
  log(`✅ ${classesFixed} fichiers avec classes corrigées`, 'green');
  
  log('\n⚠️ Actions manuelles requises:', 'yellow');
  log('1. Vérifiez que @import "tailwindcss"; fonctionne', 'yellow');
  log('2. Testez le build: npm run build', 'yellow');
  log('3. Vérifiez les styles dans le navigateur', 'yellow');
  log('4. Consultez la doc v4: https://tailwindcss.com/docs/v4-beta', 'yellow');
  
  if (cssFixed === 0 && classesFixed === 0) {
    log('\n✨ Aucune correction nécessaire détectée', 'green');
  }
  
  log('\n🎉 Correction Tailwind v4 terminée !', 'green');
}

main();