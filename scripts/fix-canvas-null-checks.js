#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'app/components/ExactShadowEffect.tsx',
  'app/components/PerfectShadowEffect.tsx'
];

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: resizeCanvas function without null check
  const pattern1 = /resizeCanvas\(\) \{\s+canvas\.width/g;
  if (pattern1.test(content)) {
    content = content.replace(
      /resizeCanvas\(\) \{\s+canvas\.width/g,
      'resizeCanvas() {\n        if (!canvas) return;\n        canvas.width'
    );
    modified = true;
  }

  // Pattern 2: animate function without null check at start
  const pattern2 = /function animate\(\) \{\s+(?!if \(!ctx)/;
  if (pattern2.test(content)) {
    content = content.replace(
      /function animate\(\) \{\s+/g,
      'function animate() {\n      if (!ctx || !canvas) return;\n      '
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  console.log(`⏭️  No changes needed: ${filePath}`);
  return false;
}

// Main
let fixedCount = 0;
for (const file of files) {
  if (fs.existsSync(file)) {
    if (fixFile(file)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);
