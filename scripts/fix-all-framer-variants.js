#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

function fixFramerVariants(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Supprimer toutes les propriétés transition dans les variants
  let newContent = content;
  
  // Pattern 1: propriété suivie de transition sur la ligne suivante
  newContent = newContent.replace(
    /(\s+)(\w+):\s*([^,\n]+),?\s*\n\s*transition:\s*\{[^}]+\}/g,
    '$1$2: $3'
  );
  
  // Pattern 2: transition seule (dernière propriété d'un objet)
  newContent = newContent.replace(
    /,?\s*\n\s*transition:\s*\{[^}]+\}\s*\n/g,
    '\n'
  );
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main
const dirs = ['components', 'app', 'src'];
let allFiles = [];

for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    allFiles = allFiles.concat(findTSFiles(dir));
  }
}

console.log(`🔍 Scanning ${allFiles.length} files...`);

let fixedCount = 0;
for (const file of allFiles) {
  if (fixFramerVariants(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);
