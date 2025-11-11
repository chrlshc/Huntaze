#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Trouver tous les fichiers TypeScript/TSX
function findTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTSFiles(fullPath));
    } else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Corriger les variants Framer Motion
function fixFramerMotionVariants(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern pour détecter les variants avec transition inline
  const variantPattern = /(\w+Variants\s*=\s*\{[^}]*?)(transition:\s*\{[^}]+\})/gs;
  
  if (variantPattern.test(content)) {
    // Supprimer les transitions inline des variants
    content = content.replace(
      /(\s+)(opacity|y|x|scale|rotate):\s*([^,\n]+),\s*\n\s*transition:\s*\{[^}]+\}/g,
      '$1$2: $3'
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main
const componentsDir = 'components';
const files = findTSFiles(componentsDir);

console.log(`🔍 Scanning ${files.length} files...`);

let fixedCount = 0;
for (const file of files) {
  if (fixFramerMotionVariants(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);
